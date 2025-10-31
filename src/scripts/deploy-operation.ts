import "dotenv/config";
import { MedplumClient } from "@medplum/core";
import type { OperationDefinition } from "@medplum/fhirtypes";
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

  console.log("🔑 Authenticating with Medplum...");
  const medplum = new MedplumClient({
    baseUrl,
  });

  await medplum.startClientLogin(clientId, clientSecret);
  console.log("✅ Authenticated successfully");

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

  console.log("🔍 Checking if operation definition already exists...");
  const operationDef = JSON.parse(
    operationJsonWithBotId
  ) as OperationDefinition;

  const searchBundle = await medplum.search("OperationDefinition", {
    code: operationDef.code,
  });

  const existingOpDef = searchBundle.entry?.[0]?.resource;

  if (existingOpDef?.id) {
    console.log(
      `📝 Found existing operation definition with ID: ${existingOpDef.id}`
    );
    console.log("➡️ Updating operation definition...");
    operationDef.id = existingOpDef.id;
    const updatedOpDef = await medplum.updateResource(operationDef);
    console.log("✅ Operation definition updated successfully!");
    console.log("Operation ID:", updatedOpDef.id);
  } else {
    console.log("➡️ Creating new operation definition...");
    const createdOpDef = await medplum.createResource(operationDef);
    console.log("✅ Operation definition created successfully!");
    console.log("Operation ID:", createdOpDef.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
