#!/bin/bash
# Usage : ./wait-for-health.sh http://localhost:8001/health "Bresil API"
# Attend qu'un endpoint /health reponde 200, timeout 60s

URL=$1
LABEL=${2:-$1}
MAX=30
COUNT=0

echo "En attente de $LABEL ($URL)..."

until curl -sf "$URL" > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX ]; then
    echo "TIMEOUT : $LABEL n'a pas repondu apres ${MAX}x2s"
    exit 1
  fi
  sleep 2
done

echo "$LABEL est pret."
