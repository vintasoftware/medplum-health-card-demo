# SMART Health Card Demo

A Medplum Bot that issues SMART Health Cards using the FHIR Operation `$health-cards-issue` for generating verifiable health credentials, as defined by the [Issue Verifiable Credential FHIR spec](https://hl7.org/fhir/uv/smart-health-cards-and-links/OperationDefinition-patient-i-health-cards-issue.html).

Uses the library [kill-the-clipboard](https://github.com/vintasoftware/kill-the-clipboard) for SHC generation.

## Features

### Bot Features
- **SMART Health Card Issuance**: Generate health cards for any FHIR resource type, including vaccination records and lab results
- **Date Filtering**: Filter resources by date using `_since` parameter
- **Value Set Filtering**: Filter resources by specific value sets

### Patient-Facing App Features
- **Immunization Filtering**: Filter patient immunizations by value sets and date ranges
- **QR Code Generation**: Generate SMART Health Card QR codes that can be scanned by healthcare providers
- **User-Friendly Interface**: Built with React and Medplum components for a seamless user experience

## Project Structure

This is a **monorepo** containing two main components:

- **Bots** (root): Medplum bots for SMART Health Card issuance, built with esbuild
- **App** (`src/app/`): Patient-facing React application for generating health cards, built with Vite

## Quick Start

```bash
# Install all dependencies (root + app workspace)
npm install

# Build everything (bots + app)
npm run build

# Build only bots
npm run build:bots

# Build only app
npm run build:app

# Run tests (for bots)
npm test

# Start app development server
npm run dev:app
```

## Bot Deployment

This project uses the [Medplum CLI](https://www.medplum.com/docs/bots/bots-in-production) for bot management. Follow these steps to deploy your bot:

### Prerequisites

1. Create a [Client Application](https://www.medplum.com/docs/bots/bots-in-production#setting-up-your-permissions) in your Medplum project
2. Copy `.env.example` to `.env` and set your credentials:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and add your `MEDPLUM_CLIENT_ID` and `MEDPLUM_CLIENT_SECRET`

### Initial Setup (First Time Only)

1. **Build the bot code:**
   ```bash
   npm run build:bots
   ```

2. **Get your Project ID:**
   - Navigate to your Medplum project's admin panel
   - Copy your Project ID

3. **Create the bot using Medplum CLI:**
   ```bash
   npx medplum bot create health-cards-demo-bot <PROJECT_ID> src/bots/health-cards-demo-bot.ts dist/health-cards-demo-bot.js
   ```
   
   This will:
   - Create a Bot resource in Medplum
   - Add the bot to `medplum.config.json`
   - Create a ProjectMembership linking the bot to your project

4. **Deploy the bot code:**
   ```bash
   npx medplum bot deploy health-cards-demo-bot
   ```

5. **Deploy the custom FHIR operation:**
   ```bash
   npm run deploy:operation
   ```
   
   This creates the `$health-cards-issue` operation definition that links to your bot (by the name `health-cards-demo-bot`).

6. **Manually set the bot as `system` in the Medplum App:**
   - Go to the Bots listing page in [Medplum App](https://app.medplum.com/Bot)
   - Find your bot and click on it
   - Click on the "Edit" button
   - Mark the "System" checkbox
   - Click on the "Update" button

7. **Set the Patient user access policy for executing the custom FHIR operation:**
   - Ensure your Medplum project has the proper [Access Policy](https://www.medplum.com/docs/access/access-policies#patient-access) for Patients. Patient users must have access to the `Bot` and `OperationDefinition` resources to execute the health card generation bot. Check the file [`patient-access-policy.json`](./patient-access-policy.json) for the policy you can use in your project. Go to the [app.medplum.com Access Policy page](https://app.medplum.com/AccessPolicy), create an Access Policy, and use the "JSON" tab to set the policy JSON.

### Updating the Bot

After making changes to the bot code:

```bash
# Build the updated code
npm run build:bots

# Deploy to Medplum
npx medplum bot deploy health-cards-demo-bot
```

## API Usage

The `$health-cards-issue` custom FHIR Operation is implemented in the bot with these parameters:

**Required:**
- `subject`: Patient resource reference
- `credentialType`: FHIR resource type to include in the health card

**Optional:**
- `_since`: ISO8601 date for filtering (e.g., "2023-01-01")
- `credentialValueSet`: Value set URIs for filtering (e.g., "https://terminology.smarthealth.cards/ValueSet/immunization-covid-all"). Multiple value sets can be specified using multiple parameters with AND logic.
- `includeIdentityClaim`: Patient data to include (e.g., `Patient.name`)

**Example Request (with filters):**
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
      "valueUri": "Immunization"
    },
    {
      "name": "credentialValueSet",
      "valueUri": "https://terminology.smarthealth.cards/ValueSet/immunization-covid-all"
    },
    {
      "name": "_since",
      "valueDateTime": "2023-01-01"
    }
  ]
}
```

## Bot Configuration

The bot requires these secrets to be configured in Medplum:

- `SHC_ISSUER`: Issuer URL for the SMART Health Cards
- `HEALTH_CARD_PUBLIC_KEY`: ES256 public key
- `HEALTH_CARD_PRIVATE_KEY`: ES256 private key

### Get example values

You can use the public/private key pair from the example issuer `https://spec.smarthealth.cards/examples/issuer`. Do NOT use those values in production:

```txt
SHC_ISSUER=https://spec.smarthealth.cards/examples/issuer
HEALTH_CARD_PUBLIC_KEY={"kty": "EC","kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s","use": "sig","alg": "ES256","crv": "P-256","x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw","y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8","crlVersion": 1}
HEALTH_CARD_PRIVATE_KEY={"kty": "EC","kid": "3Kfdg-XwP-7gXyywtUfUADwBumDOPKMQx-iELL11W9s","use": "sig","alg": "ES256","crv": "P-256","x": "11XvRWy1I2S0EyJlyf_bWfw_TQ5CJJNLw78bHXNxcgw","y": "eZXwxvO1hvCY0KucrPfKo7yAyMT6Ajc3N7OkAB6VYy8","d": "FvOOk6hMixJ2o9zt4PCfan_UW7i4aOEnzj76ZaCI9Og"}
```

### Set Secrets in Medplum

1. Go to the "Secrets" page in [Medplum App](https://app.medplum.com/admin/secrets)
2. Add the three secrets with the example values

## Available Terminology

The project includes SMART Health Cards terminology from [terminology.smarthealth.cards](https://terminology.smarthealth.cards/artifacts.html) and [WHO SMART Guidelines](https://smart.who.int/):

### CodeSystems
- **ICD-11** (`http://id.who.int/icd/release/11/mms`) - WHO International Classification of Diseases for vaccine and disease identification

Stored in `src/fixtures/codesystems/`

### ValueSets

**Immunization ValueSets:**
- `immunization-covid-all` - All COVID-19 vaccine codes
- `immunization-covid-cvx` - COVID-19 vaccines (CVX codes)
- `immunization-covid-icd11` - COVID-19 vaccines (ICD-11 codes)
- `immunization-covid-snomed` - COVID-19 vaccines (SNOMED CT codes)
- `immunization-orthopoxvirus-all` - Orthopoxvirus vaccine codes
- `immunization-orthopoxvirus-cvx` - Orthopoxvirus vaccines (CVX codes)
- `immunization-all-cvx` - All immunizations (CVX codes)
- `immunization-all-icd11` - All immunizations (ICD-11 codes)
- `immunization-all-snomed` - All immunizations (SNOMED CT codes)

**Lab Test ValueSets:**
- `lab-qualitative-test-covid` - COVID-19 lab test codes (LOINC)
- `lab-qualitative-result` - Qualitative lab test results

Stored in `src/fixtures/valuesets/`

## Patient-Facing App

A React application that allows patients to generate SMART Health Cards from their immunization records.

### Setup

The app is integrated as an npm workspace. See detailed instructions in [src/app/README.md](src/app/README.md)

Quick start from the **root directory**:
```bash
# Install dependencies (installs for both root and app)
npm install

# Configure the app
cd src/app
cp .env.defaults .env
# Edit .env to add your HEALTH_CARD_PUBLIC_KEY
cd ../..

# Start the app development server
npm run dev:app
```

### Features

- **View Immunizations**: Patients can see all their immunization records
- **Filter by Value Sets**: Filter immunizations by specific vaccine types using SMART Health Cards ValueSets (COVID-19, orthopoxvirus, etc.)
- **Filter by Date**: Filter immunizations to include only those on or after a specific date
- **Generate QR Code**: Create a scannable SMART Health Card QR code based on filtered immunizations
- **Share with Providers**: Healthcare providers can scan the QR code to access the patient's immunization history

## Resources

- [FHIR Operation Specification](https://hl7.org/fhir/uv/smart-health-cards-and-links/OperationDefinition-patient-i-health-cards-issue.html)
- [Kill the Clipboard Library](https://github.com/vintasoftware/kill-the-clipboard)
- [Medplum](https://github.com/medplum/medplum)

## Development

### Bots Development
```bash
# Code quality (for bots)
npm run check:fix

# Testing (for bots)
npm run test:watch

# Tests with coverage (for bots)
npm run test:coverage

# Linting (for bots)
npm run lint:fix
```

### App Development
```bash
# Start development server
npm run dev:app

# Preview production build
npm run preview:app

# Linting (for app, uses Biome)
npm run lint:app:fix
```

### Workspace Commands
All npm workspace commands from root:
```bash
# Run any app script
npm run <script> --workspace=src/app

# Install dependency to app
npm install <package> --workspace=src/app
```
