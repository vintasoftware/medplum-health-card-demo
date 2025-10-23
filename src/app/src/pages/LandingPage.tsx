import { Anchor, Button, Stack, Text, Title } from "@mantine/core";
import { Document } from "@medplum/react";
import type { JSX } from "react";
import { Link } from "react-router";

export function LandingPage(): JSX.Element {
  return (
    <Document width={500}>
      <Stack align="center">
        <Title order={2}>Welcome!</Title>
        <Text>
          This patient-facing application allows you to generate SMART Health
          Cards from your immunization records. You can select which
          immunizations to include and generate QR codes that can be scanned by
          healthcare providers. If you haven't already done so,{" "}
          <Anchor href="https://app.medplum.com/register">register</Anchor> for
          a Medplum Project. After that you can sign into your project by
          clicking the link below.
        </Text>
        <Button component={Link} to="/signin">
          Sign in
        </Button>
      </Stack>
    </Document>
  );
}
