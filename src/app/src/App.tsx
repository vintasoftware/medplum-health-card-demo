import { Anchor, Box, Text } from "@mantine/core";
import {
  AppShell,
  ErrorBoundary,
  Loading,
  Logo,
  useMedplum,
  useMedplumProfile,
} from "@medplum/react";
import { IconBrandGithub, IconQrcode } from "@tabler/icons-react";
import type { JSX } from "react";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { HealthCardsPage } from "./pages/HealthCardsPage";
import { LandingPage } from "./pages/LandingPage";
import { SignInPage } from "./pages/SignInPage";

export function App(): JSX.Element | null {
  const medplum = useMedplum();
  const profile = useMedplumProfile();

  if (medplum.isLoading()) {
    return null;
  }

  return (
    <AppShell
      logo={<Logo size={24} />}
      headerSearchDisabled={true}
      menus={[
        {
          title: "My Links",
          links: [
            {
              icon: <IconQrcode />,
              label: "My Health Cards",
              href: "/health-cards",
            },
          ],
        },
      ]}
    >
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Box pb={40}>
            <Routes>
              <Route
                path="/"
                element={
                  profile ? (
                    <Navigate to="/health-cards" replace />
                  ) : (
                    <LandingPage />
                  )
                }
              />
              <Route path="/signin" element={<SignInPage />} />
              <Route
                path="/health-cards"
                element={
                  profile ? (
                    <HealthCardsPage />
                  ) : (
                    <Navigate to="/signin" replace />
                  )
                }
              />
            </Routes>
          </Box>
          <Box
            pos="fixed"
            bottom={0}
            left={0}
            right={0}
            p="md"
            ta="center"
            bg="var(--mantine-color-body)"
            style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Text>
              Code available on{" "}
              <Anchor
                href="https://github.com/vintasoftware/medplum-health-card-demo"
                target="_blank"
              >
                <IconBrandGithub size={16} />
                GitHub
              </Anchor>
            </Text>
          </Box>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
