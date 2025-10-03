import { ContentType } from '@medplum/core'
import type { Bundle, BundleEntry, OperationDefinition, Parameters } from '@medplum/fhirtypes'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

interface HealthCardsBotDescription {
  src: string // TypeScript path (optional, to store as Binary)
  dist: string // JavaScript path that will be executed
  code?: string // alternative: you can inject the code directly (without Binary dist)
  botId?: string // optional: if you want to force a stable id (PUT Bot/<id>)
  opCode?: string // default: 'health-cards-issue'
  opName?: string // default: 'health-cards-issue'
  resource?: string // default: 'Patient'
  // (optional) secrets to configure after deploy:
  secrets?: Record<string, string> // ex.: { SHC_ISSUER_URL: '...', SHC_ES256_PRIVATE_PKCS8: '...' }
}

const Bots: HealthCardsBotDescription[] = [
  {
    src: 'src/bots/health-cards-demo-bot.ts',
    dist: 'dist/bots/health-cards-demo-bot.js',
    botId: '', // optional; helps to have idempotent PUT
    opCode: 'health-cards-issue',
    opName: 'health-cards-issue',
    resource: 'Patient',
    secrets: {
      // adjust the names to what your code actually reads:
      SHC_ISSUER_URL: 'https://issuer.example.com',
      SHC_ES256_PRIVATE_PKCS8: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
      SHC_ES256_PUBLIC_SPKI: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
    },
  },
]

async function main(): Promise<void> {
  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: Bots.flatMap(desc => makeEntriesForBot(desc)),
  }

  fs.mkdirSync('data/core', { recursive: true })
  fs.writeFileSync('data/core/health-cards-bot-bundle.json', JSON.stringify(bundle, null, 2))
  console.log('Wrote data/core/health-cards-bot-bundle.json')
}

/** Generates Bundle entries:
 *  - Binary (src) optional
 *  - Binary (dist) required (the executable version)
 *  - Bot (PUT) with sourceCode/executableCode pointing to the Binaries
 *  - OperationDefinition (PUT) with extension pointing to the Bot
 *  - (Optional) $set-secret for each secret
 */
function makeEntriesForBot(desc: HealthCardsBotDescription): BundleEntry[] {
  const results: BundleEntry[] = []

  const botName = path.parse(desc.dist).name
  const botId = desc.botId ?? `bot-${botName}`
  const botUrl = `Bot/${botId}`

  // 1) Binaries
  const hasSrc = !!(desc.src && fs.existsSync(desc.src))
  const distFile = fs.readFileSync(desc.dist)

  const distEntry: BundleEntry = {
    fullUrl: 'urn:uuid:' + randomUUID(),
    request: { method: 'POST', url: 'Binary' },
    resource: {
      resourceType: 'Binary',
      contentType: ContentType.JAVASCRIPT,
      data: distFile.toString('base64'),
    },
  }
  results.push(distEntry)

  let srcEntry: BundleEntry | undefined
  if (hasSrc) {
    const srcFile = fs.readFileSync(desc.src!)
    srcEntry = {
      fullUrl: 'urn:uuid:' + randomUUID(),
      request: { method: 'POST', url: 'Binary' },
      resource: {
        resourceType: 'Binary',
        contentType: ContentType.TYPESCRIPT,
        data: srcFile.toString('base64'),
      },
    }
    results.push(srcEntry)
  }

  // 2) Bot (PUT): aponta code para os binaries acima
  results.push({
    request: { method: 'PUT', url: botUrl },
    resource: {
      resourceType: 'Bot',
      id: botId,
      name: botName,
      runtimeVersion: 'awslambda', // use 'awslambda' or the runtime supported in your project
      ...(hasSrc
        ? {
            sourceCode: {
              contentType: ContentType.TYPESCRIPT,
              url: (srcEntry as BundleEntry).fullUrl,
            },
          }
        : {}),
      executableCode: { contentType: ContentType.JAVASCRIPT, url: distEntry.fullUrl },
    },
  })

  // 3) OperationDefinition (PUT): linka a operação ao Bot
  const opCode = desc.opCode ?? 'health-cards-issue'
  const opName = desc.opName ?? 'health-cards-issue'
  const resource = desc.resource ?? 'Patient'

  const op: OperationDefinition = {
    resourceType: 'OperationDefinition',
    name: opName,
    status: 'active',
    kind: 'operation',
    code: opCode,
    resource: [resource as 'Patient'],
    system: false,
    type: false,
    instance: true,
    extension: [
      {
        url: 'https://medplum.com/fhir/StructureDefinition/operationDefinition-implementation',
        valueReference: { reference: botUrl }, // points to the Bot created above
      },
    ],
    parameter: [
      { use: 'in', name: 'credentialType', min: 1, max: '*', type: 'uri' },
      { use: 'in', name: 'credentialValueSet', min: 0, max: '*', type: 'uri' },
      { use: 'in', name: 'includeIdentityClaim', min: 0, max: '*', type: 'string' },
      { use: 'in', name: '_since', min: 0, max: '1', type: 'dateTime' },

      { use: 'out', name: 'verifiableCredential', min: 0, max: '*', type: 'string' },
      // (Optional) resourceLink backbone
      {
        use: 'out',
        name: 'resourceLink',
        min: 0,
        max: '*',
        type: 'BackboneElement',
        part: [
          { name: 'vcIndex', use: 'out', min: 0, max: '1', type: 'integer' },
          { name: 'bundledResource', use: 'out', min: 1, max: '1', type: 'uri' },
          { name: 'hostedResource', use: 'out', min: 1, max: '1', type: 'uri' },
        ],
      },
    ],
  }

  results.push({
    request: { method: 'PUT', url: `OperationDefinition/${op.id}` },
    resource: op,
  })

  // 4) (Optional) Bot Secrets via $set-secret operation
  // Note: operations can also be included in transaction bundles.
  // For each secret, we add a POST entry in Bot/<id>/$set-secret with Parameters.
  if (desc.secrets) {
    for (const [key, value] of Object.entries(desc.secrets)) {
      const params: Parameters = {
        resourceType: 'Parameters',
        parameter: [
          { name: 'name', valueString: key },
          { name: 'value', valueString: value },
        ],
      }
      results.push({
        request: { method: 'POST', url: `${botUrl}/$set-secret` },
        resource: params,
      })
    }
  }

  return results
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
