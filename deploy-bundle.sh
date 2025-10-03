#!/usr/bin/env bash
set -euo pipefail

BASE="https://api.medplum.com"     
TOKEN=""
BUNDLE_FILE="data/core/health-cards-bot-bundle.json"

if [ ! -f "$BUNDLE_FILE" ]; then
  echo "❌ Arquivo $BUNDLE_FILE não encontrado."
  exit 1
fi

echo "➡️ Deploying bundle $BUNDLE_FILE to $BASE"

curl -X POST "$BASE/fhir/R4" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/fhir+json" \
  --data-binary @"$BUNDLE_FILE"

echo "✅ Deploy finalizado"
