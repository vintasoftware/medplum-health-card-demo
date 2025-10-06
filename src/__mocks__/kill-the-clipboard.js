// Mock for kill-the-clipboard library
class MockSHCIssuer {
  constructor(options) {
    this.issuer = options.issuer
    this.privateKey = options.privateKey
    this.publicKey = options.publicKey
  }

  async issue(bundle) {
    // Return a mock health card
    return {
      asJWS: () => {
        // Return a mock JWS token
        return 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tL2lzc3VlciIsInN1YiI6InBhdGllbnQtMTIzIiwiYXVkIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9hdWRpZW5jZSIsImV4cCI6MTcwNDA2NzIwMCwiaWF0IjoxNzA0MDY3MjAwLCJqdGkiOiJ0ZXN0LWp0aSIsIm5iZiI6MTcwNDA2NzIwMCwiY2xhaW1zIjp7InZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJIZWFsdGhDYXJkIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImZoaXJWZXIiOiI0LjAuMSIsInJlc291cmNlVHlwZSI6IlBhdGllbnQiLCJpZCI6InBhdGllbnQtMTIzIn19fX0.mock-signature'
      },
    }
  }
}

module.exports = {
  SHCIssuer: MockSHCIssuer,
}
