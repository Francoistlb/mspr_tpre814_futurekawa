# FutureKawa — Suivi IoT des stocks de café vert

**MSPR Bloc 4 — RNCP35584 — EPSI 2025-2026**

Solution distribuée multi-pays de suivi des stocks et des conditions de stockage (température / humidité) pour 3 pays producteurs — avec consolidation centrale au Siège.

---

## Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | v2 (plugin) | `docker compose version` |
| Git | 2.40+ | `git --version` |
| Python 3 | 3.10+ (module IoT uniquement) | `python3 --version` |
| Git Bash | — | Nécessaire sur Windows pour les scripts shell |

---

## Démarrage rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/Francoistlb/mspr_tpre814_futurekawa.git
cd mspr_tpre814_futurekawa

# 2. Créer le fichier d'environnement
cp .env .env.ci          # Pour la démo locale — adapter si besoin

# 3. Démarrer toute la solution
docker compose --env-file .env up --build -d

# 4. Vérifier que tout est opérationnel
bash test-cicd/health-check.sh
```

La solution est prête quand le health-check affiche **4 PASS**.

---

## Services et URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend siège** | http://localhost:3000 | Interface web React |
| **API siège** | http://localhost:8000/docs | Swagger — agrégation 3 pays |
| **API Brésil** | http://localhost:8001/docs | Swagger — lots, mesures, alertes |
| **API Équateur** | http://localhost:8002/docs | Swagger — lots, mesures, alertes |
| **API Colombie** | http://localhost:8003/docs | Swagger — lots, mesures, alertes |
| **MailHog** | http://localhost:8025 | Emails d'alerte (développement) |
| **Jenkins** | http://localhost:8080 | CI/CD (si démarré séparément) |

---

## Commandes utiles

```bash
# Démarrer / arrêter
docker compose --env-file .env up -d          # Démarrer (sans rebuild)
docker compose --env-file .env up --build -d  # Démarrer avec rebuild
docker compose --env-file .env down           # Arrêter (volumes conservés)
docker compose --env-file .env down -v        # Arrêter + supprimer les données ⚠️

# Logs
docker compose --env-file .env logs -f              # Tous les services
docker compose --env-file .env logs -f bresil-api   # Un service précis

# Tests
bash test-cicd/health-check.sh    # Vérifie que les 4 APIs répondent
bash test-cicd/seed-lots.sh       # Insère des lots de démonstration
bash test-cicd/seed-alertes.sh    # Génère des alertes hors seuil immédiates
bash test-cicd/demo.sh            # Démo complète : lots + péremption + simulation

# Simulation capteurs Arduino
bash test-cicd/sim-arduino.sh                    # Un cycle de mesures
bash test-cicd/sim-arduino.sh --loop --interval 30  # Simulation continue (30s)

# Tests unitaires
docker compose --env-file .env exec -T bresil-api npm test
docker compose --env-file .env exec -T siege-api npm test
```

---

## Module IoT — Arduino

Le module IoT se compose d'un **Arduino UNO + capteur DHT11/DHT22** connecté par USB à un PC hôte, et d'un script Python `scripts_mqtt/mqtt.py` qui lit les données série et les publie sur MQTT.

### Pré-requis

```bash
pip install paho-mqtt pyserial
```

### Configuration (`scripts_mqtt/mqtt.py`)

Adapter les 4 variables en haut du fichier :

```python
SERIAL_PORT = "COM3"       # Windows : COM3, COM4… — Mac/Linux : /dev/cu.usbmodem...
BAUD_RATE   = 9600
MQTT_HOST   = "127.0.0.1"
MQTT_PORT   = 1883         # Brésil:1883 | Équateur:1884 | Colombie:1885
PAYS        = "bresil"     # bresil | equateur | colombie
ENTREPOT    = "BR01"       # BR01 BR02 | EQ01 EQ02 | CO01 CO02
```

### Lancement

```bash
# S'assurer que la stack Docker est démarrée, puis :
python3 scripts_mqtt/mqtt.py
```

Le script affiche chaque mesure publiée :
```
Lecture série sur COM3...
MQTT connecté (0) — topic : futurekawa/bresil/BR01/mesures
Publié → futurekawa/bresil/BR01/mesures : {"entrepot": "BR01", "temp": 28.5, "hum": 54.2, "ts": "..."}
```

### Format des messages MQTT

**Topic :** `futurekawa/{pays}/{entrepot_code}/mesures`

**Payload JSON :**
```json
{
  "entrepot": "BR01",
  "temp": 28.5,
  "hum": 54.2,
  "ts": "2026-06-15T14:00:00+00:00"
}
```

---

## Variables d'environnement (`.env`)

| Variable | Valeur par défaut | Description |
|----------|------------------|-------------|
| `SMTP_HOST` | `mailhog` | Serveur SMTP (MailHog en dev) |
| `SMTP_PORT` | `1025` | Port SMTP |
| `RESPONSABLE_EMAIL_BRESIL` | `responsable.bresil@futurekawa.com` | Destinataire alertes Brésil |
| `RESPONSABLE_EMAIL_EQUATEUR` | `responsable.equateur@futurekawa.com` | Destinataire alertes Équateur |
| `RESPONSABLE_EMAIL_COLOMBIE` | `responsable.colombie@futurekawa.com` | Destinataire alertes Colombie |
| `API_TIMEOUT_S` | `3` | Timeout appels pays → siège (secondes) |
| `VITE_SIEGE_API_URL` | `http://localhost:8000` | URL API siège pour le frontend |

---

## Structure du projet

```
.
├── README.md
├── Jenkinsfile                    # Pipeline CI/CD
├── docker-compose.yml             # Stack complète tout-en-un
├── docker-compose.override.yml    # Surcharges dev local
├── .env                           # Variables d'environnement (non commité)
│
├── backend-pays/                  # Code API partagé entre les 3 pays
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js                 # Express — routes, middleware
│       ├── server.js              # Démarrage + check péremption horaire
│       ├── db.js                  # SQLite (better-sqlite3)
│       ├── alertes.js             # Moteur d'alertes + envoi email
│       ├── mqtt.js                # Consumer MQTT
│       └── routes/
│           ├── lots.js            # GET/POST /lots, PUT /lots/:id/statut
│           ├── mesures.js         # GET/POST /mesures
│           └── alertes.js         # GET /alertes
│
├── db/
│   └── init.sql                   # Schéma BDD + seed entrepôts
│
├── pays/                          # Configurations par pays
│   ├── bresil/mosquitto/          # Config broker MQTT Brésil
│   ├── equateur/mosquitto/        # Config broker MQTT Équateur
│   └── colombie/mosquitto/        # Config broker MQTT Colombie
│
├── siege/
│   ├── api/                       # Backend central (agrégation)
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── routes/            # /stocks, /mesures, /alertes (agrégés)
│   └── frontend/                  # Interface React + Chart.js
│       ├── Dockerfile
│       └── src/
│           └── pages/             # Dashboard, Stocks, Détail lot, Alertes
│
├── scripts_mqtt/
│   └── mqtt.py                    # Pont Arduino → MQTT
│
├── test-cicd/                     # Scripts de test et démo
│   ├── health-check.sh            # Vérifie les 4 APIs
│   ├── seed-lots.sh               # Insère 30 lots avec historique réaliste
│   ├── seed-alertes.sh            # Force des alertes hors seuil
│   ├── sim-arduino.sh             # Simule les capteurs Arduino
│   └── demo.sh                    # Démo complète enchaînée
│
├── jenkins/                       # Configuration Jenkins CI
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── DOCS/                          # Documentation
│   ├── FutureKawa_Documentation_Technique.md
│   └── FutureKawa_Guide_Utilisateur.md
│
└── Livrables/                     # Livrables MSPR
```

---

## Seuils IoT par pays

| Pays | Temp. idéale | Humidité idéale | Tolérance |
|------|-------------|-----------------|-----------|
| Brésil | 29°C | 55% | ±3°C / ±2% |
| Équateur | 31°C | 60% | ±3°C / ±2% |
| Colombie | 26°C | 80% | ±3°C / ±2% |

Une alerte email est déclenchée automatiquement si :
- Température ou humidité **hors plage** acceptable → email immédiat
- Lot stocké depuis **plus de 365 jours** → email à la vérification horaire

---

## CI/CD Jenkins

```bash
# Démarrer Jenkins (isolé de la stack principale)
docker compose -f jenkins/docker-compose.yml up -d

# Jenkins accessible sur http://localhost:8080
# Pipeline déclenché automatiquement sur push vers develop ou main
```

Le pipeline exécute dans l'ordre : **Checkout → Prepare → Build → Start → Health Checks → Tests unitaires → Tests intégration → Post (cleanup)**.

---

## Schéma BDD (identique pour chaque pays)

```
entrepots   id, code, nom, exploitation, pays,
            temp_ideale, hum_ideale, tolerance_temp, tolerance_hum

lots        id (TEXT unique), entrepot_id, date_stockage,
            statut ∈ { conforme | en_alerte | perime }
            → trié ASC par date_stockage (logique FIFO)

mesures     id, entrepot_id, temperature, humidite, hors_plage, timestamp

alertes     id, type (hors_plage | peremption), entrepot_id, lot_id,
            message, email_envoye, email_destinataire, created_at
```

---

*FutureKawa — MSPR Bloc 4 RNCP35584 — EPSI 2025-2026*
