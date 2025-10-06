// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0

// Jest setup file for health cards demo tests
// This file is run before each test file is executed

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log
console.log = (...args) => {
  // Only log if it's not a test-related log
  const firstArg = args[0]
  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('collectedResources') || firstArg.includes('Response:'))
  ) {
    return // Skip these logs
  }
  originalConsoleLog(...args)
}
