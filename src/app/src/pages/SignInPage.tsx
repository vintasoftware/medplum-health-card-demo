import { Title } from "@mantine/core";
import { Logo, SignInForm } from "@medplum/react";
import type { JSX } from "react";
import { useNavigate } from "react-router";
import { getConfig } from "../config";

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <SignInForm
      onSuccess={() => navigate("/")?.catch(console.error)}
      clientId={getConfig().clientId}
    >
      <Logo size={32} />
      <Title>Sign in to Medplum</Title>
    </SignInForm>
  );
}
