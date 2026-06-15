# FutureKawa — Documentation de lancement

**MSPR Bloc 4 — RNCP35584 — EPSI 2025-2026**

Ce document décrit les procédures de démarrage, de test et d'arrêt de la solution FutureKawa dans différents contextes (démo, développement, CI/CD).

---

## 1. Prérequis

| Outil | Rôle | Installation |
|-------|------|-------------|
| **Docker Desktop** | Conteneurisation | https://docs.docker.com/get-docker/ |
| **Git Bash** (Windows) | Scripts shell | Inclus avec Git for Windows |
| **Python 3.10+** | Script IoT (`mqtt.py`) | https://www.python.org/downloads/ |
| **paho-mqtt** | Librairie MQTT Python | `pip install paho-mqtt pyserial` |

Vérification de l'environnement :
```bash
docker --version          # Docker version 24+
docker compose version    # Docker Compose v2+
python3 --version         # Python 3.10+
git --version             # Git 2.40+
```

---

## 2. Première installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Francoistlb/mspr_tpre814_futurekawa.git
cd mspr_tpre814_futurekawa

# 2. Le fichier .env est déjà configuré pour la démo locale
#    (SMTP → MailHog, emails de test, ports par défaut)
#    Si besoin d'ajuster : éditer .env

# 3. Construire et démarrer toute la solution
docker compose --env-file .env up --build -d
```

> La construction prend environ **2 à 5 minutes** lors du premier lancement (téléchargement des images, installation des dépendances npm).

---

## 3. Vérification du démarrage

```bash
bash test-cicd/health-check.sh
```

Résultat attendu :
```
===== FutureKawa — Health Check CI =====

  bresil-api (/health:3000)    PASS  {"status":"ok","pays":"bresil"}
  equateur-api (/health:3000)  PASS  {"status":"ok","pays":"equateur"}
  colombie-api (/health:3000)  PASS  {"status":"ok","pays":"colombie"}
  siege-api (/health:8000)     PASS  {"status":"ok","service":"siege",...}

========================================
  Resultats : 4 PASS  |  0 FAIL
  Tous les services sont operationnels.
========================================
```

Si un service est en FAIL, attendre 15-30 secondes et relancer (les conteneurs peuvent encore démarrer).

---

## 4. Accès aux interfaces

| Interface | URL | Identifiants |
|-----------|-----|-------------|
| **Frontend web** | http://localhost:3000 | Aucun |
| **Swagger API Siège** | http://localhost:8000/docs | Aucun |
| **Swagger API Brésil** | http://localhost:8001/docs | Aucun |
| **Swagger API Équateur** | http://localhost:8002/docs | Aucun |
| **Swagger API Colombie** | http://localhost:8003/docs | Aucun |
| **MailHog** (emails) | http://localhost:8025 | Aucun |

---

## 5. Démo complète (données + alertes)

Pour une démonstration avec des données réalistes :

```bash
# Démo en une commande (lots + alertes péremption + simulation Arduino)
bash test-cicd/demo.sh

# Ou étape par étape :
bash test-cicd/seed-lots.sh      # Étape 1 : insère 30 lots (récents, anciens, périmés)
bash test-cicd/demo.sh           # Étape 2 : alertes + simulation continue
```

La démo insère automatiquement :
- **9 lots périmés** (> 365 jours) → emails péremption déclenchés
- **12 lots anciens** (6-12 mois) → affichés comme "Conformes" ou "En alerte"
- **9 lots récents** (< 3 mois) → affichés comme "Conformes"

Emails visibles sur **http://localhost:8025** après la démo.

---

## 6. Module IoT — Arduino

### 6.1 Câblage Arduino + DHT22

```
DHT22 VCC  → Arduino 5V
DHT22 GND  → Arduino GND
DHT22 DATA → Arduino Pin 2 (+ résistance 10kΩ entre DATA et 5V)
Arduino    → PC via câble USB
```

### 6.2 Configuration du script (`scripts_mqtt/mqtt.py`)

Éditer les 4 premières variables :

```python
SERIAL_PORT = "COM3"      # Windows : vérifier dans Gestionnaire de périphériques
                          # Mac/Linux : /dev/cu.usbmodem... ou /dev/ttyUSB0
MQTT_PORT   = 1883        # Brésil:1883 | Équateur:1884 | Colombie:1885
PAYS        = "bresil"    # bresil | equateur | colombie
ENTREPOT    = "BR01"      # BR01/BR02 | EQ01/EQ02 | CO01/CO02
```

### 6.3 Lancement

```bash
# S'assurer que la stack Docker est démarrée, puis :
python3 scripts_mqtt/mqtt.py
```

Sortie attendue :
```
Lecture série sur COM3...
MQTT connecté (0) — topic : futurekawa/bresil/BR01/mesures
Publié → futurekawa/bresil/BR01/mesures : {"entrepot": "BR01", "temp": 28.5, "hum": 54.2, "ts": "..."}
Publié → futurekawa/bresil/BR01/mesures : {"entrepot": "BR01", "temp": 28.6, "hum": 54.1, "ts": "..."}
```

Les données apparaissent dans le frontend en temps réel (< 5 secondes).

### 6.4 Trouver le port série (Windows)

1. Brancher l'Arduino
2. Ouvrir le **Gestionnaire de périphériques** → *Ports (COM et LPT)*
3. Repérer "Arduino UNO (COM**X**)" → utiliser `"COM**X**"` dans le script

---

## 7. Tests unitaires

```bash
# Tests backend pays (26 tests)
docker compose --env-file .env exec -T bresil-api npm test

# Tests backend siège (12 tests)
docker compose --env-file .env exec -T siege-api npm test
```

Résultat attendu : **26/26** et **12/12** tests verts.

---

## 8. Jenkins CI/CD

```bash
# Démarrer Jenkins (isolé — ne pas confondre avec la stack principale)
docker compose -f jenkins/docker-compose.yml up -d

# Accès : http://localhost:8080
# Le pipeline se déclenche automatiquement sur push vers develop ou main
# Ou manuellement via "Build Now" dans l'interface Jenkins
```

**Etapes du pipeline :**

| Stage | Action |
|-------|--------|
| Checkout | Clone le repo à la révision du commit |
| Prepare | Récupère le fichier `.env.ci` (credential Jenkins) |
| Build | `docker compose build --no-cache` |
| Start | `docker compose up -d` |
| Health Checks | Attente que les 4 APIs répondent (max 60s) |
| Tests unitaires | `npm test` backend-pays (26) + siège (12) |
| Tests intégration | `bash test-cicd/health-check.sh` |
| Post | `docker compose down -v` (nettoyage) |

---

## 9. Arrêt de la solution

```bash
# Arrêt simple (données conservées)
docker compose --env-file .env down

# Arrêt + suppression des données (volumes)
docker compose --env-file .env down -v

# Vérifier que tous les conteneurs sont arrêtés
docker ps
```

---

## 10. Résolution des problèmes courants

| Problème | Cause probable | Solution |
|----------|---------------|---------- |
| Port 3000 déjà utilisé | Autre application | `docker compose down` puis changer `FRONTEND_PORT` dans `.env` |
| `health-check.sh` : FAIL au démarrage | Conteneurs pas encore prêts | Attendre 30s et relancer |
| MailHog vide après `seed-alertes.sh` | Conteneur MailHog non démarré | `docker compose up -d mailhog` |
| Script `.sh` : `$'\r': command not found` | Fins de ligne Windows (CRLF) | `sed -i 's/\r//' script.sh` |
| Arduino non reconnu (port série) | Driver manquant | Installer driver CH340 ou FTDI |
| `mqtt.py` : erreur de connexion MQTT | Stack Docker non démarrée | Lancer `docker compose up -d` d'abord |

---

*FutureKawa — MSPR Bloc 4 RNCP35584 — EPSI 2025-2026*
