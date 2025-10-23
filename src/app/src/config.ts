export interface MedplumAppConfig {
  baseUrl?: string;
  clientId?: string;
}

const config: MedplumAppConfig = {
  baseUrl: import.meta.env?.MEDPLUM_BASE_URL,
  clientId: import.meta.env?.MEDPLUM_CLIENT_ID,
};

export function getConfig(): MedplumAppConfig {
  return config;
}
