<h1 align="center">Medplum SMART Health Cards App</h1>
<p align="center">A patient-facing application for generating SMART Health Cards from immunization records.</p>

This example app demonstrates the following:

- Creating a new React app with Vite and TypeScript
- Adding Medplum dependencies
- Adding basic URL routing
- Using the [Medplum client](https://www.medplum.com/docs/sdk/classes/MedplumClient) to search for FHIR resources
- Using [Medplum GraphQL](https://graphiql.medplum.com/) queries to fetch linked resources
- Using [Medplum React Components](https://storybook.medplum.com/?path=/docs/medplum-introduction--docs) to display FHIR data
- **Generating SMART Health Cards** from patient immunizations using the [kill-the-clipboard](https://github.com/vintasoftware/kill-the-clipboard) library
- **Displaying QR codes** for SMART Health Cards that can be scanned by healthcare providers

### Getting Started

If you haven't already done so, follow the instructions in [this tutorial](https://www.medplum.com/docs/tutorials/register) to register a Medplum project to store your data.

#### Prerequisites

1. Deploy the health cards bot from the parent directory (see parent README.md)
2. Get the Bot ID from Medplum after deployment
3. Ensure the bot has the required secrets configured:
   - `SHC_ISSUER`: Your issuer URL
   - `HEALTH_CARD_PRIVATE_KEY`: ES256 private key
   - `HEALTH_CARD_PUBLIC_KEY`: ES256 public key

#### Configuration

Copy the `.env.defaults` file to `.env` and configure the environment variables:

```bash
cp .env.defaults .env
```

Add the following to your `.env` file:

```bash
MEDPLUM_BASE_URL=https://api.medplum.com  # or your Medplum server URL
MEDPLUM_CLIENT_ID=your-client-id
```

#### Install and Run

This app is part of the monorepo. From the **root directory**:

```bash
# Install dependencies (installs for both bots and app)
npm install

# Start the app development server
npm run dev:app
```

The app runs on `http://localhost:3000/`

Alternatively, you can run commands directly from this directory:

```bash
cd src/app
npm run dev
```

#### Using the App

1. Sign in as a Patient user
2. Click on "My Health Cards" in the sidebar
3. (Optional) Filter your immunizations by date:
   - Set a "since" date to include only recent immunizations
4. Click "Generate Health Card" to create a health card with your immunizations
5. Scan the QR code with a SMART Health Card reader app
