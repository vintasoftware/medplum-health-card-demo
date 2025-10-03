import type { BotEvent, MedplumClient } from '@medplum/core'
import type { Parameters, Resource, ParametersParameter, Bundle } from '@medplum/fhirtypes'
import { sanitizePatient } from './utils/utilities'
import { SHCIssuer } from 'kill-the-clipboard'

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<Parameters>
): Promise<Parameters> {
  const parameters = event.input as Parameters
  const credentialTypeParameters: ParametersParameter[] = []
  const subject = parameters.parameter?.find(p => p.name === 'subject')
  if (!subject) {
    throw new Error('Subject is required')
  }
  const patientReference = subject?.valueReference?.reference

  // collect credential type parameters
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

  // collect optional credential value set parameters
  const credentialValueSetParameters: ParametersParameter[] = []
  credentialValueSetParameters.push(
    ...(parameters.parameter?.filter(p => p.name === 'credentialValueSet') || [])
  )
  const credentialValueSets =
    credentialValueSetParameters?.map(p => p.valueUri).filter(Boolean) || []

  // collect optional include identity claim parameters
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

  // from here all the parameters are validated, let's start the process of collecting resources
  let collectedResources: Resource[] = []
  for (const type of normalizedCredentialTypes) {
    if (type === 'Immunization' || type === 'Observation') {
      const searchParams: Record<string, string> = { patient: patientReference as string }
      if (since) {
        searchParams.date = `ge${since}`
      }
      const resources = await medplum.searchResources(type, searchParams)
      collectedResources.push(...resources)
    } else {
      throw new Error(`Credential type ${type} is not supported`)
    }
  }

  const patient = await medplum.readResource('Patient', patientReference as string)
  const sanitizedPatient = sanitizePatient(patient, includeIdentityClaims as string[])

  console.log('collectedResources')
  console.log(collectedResources)

  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      ...(patient ? [{ fullUrl: `Patient/${patient.id}`, resource: sanitizedPatient }] : []),
      ...collectedResources.map(r => ({
        fullUrl: `${r.resourceType}/${r.id}`,
        resource: r,
      })),
    ],
  }

  const issuer = new SHCIssuer({
    issuer: event.secrets.SHC_ISSUER?.valueString as string,
    privateKey: event.secrets.PRIVATE_KEY_PKCS8?.valueString as string, // ES256 private key in PKCS#8 format
    publicKey: event.secrets.PUBLIC_KEY_SPKI?.valueString as string, // ES256 public key in SPKI format
  })

  const healthCard = await issuer.issue(bundle)
  const healthCardParameter: ParametersParameter = {
    name: 'verifiableCredential',
    valueString: healthCard.asJWS(),
  }
  return {
    resourceType: 'Parameters',
    parameter: [healthCardParameter],
  }
}
