export const patientQuerySchema = {
  type: 'object',
  properties: {
    page:    { type: 'number', default: 1 },
    limit:   { type: 'number', default: 20 },
    search:  { type: 'string' },
    orderBy: { type: 'string', default: 'lastName' },
    order:   { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
  },
}

export const createPatientSchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName:            { type: 'string' },
    lastName:             { type: 'string' },
    dateOfBirth:          { type: 'string' },
    gender:               { type: 'string' },
    phone:                { type: 'string' },
    email:                { type: 'string' },
    address:              { type: 'string' },
    city:                 { type: 'string' },
    bloodType:            { type: 'string' },
    allergies:            { type: 'string' },
    chronicConditions:    { type: 'string' },
    currentMedications:   { type: 'string' },
    emergencyContact:     { type: 'string' },
    emergencyContactPhone:{ type: 'string' },
    notes:                { type: 'string' },
  },
}

export const updatePatientSchema = {
  type: 'object',
  properties: { ...createPatientSchema.properties },
}