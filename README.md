# Medplum SMART Health Card Demo

A Medplum Application + Bot that issues SMART Health Cards using the FHIR Operation `$health-cards-issue` as defined by the [Issue Verifiable Credential FHIR spec](https://hl7.org/fhir/uv/smart-health-cards-and-links/OperationDefinition-patient-i-health-cards-issue.html).

Uses the library [kill-the-clipboard](https://github.com/vintasoftware/kill-the-clipboard).

<img height="400" alt="Medplum SMART Health Card Demo" src="https://github.com/user-attachments/assets/b6aec316-c2a4-4852-a7ab-8fd38b6f0784" />

## Features

### Patient-Facing App Features
- **Immunization Filtering**: Filter patient immunizations by date range
- **QR Code Generation**: Generate SMART Health Card QR codes that can be scanned by healthcare providers
- **User-Friendly Interface**: Built with React Medplum components

### Bot Features
- **SMART Health Card Issuance**: Generate health cards for any FHIR resource type, including immunizations
- **Date Filtering**: Filter resources by date using `_since` parameter
- **Value Set Filtering**: Filter resources by specific value sets (NOTE: requires UMLS Terminology, a [premium Medplum feature](https://www.medplum.com/pricing))


## Project Structure

This is a **monorepo** containing two main components:

- **Bots** (`src/bots/`): Medplum bot for SMART Health Card issuance using the FHIR Operation `$health-cards-issue`, built with esbuild
- **App** (`src/app/`): Patient-facing React application for generating SMART Health Cards, built with Vite

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

If you haven't already done so, follow the instructions in [this tutorial](https://www.medplum.com/docs/tutorials/register) to register a Medplum project.

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

6. **Manually set the bot as `system`:**
   - Go to the [Bots listing page in app.medplum.com](https://app.medplum.com/Bot)
   - Find your bot and click on it
   - Click on the "Edit" button
   - Mark the "System" checkbox
   - Click on the "Update" button
   - This is necessary to allow the bot to access the SHC secret key.

7. **Set the Patient user access policy for executing the custom FHIR operation:**
   - Ensure your Medplum project has the proper [Access Policy](https://www.medplum.com/docs/access/access-policies#patient-access) for Patients. Patient users must have access to the `Bot` and `OperationDefinition` resources to execute the health card generation bot. Check the file [`patient-access-policy.json`](./patient-access-policy.json) for the policy you can use in your project. Go to the [app.medplum.com Access Policy page](https://app.medplum.com/AccessPolicy), create an Access Policy, and use the "JSON" tab to set the policy JSON.

8. **Configure the bot secrets:**
   - See the section [Bot Secrets Configuration](#bot-secrets-configuration) below.

## Bot Secrets Configuration

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

1. Go to the ["Secrets" page in app.medplum.com](https://app.medplum.com/admin/secrets)
2. Add the three secrets with the example values (see above)

## Patient-Facing App Configuration

A React application that allows patients to generate SMART Health Cards from their immunization records.

### Prerequisites

Before running the app, deploy the health cards bot (see [Bot Deployment](#bot-deployment) section above).

### Set up open patient registration

To allow patients to self-register, set the patient access policy as the default.

1. Navigate to [app.medplum.com Project page](https://app.medplum.com/Project) and select your project.
2. In the "Edit" tab, set the "Default Patient Access Policy" field to your patient access policy and click "Update".

For more details, see the [Open Patient Registration documentation](https://www.medplum.com/docs/user-management/open-patient-registration).

#### Set up reCAPTCHA

A reCAPTCHA configuration is required for the registration form to work.

1. Create a new reCAPTCHA configuration to get the site key and secret key at [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create).
2. Go to [app.medplum.com](https://app.medplum.com), go to Project, then Sites. Create a Site with domains `localhost` and `127.0.0.1` and set the reCAPTCHA site key and secret key.
3. Keep the reCAPTCHA site key at hand to set it as an environment variable (see the next section).

### App environment variables

Inside the `src/app` directory, copy the `.env.defaults` file to `.env` and configure the environment variables:

```bash
cd src/app
cp .env.defaults .env
```

Add the following to your `.env` file:

```bash
MEDPLUM_BASE_URL=https://api.medplum.com  # or your Medplum server URL
MEDPLUM_CLIENT_ID=your-client-id
MEDPLUM_PROJECT_ID=your-project-id  # Required for patient registration
MEDPLUM_RECAPTCHA_SITE_KEY=your-recaptcha-site-key  # Required for patient registration
```

#### Install and Run

From the **root directory**:

```bash
# Install dependencies (installs for both bots and app)
npm install

# Start the app development server
npm run dev:app
```

The app runs on `http://localhost:3000/`

Alternatively, you can run commands directly from the app directory:

```bash
cd src/app
npm run dev
```

### Using the App

1. **New users**: Click "Sign in" and then "Register here" to create a new patient account
2. **Existing users**: Sign in as a Patient user
3. (Optional) Filter your immunizations by date
4. Click "Generate Health Card" to create a health card with your immunizations
5. Scan the QR code with a SMART Health Card reader app

## Development

### Updating the Bot

After making changes to the bot code:

```bash
# Build the updated code
npm run build:bots

# Deploy to Medplum
npx medplum bot deploy health-cards-demo-bot
```

### `$health-cards-issue` API Usage

The `$health-cards-issue` custom FHIR Operation is implemented in the bot with these parameters:

**Required:**
- `subject`: Patient resource reference
- `credentialType`: FHIR resource type to include in the health card

**Optional:**
- `_since`: ISO8601 date for filtering (e.g., "2023-01-01")
- `credentialValueSet`: Value set URIs for filtering (e.g., "https://terminology.smarthealth.cards/ValueSet/immunization-covid-all"). Multiple value sets can be specified using multiple parameters with AND logic. NOTE: requires UMLS Terminology, a [premium Medplum feature](https://www.medplum.com/pricing). Grab SMART Health Cards terminology from [terminology.smarthealth.cards](https://terminology.smarthealth.cards/artifacts.html) and add it to your Medplum instance.
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

## See also

For larger FHIR bundles, prefer using SMART Health Links. The [Kill the Clipboard Library](https://github.com/vintasoftware/kill-the-clipboard) also supports SMART Health Link generation and it provides a [Medplum Demo project](https://github.com/vintasoftware/kill-the-clipboard/tree/main/demo/medplum-shl#readme).

## Reference Resources

- [SMART Health Cards Specification](https://hl7.org/fhir/uv/smart-health-cards-and-links/cards-specification.html)
- [FHIR Operation Specification](https://hl7.org/fhir/uv/smart-health-cards-and-links/OperationDefinition-patient-i-health-cards-issue.html)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Commercial Support

[![alt text](https://avatars2.githubusercontent.com/u/5529080?s=80&v=4 "Vinta Logo")](https://www.vinta.com.br/)

This project is maintained by [Vinta Software](https://www.vinta.com.br/). We offer design and development services for healthcare companies. If you need any commercial support, feel free to get in touch: contact@vinta.com.br
