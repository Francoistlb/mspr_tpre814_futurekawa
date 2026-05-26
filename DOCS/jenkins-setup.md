# Jenkins CI/CD — Guide de configuration

## Architecture

Jenkins tourne dans un conteneur Docker sur la machine du responsable CI.  
Il surveille le dépôt GitHub toutes les 5 minutes (polling) et déclenche automatiquement le pipeline à chaque nouveau commit.

```
git push origin develop
        │
        ▼
Jenkins détecte le changement (pollSCM)
        │
        ▼
Pipeline : Checkout → Build → Start → Health Checks → Tests
        │
   ✅ succès ──► statut "jenkins/ci : success" posté sur le commit GitHub
   ❌ échec  ──► statut "jenkins/ci : failure" + logs conservés
```

Les statuts apparaissent sur les Pull Requests GitHub, permettant de bloquer une PR si le CI échoue.

---

## Structure des fichiers

```
jenkins/
├── Dockerfile          # Image Jenkins + Docker CLI + Docker Compose
└── docker-compose.yml  # Service Jenkins (bind mount /var/jenkins_home)
Jenkinsfile             # Pipeline déclaratif (à la racine du projet)
```

---

## 1. Démarrer Jenkins

```bash
make up-jenkins
# ou directement :
docker compose -f jenkins/docker-compose.yml up --build -d
```

Attendre ~30 secondes puis ouvrir : **http://localhost:8080**

---

## 2. Déverrouiller Jenkins (première fois)

```bash
docker exec futurekawa-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Copier-coller ce mot de passe dans le navigateur.

---

## 3. Installer les plugins

Choisir **"Install suggested plugins"** et attendre.

---

## 4. Créer le credential GitHub

Nécessaire pour poster les statuts sur les commits (badge vert/rouge sur les PRs).

**Manage Jenkins → Credentials → System → Global → Add Credentials**

- Kind : **Secret text**
- Secret : token GitHub Classic (voir ci-dessous)
- ID : `github-token`
- Description : `GitHub status token`

### Créer le token GitHub Classic

GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**  
→ Generate new token (classic)
- Note : `jenkins-futurekawa`
- Scope : cocher **`repo`** (inclut `repo:status`)
- Generate → copier la valeur → coller dans le champ Secret

---

## 5. Créer le job Multibranch Pipeline

1. **New Item** → nom : `FutureKawa` → **Multibranch Pipeline** → OK

2. Section **Branch Sources** → Add source → **Git**
   - Repository URL : `https://github.com/Francoistlb/mspr_tpre814_futurekawa.git`
   - Credentials : laisser vide (repo public)

3. Section **Build Configuration**
   - Mode : `by Jenkinsfile`
   - Script Path : `Jenkinsfile`

4. **Save** → Jenkins scanne les branches automatiquement

---

## 6. Protéger la branche main sur GitHub

Pour bloquer les merges si le CI échoue :

1. GitHub → repo → **Settings → Branches → Add branch ruleset**
2. Target : `main`
3. Activer **"Require status checks to pass"**
4. Chercher et ajouter : `jenkins/ci`

> `jenkins/ci` apparaît dans la liste après le premier build complet.

---

## 7. Ce que fait le pipeline

| Stage | Action |
|-------|--------|
| Checkout | Clone le repo à la révision du commit |
| Build | `docker compose build --no-cache` |
| Start | `docker compose up -d` |
| Health Checks | `docker compose exec` sur chaque API — vérifie `/health` depuis l'intérieur du conteneur |
| Tests | Placeholder — à implémenter (Étape 7) |
| Post (always) | `docker compose down -v` — nettoyage systématique |
| Post (success/failure) | Poste le statut `jenkins/ci` sur le commit GitHub |

Les health checks utilisent `docker compose exec` (pas `localhost`) : le CI peut tourner même si la stack locale est active, sans conflit de ports.

---

## 8. Commandes utiles

```bash
# Démarrer Jenkins
make up-jenkins

# Arrêter Jenkins (sans perdre la config)
make down-jenkins

# Voir les logs Jenkins en temps réel
docker compose -f jenkins/docker-compose.yml logs -f

# Mot de passe initial
docker exec futurekawa-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

---

## 9. Dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| `docker: not found` | Image Jenkins sans Docker CLI | `make up-jenkins` (rebuild) |
| `port already allocated` | Stack locale sur le même port | Ne devrait plus arriver — ports supprimés du root compose |
| `Bad credentials` (GitHub API 401) | Token expiré ou invalide | Mettre à jour le credential `github-token` dans Jenkins |
| Health check timeout | API ne démarre pas | `docker compose -f jenkins/... exec bresil-api cat /proc/1/fd/1` |
| `jenkins/ci` absent de GitHub | Aucun build complet | Relancer manuellement depuis Jenkins |
