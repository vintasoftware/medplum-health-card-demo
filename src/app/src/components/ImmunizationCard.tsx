import { Box, Card, Group, Text } from "@mantine/core";
import type { Immunization } from "@medplum/fhirtypes";
import { ResourceBadge } from "@medplum/react";
import type { JSX } from "react";

export interface ImmunizationCardProps {
  immunization: Immunization;
}

export function ImmunizationCard({
  immunization,
}: ImmunizationCardProps): JSX.Element {
  return (
    <Card shadow="xs" padding="md" withBorder>
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
              {new Date(immunization.occurrenceDateTime).toLocaleDateString()}
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
  );
}
