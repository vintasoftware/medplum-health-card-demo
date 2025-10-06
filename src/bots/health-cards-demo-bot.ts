import type { BotEvent, MedplumClient } from '@medplum/core'
import type {
  Parameters,
  Resource,
  ParametersParameter,
  Bundle,
  Reference,
  Patient,
} from '@medplum/fhirtypes'
import {
  sanitizePatient,
  makeStringLiteral,
  expandValueSet,
  filterResourcesByValueSets,
} from './utils/utilities'
import { SHCIssuer } from 'kill-the-clipboard'

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<Parameters>
): Promise<Record<string, unknown>> {
  const parameters = event.input as Parameters
  const credentialTypeParameters: ParametersParameter[] = []
  const subject = parameters.parameter?.find(p => p.name === 'subject')
  if (!subject) {
    throw new Error('Subject is required')
  }
  const patientReference = subject?.valueReference as Reference

  credentialTypeParameters.push(
    ...(parameters.parameter?.filter(p => p.name === 'credentialType') || [])
  )
  if (!credentialTypeParameters.length) {
    throw new Error('Credential type is required')
  }
  const credentialTypes = credentialTypeParameters.map(p => p.valueUri).filter(Boolean)
  const normalizedCredentialTypes = credentialTypes
    .map(type =>
      type === '#immunization' ? 'Immunization' : type === '#laboratory' ? 'Observation' : type
    )
    .filter(Boolean)

  const credentialValueSetParameters: ParametersParameter[] = []
  credentialValueSetParameters.push(
    ...(parameters.parameter?.filter(p => p.name === 'credentialValueSet') || [])
  )
  const credentialValueSets =
    credentialValueSetParameters?.map(p => p.valueUri).filter(Boolean) || []

  const includeIdentityClaimParameters: ParametersParameter[] = []
  includeIdentityClaimParameters.push(
    ...(parameters.parameter?.filter(p => p.name === 'includeIdentityClaim') || [])
  )
  const includeIdentityClaims =
    includeIdentityClaimParameters?.map(p => p.valueString).filter(Boolean) || []

  const since = parameters.parameter?.find(p => p.name === '_since')?.valueDateTime
  if (since) {
    const iso8601Regex =
      /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/
    if (!iso8601Regex.test(since)) {
      throw new Error(
        'Invalid _since parameter: must be ISO8601 format (YYYY, YYYY-MM, YYYY-MM-DD, or YYYY-MM-DDTHH:mm:ss.sssZ)'
      )
    }
  }

  const patient = await medplum.readReference(patientReference as Reference)
  const sanitizedPatient = sanitizePatient(patient as Patient, includeIdentityClaims as string[])
  const collectedResources: Resource[] = []
  for (const type of normalizedCredentialTypes) {
    if (type === 'Immunization' || type === 'Observation') {
      const searchParams: Record<string, string> = { patient: `Patient/${patient.id}` }
      if (since) {
        searchParams.date = `ge${since}`
      }
      const resources = await medplum.searchResources(type, searchParams)
      collectedResources.push(...resources)
    } else {
      throw new Error(`Credential type ${type} is not supported`)
    }
  }

  let filteredResources = collectedResources
  if (credentialValueSets.length > 0) {
    const expandedVSets = await Promise.all(
      credentialValueSets.map(uri => expandValueSet(medplum, uri as string))
    )
    filteredResources = filterResourcesByValueSets(collectedResources, expandedVSets)
  }

  if (filteredResources.length === 0) {
    return { resourceType: 'Parameters' }
  }

  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      ...(patient ? [{ fullUrl: `Patient/${patient.id}`, resource: sanitizedPatient }] : []),
      ...filteredResources.map(r => ({
        fullUrl: `${r.resourceType}/${r.id}`,
        resource: r,
      })),
    ],
  }
  const issuer = new SHCIssuer({
    issuer: event.secrets.SHC_ISSUER?.valueString as string,
    privateKey: makeStringLiteral(event.secrets.PRIVATE_KEY_PKCS8?.valueString as string), // ES256 private key in PKCS#8 format
    publicKey: makeStringLiteral(event.secrets.PUBLIC_KEY_SPKI?.valueString as string), // ES256 public key in SPKI format
  })

  const healthCard = await issuer.issue(bundle)
  // necessary to work with medplum
  return { verifiableCredential: healthCard.asJWS() }
}
