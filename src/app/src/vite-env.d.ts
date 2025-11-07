interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly MEDPLUM_BASE_URL: string;
  readonly MEDPLUM_CLIENT_ID: string;
  readonly MEDPLUM_PROJECT_ID: string;
  readonly MEDPLUM_RECAPTCHA_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
