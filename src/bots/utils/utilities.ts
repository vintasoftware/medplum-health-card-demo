import { MedplumClient } from '@medplum/core'
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

export function makeStringLiteral(keys: string) {
  return keys.replace(/\\n/g, '\n')
}

type CanonicalCode = `${string}|${string}`

function canonical(coding?: { system?: string; code?: string } | null): CanonicalCode | null {
  if (!coding?.system || !coding?.code) return null
  return `${coding.system}|${coding.code}`
}

function extractCodingsFromResource(resource: any): CanonicalCode[] {
  if (resource.resourceType === 'Immunization') {
    const codings = resource.vaccineCode?.coding ?? []
    return codings.map(canonical).filter(Boolean) as CanonicalCode[]
  }
  if (resource.resourceType === 'Observation') {
    const codings = resource.code?.coding ?? []
    return codings.map(canonical).filter(Boolean) as CanonicalCode[]
  }
  return []
}

export async function expandValueSet(
  medplum: MedplumClient,
  vsUri: string
): Promise<CanonicalCode[]> {
  let result: any
  try {
    result = await medplum.get(`ValueSet/$expand?url=${encodeURIComponent(vsUri)}`)
  } catch {
    result = await medplum.post('ValueSet/$expand', { url: vsUri })
  }

  const contains = result?.expansion?.contains ?? []
  const codes: CanonicalCode[] = []

  for (const item of contains) {
    if (item.system && item.code) {
      codes.push(`${item.system}|${item.code}`)
    }
    if (Array.isArray(item.concept)) {
      for (const c of item.concept) {
        if (c.code && item.system) codes.push(`${item.system}|${c.code}`)
      }
    }
  }
  return codes
}

export function filterResourcesByValueSets(resources: any[], valueSets: CanonicalCode[][]): any[] {
  if (!valueSets.length) return resources
  return resources.filter(r => {
    const resourceCodes = extractCodingsFromResource(r)
    if (resourceCodes.length === 0) return false
    for (const vs of valueSets) {
      const matched = resourceCodes.some(code => vs.includes(code))
      if (!matched) return false
    }
    return true
  })
}
