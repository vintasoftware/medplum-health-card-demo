import type { MedplumClient } from "@medplum/core";
import type {
  Patient,
  Resource,
  Immunization,
  Observation,
} from "@medplum/fhirtypes";

export function sanitizePatient(patient: Patient, claims: string[]): Patient {
  const sanitized: Patient = { resourceType: "Patient", id: patient.id };

  // Iterate through all properties of the patient object
  for (const [key, value] of Object.entries(patient)) {
    // Skip resourceType and id as they're already set
    if (key === "resourceType" || key === "id") {
      continue;
    }

    // Always remove extensions and photo (SMART Health Cards spec)
    if (key === "extension" || key === "photo") {
      continue;
    }

    // If no claims specified, include all other fields
    if (!claims.length) {
      (sanitized as unknown as Record<string, unknown>)[key] = value;
      continue;
    }

    // Check if this field is requested in claims
    // Support "Patient.fieldName" format
    const fieldClaimed = claims.includes(`Patient.${key}`);

    if (fieldClaimed && value !== undefined) {
      (sanitized as unknown as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}

type CanonicalCode = `${string}|${string}`;

function canonical(
  coding?: { system?: string; code?: string } | null
): CanonicalCode | null {
  if (!coding?.system || !coding?.code) {
    return null;
  }
  return `${coding.system}|${coding.code}`;
}

function extractCodingsFromResource(resource: Resource): CanonicalCode[] {
  if (resource.resourceType === "Immunization") {
    const immunization = resource as Immunization;
    const codings = immunization.vaccineCode?.coding ?? [];
    return codings.map(canonical).filter(Boolean) as CanonicalCode[];
  }
  if (resource.resourceType === "Observation") {
    const observation = resource as Observation;
    const codings = observation.code?.coding ?? [];
    return codings.map(canonical).filter(Boolean) as CanonicalCode[];
  }
  return [];
}

export async function expandValueSet(
  medplum: MedplumClient,
  vsUri: string
): Promise<CanonicalCode[]> {
  let result: {
    expansion?: {
      contains?: {
        system?: string;
        code?: string;
        concept?: { code?: string }[];
      }[];
    };
  };
  try {
    result = await medplum.get(
      `ValueSet/$expand?url=${encodeURIComponent(vsUri)}`
    );
  } catch {
    result = await medplum.post("ValueSet/$expand", { url: vsUri });
  }

  const contains = result?.expansion?.contains ?? [];
  const codes: CanonicalCode[] = [];

  for (const item of contains) {
    if (item.system && item.code) {
      codes.push(`${item.system}|${item.code}`);
    }
    if (Array.isArray(item.concept)) {
      for (const c of item.concept) {
        if (c.code && item.system) {
          codes.push(`${item.system}|${c.code}`);
        }
      }
    }
  }
  return codes;
}

export function filterResourcesByValueSets(
  resources: Resource[],
  valueSets: CanonicalCode[][]
): Resource[] {
  if (!valueSets.length) {
    return resources;
  }
  return resources.filter((r) => {
    const resourceCodes = extractCodingsFromResource(r);
    if (resourceCodes.length === 0) {
      return false;
    }
    for (const vs of valueSets) {
      const matched = resourceCodes.some((code) => vs.includes(code));
      if (!matched) {
        return false;
      }
    }
    return true;
  });
}
