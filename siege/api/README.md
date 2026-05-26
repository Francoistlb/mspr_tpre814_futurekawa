# FutureKawa — Backend Siège (Étape 4)

API centrale Node.js/Express qui agrège les données des 3 pays (Brésil, Équateur, Colombie).  
Elle ne stocke rien : elle interroge les APIs pays à la demande avec timeout et résilience.

---

## Prérequis

- [Node.js 20+](https://nodejs.org/) (pour le dev local)
- [Docker](https://www.docker.com/) + Docker Compose (pour le mode conteneur)

---

## Lancement — Mode développement local (sans Docker)

```bash
cd siege/api

# 1. Installer les dépendances
npm install

# 2. Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env si les ports des APIs pays sont différents

# 3. Lancer le serveur (avec rechargement automatique)
npm run dev

# OU sans rechargement automatique
npm start
```

L'API est disponible sur **http://localhost:8000**  
La doc Swagger est sur **http://localhost:8000/docs**

---

## Lancement — Mode Docker (siège seul)

```bash
# Depuis la racine du projet
make up-siege
```

Ou manuellement :

```bash
cd siege
docker compose up --build
```

---

## Lancement — Mode démo tout-en-un (tous les services)

```bash
# Depuis la racine du projet
make up
```

Démarre les 3 pays + le siège + le frontend + Mailhog en une seule commande.

---

## Variables d'environnement

Fichier : `siege/api/.env` (copié depuis `.env.example`)

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `8000` | Port d'écoute de l'API siège |
| `BRESIL_API_URL` | `http://bresil-api:8000` | URL de l'API Brésil |
| `EQUATEUR_API_URL` | `http://equateur-api:8000` | URL de l'API Équateur |
| `COLOMBIE_API_URL` | `http://colombie-api:8000` | URL de l'API Colombie |
| `API_TIMEOUT_S` | `3` | Timeout par requête vers un pays (secondes) |

> En développement local sans Docker, remplacer les URLs par `http://localhost:8001`, `http://localhost:8002`, `http://localhost:8003`.

---

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/health` | Santé du service |
| `GET` | `/siege/stocks` | Stocks agrégés de tous les pays |
| `GET` | `/siege/stocks/:pays` | Stocks d'un seul pays |
| `GET` | `/siege/mesures/:pays/:lot_id` | Mesures IoT d'un lot (délégation) |
| `GET` | `/siege/alertes` | Alertes actives de tous les pays |
| `GET` | `/docs` | Swagger UI interactif |
| `GET` | `/openapi.json` | Spec OpenAPI brute |

**Valeurs valides pour `:pays`** : `bresil`, `equateur`, `colombie`

### Exemple de réponse — `/siege/stocks`

```json
{
  "total_pays": 3,
  "pays_ok": 2,
  "pays_en_erreur": 1,
  "resultats": [
    { "pays": "bresil",   "code": "BR", "status": "ok",    "data": [...] },
    { "pays": "equateur", "code": "EQ", "status": "error", "error": "Timeout (>3s)" },
    { "pays": "colombie", "code": "CO", "status": "ok",    "data": [...] }
  ]
}
```

> Si un pays est down, la réponse reste **200** avec `status: "error"` pour ce pays uniquement. Les autres pays sont toujours inclus.

---

## Tests

```bash
cd siege/api

# Lancer les tests
npm test

# Avec rapport de couverture
npm run test:coverage
```

Les tests mockent axios — **aucune API pays ne doit être démarrée** pour les lancer.

```
PASS tests/siege.test.js
  GET /health                        ✓
  GET /siege/stocks
    ✓ tous les pays disponibles
    ✓ réponse partielle si timeout
    ✓ réponse partielle si ECONNREFUSED
  GET /siege/stocks/:pays
    ✓ pays valide
    ✓ 404 pays inconnu
  GET /siege/mesures/:pays/:lot_id
    ✓ délégation vers l'API pays
    ✓ 404 pays inconnu
    ✓ 503 si API pays down
  GET /siege/alertes
    ✓ agrégation tous pays
    ✓ réponse partielle si erreur
  Routes inconnues
    ✓ 404 avec message explicite

Tests: 12 passed, 12 total
```

---

## Structure du code

```
siege/api/
├── Dockerfile
├── package.json
├── .env.example
├── src/
│   ├── app.js              ← Point d'entrée Express
│   ├── config.js           ← Variables d'env + URLs pays
│   ├── swagger.js          ← Configuration Swagger/OpenAPI
│   ├── routes/
│   │   ├── health.js       ← GET /health
│   │   ├── stocks.js       ← GET /siege/stocks[/:pays]
│   │   ├── mesures.js      ← GET /siege/mesures/:pays/:lot_id
│   │   └── alertes.js      ← GET /siege/alertes
│   └── utils/
│       └── httpClient.js   ← fetchPays() + fetchAllPays() avec résilience
└── tests/
    └── siege.test.js       ← Tests Jest + Supertest
```

---

## Résilience

Le siège ne tombe jamais à cause d'un pays indisponible :

- Tous les appels pays sont faits **en parallèle** (`Promise.all`)
- Chaque pays a un **timeout configurable** (défaut 3s)
- Un pays en erreur retourne `{ status: "error", error: "..." }` sans bloquer les autres
- Le code HTTP de la réponse siège est toujours **200** sauf pour les erreurs de route (404) ou si le pays lui-même est introuvable sur `/mesures` (503)
