#!/bin/bash
# FutureKawa — Génère des alertes de test visibles dans MailHog (http://localhost:8025)
# Usage : bash test-cicd/seed-alertes.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.ci}"

DC=(docker compose -f "$ROOT_DIR/docker-compose.yml" --env-file "$ENV_FILE")

echo ""
echo "===== FutureKawa — Seed alertes (MailHog) ====="
echo ""

# ---------------------------------------------------------------
# 1. Alertes hors_plage — email immédiat via POST /mesures
# ---------------------------------------------------------------
echo "--- 1/2  Mesures hors seuils"
echo ""

post_mesure() {
  local label=$1 url=$2 entrepot=$3 temp=$4 hum=$5
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url/mesures" \
    -H "Content-Type: application/json" \
    -d "{\"entrepot\":\"$entrepot\",\"temperature\":$temp,\"humidite\":$hum}")
  if [ "$code" = "201" ]; then
    echo "  PASS  $label  ($entrepot  temp=${temp}C  hum=${hum}%)"
  else
    echo "  FAIL  $label  (HTTP $code)"
  fi
}

# Seuils : bresil   29±3°C / 55±2%   → hors plage avec 40°C / 70%
post_mesure "bresil"   "http://localhost:8001" "BR01" 40 70
# Seuils : equateur 31±3°C / 60±2%   → hors plage avec 42°C / 90%
post_mesure "equateur" "http://localhost:8002" "EQ01" 42 90
# Seuils : colombie 26±3°C / 80±2%   → hors plage avec 38°C / 50%
post_mesure "colombie" "http://localhost:8003" "CO01" 38 50

echo ""
echo "--- 2/2  Lots périmés (> 365 jours)"
echo ""

trigger_peremption() {
  local service=$1 pays=$2
  local lot_id="LOT-TEST-PERIME-$pays-001"

  local script
  script=$(cat << NODEEOF
const { pool } = require('./src/db');
const { verifierPeremption } = require('./src/alertes');
(async () => {
  const e = await pool.query('SELECT id FROM entrepots WHERE pays = ? LIMIT 1', ['$pays']);
  if (!e.rows.length) { console.error('Entrepot introuvable pour $pays'); process.exit(1); }
  await pool.query(
    "INSERT OR IGNORE INTO lots (id, entrepot_id, date_stockage) VALUES (?, ?, datetime('now', '-400 days'))",
    ['$lot_id', e.rows[0].id]
  );
  await verifierPeremption();
  process.exit(0);
})().catch(err => { console.error(err.message); process.exit(1); });
NODEEOF
  )

  if echo "$script" | "${DC[@]}" exec -T "$service" node - 2>&1; then
    echo "  PASS  $service"
  else
    echo "  FAIL  $service"
  fi
}

trigger_peremption "bresil-api"   "bresil"
trigger_peremption "equateur-api" "equateur"
trigger_peremption "colombie-api" "colombie"

echo ""
echo "========================================"
echo "  Vérifiez MailHog : http://localhost:8025"
echo "========================================"
echo ""
