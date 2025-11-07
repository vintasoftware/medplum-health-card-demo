import {
  Anchor,
  Box,
  Button,
  Card,
  CopyButton,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import type { JSX } from "react";

export interface QRCodeDisplayProps {
  qrCodeUrls: string[];
  shcNumeric: string[];
  jws: string;
  onReset: () => void;
}

export function QRCodeDisplay({
  qrCodeUrls,
  shcNumeric,
  jws,
  onReset,
}: QRCodeDisplayProps): JSX.Element {
  return (
    <Card shadow="md" padding="xl" mb="xl" withBorder>
      <Stack gap="md">
        <Title order={2} ta="center">
          Your SMART Health Card
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          {qrCodeUrls.length === 1
            ? "Scan this QR code with a SMART Health Card reader app"
            : `Scan these ${qrCodeUrls.length} QR codes in order with a SMART Health Card reader app`}
        </Text>
        {qrCodeUrls.map((qrCodeUrl, index) => (
          <Box
            key={qrCodeUrl}
            style={{
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {qrCodeUrls.length > 1 && (
              <Text fw={500} size="sm" mb="xs">
                QR Code {index + 1} of {qrCodeUrls.length}
              </Text>
            )}
            <img
              src={qrCodeUrl}
              alt={`SMART Health Card QR Code ${index + 1}`}
              style={{ maxWidth: "400px", width: "100%" }}
            />
          </Box>
        ))}

        {shcNumeric.length === 1 && (
          <Stack gap="xs">
            <Text fw={500} size="sm">
              View in External Reader
            </Text>
            <Anchor
              href={`https://viewer.tcpdev.org/#${shcNumeric[0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Group gap="xs">
                <Text size="sm">Open in TCP Health Card Viewer</Text>
                <IconExternalLink size={14} />
              </Group>
            </Anchor>
          </Stack>
        )}

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={500} size="sm">
              JWS (Verifiable Credential)
            </Text>
            <CopyButton value={jws}>
              {({ copied, copy }) => (
                <Button size="xs" variant="light" onClick={copy}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Textarea
            value={jws}
            readOnly
            autosize
            minRows={3}
            maxRows={8}
            styles={{
              input: {
                fontFamily: "monospace",
                fontSize: "11px",
              },
            }}
          />
        </Stack>

        <Button variant="outline" onClick={onReset}>
          Generate Another
        </Button>
      </Stack>
    </Card>
  );
}
