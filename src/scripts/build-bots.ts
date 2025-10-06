// scripts/build-health-cards-bot-bundle.ts
import { ContentType } from '@medplum/core'
import type { Bundle, BundleEntry } from '@medplum/fhirtypes'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

interface HealthCardsBotDescription {
  src: string
  dist: string
}

const Bots: HealthCardsBotDescription[] = [
  {
    src: 'src/bots/health-cards-demo-bot.ts',
    dist: 'dist/health-cards-demo-bot.js',
  },
]

async function main(): Promise<void> {
  const entries: BundleEntry[] = []

  for (const bot of Bots) {
    const botName = path.parse(bot.dist).name

    // 1) Binary do JS (executável)
    const distFile = fs.readFileSync(bot.dist)
    const distFullUrl = 'urn:uuid:' + randomUUID()
    entries.push({
      fullUrl: distFullUrl,
      request: { method: 'POST', url: 'Binary' },
      resource: {
        resourceType: 'Binary',
        contentType: ContentType.JAVASCRIPT,
        data: distFile.toString('base64'),
      },
    })

    let srcFullUrl: string | undefined
    if (bot.src && fs.existsSync(bot.src)) {
      const srcFile = fs.readFileSync(bot.src)
      srcFullUrl = 'urn:uuid:' + randomUUID()
      entries.push({
        fullUrl: srcFullUrl,
        request: { method: 'POST', url: 'Binary' },
        resource: {
          resourceType: 'Binary',
          contentType: ContentType.TYPESCRIPT,
          data: srcFile.toString('base64'),
        },
      })
    }

    const botFullUrl = 'urn:uuid:' + randomUUID()
    entries.push({
      fullUrl: botFullUrl,
      request: { method: 'POST', url: 'Bot' },
      resource: {
        resourceType: 'Bot',
        name: botName,
        runtimeVersion: 'awslambda',
        ...(srcFullUrl
          ? { sourceCode: { contentType: ContentType.TYPESCRIPT, url: srcFullUrl } }
          : {}),
        executableCode: { contentType: ContentType.JAVASCRIPT, url: distFullUrl },
      },
    })
  }

  const bundle: Bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  }

  fs.mkdirSync('data/core', { recursive: true })
  fs.writeFileSync('data/core/health-cards-bot-bundle.json', JSON.stringify(bundle, null, 2))
  console.log('Wrote data/core/health-cards-bot-bundle.json')
}

main().catch(console.error)
