#!/bin/bash
# FutureKawa — Seed lots avec historique réaliste (récents, anciens, périmés)
# Usage : bash test-cicd/seed-lots.sh

PASS=0
FAIL=0
SKIP=0

date_ago() {
  date -d "$1 days ago" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null
}

post_lot() {
  local port=$1 lot_id=$2 entrepot=$3 days=$4 notes=$5
  local date_stock code
  date_stock=$(date_ago "$days")

  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:$port/lots" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$lot_id\",\"entrepot\":\"$entrepot\",\"date_stockage\":\"$date_stock\",\"notes\":\"$notes\"}")

  if [ "$code" = "201" ]; then
    local label
    if   [ "$days" -gt 365 ]; then label="PERIME"
    elif [ "$days" -gt 180 ]; then label="ANCIEN"
    elif [ "$days" -gt  60 ]; then label="MI-PARCOURS"
    else                            label="RECENT"
    fi
    printf "  PASS  %-25s  %s  -%3sj  %s\n" "$lot_id" "$entrepot" "$days" "$label"
    PASS=$((PASS + 1))
  elif [ "$code" = "400" ]; then
    printf "  SKIP  %s  (déjà existant)\n" "$lot_id"
    SKIP=$((SKIP + 1))
  else
    printf "  FAIL  %s  (HTTP %s)\n" "$lot_id" "$code"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "===== FutureKawa — Seed lots ====="
echo ""

# ------------------------------------------------------------------ BRESIL
echo "--- Brésil (BR01 / BR02 — port 8001)"
# Périmés (>365j) — alertes déclenchées au prochain check horaire
post_lot 8001 "LOT-BR-2024-001" "BR01" 450 "Arabica premium - Fazenda Norte"
post_lot 8001 "LOT-BR-2024-002" "BR01" 420 "Robusta export grade A"
post_lot 8001 "LOT-BR-2024-003" "BR02" 400 "Mélange spécial récolte 2023"
# Anciens (180-365j)
post_lot 8001 "LOT-BR-2024-004" "BR01" 300 "Arabica sélection Minas"
post_lot 8001 "LOT-BR-2024-005" "BR02" 240 "Robusta Fazenda Sul grade B"
post_lot 8001 "LOT-BR-2024-006" "BR01" 180 "Torréfaction légère - lot standard"
# Mi-parcours (60-180j)
post_lot 8001 "LOT-BR-2024-007" "BR02" 120 "Torréfaction forte - export Asie"
post_lot 8001 "LOT-BR-2025-001" "BR01"  90 "Arabica bio certifié"
# Récents (<60j)
post_lot 8001 "LOT-BR-2025-002" "BR02"  45 "Robusta frais - arrivage Q1"
post_lot 8001 "LOT-BR-2025-003" "BR01"  20 "Café spécialité - micro-lot"
post_lot 8001 "LOT-BR-2025-004" "BR02"   7 "Arrivage récent - arabica Cerrado"

echo ""
# ---------------------------------------------------------------- EQUATEUR
echo "--- Équateur (EQ01 / EQ02 — port 8002)"
post_lot 8002 "LOT-EQ-2024-001" "EQ01" 440 "Café des Andes - altitude 2000m"
post_lot 8002 "LOT-EQ-2024-002" "EQ02" 410 "Arabica Hacienda Costa récolte 2023"
post_lot 8002 "LOT-EQ-2024-003" "EQ01" 380 "Washed process - lot standard"
post_lot 8002 "LOT-EQ-2024-004" "EQ01" 270 "Lavé haute altitude Quito"
post_lot 8002 "LOT-EQ-2024-005" "EQ02" 200 "Natural process Guayaquil"
post_lot 8002 "LOT-EQ-2024-006" "EQ01" 150 "Micro-lot Hacienda Andes"
post_lot 8002 "LOT-EQ-2024-007" "EQ02" 100 "Honey process sélection"
post_lot 8002 "LOT-EQ-2025-001" "EQ01"  50 "Washed Quito - arrivage Q1"
post_lot 8002 "LOT-EQ-2025-002" "EQ02"  22 "Natural Guayaquil - nouveau"
post_lot 8002 "LOT-EQ-2025-003" "EQ01"   9 "Lot sélection jury - ultra frais"

echo ""
# ---------------------------------------------------------------- COLOMBIE
echo "--- Colombie (CO01 / CO02 — port 8003)"
post_lot 8003 "LOT-CO-2024-001" "CO01" 460 "Café Huila - grand cru 2023"
post_lot 8003 "LOT-CO-2024-002" "CO02" 430 "Café Nariño - export premium"
post_lot 8003 "LOT-CO-2024-003" "CO01" 390 "Arabica Bogota export lot 3"
post_lot 8003 "LOT-CO-2024-004" "CO01" 310 "Huila sélection - Finca Sierra"
post_lot 8003 "LOT-CO-2024-005" "CO02" 230 "Nariño bio Finca Cauca"
post_lot 8003 "LOT-CO-2024-006" "CO01" 160 "Cauca premium - torréfaction medium"
post_lot 8003 "LOT-CO-2024-007" "CO02"  95 "Medellin grade 1 - lot automne"
post_lot 8003 "LOT-CO-2025-001" "CO01"  55 "Bogota spécialité - lavé"
post_lot 8003 "LOT-CO-2025-002" "CO02"  28 "Medellin washed - arrivage"
post_lot 8003 "LOT-CO-2025-003" "CO01"   4 "Micro-lot sélection - ultra frais"

echo ""
echo "========================================"
printf "  Résultats : %d PASS  |  %d SKIP  |  %d FAIL\n" "$PASS" "$SKIP" "$FAIL"
echo ""
echo "  Lots périmés (>365j) : alertes email à la prochaine vérification (horaire)"
echo "  Pour mesures immédiates : bash test-cicd/sim-arduino.sh"
echo "  Pour alertes hors seuils maintenant : bash test-cicd/seed-alertes.sh"
echo "========================================"
echo ""
