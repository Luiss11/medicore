import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function inventoryRoutes(app: FastifyInstance) {

  // GET /inventory
  app.get('/', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { category, search, lowStock } = request.query as any

      const where: any = { tenantId, isActive: true }
      if (category) where.category = category
      if (search)   where.name     = { contains: search, mode: 'insensitive' }
      if (lowStock === 'true') {
        // Items where quantity <= minQuantity
        const all = await prisma.inventoryItem.findMany({ where })
        const low = all.filter(i => i.quantity <= i.minQuantity)
        return reply.send({ success: true, data: low, meta: { total: low.length } })
      }

      const [data, total] = await Promise.all([
        prisma.inventoryItem.findMany({
          where, orderBy: { name: 'asc' },
          include: { _count: { select: { movements: true } } },
        }),
        prisma.inventoryItem.count({ where }),
      ])

      // Add lowStock flag
      const dataWithFlag = data.map(item => ({
        ...item,
        isLowStock: item.quantity <= item.minQuantity,
      }))

      return reply.send({ success: true, data: dataWithFlag, meta: { total } })
    },
  })

  // GET /inventory/:id/movements
  app.get('/:id/movements', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as any

      const item = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
      if (!item) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } })

      const movements = await prisma.inventoryMovement.findMany({
        where: { itemId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return reply.send({ success: true, data: movements })
    },
  })

  // POST /inventory
  app.post('/', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'unitPrice'],
        properties: {
          name:        { type: 'string' },
          description: { type: 'string' },
          category:    { type: 'string' },
          sku:         { type: 'string' },
          quantity:    { type: 'number' },
          minQuantity: { type: 'number' },
          unit:        { type: 'string' },
          unitPrice:   { type: 'number' },
          supplier:    { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const body = request.body as any

      const item = await prisma.inventoryItem.create({
        data: {
          tenantId,
          name:        body.name,
          description: body.description,
          category:    body.category    ?? 'CONSUMABLE',
          sku:         body.sku,
          quantity:    body.quantity    ?? 0,
          minQuantity: body.minQuantity ?? 5,
          unit:        body.unit        ?? 'pza',
          unitPrice:   body.unitPrice,
          supplier:    body.supplier,
        },
      })

      // Record initial stock movement
      if (body.quantity > 0) {
        await prisma.inventoryMovement.create({
          data: { itemId: item.id, type: 'IN', quantity: body.quantity, reason: 'Stock inicial' },
        })
      }

      return reply.status(201).send({ success: true, data: item })
    },
  })

  // PATCH /inventory/:id
  app.patch('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id }  = request.params as any
      const body    = request.body as any

      const existing = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
      if (!existing) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } })

      const updated = await prisma.inventoryItem.update({ where: { id }, data: body })
      return reply.send({ success: true, data: updated })
    },
  })

  // POST /inventory/:id/movement — add/remove stock
  app.post('/:id/movement', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'quantity'],
        properties: {
          type:     { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT'] },
          quantity: { type: 'number' },
          reason:   { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id }  = request.params as any
      const { type, quantity, reason } = request.body as any

      const item = await prisma.inventoryItem.findFirst({ where: { id, tenantId } })
      if (!item) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Producto no encontrado' } })

      const newQty = type === 'IN'
        ? item.quantity + quantity
        : type === 'OUT'
        ? Math.max(0, item.quantity - quantity)
        : quantity // ADJUSTMENT sets exact value

      const [movement] = await Promise.all([
        prisma.inventoryMovement.create({
          data: { itemId: id, type, quantity, reason },
        }),
        prisma.inventoryItem.update({
          where: { id },
          data: { quantity: newQty },
        }),
      ])

      return reply.send({ success: true, data: { movement, newQuantity: newQty } })
    },
  })

  // DELETE /inventory/:id (soft)
  app.delete('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as any
      await prisma.inventoryItem.updateMany({ where: { id, tenantId }, data: { isActive: false } })
      return reply.send({ success: true, data: { message: 'Producto eliminado' } })
    },
  })
}
