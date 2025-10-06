// Generate ES256 key pair for testing (Node.js 18+)
import crypto from 'crypto'
import { exportPKCS8, exportSPKI } from 'jose'

async function generateKeys() {
  // Requires Node.js 18+ for crypto.webcrypto.subtle
  const { publicKey, privateKey } = await crypto.webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )

  const privateKeyPKCS8 = await exportPKCS8(privateKey)
  const publicKeySPKI = await exportSPKI(publicKey)

  // Format keys as single strings with \n
  const privateKeyFormatted = privateKeyPKCS8.replace(/\n/g, '\\n')
  const publicKeyFormatted = publicKeySPKI.replace(/\n/g, '\\n')

  console.log('Private Key (formatted):')
  console.log(privateKeyFormatted)
  console.log('\nPublic Key (formatted):')
  console.log(publicKeyFormatted)

  // Use these keys in SHCIssuer config
  const config = {
    issuer: 'https://your-org.com',
    privateKey: privateKeyFormatted,
    publicKey: publicKeyFormatted,
  }

  console.log(config)
}

generateKeys().catch(console.error)
