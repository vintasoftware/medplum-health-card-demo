import {
  Alert,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
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
import { Document, useMedplum, useMedplumProfile } from "@medplum/react";
import {
  IconAlertCircle,
  IconCalendar,
  IconFilter,
  IconQrcode,
} from "@tabler/icons-react";
import { SHCReader } from "kill-the-clipboard";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { ImmunizationCard } from "../components/ImmunizationCard";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import sampleImmunizationsData from "../data/sampleImmunizations.json";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build search parameters for immunization queries
 */
function buildSearchParams(
  profileId: string,
  sinceDate: Date | null
): Record<string, string> {
  const searchParams: Record<string, string> = {
    patient: `Patient/${profileId}`,
    _sort: "-date",
  };

  // Apply date filter in the search query
  if (sinceDate) {
    searchParams.date = `ge${sinceDate.toISOString().split("T")[0]}`;
  }

  return searchParams;
}

/**
 * Build parameters for the $health-cards-issue operation
 */
function buildHealthCardParameters(
  profileId: string,
  sinceDate: Date | null
): Parameters {
  return {
    resourceType: "Parameters",
    parameter: [
      {
        name: "subject",
        valueReference: { reference: `Patient/${profileId}` },
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
}

/**
 * Extract JWS value from the Parameters response
 */
function extractJWSFromResponse(response: Parameters): string {
  const jwsValue = response.parameter?.find(
    (p: ParametersParameter) => p.name === "verifiableCredential"
  )?.valueString;

  if (!jwsValue) {
    throw new Error(
      "No verifiable credential returned from the health card operation."
    );
  }

  return jwsValue;
}

/**
 * Generate QR codes from JWS value
 */
async function generateQRCodes(
  jwsValue: string
): Promise<{ qrCodeUrls: string[]; shcNumeric: string[] }> {
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

  // Generate numeric QR code string (shc:/...)
  const numericCodes = healthCard.asQRNumeric();

  return {
    qrCodeUrls: qrCodes,
    shcNumeric: numericCodes,
  };
}

// ============================================================================
// Sub-Components
// ============================================================================

interface FilterControlsProps {
  sinceDate: Date | null;
  onSinceDateChange: (date: Date | null) => void;
  filteredCount: number;
  hasDateFilter: boolean;
}

function FilterControls({
  sinceDate,
  onSinceDateChange,
  filteredCount,
  hasDateFilter,
}: FilterControlsProps): JSX.Element {
  return (
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
          onChange={onSinceDateChange}
          clearable
          leftSection={<IconCalendar size={16} />}
          description="Only include immunizations on or after this date"
        />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {filteredCount} {hasDateFilter ? "filtered" : ""}{" "}
            immunization
            {filteredCount !== 1 ? "s" : ""}
          </Text>
          {hasDateFilter && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                onSinceDateChange(null);
              }}
            >
              Clear Date Filter
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
}

interface EmptyStateProps {
  message: string;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  loading?: boolean;
}

function EmptyState({
  message,
  showButton = false,
  buttonText = "",
  onButtonClick,
  loading = false,
}: EmptyStateProps): JSX.Element {
  return (
    <Stack gap="md" align="center" mt="xl">
      <Text c="dimmed">{message}</Text>
      {showButton && onButtonClick && (
        <Button onClick={onButtonClick} loading={loading} variant="light">
          {buttonText}
        </Button>
      )}
    </Stack>
  );
}

interface ActionButtonsProps {
  onAddSample: () => void;
  onGenerateCard: () => void;
  isGenerating: boolean;
  isSamplesLoading: boolean;
  disabled: boolean;
  filteredCount: number;
}

function ActionButtons({
  onAddSample,
  onGenerateCard,
  isGenerating,
  isSamplesLoading,
  disabled,
}: ActionButtonsProps): JSX.Element {
  return (
    <Group justify="space-between">
      <Button
        variant="subtle"
        onClick={onAddSample}
        loading={isSamplesLoading}
        size="sm"
      >
        Add Sample Data
      </Button>
      <Button
        onClick={onGenerateCard}
        disabled={disabled || isGenerating}
        leftSection={<IconQrcode size={16} />}
        loading={isGenerating}
      >
        Generate Health Card
      </Button>
    </Group>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HealthCardsPage(): JSX.Element {
  const medplum = useMedplum();
  const profile = useMedplumProfile() as Patient;
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [hasAnyImmunizations, setHasAnyImmunizations] = useState(false);
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
    const searchParams = buildSearchParams(profile.id, sinceDate);

    // First, check if any immunizations exist at all (without date filter)
    const checkAnyImmunizations = medplum
      .searchResources("Immunization", {
        patient: `Patient/${profile.id}`,
        _count: "1",
      })
      .then((results) => {
        setHasAnyImmunizations(results.length > 0);
      });

    // Then load the filtered immunizations
    const loadImmunizations = medplum
      .searchResources("Immunization", searchParams)
      .then((results) => {
        setImmunizations(results);
      });

    Promise.all([checkAnyImmunizations, loadImmunizations])
      .then(() => {
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
      setHasAnyImmunizations(allImmunizations.length > 0);

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
      const parameters = buildHealthCardParameters(
        profile.id as string,
        sinceDate
      );

      // Invoke the custom FHIR operation to generate the health card
      const response = await medplum.post(
        medplum.fhirUrl("Patient", profile.id as string, "$health-cards-issue"),
        parameters
      );

      // Extract the verifiable credential (JWS)
      const jwsValue = extractJWSFromResponse(response);

      // Store the JWS
      setJws(jwsValue);

      // Generate QR codes from JWS
      const { qrCodeUrls: qrCodes, shcNumeric: numericCodes } =
        await generateQRCodes(jwsValue);

      setQrCodeUrls(qrCodes);
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

  const handleResetQRCode = (): void => {
    setQrCodeUrls([]);
    setJws(null);
    setShcNumeric([]);
  };

  return (
    <Document>
      {qrCodeUrls.length > 0 && jws && (
        <QRCodeDisplay
          qrCodeUrls={qrCodeUrls}
          shcNumeric={shcNumeric}
          jws={jws}
          onReset={handleResetQRCode}
        />
      )}

      <Title order={1}>My Health Cards</Title>

      <Text c="dimmed" size="sm" mb="lg">
        Filter your immunizations and generate a SMART Health Card with QR code
      </Text>

      {loading ? (
        <Stack gap="md" align="center" mt="xl">
          <Loader size="lg" />
        </Stack>
      ) : (
        <>
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

          {!hasAnyImmunizations ? (
            <EmptyState
              message="No immunizations found in your record."
              showButton
              buttonText="Add Sample Immunizations"
              onButtonClick={() => void handleCreateSampleImmunizations()}
              loading={creatingSamples}
            />
          ) : (
            <Stack gap="md">
              <FilterControls
                sinceDate={sinceDate}
                onSinceDateChange={setSinceDate}
                filteredCount={filteredImmunizations.length}
                hasDateFilter={!!sinceDate}
              />

              <ActionButtons
                onAddSample={() => void handleCreateSampleImmunizations()}
                onGenerateCard={() => void handleGenerateHealthCard()}
                isGenerating={generating}
                isSamplesLoading={creatingSamples}
                disabled={filteredImmunizations.length === 0}
                filteredCount={filteredImmunizations.length}
              />

              {filteredImmunizations.length > 0 ? (
                <>
                  <Title order={3}>
                    {sinceDate
                      ? "Filtered Immunizations"
                      : "Your Immunizations"}
                  </Title>
                  {filteredImmunizations.map((immunization) => (
                    <ImmunizationCard
                      key={immunization.id}
                      immunization={immunization}
                    />
                  ))}
                </>
              ) : (
                <EmptyState
                  message={
                    sinceDate
                      ? `No immunizations found in your record after date ${sinceDate.toLocaleDateString()}.`
                      : "No immunizations match your filters."
                  }
                />
              )}
            </Stack>
          )}
        </>
      )}
    </Document>
  );
}
