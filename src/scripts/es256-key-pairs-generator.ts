// Generate ES256 key pair for testing (Node.js 18+)
import crypto from 'crypto'
import { exportPKCS8, exportSPKI } from 'jose'

// Requires Node.js 18+ for crypto.webcrypto.subtle
const { publicKey, privateKey } = await crypto.webcrypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)

const privateKeyPKCS8 = await exportPKCS8(privateKey)
const publicKeySPKI = await exportSPKI(publicKey)

// Use these keys in SHCIssuer config
const config = {
  issuer: 'https://your-org.com',
  privateKey: privateKeyPKCS8,
  publicKey: publicKeySPKI,
}

console.log(config)
