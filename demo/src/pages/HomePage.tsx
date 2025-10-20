import { Container, Title, Text, Stack, Button, Group, Loader, Box } from '@mantine/core'
import { SignInForm, useMedplumContext } from '@medplum/react'
import { useState } from 'react'
import { RegisterForm } from '../components/RegisterForm'

export function HomePage() {
  const { medplum, loading: medplumLoading, profile } = useMedplumContext()
  const [showRegister, setShowRegister] = useState(false)

  const handleRegistrationSuccess = () => {
    setShowRegister(false)
  }

  const handleShowRegister = () => {
    setShowRegister(true)
  }

  const handleShowSignIn = () => {
    setShowRegister(false)
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Stack gap="sm">
          <Title order={1}>Health Cards Demo</Title>
          <Text size="lg" c="dimmed">
            Demo application for the $health-cards-issue operation using Medplum
          </Text>
        </Stack>

        {medplumLoading && <Loader size="lg" />}

        {!profile && !medplumLoading && (
          <Stack gap="xs">
            {!showRegister ? (
              <Stack gap="xs">
                <Text>Please sign in to continue.</Text>
                <Stack gap={0}>
                  <Box w="100%">
                    <SignInForm>Sign in</SignInForm>
                  </Box>
                  <Group justify="center">
                    <Text size="sm" c="dimmed">
                      Don&apos;t have an account?{' '}
                      <Button variant="subtle" size="compact-sm" onClick={handleShowRegister}>
                        Register here
                      </Button>
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            ) : (
              <RegisterForm onSuccess={handleRegistrationSuccess} onCancel={handleShowSignIn} />
            )}
          </Stack>
        )}

        {profile && (
          <Stack gap="xs">
            <Text>
              Welcome, {profile.name?.[0]?.given?.[0]} {profile.name?.[0]?.family}!
            </Text>
            <Group>
              <Button size="xs" variant="outline" onClick={() => medplum.signOut()}>
                Sign out
              </Button>
            </Group>
            <Text>Health cards functionality coming soon...</Text>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
