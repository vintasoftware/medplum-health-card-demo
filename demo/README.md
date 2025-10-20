# Medplum Health Cards Demo

A simple demo application for the `$health-cards-issue` operation using Medplum, built with React and Vite.

## Features

- Patient registration
- Patient sign in
- Integration with Medplum backend
- Built with Mantine UI components

## Setup

### Prerequisites

- Node.js 20.19.0 or higher
- pnpm package manager
- Configured Medplum project (see sections below)

### Medplum Configuration

#### 1. Client Credentials Setup

Get your Medplum project ID from the [Project page](https://app.medplum.com/admin/project).

Create a Client application in your Project page and get the client ID.

For more details, see the [Medplum Client Credentials documentation](https://www.medplum.com/docs/auth/methods/client-credentials).

#### 2. reCAPTCHA Setup

Create a new reCAPTCHA configuration at [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create).

Go to [app.medplum.com](https://app.medplum.com), navigate to Project, then Sites. Create a Site with domains `localhost` and `127.0.0.1` and set the reCAPTCHA site key and secret key.

#### 3. Patient Access Policy Setup

Ensure your Medplum project has the proper [Access Policy](https://www.medplum.com/docs/access/access-policies#patient-access) for Patients.

Navigate to [app.medplum.com Access Policy page](https://app.medplum.com/AccessPolicy) and create an Access Policy. Set it as the "Default Patient Access Policy" in your Project settings.

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables in `.env`:
   ```env
   VITE_MEDPLUM_BASE_URL=https://api.medplum.com
   VITE_MEDPLUM_PROJECT_ID=your_project_id
   VITE_MEDPLUM_CLIENT_ID=your_client_id
   VITE_MEDPLUM_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Patient Registration

1. On the home page, click "Register here" to create a new patient account
2. Fill in the registration form
3. Complete the reCAPTCHA verification

### Patient Sign In

1. Enter your email and password
2. Click "Sign in"

## Development

### Project Structure

```
demo/
├── src/
│   ├── components/
│   │   └── RegisterForm.tsx    # Registration form component
│   ├── pages/
│   │   └── HomePage.tsx        # Home page with login/register
│   ├── App.tsx                 # Main app with routing
│   └── main.tsx                # App entry point with providers
├── .env.example                # Environment variables template
├── package.json
└── README.md
```

### Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Mantine UI
- Medplum SDK
