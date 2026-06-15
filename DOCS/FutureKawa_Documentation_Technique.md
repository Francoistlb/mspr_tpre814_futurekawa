# FutureKawa — Documentation technique
### MSPR Bloc 4 — RNCP35584 — EPSI 2025-2026

---

**Projet** : FutureKawa — Suivi IoT des stocks de café vert  
**Équipe** : Bloc 4 EPSI  
**Version** : 1.0  
**Date** : Juin 2026

---

## Table des matières

1. [Architecture globale](#1-architecture-globale)
2. [Justification des choix techniques](#2-justification-des-choix-techniques)
3. [Conception IoT](#3-conception-iot)
4. [Plans de tests et résultats](#4-plans-de-tests-et-résultats)
5. [Pipeline CI/CD Jenkins](#5-pipeline-cicd-jenkins)
6. [Sécurité — OWASP API Top 10](#6-sécurité--owasp-api-top-10)
7. [Schéma d'automatisation — Phase 2](#7-schéma-dautomatisation--phase-2)
8. [Questionnaire interview — Phase 2](#8-questionnaire-interview--phase-2)

---

## 1. Architecture globale

### 1.1 Vue d'ensemble

FutureKawa est une architecture **distribuée multi-pays** : chaque pays producteur (Brésil, Équateur, Colombie) dispose d'une stack indépendante et conteneurisée. Le siège agrège les données de tous les pays via un backend central.

```
[Arduino + DHT]
      │ USB série
[mqtt.py — hôte]
      │ MQTT publish
[Mosquitto broker]  ←──────┐
      │ subscribe           │ bresil_net / equateur_net / colombie_net
[API REST pays]  ─────────→ [SQLite partagé]
      │ HTTP REST
[Backend Siège]  ←── agrégation 3 pays (timeout 3s / résilience)
      │
[Frontend React] ── Dashboard / Stocks / Alertes / Charts
```

**[CAPTURE D'ÉCRAN — Schéma draw.io architecture applicative page 1]**

### 1.2 Composants par pays

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Broker MQTT | Eclipse Mosquitto 2.0 | Réception des messages IoT |
| API REST | Node.js 20 + Express 5 | Gestion lots, mesures, alertes |
| Base de données | SQLite (better-sqlite3) | Persistance partagée entre les 3 APIs |
| IoT bridge | Python 3 + paho-mqtt | Lecture Arduino → publication MQTT |
| Capteur | Arduino UNO + DHT11/22 | Mesure température et humidité |

### 1.3 Composants siège

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Backend siège | Node.js 20 + Express 5 | Agrégation et proxy vers les APIs pays |
| Frontend | React 18 + Chart.js 4 | Interface de consultation |
| Serveur web | nginx 1.27 | Serveur de production + proxy |
| Email dev | Mailhog | Interception des emails en développement |

### 1.4 Infrastructure Docker

La stack est entièrement conteneurisée via Docker Compose.

**Fichiers de configuration :**

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Base : services, réseaux, volumes |
| `docker-compose.override.yml` | Dev local : ports exposés vers l'hôte |
| `jenkins/docker-compose.yml` | Jenkins CI isolé |

**Réseaux Docker :**

| Réseau | Services connectés |
|--------|-------------------|
| `bresil_net` | bresil-mqtt, bresil-api |
| `equateur_net` | equateur-mqtt, equateur-api |
| `colombie_net` | colombie-mqtt, colombie-api |
| `futurekawa_net` | toutes les APIs pays, siege-api, siege-frontend, mailhog |

**Ports exposés (développement local) :**

| Service | Port hôte | Port interne |
|---------|-----------|--------------|
| bresil-api | 8001 | 3000 |
| equateur-api | 8002 | 3000 |
| colombie-api | 8003 | 3000 |
| siege-api | 8000 | 8000 |
| siege-frontend | 3000 | 80 |
| bresil-mqtt | 1883 | 1883 |
| equateur-mqtt | 1884 | 1883 |
| colombie-mqtt | 1885 | 1883 |
| mailhog UI | 8025 | 8025 |
| Jenkins | 8080 | 8080 |

**[CAPTURE D'ÉCRAN — Schéma draw.io architecture Docker Compose page 2]**

### 1.5 Flux de données

**Flux IoT → BDD :**
1. Arduino mesure température et humidité toutes les 30 secondes
2. Le script `mqtt.py` lit la mesure via liaison série USB
3. Il publie un message JSON sur le topic MQTT du pays
4. Le consumer MQTT de l'API pays reçoit le message
5. Il compare les valeurs aux seuils de l'entrepôt
6. Il insère la mesure en BDD et crée une alerte si hors plage

**Flux consultation siège :**
1. Le frontend appelle le backend siège (ex. `GET /siege/stocks`)
2. Le siège appelle en parallèle les 3 APIs pays
3. Chaque pays répond avec ses données ou une erreur timeout
4. Le siège consolide et retourne une réponse partielle si nécessaire
5. Le frontend affiche les données avec les graphiques Chart.js

### 1.6 Résilience et tolérance aux pannes

**Principe de résilience du siège :**

Le backend siège est conçu pour ne jamais bloquer si un pays est indisponible. Chaque appel vers une API pays est soumis à un **timeout configurable (3 secondes par défaut)**. En cas de panne ou de timeout, la réponse inclut une indication d'erreur partielle sans bloquer les autres pays.

```json
{
  "total_pays": 3,
  "pays_ok": 2,
  "pays_en_erreur": 1,
  "resultats": [
    { "pays": "bresil",   "status": "ok",    "data": [...] },
    { "pays": "equateur", "status": "ok",    "data": [...] },
    { "pays": "colombie", "status": "error", "error": "Timeout (>3s)" }
  ]
}
```

**Résilience du consumer MQTT :**

Le consumer MQTT gère automatiquement les déconnexions via la bibliothèque `mqtt.js` :
- Reconnexion automatique sur coupure réseau
- Log des erreurs de connexion (`console.error`)
- Reprise de la souscription aux topics après reconnexion

**Résilience de l'IoT :**

Le script `mqtt.py` ignore les lignes de lecture série invalides (format inattendu, erreur DHT) et continue la boucle sans planter.

---

## 2. Justification des choix techniques

### 2.1 Pourquoi une architecture microservices ?

Le cahier des charges impose une architecture distribuée pays ↔ siège. Ce découpage répond à plusieurs contraintes métier :

| Besoin métier | Réponse architecturale |
|---------------|------------------------|
| Chaque pays doit fonctionner de manière autonome | Stack indépendante par pays |
| Le siège doit consolider sans dépendre d'un pays | Agrégation avec tolérance aux pannes |
| Les seuils varient par pays | Configuration en BDD par entrepôt |
| Déploiement progressif (un pays à la fois) | Docker Compose par pays (`make up-bresil`) |

Une architecture monolithique aurait rendu impossible le fonctionnement autonome d'un pays en cas de panne du siège.

### 2.2 Pourquoi MQTT plutôt qu'HTTP pour l'IoT ?

| Critère | MQTT | HTTP |
|---------|------|------|
| Consommation mémoire Arduino | Très faible | Élevée |
| Fiabilité réseau instable | Publication asynchrone, QoS | Connexion synchrone bloquante |
| Découplage capteur / serveur | Total (publish/subscribe) | Couplage fort |
| Reconnexion automatique | Native | À implémenter manuellement |

MQTT est le standard industriel pour l'IoT. La bibliothèque PubSubClient (Arduino) et paho-mqtt (Python) gèrent nativement la reconnexion et le mode hors-ligne.

### 2.3 Pourquoi Mosquitto ?

- Image Docker officielle légère (eclipse-mosquitto:2.0)
- Configuration simple par fichier texte
- Standard de fait pour les brokers MQTT embarqués
- Compatible avec tous les clients MQTT (Arduino, Python, Node.js)

### 2.4 Pourquoi Node.js + Express ?

- Écosystème npm riche pour MQTT, email, SQLite
- Modèle async natif adapté aux I/O multiples (MQTT + HTTP + BDD)
- FastAPI (initialement envisagé) apportait une dépendance Python supplémentaire redondante avec le script IoT
- Express 5 avec gestion d'erreurs async native

### 2.5 Pourquoi SQLite plutôt que PostgreSQL ?

Choix pragmatique justifié par le contexte MSPR (24h de préparation) :

| Critère | SQLite | PostgreSQL |
|---------|--------|------------|
| Configuration | Zéro (fichier) | Service + auth + init |
| Volume partagé Docker | Fichier monté | Connexion réseau + credentials |
| Performance (< 1000 req/s) | Suffisant | Sur-dimensionné |
| Migrations | `CREATE TABLE IF NOT EXISTS` | Outils dédiés |

Pour une mise en production réelle, PostgreSQL serait préféré pour la concurrence et les performances à grande échelle.

### 2.6 Pourquoi React + Chart.js ?

- React : composants réutilisables, hooks pour les appels API
- Chart.js 4 : courbes temporelles avec annotations de seuils
- Vite : build ultra-rapide, hot reload en développement
- nginx : serveur de production léger avec reverse proxy intégré

---

## 3. Conception IoT

### 3.1 Matériel utilisé

| Composant | Référence | Rôle |
|-----------|-----------|------|
| Microcontrôleur | Arduino UNO | Lecture capteur + transmission série |
| Capteur | DHT11 / DHT22 | Mesure température et humidité |
| Résistance | 10 kΩ (pull-up) | Stabilisation signal DATA du DHT |
| Câble USB | USB-A vers USB-B | Liaison série Arduino ↔ PC |
| PC hôte | Tout OS | Exécution de `mqtt.py` |

**Précision des capteurs :**

| Capteur | Précision température | Précision humidité |
|---------|-----------------------|--------------------|
| DHT11 | ±2°C | ±5% |
| DHT22 | ±0.5°C | ±2% |

> Note : le DHT22 est recommandé pour les seuils du projet (±3°C / ±2%) car le DHT11 peut être insuffisant en précision humidité.

### 3.2 Schéma de câblage

**[CAPTURE D'ÉCRAN — Schéma de câblage Arduino + DHT (photo ou Fritzing)]**

**Connexions :**

| Pin DHT | Connexion |
|---------|-----------|
| VCC | 5V Arduino |
| DATA | Pin digital 2 + résistance 10kΩ vers VCC |
| GND | GND Arduino |

**[CAPTURE D'ÉCRAN — Photo du montage physique sur breadboard]**

### 3.3 Code Arduino

Le programme Arduino lit le capteur DHT toutes les 2 secondes et envoie les valeurs sur le port série au format texte :

```
54.20 28.50
```
_(humidité puis température, séparés par un espace)_

**[CAPTURE D'ÉCRAN — Code Arduino dans l'IDE]**

### 3.4 Structure des topics MQTT

**Format :** `futurekawa/{pays}/{entrepot_code}/mesures`

| Exemple de topic | Description |
|-----------------|-------------|
| `futurekawa/bresil/BR01/mesures` | Entrepôt São Paulo, Brésil |
| `futurekawa/equateur/EQ01/mesures` | Entrepôt Quito, Équateur |
| `futurekawa/colombie/CO01/mesures` | Entrepôt Bogotá, Colombie |

Les APIs pays souscrivent au topic générique `futurekawa/{pays}/#` pour recevoir tous les entrepôts du pays.

### 3.5 Format du payload JSON

```json
{
  "entrepot": "BR01",
  "temp": 28.5,
  "hum": 54.2,
  "ts": "2026-05-28T14:13:17.031326+00:00"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `entrepot` | string | Code de l'entrepôt (BR01, EQ02…) |
| `temp` | float | Température en °C |
| `hum` | float | Humidité relative en % |
| `ts` | string ISO 8601 | Horodatage UTC de la mesure |

### 3.6 Fréquence d'envoi

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| Fréquence Arduino | 1 lecture / 2s | Limite recommandée DHT |
| Fréquence publication MQTT | À chaque lecture valide | Données fraîches en continu |
| Tolérance dérive | ±3°C / ±2% | Définie par pays en BDD |

### 3.7 Stratégie de reconnexion

**Reconnexion MQTT (script Python) :**

La bibliothèque `paho-mqtt` gère automatiquement la reconnexion via `loop_start()`. En cas de coupure réseau, le client tente de se reconnecter toutes les quelques secondes jusqu'au rétablissement.

**Reconnexion MQTT (consumer Node.js) :**

L'événement `offline` est loggué. La bibliothèque `mqtt.js` tente automatiquement la reconnexion avec backoff exponentiel.

**Gestion des erreurs de lecture DHT :**

Le script `mqtt.py` ignore les lignes contenant "Erreur" ou dont le format est invalide :

```python
if len(parts) < 2 or "Erreur" in parts[0]:
    continue
```

### 3.8 Flux end-to-end validé

**[CAPTURE D'ÉCRAN — Log du script mqtt.py montrant les publications]**

**[CAPTURE D'ÉCRAN — Dashboard montrant les données IoT en temps réel]**

---

## 4. Plans de tests et résultats

### 4.1 Stratégie de tests

| Niveau | Outil | Périmètre |
|--------|-------|-----------|
| Tests unitaires | Jest (Node.js) | Règles métier, seuils, FIFO, HTTP |
| Tests d'intégration | Script shell + curl | Health checks API en conteneur |
| Tests API | Postman | Endpoints REST (lots, mesures, alertes) |
| Tests end-to-end | Manuel | IoT → MQTT → BDD → API → Frontend |

### 4.2 Tests unitaires — Backend pays (26 tests)

**Commande :** `npm test` dans `backend-pays/`

| Suite | Tests | Résultat |
|-------|-------|---------|
| `alertes.test.js` | 9 tests — seuils IoT par pays | ✅ PASS |
| `mesures.test.js` | 6 tests — GET/POST mesures, hors plage | ✅ PASS |
| `fifo.test.js` | 3 tests — tri FIFO par date_stockage | ✅ PASS |
| `lots.test.js` | 8 tests — CRUD lots, statuts, health | ✅ PASS |

**Résultats :** 26/26 tests passent en 3.5s

**[CAPTURE D'ÉCRAN — Résultat npm test backend-pays avec les 26 tests verts]**

#### Cas de test clés — Seuils IoT

| Cas | Pays | Entrée | Attendu | Résultat |
|-----|------|--------|---------|---------|
| Conditions idéales Brésil | Brésil | 29°C / 55% | `ok: true` | ✅ |
| Limite haute acceptable | Brésil | 32°C / 57% | `ok: true` | ✅ |
| Température trop haute | Brésil | 33°C / 55% | `tempOk: false` | ✅ |
| Humidité trop basse | Brésil | 29°C / 52% | `humOk: false` | ✅ |
| Conditions idéales Équateur | Équateur | 31°C / 60% | `ok: true` | ✅ |
| Température trop basse | Équateur | 27°C / 60% | `tempOk: false` | ✅ |
| Conditions idéales Colombie | Colombie | 26°C / 80% | `ok: true` | ✅ |
| Humidité trop haute | Colombie | 26°C / 83% | `humOk: false` | ✅ |
| Pays inconnu | — | n/a | `ok: false` | ✅ |

#### Cas de test clés — Logique FIFO

| Cas | Données | Attendu | Résultat |
|-----|---------|---------|---------|
| Tri lots par date ASC | 3 lots à dates différentes | Plus ancien en premier | ✅ |
| Liste vide | 0 lots | Tableau vide | ✅ |
| Lot unique | 1 lot | Tableau d'un élément | ✅ |

### 4.3 Tests unitaires — Backend siège (12 tests)

**Commande :** `npm test` dans `siege/api/`

| Suite | Tests | Résultat |
|-------|-------|---------|
| `siege.test.js` | 12 tests — agrégation, résilience, routes | ✅ PASS |

**Résultats :** 12/12 tests passent en 2.8s

**[CAPTURE D'ÉCRAN — Résultat npm test siege avec les 12 tests verts]**

#### Cas de test clés — Résilience siège

| Cas | Simulation | Attendu | Résultat |
|-----|-----------|---------|---------|
| Tous les pays disponibles | axios mock → 200 | 3 pays OK | ✅ |
| Un pays en timeout | axios mock → timeout | Réponse partielle 2/3 | ✅ |
| Un pays ECONNREFUSED | axios mock → ECONNREFUSED | Réponse partielle 2/3 | ✅ |
| Pays inconnu dans l'URL | `GET /siege/stocks/france` | 404 | ✅ |
| Route inconnue | `GET /siege/inconnu` | 404 + message + lien /docs | ✅ |

### 4.4 Tests d'intégration — Health checks CI

**Commande :** `bash test-cicd/health-check.sh`

**[CAPTURE D'ÉCRAN — Console Jenkins build #7 — stage Tests integration PASS]**

| Service | Endpoint | Résultat CI |
|---------|----------|-------------|
| bresil-api | `GET /health` | ✅ PASS |
| equateur-api | `GET /health` | ✅ PASS |
| colombie-api | `GET /health` | ✅ PASS |
| siege-api | `GET /health` | ✅ PASS |

### 4.5 Tests API — Collection Postman

**Fichier :** `backend-pays/postman/FutureKawa.postman_collection.json`

**[CAPTURE D'ÉCRAN — Collection Postman avec les requêtes et résultats]**

| Groupe | Requêtes | Scénarios testés |
|--------|----------|-----------------|
| Health | 1 | GET /health → 200 |
| Lots Brésil | 10 | POST (création), PUT (statut), GET (liste FIFO, détail) |
| Lots Équateur | 8 | Idem Équateur |
| Lots Colombie | 10 | Idem Colombie |
| Mesures | 3 | GET /mesures/:entrepot par pays |
| Siège | 3 | GET /siege/stocks, /siege/stocks?pays=bresil, /siege/alertes |

#### Cas de test FIFO

**Procédure :** Insérer 3 lots avec des dates différentes et vérifier l'ordre retourné.

```json
// POST LOT-BR-2024-001 — date: 2024-06-01
// POST LOT-BR-2025-007 — date: 2026-01-05
// POST LOT-BR-2024-042 — date: 2025-09-01

// GET /lots — résultat attendu (tri ASC date_stockage)
[
  { "id": "LOT-BR-2024-001", "date_stockage": "2024-06-01..." },
  { "id": "LOT-BR-2024-042", "date_stockage": "2025-09-01..." },
  { "id": "LOT-BR-2025-007", "date_stockage": "2026-01-05..." }
]
```

#### Cas de test alerte hors plage

**Procédure :** Le consumer MQTT reçoit une mesure hors seuil → vérifier la création d'une alerte et l'envoi email.

1. Publier sur `futurekawa/bresil/BR01/mesures` : `{"temp": 35, "hum": 54, "entrepot": "BR01"}`
2. `GET /alertes` → doit contenir une alerte `type: hors_plage`
3. Mailhog UI (`http://localhost:8025`) → doit contenir l'email d'alerte

**[CAPTURE D'ÉCRAN — Mailhog avec l'email d'alerte reçu]**

### 4.6 Tests end-to-end

**Scénario complet validé :**

1. Arduino branché, `mqtt.py` lancé ✅
2. Mesures publiées sur `futurekawa/bresil/BR01/mesures` ✅
3. Consumer insère en BDD (`mesures` table) ✅
4. Alerte créée si hors plage ✅
5. `GET /siege/stocks` retourne les lots ✅
6. `GET /siege/alertes` retourne les alertes ✅
7. Frontend affiche Dashboard + graphiques ✅

**[CAPTURE D'ÉCRAN — Frontend Dashboard avec données réelles]**

**[CAPTURE D'ÉCRAN — Page Stocks avec les lots en FIFO]**

**[CAPTURE D'ÉCRAN — Page Détail d'un lot avec courbes température/humidité]**

### 4.7 Anomalies rencontrées et corrections

| Anomalie | Cause | Correction |
|----------|-------|-----------|
| Route `/alertes` retournait les alertes des 3 pays pour chaque instance | Absence de filtre `WHERE e.pays = ?` | Ajout du filtre pays dans la requête |
| Bind mount `mosquitto.conf` échouait en CI | Docker socket : host ne trouve pas les fichiers du volume Jenkins | Config Mosquitto générée inline via `entrypoint` |
| Tests Jest : 3 tests échouaient | Mocks `pool.query` insuffisants (1 mock pour 3 appels) | Ajout des mocks manquants pour chaque appel query |
| Frontend montrait données des 3 pays pour une alerte BR01 | Enrichissement incorrect du pays dans le siège | Filtre par `r.pays` lors de la transformation de la réponse |

---

## 5. Pipeline CI/CD Jenkins

### 5.1 Architecture du pipeline

```
git push origin develop
        │
        ▼
Jenkins détecte le changement (pollSCM toutes les minutes)
        │
        ▼
┌─ Checkout ──────────────────────────────────────────────┐
│  Clone le repo à la révision du commit                   │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Prepare ───────────────────────────────────────────────┐
│  Copie le fichier .env.ci (credential Jenkins)           │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Build ─────────────────────────────────────────────────┐
│  docker compose build --no-cache (5 images)              │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Start ─────────────────────────────────────────────────┐
│  docker compose up -d (tous les services)                │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Health Checks ─────────────────────────────────────────┐
│  Attente (max 60s) que chaque API réponde                │
│  bresil-api / equateur-api / colombie-api / siege-api    │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Tests unitaires ───────────────────────────────────────┐
│  docker run bresil-api → npm test (26 tests)             │
│  docker run siege-api  → npm test (12 tests)             │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ Tests intégration ─────────────────────────────────────┐
│  health-check.sh → curl sur /health de chaque API        │
└──────────────────────────────────────────────────────────┘
        │
   ✅ succès ──► statut "jenkins/ci : success" → GitHub
   ❌ échec  ──► logs exportés + statut "jenkins/ci : failure"
        │
        ▼
┌─ Post (always) ─────────────────────────────────────────┐
│  docker compose down -v --remove-orphans                 │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Preuve d'exécution

**[CAPTURE D'ÉCRAN — Jenkins build #7 develop — Finished: SUCCESS]**

**[CAPTURE D'ÉCRAN — Console Output Jenkins — 26 tests verts backend-pays]**

**[CAPTURE D'ÉCRAN — Console Output Jenkins — 12 tests verts siège]**

**[CAPTURE D'ÉCRAN — Console Output Jenkins — Health Checks 4/4 PASS]**

**[CAPTURE D'ÉCRAN — GitHub PR avec badge jenkins/ci : success]**

**[CAPTURE D'ÉCRAN — Liste des branches Jenkins (FuturKawa) — develop et main verts]**

### 5.3 Particularités CI

**Docker socket pattern :** Jenkins tourne en conteneur et partage le socket Docker du host (`/var/run/docker.sock`). Les bind mounts de fichiers depuis le workspace Jenkins ne sont pas possibles car le daemon Docker du host ne peut pas résoudre les chemins internes au volume Jenkins. Solution : configuration Mosquitto générée inline via `entrypoint`.

**Isolation des builds :** Le `COMPOSE_PROJECT_NAME = "futurekawa-ci-${BUILD_NUMBER}"` garantit que chaque build crée ses propres réseaux et conteneurs, sans conflit avec la stack locale ou les builds parallèles.

---

## 6. Sécurité — OWASP API Top 10

| Risque OWASP | Mesure appliquée |
|--------------|-----------------|
| **API1 — Broken Object Level Authorization** | Chaque endpoint filtre par `pays` via variable d'environnement — impossible d'accéder aux données d'un autre pays |
| **API2 — Broken Authentication** | Pas d'authentification en v1 (démo locale). En production : JWT ou API key à ajouter |
| **API3 — Broken Object Property Level** | Les routes n'exposent que les champs nécessaires (pas de `SELECT *` non contrôlé) |
| **API4 — Unrestricted Resource Consumption** | Timeout 3s par pays côté siège. Limit paramètre sur `/mesures?limit=200` (max 500) |
| **API5 — Broken Function Level Authorization** | Pas de routes d'administration exposées |
| **API6 — Unrestricted Access to Sensitive Business Flows** | Identifiant unique de lot — doublon rejeté par contrainte UNIQUE BDD |
| **API7 — Server Side Request Forgery** | Le siège ne fait des requêtes qu'aux URLs configurées en `.env` — pas d'URL externe dynamique |
| **API8 — Security Misconfiguration** | CORS activé côté siège. Mosquitto en `allow_anonymous` uniquement en dev (à restreindre en production) |
| **API9 — Improper Inventory Management** | Swagger UI disponible sur `/docs` pour chaque API — documentation exhaustive des endpoints |
| **API10 — Unsafe Consumption of APIs** | Validation Pydantic / express.json() sur tous les body. Requêtes SQL paramétrées (pas de concaténation) |

**Points de vigilance production :**
- Activer l'authentification MQTT (username/password dans mosquitto.conf)
- Ajouter authentification JWT sur les APIs REST
- Restreindre CORS aux domaines autorisés
- Passer de SQLite à PostgreSQL pour la concurrence multi-processus

---

## 7. Schéma d'automatisation — Phase 2

### 7.1 Vision générale

La phase 2 vise à automatiser le contrôle des conditions de stockage : les capteurs déclenchent des actionneurs (climatisation, humidificateur, ventilation) en fonction des mesures et des règles métier.

```
[Capteurs IoT]                [Actionneurs]
  DHT22 (temp/hum)    ──→    Climatisation
  Capteur CO2         ──→    Ventilation
  Capteur lumière     ──→    Volets automatiques
        │                    Humidificateur
        ▼
  [Broker MQTT]
        │
        ▼
  [Moteur de décision]
  ┌─────────────────────────────────────┐
  │  Règles métier (seuils par pays)    │
  │  Priorités actionneurs              │
  │  Modes : auto / manuel / urgence    │
  └─────────────────────────────────────┘
        │
        ▼
  [API REST étendue]
  - État des actionneurs
  - Historique des actions
  - Mode de contrôle
        │
        ▼
  [Frontend étendu]
  - Tableau de bord actionneurs
  - Contrôle manuel
  - Journal des actions automatiques
```

### 7.2 Cas nominal — Conditions dans les seuils

**Situation :** Température et humidité dans les tolérances définies.

```
Mesure : temp=28°C, hum=54% (Brésil, seuil 29±3°C / 55±2%)
         → Dans les seuils → AUCUNE action

État actionneurs :
  Climatisation  : STANDBY
  Humidificateur : STANDBY
  Ventilation    : STANDBY
```

**Actions automatiques :** Aucune. Enregistrement de la mesure en BDD. Statut lot = `conforme`.

### 7.3 Cas dégradé — Température trop haute

**Situation :** Température dépasse le seuil maximum.

```
Mesure : temp=34°C, hum=55% (Brésil, max autorisé 32°C)
         → Hors seuil température

Actions automatiques (dans l'ordre) :
  1. Alerte email → responsable entrepôt (immédiat)
  2. Ventilation : ON (refroidissement passif)
  3. Attente 5 min → nouvelle mesure
  4. Si temp > 32°C : Climatisation : ON (puissance 50%)
  5. Attente 10 min → nouvelle mesure
  6. Si temp > 35°C : Climatisation : ON (puissance 100%) + alerte URGENCE

Statut lot : → en_alerte
```

### 7.4 Cas dégradé — Panne capteur

**Situation :** Aucune mesure reçue depuis X minutes.

```
Timeout capteur : aucune mesure depuis 10 minutes
         → Panne capteur suspectée

Actions automatiques :
  1. Alerte email : "Capteur BR01 hors ligne depuis 10 min"
  2. Maintien dernier état des actionneurs connu
  3. Passage en mode MANUEL forcé (sécurité)
  4. Notification sur le dashboard (bannière rouge)

Résolution :
  - Opérateur vérifie physiquement le capteur
  - Redémarrage manuel ou remplacement
  - Retour en mode AUTO via l'interface
```

### 7.5 Modes de fonctionnement

| Mode | Description | Déclenchement |
|------|-------------|---------------|
| **AUTO** | Actionneurs pilotés par les règles métier | Par défaut |
| **MANUEL** | Opérateur contrôle chaque actionneur via l'interface | Bouton interface / panne capteur |
| **URGENCE** | Tous les actionneurs au maximum, alerte immédiate | Dépassement seuil critique |

### 7.6 Sécurités

| Sécurité | Description |
|----------|-------------|
| Timeout capteur | Si aucune mesure depuis 10 min → mode MANUEL forcé |
| Seuil d'arrêt d'urgence | Température > 40°C → arrêt climatisation (risque condensation) |
| Redondance capteurs | En production, 2 capteurs par entrepôt (validation croisée) |
| Journalisation | Toutes les actions automatiques enregistrées avec timestamp et déclencheur |
| Mode manuel inviolable | En mode MANUEL, aucune règle auto ne peut changer l'état des actionneurs |

---

## 8. Questionnaire interview — Phase 2

*Ce questionnaire est destiné à cadrer le cahier des charges de la phase d'automatisation avec les responsables d'exploitation FutureKawa.*

---

**Objectifs et périmètre**

1. Quels sont les 3 principaux problèmes que l'automatisation doit résoudre en priorité (qualité, pertes, coût énergétique) ?

2. Sur quels entrepôts souhaitez-vous déployer l'automatisation en premier ? Dans quel délai ?

3. Y a-t-il des entrepôts avec des contraintes spécifiques (bâtiments anciens, accès réseau limité, réglementation locale) ?

---

**Actionneurs et matériel**

4. Quels actionneurs sont déjà présents dans les entrepôts (climatisation, ventilation, humidificateur) ? Sont-ils pilotables électroniquement ?

5. Disposez-vous d'un accès aux armoires électriques pour raccorder des relais de contrôle ?

6. Quel budget matériel est envisagé par entrepôt pour la phase 2 ?

---

**Seuils et règles métier**

7. Les seuils actuels (ex. 29°C ±3°C pour le Brésil) sont-ils validés par votre département qualité ? Peuvent-ils évoluer selon les variétés de café ou les saisons ?

8. Quelle tolérance de dépassement avant déclenchement d'un actionneur (immédiat ou après N minutes hors plage) ?

9. Comment gérez-vous aujourd'hui un pic de température en entrepôt (procédure manuelle) ?

---

**Sécurité et supervision**

10. En cas de panne du système automatisé, qui est responsable de la reprise manuelle et sous quel délai ?

11. Souhaitez-vous un mode de supervision centralisé au siège permettant de prendre la main à distance sur les actionneurs d'un pays ?

12. Quelles sont les contraintes réglementaires locales sur le contrôle automatisé des installations électriques (Brésil, Équateur, Colombie) ?

---

**Déploiement et formation**

13. Les équipes terrain ont-elles une formation technique suffisante pour maintenir des relais/automates ? Une formation est-elle envisageable ?

14. Quel niveau de connectivité réseau peut-on garantir dans les entrepôts (WiFi stable, GSM, Ethernet) ?

15. Quelle est la tolérance à l'indisponibilité du système automatisé (durée max acceptable sans supervision) ?

---

*Document rédigé dans le cadre du projet FutureKawa — MSPR Bloc 4 RNCP35584 — EPSI 2025-2026*
