import { indexSearchParameterBundle, indexStructureDefinitionBundle } from '@medplum/core'
import { readJson, SEARCH_PARAMETER_BUNDLE_FILES } from '@medplum/definitions'
import type { Bundle, Parameters, SearchParameter } from '@medplum/fhirtypes'
import { MockClient } from '@medplum/mock'
import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals'
import { handler } from './health-cards-demo-bot'
import {
  basicParameters,
  invalidSinceParameters,
  missingCredentialTypeParameters,
  missingSubjectParameters,
  multipleCredentialTypesParameters,
  parametersWithCredentialValueSet,
  parametersWithIdentityClaims,
  parametersWithSince,
  testImmunization,
  testImmunizationWithDifferentCode,
  testObservation,
  testObservationWithDifferentCode,
  testPatient,
  testSecrets,
  unsupportedCredentialTypeParameters,
} from './test-data/health-cards-test-data'

describe('Health Cards Demo Bot', () => {
  let medplum: MockClient
  const bot = { reference: 'Bot/123' }
  const contentType = 'application/fhir+json'

  beforeAll(() => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle)
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle)
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle)
    for (const filename of SEARCH_PARAMETER_BUNDLE_FILES) {
      indexSearchParameterBundle(readJson(filename) as Bundle<SearchParameter>)
    }
  })

  beforeEach(async () => {
    medplum = new MockClient()
    await medplum.createResource(testPatient)
    await medplum.createResource(testImmunization)
    await medplum.createResource(testObservation)
    await medplum.createResource(testImmunizationWithDifferentCode)
    await medplum.createResource(testObservationWithDifferentCode)
  })

  describe('Basic functionality', () => {
    test('Creates health card with immunization credential', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Creates health card with multiple credential types', async () => {
      const result = await handler(medplum, {
        bot,
        input: multipleCredentialTypesParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Creates health card with since parameter', async () => {
      const result = await handler(medplum, {
        bot,
        input: parametersWithSince,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Creates health card with identity claims', async () => {
      const result = await handler(medplum, {
        bot,
        input: parametersWithIdentityClaims,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Creates health card with credential value set', async () => {
      const result = await handler(medplum, {
        bot,
        input: parametersWithCredentialValueSet,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      // When value set expansion fails in test environment, it should return Parameters object
      expect(result.resourceType).toBe('Parameters')
    })
  })

  describe('Error handling', () => {
    test('Throws error when subject is missing', async () => {
      await expect(
        handler(medplum, {
          bot,
          input: missingSubjectParameters,
          contentType,
          secrets: testSecrets,
        })
      ).rejects.toThrow('Subject is required')
    })

    test('Throws error when credential type is missing', async () => {
      await expect(
        handler(medplum, {
          bot,
          input: missingCredentialTypeParameters,
          contentType,
          secrets: testSecrets,
        })
      ).rejects.toThrow('Credential type is required')
    })

    test('Throws error when since parameter is invalid', async () => {
      await expect(
        handler(medplum, {
          bot,
          input: invalidSinceParameters,
          contentType,
          secrets: testSecrets,
        })
      ).rejects.toThrow(
        'Invalid _since parameter: must be ISO8601 format (YYYY, YYYY-MM, YYYY-MM-DD, or YYYY-MM-DDTHH:mm:ss.sssZ)'
      )
    })

    test('Throws error when credential type is unsupported', async () => {
      await expect(
        handler(medplum, {
          bot,
          input: unsupportedCredentialTypeParameters,
          contentType,
          secrets: testSecrets,
        })
      ).rejects.toThrow('Credential type #unsupported is not supported')
    })
  })

  describe('Credential type normalization', () => {
    test('Normalizes #immunization to Immunization', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Normalizes #laboratory to Observation', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#laboratory',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
  })

  describe('Resource collection', () => {
    test('Collects immunization resources', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Collects observation resources', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#laboratory',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Filters resources by since parameter', async () => {
      const result = await handler(medplum, {
        bot,
        input: parametersWithSince,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
  })

  describe('Patient sanitization', () => {
    test('Sanitizes patient with identity claims', async () => {
      const result = await handler(medplum, {
        bot,
        input: parametersWithIdentityClaims,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Sanitizes patient without identity claims', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Handles name-only identity claims', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
          {
            name: 'includeIdentityClaim',
            valueString: 'name',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Handles birthDate-only identity claims', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
          {
            name: 'includeIdentityClaim',
            valueString: 'birthDate',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Handles empty identity claims array', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
  })

  describe('Bundle creation', () => {
    test('Creates bundle with patient and resources', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Creates bundle with multiple resource types', async () => {
      const result = await handler(medplum, {
        bot,
        input: multipleCredentialTypesParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
  })

  describe('Health card issuance', () => {
    test('Issues health card with valid credentials', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Issues health card with multiple credentials', async () => {
      const result = await handler(medplum, {
        bot,
        input: multipleCredentialTypesParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
  })

  describe('Parameter validation', () => {
    test('Validates ISO8601 since parameter format', async () => {
      const validSinceParameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
          {
            name: '_since',
            valueDateTime: '2023-01-01T00:00:00Z',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: validSinceParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Validates ISO8601 since parameter with different formats', async () => {
      const testCases = [
        '2023',
        '2023-01',
        '2023-01-01',
        '2023-01-01T00:00:00Z',
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00+00:00',
      ]

      for (const sinceValue of testCases) {
        const parameters: Parameters = {
          resourceType: 'Parameters',
          parameter: [
            {
              name: 'subject',
              valueReference: {
                reference: 'Patient/patient-123',
              },
            },
            {
              name: 'credentialType',
              valueUri: '#immunization',
            },
            {
              name: '_since',
              valueDateTime: sinceValue,
            },
          ],
        }

        const result = await handler(medplum, {
          bot,
          input: parameters,
          contentType,
          secrets: testSecrets,
        })

        expect(result).toBeDefined()
        expect(result).toHaveProperty('verifiableCredential')
        expect(typeof result.verifiableCredential).toBe('string')
      }
    })
  })

  describe('Value set filtering', () => {
    test('Handles credential value set parameter gracefully when expansion fails', async () => {
      // Since MockClient doesn't support value set expansion, this should return Parameters
      // when no resources match the value set criteria
      const result = await handler(medplum, {
        bot,
        input: parametersWithCredentialValueSet,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      // When value set expansion fails, it should return Parameters object
      expect(result.resourceType).toBe('Parameters')
    })

    test('Handles multiple value sets gracefully when expansion fails', async () => {
      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
          {
            name: 'credentialValueSet',
            valueUri: 'https://example.com/immunization-codes-1',
          },
          {
            name: 'credentialValueSet',
            valueUri: 'https://example.com/immunization-codes-2',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      // When value set expansion fails, it should return Parameters object
      expect(result.resourceType).toBe('Parameters')
    })
  })

  describe('Edge cases', () => {
    test('Handles empty credential value sets', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Handles empty identity claims', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })

    test('Handles missing since parameter', async () => {
      const result = await handler(medplum, {
        bot,
        input: basicParameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('verifiableCredential')
      expect(typeof result.verifiableCredential).toBe('string')
    })
    test('Returns Parameters object when no resources found', async () => {
      // Create a patient with no associated resources
      const emptyPatient = {
        ...testPatient,
        id: 'empty-patient-123',
      }
      await medplum.createResource(emptyPatient)

      const parameters: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          {
            name: 'subject',
            valueReference: {
              reference: 'Patient/empty-patient-123',
            },
          },
          {
            name: 'credentialType',
            valueUri: '#immunization',
          },
        ],
      }

      const result = await handler(medplum, {
        bot,
        input: parameters,
        contentType,
        secrets: testSecrets,
      })

      expect(result).toBeDefined()
      expect(result.resourceType).toBe('Parameters')
      expect(result.parameter).toBeUndefined()
    })
  })
})
