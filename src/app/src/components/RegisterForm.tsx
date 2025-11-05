import { Button, Stack, Text, Title } from "@mantine/core";
import { RegisterForm as MedplumRegisterForm } from "@medplum/react";
import type { JSX } from "react";
import { getConfig } from "../config";

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegisterForm({
  onSuccess,
  onCancel,
}: RegisterFormProps): JSX.Element {
  const config = getConfig();

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} ta="center" mb="md">
          Create Account
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          Register as a new patient to access your health information
        </Text>
      </div>

      <MedplumRegisterForm
        type="patient"
        projectId={config.projectId}
        recaptchaSiteKey={config.recaptchaSiteKey}
        onSuccess={() => {
          onSuccess?.();
        }}
      />

      {onCancel && (
        <Button variant="subtle" onClick={onCancel} mt="md">
          Back to sign in
        </Button>
      )}
    </Stack>
  );
}
