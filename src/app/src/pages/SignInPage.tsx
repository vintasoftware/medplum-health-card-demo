import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { Document, Logo, SignInForm } from "@medplum/react";
import type { JSX } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RegisterForm } from "../components/RegisterForm";
import { getConfig } from "../config";

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);

  const handleRegistrationSuccess = () => {
    setShowRegister(false);
    // Navigate to home page after successful registration
    navigate("/")?.catch(console.error);
  };

  if (showRegister) {
    return (
      <Document width={500}>
        <RegisterForm
          onSuccess={handleRegistrationSuccess}
          onCancel={() => setShowRegister(false)}
        />
      </Document>
    );
  }

  return (
    <Document width={500}>
      <SignInForm
        onSuccess={() => navigate("/")?.catch(console.error)}
        clientId={getConfig().clientId}
      >
        <Logo size={32} />
        <Title>Sign in to Medplum</Title>
        <Group justify="center" mt="md">
          <Text size="sm" c="dimmed">
            Don&apos;t have an account?{" "}
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => setShowRegister(true)}
            >
              Register here
            </Button>
          </Text>
        </Group>
      </SignInForm>
    </Document>
  );
}
