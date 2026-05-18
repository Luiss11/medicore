# MediCore 🏥

**Universal Medical Practice Management Platform**

Un solo sistema para cualquier especialidad médica. Arquitectura multi-tenant, modular y lista para escalar a SaaS.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind |
| Backend | Fastify (Node.js) |
| ORM | Prisma |
| Base de datos | PostgreSQL 16 |
| Caché | Redis 7 |
| Archivos | MinIO (S3-compatible) |
| Auth | JWT + Refresh Tokens |
| Monorepo | Turborepo + pnpm workspaces |
| CI/CD | GitHub Actions |

## Estructura del proyecto

```
medicore/
├── apps/
│   ├── api/          # Fastify REST API
│   │   └── src/
│   │       ├── modules/        # Un folder por dominio
│   │       │   ├── auth/
│   │       │   ├── tenants/
│   │       │   ├── patients/
│   │       │   ├── doctors/
│   │       │   ├── appointments/
│   │       │   ├── treatments/
│   │       │   ├── payments/
│   │       │   ├── inventory/
│   │       │   └── plugins/    # Plugin-specific endpoints
│   │       ├── middleware/     # Auth, tenant, logging
│   │       └── config/        # Env, logger
│   │
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/            # Next.js App Router pages
│           ├── components/     # UI, layout, domain modules
│           ├── lib/            # API client, utils
│           └── hooks/         # Custom React hooks
│
└── packages/
    ├── database/     # Prisma schema + migrations + seeds
    ├── shared/       # Types, constants, utils (isomorphic)
    ├── ui/           # Shared React components
    └── config/       # ESLint + TypeScript shared configs
```

## Inicio rápido

### Requisitos
- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/medicore.git
cd medicore
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores (el default funciona para dev local)
```

### 3. Levantar servicios con Docker

```bash
pnpm docker:up
# Levanta: PostgreSQL, Redis, MinIO, MailHog
```

### 4. Correr migraciones y seed

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Iniciar en desarrollo

```bash
pnpm dev
# API: http://localhost:4000
# Web: http://localhost:3000
# DB Studio: http://localhost:5555
# Mail: http://localhost:8025
# MinIO: http://localhost:9001
```

### Credenciales de demo (seed)
```
Admin:  admin@clinicasonrisa.mx  /  Admin1234!
Doctor: dr.garcia@clinicasonrisa.mx  /  Doctor1234!
Tenant: clinica-sonrisa
```

---

## Módulos del sistema

### Core (todos los tenants)
- ✅ **Auth** — Login, roles (admin, doctor, recepcionista), JWT
- ✅ **Pacientes** — CRUD completo, búsqueda, historial
- ✅ **Doctores** — Perfiles, horarios, especialidades
- ✅ **Citas** — Agenda, estados, conflictos de horario
- ✅ **Tratamientos** — Catálogo por tenant
- ✅ **Pagos** — Registro, métodos, recibos
- ✅ **Inventario** — Stock, alertas de mínimos
- ✅ **Expediente** — Notas SOAP, signos vitales, adjuntos

### Plugins de especialidad
- 🦷 `odontologia` — Odontograma interactivo
- 👁️ `oftalmologia` — Agudeza visual, tonometría
- 🧴 `dermatologia` — Mapa corporal de lesiones
- más en roadmap...

---

## Convenciones de código

### Módulos API
Cada módulo sigue la estructura:
```
modules/{nombre}/
├── {nombre}.routes.ts    # Definición de rutas Fastify
├── {nombre}.service.ts   # Lógica de negocio
├── {nombre}.schema.ts    # Validación con Zod
└── {nombre}.test.ts      # Tests unitarios
```

### Multi-tenancy
**REGLA DE ORO**: Toda query a la BD DEBE incluir `tenantId` en el `where`.
El middleware inyecta `request.tenant.tenantId` en cada request autenticado.

```typescript
// ✅ Correcto
prisma.patient.findMany({ where: { tenantId, isActive: true } })

// ❌ NUNCA así — cross-tenant data leak
prisma.patient.findMany({ where: { isActive: true } })
```

### Soft deletes
Los registros médicos NUNCA se eliminan físicamente.
Siempre usar `isActive: false` (pacientes, doctores, tratamientos).

---

## Roadmap

| Versión | Estado | Descripción |
|---------|--------|-------------|
| v0.1 | 🚧 En progreso | Estadías — módulo dental funcional |
| v1.0 | 📋 Planeado | MVP universal, 3 especialidades |
| v2.0 | 📋 Planeado | SaaS multi-tenant, billing, WhatsApp |
| v3.0 | 💭 Futuro | Plugin marketplace, API pública |

---

## Licencia

Privado — todos los derechos reservados.
