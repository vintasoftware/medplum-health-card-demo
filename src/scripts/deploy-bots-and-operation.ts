// scripts/deploy-questionnaire.ts
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'

async function main() {
  console.log('🔍 Checking environment...')
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com'
  const clientId = process.env.MEDPLUM_CLIENT_ID
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('❌ Missing MEDPLUM_CLIENT_ID or MEDPLUM_CLIENT_SECRET')
  }

  console.log('🔑 Getting access token...')
  const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Failed to get token: ${tokenRes.status} ${errText}`)
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string }
  console.log('✅ Token obtained')

  const bundlePath = path.join(process.cwd(), 'data/core/health-cards-bot-bundle.json')
  console.log(`📦 Loading bundle from: ${bundlePath}`)

  const bundleJson = await fs.readFile(bundlePath, 'utf8')

  console.log('➡️ Deploying bundle to Medplum...')
  const res = await fetch(`${baseUrl}/fhir/R4`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/fhir+json',
    },
    body: bundleJson,
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('❌ Deploy failed:')
    console.error(`Status: ${res.status}`)
    console.error(text)
    process.exit(1)
  }

  console.log('✅ Bundle deploy completed successfully!')
  console.log('Server response:\n', text)

  // Extract bot ID from the response
  let botId: string
  try {
    const responseData = JSON.parse(text)
    if (responseData.entry && responseData.entry.length > 0) {
      // Look for Bot resource in the response
      const botEntry = responseData.entry.find(
        (entry: { resource?: { resourceType?: string; id?: string } }) =>
          entry.resource?.resourceType === 'Bot'
      )
      if (botEntry?.resource?.id) {
        botId = botEntry.resource.id
        console.log(`🔍 Found bot ID in response: ${botId}`)
      } else {
        throw new Error('No Bot resource found in response')
      }
    } else {
      throw new Error('No entries found in response')
    }
  } catch (error) {
    console.error('❌ Failed to extract bot ID from response:', error)
    console.error('Response text:', text)
    process.exit(1)
  }

  // Now deploy the bot code
  console.log('🤖 Deploying bot code...')

  try {
    const code = await fs.readFile('dist/health-cards-demo-bot.js', 'utf8')

    const botRes = await fetch(`${baseUrl}/fhir/R4/Bot/${botId}/$deploy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: 'index.js', code }),
    })

    const botResponse = await botRes.text()
    if (!botRes.ok) {
      console.error('❌ Bot deploy failed:')
      console.error(`Status: ${botRes.status}`)
      console.error(botResponse)
      process.exit(1)
    }

    console.log('✅ Bot deploy completed successfully!')
    console.log('Bot response:\n', botResponse)
  } catch (error) {
    console.error('❌ Error reading bot code file:', error)
    process.exit(1)
  }

  // Now deploy the operation
  console.log('🔍 Deploying operation...')

  const operationPath = path.join(process.cwd(), 'src/ops/health-cards-issue-operation.json')
  console.log(`📦 Loading operation from: ${operationPath}`)

  const operationJson = await fs.readFile(operationPath, 'utf8')
  const operationJsonWithBotId = operationJson.replace('<PUT-YOUR-BOT-ID-HERE>', botId)
  const operationRes = await fetch(`${baseUrl}/fhir/R4/OperationDefinition`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/fhir+json',
    },
    body: operationJsonWithBotId,
  })

  const operationResponse = await operationRes.text()
  if (!operationRes.ok) {
    console.error('❌ Operation deploy failed:')
    console.error(`Status: ${operationRes.status}`)
    console.error(operationResponse)
    process.exit(1)
  }

  console.log('✅ Operation deploy completed successfully!')
  console.log('Operation response:\n', operationResponse)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
