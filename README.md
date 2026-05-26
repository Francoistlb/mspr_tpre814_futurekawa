# FutureKawa — Suivi IoT des stocks de café vert

MSPR Bloc 4 — RNCP35584 — EPSI

Solution applicative distribuée de suivi des stocks et des conditions de stockage (température / humidité) pour 3 pays : **Brésil**, **Équateur**, **Colombie** — avec consolidation centrale au **Siège**.

---

## Démarrage rapide

```bash
# 1. Copier les fichiers d'environnement
make setup

# 2. Démarrer toute la solution (mode démo)
make up
```

| Service | URL |
|---|---|
| Brésil API (Swagger) | http://localhost:8001/docs |
| Équateur API | http://localhost:8002/docs |
| Colombie API | http://localhost:8003/docs |
| Siège API (Swagger) | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Mailhog (emails test) | http://localhost:8025 |

---

## Commandes utiles

```bash
make up            # Démarrer tout (démo tout-en-un)
make down          # Arrêter tout
make logs          # Suivre les logs en temps réel

make up-bresil     # Démarrer uniquement le stack Brésil
make up-equateur   # Démarrer uniquement le stack Équateur
make up-colombie   # Démarrer uniquement le stack Colombie
make up-siege      # Démarrer uniquement le stack Siège

make clean         # Supprimer tous les volumes (⚠ perte de données)
```

---

## Structure du projet

```
.
├── docker-compose.yml        # Compose tout-en-un (mode démo)
├── .env.example              # Variables racine à copier en .env
├── Makefile                  # Commandes de lancement
│
├── pays/
│   ├── bresil/               # Stack local Brésil
│   │   ├── docker-compose.yml    # DB + MQTT + API isolés
│   │   ├── .env.example          # Variables (ports, SMTP, pays)
│   │   ├── mosquitto/
│   │   │   └── mosquitto.conf    # Config broker MQTT
│   │   └── db/
│   │       └── init.sql          # Schéma SQL + seed entrepôts BR01/BR02
│   ├── equateur/             # Idem — ports 1884/8002 — seuils 31°C/60%
│   └── colombie/             # Idem — ports 1885/8003 — seuils 26°C/80%
│
├── api-pays/                 # Code API partagé entre les 3 pays
│   ├── Dockerfile
│   ├── requirements.txt      # FastAPI, uvicorn, psycopg2, paho-mqtt
│   └── main.py               # Placeholder Step 1 — à compléter Étape 2
│
└── siege/
    ├── docker-compose.yml    # Stack siège (API centrale + frontend)
    ├── .env.example          # URLs des APIs pays + ports
    ├── api/
    │   ├── Dockerfile
    │   ├── requirements.txt  # FastAPI, httpx
    │   └── main.py           # Agrégation async multi-pays, résilience timeout
    └── frontend/
        ├── Dockerfile        # nginx
        └── index.html        # Placeholder Step 1 — à remplacer Étape 5 (React)
```

---

## Architecture distribuée

```
  [IoT ESP32]                    [Siège]
      │ MQTT                  ┌─────────────┐
      ▼                       │  Frontend   │ :3000
  [Mosquitto]                 │  (React)    │
      │                       └──────┬──────┘
      ▼                              │ HTTP
  [API Pays]  ──── HTTP ────►  [API Siège] :8000
  [PostgreSQL]                       │
                              agrège les 3 pays
```

Chaque pays dispose d'un **backend isolé** (DB + MQTT + API).  
Le **siège** ne stocke rien : il interroge les APIs pays à la demande avec timeout (3s) — si un pays est indisponible, les autres continuent de fonctionner.

---

## Seuils IoT par pays (stockés en BDD)

| Pays | Temp. idéale | Humidité idéale | Tolérance |
|---|---|---|---|
| Brésil | 29°C | 55% | ±3°C / ±2% |
| Équateur | 31°C | 60% | ±3°C / ±2% |
| Colombie | 26°C | 80% | ±3°C / ±2% |

Une alerte email est déclenchée si :
- Température ou humidité **hors plage** acceptable
- Lot stocké depuis **plus de 365 jours** (péremption)

---

## Topics MQTT

```
futurekawa/{PAYS_CODE}/{entrepot_code}/mesures
```

Exemples :
- `futurekawa/BR/BR01/mesures`
- `futurekawa/EQ/EQ01/mesures`
- `futurekawa/CO/CO01/mesures`

Payload JSON attendu :
```json
{ "temp": 28.5, "hum": 54.2, "ts": "2024-01-15T10:30:00Z" }
```

---

## Ports exposés (mode démo tout-en-un)

| Service | Port hôte |
|---|---|
| Brésil — API | 8001 |
| Brésil — MQTT | 1883 |
| Équateur — API | 8002 |
| Équateur — MQTT | 1884 |
| Colombie — API | 8003 |
| Colombie — MQTT | 1885 |
| Siège — API | 8000 |
| Siège — Frontend | 3000 |
| Mailhog — SMTP | 1025 |
| Mailhog — UI | 8025 |

---

## Schéma BDD (identique pour chaque pays)

```
entrepots     id, code, nom, exploitation, pays,
              temp_ideale, hum_ideale, tolerance_temp, tolerance_hum

lots          id (unique), entrepot_id, date_stockage, statut
              statut ∈ { conforme | en_alerte | perime }
              trié ASC par date_stockage → logique FIFO

mesures       id, entrepot_id, temperature, humidite, hors_plage, timestamp

alertes       id, type (hors_plage | peremption), entrepot_id, lot_id,
              message, email_envoye, email_destinataire, created_at
```

---

## État d'avancement

| Étape | Description | Statut |
|---|---|---|
| 0 | Lecture & cadrage, repo Git | ✅ Fait |
| 1 | Architecture & Docker Compose | ✅ Fait |
| 2 | Backend pays — API REST (lots, mesures, alertes, consumer MQTT) | 🔲 À faire |
| 3 | Prototype IoT — ESP32 + DHT (parallèle à Étape 2) | 🔲 À faire |
| 4 | Backend siège — agrégation réelle | 🔲 À faire |
| 5 | Frontend React + Chart.js | 🔲 À faire |
| 6 | CI/CD Jenkins (Jenkinsfile) | 🔲 À faire |
| 7 | Tests (unitaires, intégration, API, end-to-end) | 🔲 À faire |
| 8 | Documentation technique (archi, IoT, tests) | 🔲 À faire |
| 9 | Documentation utilisateur métier | 🔲 À faire |
| 10 | Schéma automatisation phase 2 + questionnaire | 🔲 À faire |

---

## Prochaine étape : Étape 2 — Backend pays

Fichier à compléter : [`api-pays/main.py`](api-pays/main.py)

Endpoints à implémenter :
- `POST /lots` — créer un lot
- `GET /lots` — liste triée FIFO (date_stockage ASC)
- `GET /lots/{id}` — détail + statut
- `PUT /lots/{id}/statut` — mise à jour statut
- `POST /mesures` — réception capteur
- `GET /mesures/{entrepot_code}` — historique
- Consumer MQTT (subscribe + insert BDD)
- Moteur d'alertes (seuils + péremption + envoi email)
