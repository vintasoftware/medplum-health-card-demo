import { Patient } from '@medplum/fhirtypes'

export function sanitizePatient(patient: Patient, claims: string[]): Patient {
  if (!claims.length) return patient

  const keepName = claims.includes('Patient.name') || claims.includes('name')
  const keepBirth = claims.includes('Patient.birthDate') || claims.includes('birthDate')

  const sanitized: Patient = { resourceType: 'Patient', id: patient.id }

  if (keepName && patient.name) {
    sanitized.name = patient.name
  }
  if (keepBirth && patient.birthDate) {
    sanitized.birthDate = patient.birthDate
  }

  return sanitized
}
