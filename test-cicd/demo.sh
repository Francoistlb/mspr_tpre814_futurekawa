#!/bin/bash
# FutureKawa — Script de démonstration complet
#
# Étapes :
#   1. Insère les lots (historique réaliste : récents, anciens, périmés)
#   2. Déclenche immédiatement le check péremption → emails MailHog
#   3. Lance le simulateur Arduino en boucle → mesures + alertes en temps réel
#
# Usage : bash test-cicd/demo.sh [--interval SECONDES]
# Ctrl+C pour arrêter la simulation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INTERVAL=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --interval) INTERVAL=$2; shift 2 ;;
    *) shift ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     FutureKawa — Démo simulation         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Seed lots ──────────────────────────────────────────────────────────────
echo "━━━ Étape 1/3 — Insertion des lots ━━━"
echo ""
bash "$SCRIPT_DIR/seed-lots.sh"

# ── 2. Alertes péremption immédiates ─────────────────────────────────────────
echo "━━━ Étape 2/3 — Alertes péremption (lots > 365 jours) ━━━"
echo ""

trigger_peremption() {
  local port=$1 pays=$2
  local out code
  out=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:$port/dev/trigger-peremption")
  code=$(echo "$out" | tail -1)
  if [ "$code" = "200" ]; then
    echo "  PASS  $pays — emails envoyés pour les lots périmés"
  else
    echo "  FAIL  $pays (HTTP $code)"
  fi
}

trigger_peremption 8001 "bresil"
trigger_peremption 8002 "equateur"
trigger_peremption 8003 "colombie"

echo ""
echo "  → Vérifiez MailHog : http://localhost:8025"
echo ""
sleep 2

# ── 3. Simulation Arduino en boucle ──────────────────────────────────────────
echo "━━━ Étape 3/3 — Simulateur Arduino (boucle toutes les ${INTERVAL}s) ━━━"
echo ""
echo "  Mesures envoyées sur les 6 entrepôts (~15% hors seuil → email alerte)"
echo "  Ctrl+C pour arrêter."
echo ""

bash "$SCRIPT_DIR/sim-arduino.sh" --loop --interval "$INTERVAL"
