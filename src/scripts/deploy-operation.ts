import { MedplumClient } from "@medplum/core";
import type { OperationDefinition } from "@medplum/fhirtypes";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);

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
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? "https://api.medplum.com";

  console.log("🔑 Getting access token from Medplum CLI...");
  let accessToken: string;
  try {
    const { stdout } = await execAsync("npx medplum token");
    accessToken = stdout.trim();
    if (!accessToken) {
      throw new Error("❌ Failed to get access token from Medplum CLI");
    }
  } catch (error) {
    throw new Error(
      `❌ Failed to get access token from Medplum CLI. Make sure you're logged in with 'medplum login': ${error}`
    );
  }
  console.log("✅ Got access token successfully");

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

  const medplum = new MedplumClient({
    baseUrl,
    accessToken,
  });

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
