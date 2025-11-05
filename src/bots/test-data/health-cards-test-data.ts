import type {
  Bundle,
  Immunization,
  Observation,
  Parameters,
  Patient,
} from "@medplum/fhirtypes";

export const testPatient: Patient = {
  resourceType: "Patient",
  id: "patient-123",
  name: [
    {
      given: ["John"],
      family: "Doe",
    },
  ],
  birthDate: "1990-01-01",
  gender: "male",
  identifier: [
    {
      system: "http://hl7.org/fhir/sid/us-ssn",
      value: "123-45-6789",
    },
  ],
};

export const testImmunization: Immunization = {
  resourceType: "Immunization",
  id: "immunization-123",
  status: "completed",
  vaccineCode: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/cvx",
        code: "207",
        display: "Moderna COVID-19 Vaccine",
      },
    ],
  },
  patient: {
    reference: "Patient/patient-123",
  },
  occurrenceDateTime: "2023-01-15T10:00:00Z",
  lotNumber: "LOT123",
  manufacturer: {
    display: "Moderna",
  },
};

export const testObservation: Observation = {
  resourceType: "Observation",
  id: "observation-123",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "94500-6",
        display:
          "SARS-CoV-2 (COVID-19) RNA panel - Respiratory specimen by NAA with probe detection",
      },
    ],
  },
  subject: {
    reference: "Patient/patient-123",
  },
  effectiveDateTime: "2023-01-10T14:30:00Z",
  valueString: "Not Detected",
};

export const testBundle: Bundle = {
  resourceType: "Bundle",
  type: "collection",
  entry: [
    {
      fullUrl: "Patient/patient-123",
      resource: testPatient,
    },
    {
      fullUrl: "Immunization/immunization-123",
      resource: testImmunization,
    },
    {
      fullUrl: "Observation/observation-123",
      resource: testObservation,
    },
  ],
};

export const basicParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
  ],
};

export const multipleCredentialTypesParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
    {
      name: "credentialType",
      valueUri: "#laboratory",
    },
  ],
};

export const parametersWithSince: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
    {
      name: "_since",
      valueDateTime: "2023-01-01T00:00:00Z",
    },
  ],
};

export const parametersWithIdentityClaims: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
    {
      name: "includeIdentityClaim",
      valueString: "Patient.name",
    },
    {
      name: "includeIdentityClaim",
      valueString: "Patient.birthDate",
    },
  ],
};

export const parametersWithCredentialValueSet: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
    {
      name: "credentialValueSet",
      valueUri: "https://example.com/immunization-codes",
    },
  ],
};

export const invalidSinceParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
    {
      name: "_since",
      valueDateTime: "invalid-date",
    },
  ],
};

export const missingSubjectParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "credentialType",
      valueUri: "#immunization",
    },
  ],
};

export const missingCredentialTypeParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
  ],
};

export const unsupportedCredentialTypeParameters: Parameters = {
  resourceType: "Parameters",
  parameter: [
    {
      name: "subject",
      valueReference: {
        reference: "Patient/patient-123",
      },
    },
    {
      name: "credentialType",
      valueUri: "#unsupported",
    },
  ],
};

export const testSecrets = {
  SHC_ISSUER: {
    name: "SHC_ISSUER",
    valueString: "https://spec.smarthealth.cards/examples/issuer",
  },
  HEALTH_CARD_PUBLIC_KEY: {
    name: "HEALTH_CARD_PUBLIC_KEY",
    valueString:
      '{"kty": "EC","kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s","use": "sig","alg": "ES256","crv": "P-256","x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw","y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8","crlVersion": 1}',
  },
  HEALTH_CARD_PRIVATE_KEY: {
    name: "HEALTH_CARD_PRIVATE_KEY",
    valueString:
      '{"kty": "EC","kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s","use": "sig","alg": "ES256","crv": "P-256","x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw","y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8","d": "FvOOk6hMixJ2o9zt4PCfan_UW7i4aOEnzj76ZaCI9Og"}',
  },
};

export const testImmunizationWithDifferentCode: Immunization = {
  resourceType: "Immunization",
  id: "immunization-different-123",
  status: "completed",
  vaccineCode: {
    coding: [
      {
        system: "http://hl7.org/fhir/sid/cvx",
        code: "208", // Different code
        display: "Pfizer COVID-19 Vaccine",
      },
    ],
  },
  patient: {
    reference: "Patient/patient-123",
  },
  occurrenceDateTime: "2023-02-15T10:00:00Z",
  lotNumber: "LOT456",
  manufacturer: {
    display: "Pfizer",
  },
};

export const testObservationWithDifferentCode: Observation = {
  resourceType: "Observation",
  id: "observation-different-123",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "94534-5", // Different code
        display:
          "SARS-CoV-2 (COVID-19) RNA [Presence] in Respiratory specimen by NAA with probe detection",
      },
    ],
  },
  subject: {
    reference: "Patient/patient-123",
  },
  effectiveDateTime: "2023-02-10T14:30:00Z",
  valueString: "Detected",
};
