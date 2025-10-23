import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { MedplumClient } from "@medplum/core";
import type { CodeSystem, ValueSet } from "@medplum/fhirtypes";

async function uploadResources(
  medplum: MedplumClient,
  resourceType: "ValueSet" | "CodeSystem",
  fixturesDir: string
): Promise<{ successCount: number; errorCount: number }> {
  console.log(`\n📦 Loading ${resourceType} fixtures...`);

  try {
    const files = await fs.readdir(fixturesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    console.log(`Found ${jsonFiles.length} ${resourceType} files to upload`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(fixturesDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const resource = JSON.parse(content) as ValueSet | CodeSystem;

      console.log(
        `\n📤 Processing ${resourceType}: ${
          resource.name || resource.id || file
        }...`
      );

      try {
        // Search for existing resource by canonical URL
        const existingResources = await medplum.searchResources(resourceType, {
          url: resource.url as string,
        });

        if (existingResources.length > 0) {
          // Resource exists, update it
          const existing = existingResources[0];
          console.log(
            `   Updating existing ${resourceType}: ${existing.id} (${resource.url})`
          );

          await medplum.updateResource({
            ...resource,
            id: existing.id,
          });

          console.log(`   ✅ Success`);
          successCount++;
        } else {
          // Resource doesn't exist, create it
          console.log(
            `   Creating new ${resourceType}: ${resource.id} (${resource.url})`
          );

          await medplum.createResource(resource);

          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error uploading ${file}:`, err);
        errorCount++;
      }
    }

    return { successCount, errorCount };
  } catch (err) {
    console.error(`   ⚠️  Error reading ${resourceType} fixtures:`, err);
    return { successCount: 0, errorCount: 0 };
  }
}

async function main() {
  console.log("🔍 Checking environment...");
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? "https://api.medplum.com";
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("❌ Missing MEDPLUM_CLIENT_ID or MEDPLUM_CLIENT_SECRET");
  }

  console.log("🔑 Initializing Medplum client...");
  const medplum = new MedplumClient({
    baseUrl,
    clientId,
    clientSecret,
  });

  // Authenticate using client credentials
  await medplum.startClientLogin(clientId, clientSecret);
  console.log("✅ Authenticated");

  // Upload CodeSystems first (ValueSets may reference them)
  const codeSystemsDir = path.join(process.cwd(), "src/fixtures/codesystems");
  const csResults = await uploadResources(
    medplum,
    "CodeSystem",
    codeSystemsDir
  );

  // Upload ValueSets
  const valueSetsDir = path.join(process.cwd(), "src/fixtures/valuesets");
  const vsResults = await uploadResources(medplum, "ValueSet", valueSetsDir);

  const totalSuccess = csResults.successCount + vsResults.successCount;
  const totalError = csResults.errorCount + vsResults.errorCount;
  const totalFiles = totalSuccess + totalError;

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Successfully uploaded: ${totalSuccess}`);
  console.log(`   ❌ Failed: ${totalError}`);
  console.log(`   📝 Total: ${totalFiles}`);
  console.log("=".repeat(50));

  if (totalError > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
