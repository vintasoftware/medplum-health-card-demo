import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

interface BotConfig {
  name: string;
  id: string;
  source: string;
  dist: string;
}

interface MedplumConfig {
  bots: BotConfig[];
}

async function main() {
  console.log("🔍 Checking environment...");
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? "https://api.medplum.com";
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("❌ Missing MEDPLUM_CLIENT_ID or MEDPLUM_CLIENT_SECRET");
  }

  console.log("📖 Reading medplum.config.json...");
  const configPath = path.join(process.cwd(), "medplum.config.json");
  const configJson = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configJson) as MedplumConfig;

  const bot = config.bots.find((b) => b.name === "health-cards-demo-bot");
  if (!bot) {
    throw new Error(
      '❌ Bot "health-cards-demo-bot" not found in medplum.config.json'
    );
  }

  const botId = bot.id;
  if (!botId || botId === "<BOT_ID>") {
    throw new Error(
      "❌ Bot ID not set in medplum.config.json. Please create the bot first using: npx medplum bot create"
    );
  }

  console.log(`✅ Found bot ID: ${botId}`);

  console.log("🔑 Getting access token...");
  const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to get token: ${tokenRes.status} ${errText}`);
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  console.log("✅ Token obtained");

  console.log("📦 Loading operation definition...");
  const operationPath = path.join(
    process.cwd(),
    "src/ops/health-cards-issue-operation.json"
  );
  const operationJson = await fs.readFile(operationPath, "utf8");
  const operationJsonWithBotId = operationJson.replace(
    "<PUT-YOUR-BOT-ID-HERE>",
    botId
  );

  console.log("➡️ Deploying operation definition to Medplum...");
  const operationRes = await fetch(`${baseUrl}/fhir/R4/OperationDefinition`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/fhir+json",
    },
    body: operationJsonWithBotId,
  });

  const operationResponse = await operationRes.text();
  if (!operationRes.ok) {
    console.error("❌ Operation deploy failed:");
    console.error(`Status: ${operationRes.status}`);
    console.error(operationResponse);
    process.exit(1);
  }

  console.log("✅ Operation deploy completed successfully!");
  console.log("Operation response:\n", operationResponse);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
