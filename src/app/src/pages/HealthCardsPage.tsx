import {
  Alert,
  Anchor,
  Box,
  Button,
  Card,
  CopyButton,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { normalizeErrorString } from "@medplum/core";
import type {
  Immunization,
  Parameters,
  ParametersParameter,
  Patient,
} from "@medplum/fhirtypes";
import {
  Document,
  ResourceBadge,
  useMedplum,
  useMedplumProfile,
} from "@medplum/react";
import {
  IconAlertCircle,
  IconCalendar,
  IconExternalLink,
  IconFilter,
  IconQrcode,
} from "@tabler/icons-react";
import { SHCReader } from "kill-the-clipboard";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import sampleImmunizationsData from "../data/sampleImmunizations.json";

export function HealthCardsPage(): JSX.Element {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Patient;
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [sinceDate, setSinceDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);
  const [jws, setJws] = useState<string | null>(null);
  const [shcNumeric, setShcNumeric] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creatingSamples, setCreatingSamples] = useState(false);

  // Load patient's immunizations with date filter
  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    setLoading(true);
    const searchParams: Record<string, string> = {
      patient: `Patient/${profile.id}`,
      _sort: "-date",
    };

    // Apply date filter in the search query
    if (sinceDate) {
      searchParams.date = `ge${sinceDate.toISOString().split("T")[0]}`;
    }

    medplum
      .searchResources("Immunization", searchParams)
      .then((results) => {
        setImmunizations(results);
        setLoading(false);
      })
      .catch((err) => {
        setError(normalizeErrorString(err));
        setLoading(false);
      });
  }, [medplum, profile, sinceDate]);

  const handleCreateSampleImmunizations = async (): Promise<void> => {
    setCreatingSamples(true);
    setError(null);

    try {
      // Create sample immunizations based on SMART Health Cards examples
      // Reference: https://spec.smarthealth.cards/examples/example-01-a-fhirBundle.json
      const sampleImmunizations: Partial<Immunization>[] =
        sampleImmunizationsData.map((imm) => ({
          ...(imm as Partial<Immunization>),
          patient: {
            reference: `Patient/${profile.id}`,
          },
        }));

      // Create each immunization
      const createdImmunizations = await Promise.all(
        sampleImmunizations.map((imm) =>
          medplum.createResource(imm as Immunization)
        )
      );

      // Refresh the immunizations list
      const allImmunizations = await medplum.searchResources("Immunization", {
        patient: `Patient/${profile.id}`,
        _sort: "-date",
      });
      setImmunizations(allImmunizations);

      notifications.show({
        title: "Success",
        message: `Created ${createdImmunizations.length} sample immunizations`,
        color: "green",
      });
    } catch (err) {
      const errorMessage = normalizeErrorString(err);
      setError(errorMessage);
      notifications.show({
        title: "Error creating sample immunizations",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setCreatingSamples(false);
    }
  };

  // Date filtering is already applied in the search query
  // ValueSet filtering is handled server-side by the bot
  const filteredImmunizations = immunizations;

  const handleGenerateHealthCard = async (): Promise<void> => {
    if (filteredImmunizations.length === 0) {
      notifications.show({
        title: "No immunizations match filters",
        message:
          "Please adjust your filters to include at least one immunization.",
        color: "yellow",
      });
      return;
    }

    setGenerating(true);
    setError(null);
    setQrCodeUrls([]);
    setJws(null);
    setShcNumeric([]);

    try {
      // Build parameters for the $health-cards-issue operation
      const parameters: Parameters = {
        resourceType: "Parameters",
        parameter: [
          {
            name: "subject",
            valueReference: { reference: `Patient/${profile.id}` },
          },
          {
            name: "credentialType",
            valueUri: "Immunization",
          },
          // Add _since parameter if date is selected
          ...(sinceDate
            ? [
                {
                  name: "_since" as const,
                  valueDateTime: sinceDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
                },
              ]
            : []),
        ],
      };

      // Invoke the custom FHIR operation to generate the health card
      const response = await medplum.post(
        medplum.fhirUrl("Patient", profile.id as string, "$health-cards-issue"),
        parameters
      );

      // Extract the verifiable credential (JWS)
      // NOTE: For now, Medplum custom FHIR operations return a Parameters object with the verifiable credential in the `verifiableCredential` field.
      const jwsValue = response.parameter?.find(
        (p: ParametersParameter) => p.name === "verifiableCredential"
      )?.valueString;

      if (!jwsValue) {
        throw new Error(
          "No verifiable credential returned from the health card operation."
        );
      }

      // Store the JWS
      setJws(jwsValue);

      // Use SHCReader to decode and generate QR code
      const reader = new SHCReader({
        strictReferences: false,
      });

      // Create a health card from the JWS
      const healthCard = await reader.fromJWS(jwsValue);

      console.log(await healthCard.asBundle());

      // Generate QR code
      const qrCodes = await healthCard.asQR({
        enableChunking: true,
      });

      if (qrCodes.length === 0) {
        throw new Error("Failed to generate QR code from health card.");
      }

      setQrCodeUrls(qrCodes);

      // Generate numeric QR code string (shc:/...)
      const numericCodes = healthCard.asQRNumeric();
      setShcNumeric(numericCodes);

      notifications.show({
        title: "Success",
        message: "SMART Health Card generated successfully!",
        color: "green",
      });
    } catch (err) {
      const errorMessage = normalizeErrorString(err);
      setError(errorMessage);
      notifications.show({
        title: "Error generating health card",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Document>
        <Loader />
      </Document>
    );
  }

  return (
    <Document>
      {qrCodeUrls.length > 0 && (
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

            {jws && (
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
            )}

            <Button
              variant="outline"
              onClick={() => {
                setQrCodeUrls([]);
                setJws(null);
                setShcNumeric([]);
              }}
            >
              Generate Another
            </Button>
          </Stack>
        </Card>
      )}

      <Title order={1}>My Health Cards</Title>

      <Text c="dimmed" size="sm" mb="lg">
        Filter your immunizations and generate a SMART Health Card with QR code
      </Text>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          mb="md"
        >
          {error}
        </Alert>
      )}

      {immunizations.length === 0 ? (
        <Stack gap="md" align="center" mt="xl">
          <Text c="dimmed">No immunizations found in your record.</Text>
          <Button
            onClick={() => void handleCreateSampleImmunizations()}
            loading={creatingSamples}
            variant="light"
          >
            Add Sample Immunizations
          </Button>
        </Stack>
      ) : (
        <Stack gap="md">
          {/* Filter Controls */}
          <Card shadow="xs" padding="md" withBorder>
            <Stack gap="md">
              <Group align="flex-start">
                <IconFilter size={20} />
                <Text fw={500}>Filter Immunizations</Text>
              </Group>

              <DateInput
                label="Since Date"
                placeholder="Select a date"
                value={sinceDate}
                onChange={setSinceDate}
                clearable
                leftSection={<IconCalendar size={16} />}
                description="Only include immunizations on or after this date"
              />

              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Showing {filteredImmunizations.length} of{" "}
                  {immunizations.length} immunizations
                </Text>
                {sinceDate && (
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => {
                      setSinceDate(null);
                    }}
                  >
                    Clear Date Filter
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>

          {/* Action Buttons */}
          <Group justify="space-between">
            <Button
              variant="subtle"
              onClick={() => void handleCreateSampleImmunizations()}
              loading={creatingSamples}
              size="sm"
            >
              Add Sample Data
            </Button>
            <Button
              onClick={() => void handleGenerateHealthCard()}
              disabled={filteredImmunizations.length === 0 || generating}
              leftSection={<IconQrcode size={16} />}
              loading={generating}
            >
              Generate Health Card
            </Button>
          </Group>

          {/* Immunization List */}
          <Title order={3}>
            {filteredImmunizations.length > 0
              ? "Filtered Immunizations"
              : "No immunizations match your filters"}
          </Title>

          {filteredImmunizations.map((immunization) => (
            <Card key={immunization.id} shadow="xs" padding="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Box>
                  <ResourceBadge value={immunization} link={false} />
                  <Text size="sm" mt="xs">
                    {immunization.vaccineCode?.coding?.[0]?.display ||
                      immunization.vaccineCode?.text ||
                      "Unknown vaccine"}
                  </Text>
                  {immunization.occurrenceDateTime && (
                    <Text size="xs" c="dimmed">
                      Date:{" "}
                      {new Date(
                        immunization.occurrenceDateTime
                      ).toLocaleDateString()}
                    </Text>
                  )}
                  {immunization.status && (
                    <Text size="xs" c="dimmed">
                      Status: {immunization.status}
                    </Text>
                  )}
                </Box>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Document>
  );
}
