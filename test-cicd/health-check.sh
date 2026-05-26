#!/bin/bash
# FutureKawa — Health check des APIs (premier test CI)
# Usage : ENV_FILE=.env.ci bash test-cicd/health-check.sh
#
# Verifie que chaque API repond { status: "ok" } sur /health.
# Necessite que les conteneurs soient deja demarres (docker compose up -d).

ENV_FILE="${ENV_FILE:-.env.ci}"

PASS=0
FAIL=0
FAILED_SERVICES=""

# --- Verifie un service via docker compose exec + node (disponible dans tous les containers)
check_api() {
  local service=$1
  local port=$2

  printf "  %-24s" "$service (/health:$port)"

  local output
  if output=$(docker compose --env-file "$ENV_FILE" exec -T "$service" \
    node -e "
const http = require('http');
http.get('http://localhost:${port}/health', r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    try {
      const j = JSON.parse(d);
      process.stdout.write(JSON.stringify(j));
      process.exit(j.status === 'ok' ? 0 : 1);
    } catch { process.exit(1); }
  });
}).on('error', e => { process.stderr.write(e.message); process.exit(1); });
" 2>/dev/null); then
    echo " PASS  $output"
    PASS=$((PASS + 1))
  else
    echo " FAIL"
    FAIL=$((FAIL + 1))
    FAILED_SERVICES="$FAILED_SERVICES $service"
  fi
}

echo ""
echo "===== FutureKawa — Health Check CI ====="
echo ""

# Pays APIs : port 3000 (PORT non defini dans docker-compose.yml principal → defaut server.js)
check_api "bresil-api"   3000
check_api "equateur-api" 3000
check_api "colombie-api" 3000

# Siege API : port 8000 (defaut config.js)
check_api "siege-api"    8000

echo ""
echo "========================================"
echo "  Resultats : $PASS PASS  |  $FAIL FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  Services en echec :$FAILED_SERVICES"
  echo "========================================"
  exit 1
fi

echo "  Tous les services sont operationnels."
echo "========================================"
echo ""
