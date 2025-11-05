export interface MedplumAppConfig {
  baseUrl?: string;
  clientId?: string;
  projectId?: string;
  recaptchaSiteKey?: string;
}

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL,
  clientId: import.meta.env?.MEDPLUM_CLIENT_ID,
  projectId: import.meta.env?.MEDPLUM_PROJECT_ID,
  recaptchaSiteKey: import.meta.env?.MEDPLUM_RECAPTCHA_SITE_KEY,
};

export function getConfig(): MedplumAppConfig {
  return config;
}
