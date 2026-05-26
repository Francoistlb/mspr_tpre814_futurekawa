# ============================================================
# FutureKawa — Makefile
# Requires: make (Git Bash / WSL / Linux)
# ============================================================

.PHONY: help setup up up-local up-prod down up-bresil up-equateur up-colombie up-siege logs clean up-jenkins down-jenkins

# Afficher l'aide
help:
	@echo ""
	@echo "FutureKawa — Commandes disponibles"
	@echo "-----------------------------------"
	@echo "  make setup        : copier les .env.example vers .env"
	@echo "  make up           : demarrer en LOCAL  (utilise .env.local)"
	@echo "  make up-local     : idem (alias explicite)"
	@echo "  make up-prod      : demarrer en PROD   (utilise .env.prod)"
	@echo "  make down         : arreter tous les conteneurs"
	@echo "  make up-bresil    : demarrer uniquement le stack Bresil"
	@echo "  make up-equateur  : demarrer uniquement le stack Equateur"
	@echo "  make up-colombie  : demarrer uniquement le stack Colombie"
	@echo "  make up-siege     : demarrer uniquement le stack Siege"
	@echo "  make logs         : afficher les logs en continu"
	@echo "  make clean        : supprimer les volumes (perte de donnees !)"
	@echo ""

# Initialiser les .env des stacks pays et siege depuis leurs .env.example
setup:
	@echo "Configuration des fichiers .env..."
	@test -f .env            || cp .env.example .env
	@test -f .env.local      || cp .env.example .env.local
	@test -f pays/bresil/.env    || cp pays/bresil/.env.example    pays/bresil/.env
	@test -f pays/equateur/.env  || cp pays/equateur/.env.example  pays/equateur/.env
	@test -f pays/colombie/.env  || cp pays/colombie/.env.example  pays/colombie/.env
	@test -f siege/.env          || cp siege/.env.example          siege/.env
	@test -f siege/api/.env      || cp siege/api/.env.example      siege/api/.env
	@echo "Fichiers .env crees. Pensez a modifier les mots de passe !"

# Local (dev) — utilise .env.local
up: up-local

up-local: setup
	docker compose --env-file .env.local up --build -d
	@echo ""
	@echo "Services disponibles (LOCAL) :"
	@echo "  Bresil API    : http://localhost:8001/docs"
	@echo "  Equateur API  : http://localhost:8002/docs"
	@echo "  Colombie API  : http://localhost:8003/docs"
	@echo "  Siege API     : http://localhost:8000/docs"
	@echo "  Frontend      : http://localhost:3000"
	@echo "  Mailhog UI    : http://localhost:8025"

# Production — utilise .env.prod
up-prod:
	@echo "Demarrage en mode PRODUCTION..."
	@test -f .env.prod || (echo "ERREUR : .env.prod introuvable" && exit 1)
	docker compose --env-file .env.prod up --build -d
	@echo "Stack PROD demarre."

down:
	docker compose down

# Stacks pays independants
up-bresil: setup
	docker compose -p fk-bresil -f pays/bresil/docker-compose.yml up --build -d

up-equateur: setup
	docker compose -p fk-equateur -f pays/equateur/docker-compose.yml up --build -d

up-colombie: setup
	docker compose -p fk-colombie -f pays/colombie/docker-compose.yml up --build -d

up-siege: setup
	docker compose -p fk-siege -f siege/docker-compose.yml up --build -d

# Jenkins CI
up-jenkins:
	docker compose -f jenkins/docker-compose.yml up --build -d
	@echo "Jenkins disponible sur http://localhost:8080"

down-jenkins:
	docker compose -f jenkins/docker-compose.yml down

logs:
	docker compose logs -f

# ATTENTION : supprime toutes les donnees
clean:
	docker compose down -v
	@echo "Volumes supprimes."
