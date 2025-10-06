# SMART Health Card Demo

A Medplum Bot that issues SMART Health Cards using the FHIR Operation `$health-cards-issue` for generating verifiable health credentials.

## Features

- **Immunization & Laboratory Credentials**: Generate health cards for vaccination records and lab results
- **Identity Claims**: Selective patient data inclusion
- **Date Filtering**: Filter resources by date using `_since` parameter
- **Value Set Filtering**: Filter credentials by specific value sets
- **Multiple Credential Types**: Support for multiple credential types in a single request

## Quick Start

```bash
# Install and build
pnpm install
pnpm run build

# Run tests
pnpm test

# Build bot
pnpm run build:bots
```

## Deploy bots
For bots deployment is necessary have the env variables use the .env.example file as reference.


The after the bot has been build there are two ways:
If just wanna deploy the bot:
``` bash
pnpm run deploy:bots
```

If wanna deploy the bot and the operation:
``` bash
pnpm run deploy:bots-and-operation
```

## API Usage

The bot implements `$health-cards-issue` with these parameters:

**Required:**
- `subject`: Patient resource reference
- `credentialType`: Immunization or Laboratory

**Optional:**
- `_since`: ISO8601 date for filtering
- `includeIdentityClaim`: Patient data to include (e.g., `Patient.name`)
- `credentialValueSet`: Value set URIs for filtering

**Example Request:**
```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "subject",
      "valueReference": {"reference": "Patient/patient-123"}
    },
    {
      "name": "credentialType", 
      "valueUri": "#immunization"
    }
  ]
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage
```
## Configuration

Required Medplum secrets:
- `SHC_ISSUER`: Issuer URL
- `PRIVATE_KEY_PKCS8`: ES256 private key
- `PUBLIC_KEY_SPKI`: ES256 public key

Generate keys: `npx ts-node src/scripts/es256-key-pairs-generator.ts`

## Resources

- [FHIR Operation Specification](https://hl7.org/fhir/uv/smart-health-cards-and-links/OperationDefinition-patient-i-health-cards-issue.html)
- [Kill the Clipboard Library](https://github.com/vintasoftware/kill-the-clipboard)
- [Medplum](https://github.com/medplum/medplum)

## Development

```bash
# Code quality
pnpm run check:fix

# Testing
pnpm run test:watch
```

Built with TypeScript, Jest, and Biome. Follows [Conventional Commits](https://www.conventionalcommits.org/).