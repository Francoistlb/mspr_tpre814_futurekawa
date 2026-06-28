#!/bin/bash
# FutureKawa — Simulateur capteurs Arduino (température / humidité)
# Usage : bash test-cicd/sim-arduino.sh [--loop] [--interval SECONDES]
# Exemple : bash test-cicd/sim-arduino.sh --loop --interval 30

LOOP=false
INTERVAL=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --loop)     LOOP=true; shift ;;
    --interval) INTERVAL=$2; shift 2 ;;
    *)          shift ;;
  esac
done

# pays|port|entrepot|temp_ideale|tol_temp|hum_ideale|tol_hum
ENTREPOTS=(
  "bresil|8001|BR01|29|3|55|2"
  "bresil|8001|BR02|29|3|55|2"
  "equateur|8002|EQ01|31|3|60|2"
  "equateur|8002|EQ02|31|3|60|2"
  "colombie|8003|CO01|26|3|80|2"
  "colombie|8003|CO02|26|3|80|2"
)

# Génère une valeur réaliste autour de l'idéal (~15% chance hors seuil)
rand_val() {
  local ideale=$1 tol=$2
  awk -v seed="$RANDOM$RANDOM" -v ideale="$ideale" -v tol="$tol" 'BEGIN {
    srand(seed);
    hors  = rand() < 0.15;
    range = hors ? (tol + rand() * 2.5 + 0.5) : (rand() * tol * 1.6);
    sign  = rand() > 0.5 ? 1 : -1;
    printf "%.1f", ideale + sign * range;
  }'
}

run_cycle() {
  local ts
  ts=$(date '+%H:%M:%S')
  printf "  [%s]" "$ts"

  local any_alert=false
  for cfg in "${ENTREPOTS[@]}"; do
    IFS='|' read -r pays port entrepot t_ideal t_tol h_ideal h_tol <<< "$cfg"

    local temp hum code resp
    temp=$(rand_val "$t_ideal" "$t_tol")
    hum=$(rand_val  "$h_ideal" "$h_tol")

    resp=$(curl -s -X POST "http://localhost:$port/mesures" \
      -H "Content-Type: application/json" \
      -d "{\"entrepot\":\"$entrepot\",\"temperature\":$temp,\"humidite\":$hum}")
    code=$(echo "$resp" | grep -o '"hors_plage":[0-9]' | grep -o '[0-9]')

    if echo "$resp" | grep -q '"id"'; then
      local flag=""
      [ "$code" = "1" ] && flag=" !" && any_alert=true
      printf "  %s %s°C/%s%%%s" "$entrepot" "$temp" "$hum" "$flag"
    else
      printf "  %s FAIL" "$entrepot"
    fi
  done

  $any_alert && printf "  ← ALERTE email envoyé"
  echo ""
}

echo ""
echo "===== FutureKawa — Simulateur Arduino ====="
echo "  Entrepôts : BR01 BR02 | EQ01 EQ02 | CO01 CO02"
echo "  Seuils    : bresil 29±3°C/55±2%  equateur 31±3°C/60±2%  colombie 26±3°C/80±2%"
echo "  Alertes   : ~15% des mesures hors plage → email MailHog (http://localhost:8025)"
if $LOOP; then
  echo "  Mode boucle — 1 cycle toutes les ${INTERVAL}s. Ctrl+C pour arrêter."
else
  echo "  Mode one-shot. Relancez avec --loop --interval 30 pour une simulation continue."
fi
echo ""

if $LOOP; then
  while true; do
    run_cycle
    sleep "$INTERVAL"
  done
else
  run_cycle
  echo ""
fi
