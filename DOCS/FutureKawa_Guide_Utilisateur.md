# FutureKawa — Guide utilisateur
### Système de suivi des stocks de café vert

---

**Version** : 1.0  
**Date** : Juin 2026  
**Destinataires** : Responsables d'entrepôt · Direction siège

---

## À qui s'adresse ce guide ?

Ce document est destiné aux équipes terrain et à la direction. Il explique comment utiliser l'interface de suivi des stocks de café vert **sans connaissance technique particulière**.

Deux types d'utilisateurs sont concernés :

| Profil | Rôle | Pages utilisées |
|--------|------|-----------------|
| **Responsable d'entrepôt** | Consulte les stocks et conditions de son pays. Reçoit les emails d'alerte et prend les décisions terrain. | Tableau de bord, Stocks, Détail d'un lot, Alertes |
| **Direction siège** | Supervise l'ensemble des pays. Identifie les lots à risque et les tendances globales. | Tableau de bord, Alertes |

---

## 1. Accéder à l'interface

Ouvrez votre navigateur (Chrome, Firefox, Edge) et saisissez l'adresse fournie par votre responsable informatique.

L'interface s'affiche directement sans identifiant ni mot de passe.

> **Recommandation** : utilisez un écran d'au moins 10 pouces (tablette ou ordinateur). L'interface s'adapte à la taille de votre écran.

---

## 2. Tableau de bord

Le tableau de bord est la **première page** qui s'affiche. Il donne une vue d'ensemble de tous les pays en un coup d'œil.

### 2.1 Indicateurs clés (chiffres en haut de page)

| Indicateur | Ce qu'il signifie |
|------------|-------------------|
| **Lots en stock** | Nombre total de lots présents dans tous les entrepôts |
| **Lots en alerte** | Lots dont les conditions de stockage sont hors des limites acceptables |
| **Lots périmés** | Lots stockés depuis plus de 365 jours (à expédier en priorité) |
| **Alertes actives** | Nombre total d'alertes générées par le système |

Un indicateur affiché en **orange** signale un point de vigilance. En **rouge**, une action est requise.

### 2.2 Cartes par pays

Chaque carte correspond à un pays (Brésil, Équateur, Colombie). Elle affiche :

- Le nombre d'entrepôts et de lots
- Les conditions idéales de ce pays (température et humidité cibles)
- L'**état général** :
  - 🟢 **Conditions nominales** — tout est dans les normes
  - 🟡 **Lot(s) en alerte** — des conditions hors plage ont été détectées
  - 🔴 **Lot(s) périmés** — des lots dépassent la durée maximale de stockage

### 2.3 Graphiques IoT — Conditions en temps réel

En bas du tableau de bord, des graphiques affichent les relevés de température et d'humidité des capteurs installés dans les entrepôts.

**Comment lire les graphiques :**

- La **courbe principale** (colorée) représente la valeur mesurée au fil du temps
- La **ligne verte en pointillés** représente la valeur idéale pour ce pays
- Les **lignes rouges en pointillés** représentent les limites acceptables (seuils min et max)
- Toute valeur qui sort de la zone entre les lignes rouges est une anomalie

**Changer de pays :** cliquez sur les boutons **BR** (Brésil), **EQ** (Équateur) ou **CO** (Colombie) pour afficher les graphiques du pays souhaité.

### 2.4 Alertes récentes

La section du bas liste les 5 dernières alertes générées. Cliquez sur **"Voir tout →"** pour accéder à la page Alertes complète.

---

## 3. Page Stocks — La liste des lots

Accessible via le menu latéral : **"Stocks"**

### 3.1 Comprendre le tri FIFO

Les lots sont affichés **du plus ancien au plus récent** (du haut vers le bas du tableau). C'est la logique **FIFO** (Premier Entré, Premier Sorti) :

> Le lot en **haut du tableau** est celui qui doit être expédié en priorité.

Cette organisation garantit qu'aucun lot ne reste indéfiniment en entrepôt et qu'une expédition respecte toujours l'ordre d'arrivée.

### 3.2 Filtrer par pays

Utilisez le sélecteur en haut à droite de la page pour afficher uniquement les lots d'un pays spécifique :

- **Tous les pays** (par défaut)
- Brésil
- Équateur
- Colombie

### 3.3 Codes couleur des lignes

Chaque ligne du tableau indique l'état du lot grâce à une couleur de fond :

| Couleur | Statut | Signification |
|---------|--------|---------------|
| Fond blanc | ✅ **Conforme** | Conditions de stockage respectées |
| Fond orange | ⚠️ **En alerte** | Une anomalie de température ou d'humidité a été détectée |
| Fond rouge | ❌ **Périmé** | Le lot est stocké depuis plus de 365 jours |

### 3.4 Informations affichées

| Colonne | Signification |
|---------|---------------|
| **Lot** | Identifiant unique du lot |
| **Pays** | Pays d'origine |
| **Entrepôt** | Code et nom de l'entrepôt |
| **Date de stockage** | Date d'entrée en entrepôt |
| **Âge** | Nombre de jours depuis l'entrée en stock |
| **Statut** | Badge de couleur indiquant l'état |
| **Détail →** | Bouton pour consulter le détail complet du lot |

---

## 4. Page Détail d'un lot

Accessible en cliquant sur **"Détail →"** depuis la liste des stocks.

### 4.1 Informations générales

En haut de la page :
- Identifiant du lot et son statut actuel
- Pays et entrepôt de stockage
- Date d'entrée en entrepôt et âge en jours
- Notes éventuelles saisies à l'entrée

### 4.2 Graphiques de conditions (Température et Humidité)

Deux graphiques côte à côte montrent l'**historique des mesures** depuis l'entrée du lot dans l'entrepôt.

**Rappel des conditions idéales par pays :**

| Pays | Température idéale | Humidité idéale | Tolérance |
|------|--------------------|-----------------|-----------|
| Brésil | 29°C | 55 % | ±3°C / ±2 % |
| Équateur | 31°C | 60 % | ±3°C / ±2 % |
| Colombie | 26°C | 80 % | ±3°C / ±2 % |

**Comment lire les graphiques :**
1. L'axe horizontal représente le temps (dates)
2. L'axe vertical représente la valeur mesurée
3. Si la courbe dépasse les **lignes rouges**, les conditions sont hors plage → le lot peut être impacté
4. Passez la souris sur la courbe pour voir la valeur exacte à un moment précis

> **Important** : si les graphiques affichent "Aucune mesure IoT enregistrée", cela signifie que le capteur de cet entrepôt ne transmet pas encore de données. Contactez votre responsable technique.

### 4.3 Alertes liées au lot

En bas de page, la liste des alertes associées à ce lot est affichée avec :
- Le type d'alerte (conditions hors plage ou péremption)
- Le message détaillé
- La confirmation que l'email a bien été envoyé au responsable

---

## 5. Page Alertes

Accessible via le menu latéral : **"Alertes"**

### 5.1 Types d'alertes

| Type | Icône | Ce qui s'est passé |
|------|-------|-------------------|
| **Hors plage** | Badge orange | La température ou l'humidité de l'entrepôt a dépassé les limites acceptables |
| **Péremption** | Badge rouge | Un lot est stocké depuis plus de 365 jours sans avoir été expédié |

### 5.2 Filtres disponibles

- **Filtre Pays** : afficher uniquement les alertes d'un pays
- **Filtre Type** : afficher uniquement les alertes "Hors plage" ou "Péremption"
- Le nombre de résultats s'affiche automatiquement

### 5.3 Que faire en cas d'alerte ?

#### Alerte "Hors plage" (température ou humidité anormale)

1. **Vérifiez le lot concerné** (cliquez sur l'identifiant du lot pour voir les courbes)
2. **Évaluez la durée** : une anomalie ponctuelle est moins préoccupante qu'une dérive persistante
3. **Contactez le responsable de l'entrepôt** concerné
4. **Actions terrain possibles** :
   - Vérifier et ajuster le système de climatisation ou de ventilation
   - Inspecter physiquement les sacs de café concernés
   - Envisager le transfert vers un autre entrepôt si la dérive persiste
5. **Documentez la correction** dans les notes du lot

#### Alerte "Péremption" (lot > 365 jours)

1. **Identifiez le lot** dans la liste des stocks
2. **Préparez l'expédition en priorité** — ce lot doit partir avant les lots plus récents (logique FIFO)
3. **Informez l'acheteur** si le lot est déjà vendu ou réservé
4. Le lot passera automatiquement au statut **"Périmé"** dans l'interface

### 5.4 Colonne "Email"

| Indicateur | Signification |
|------------|---------------|
| ✅ **Envoyé** | Un email a été automatiquement envoyé au responsable de l'entrepôt au moment de l'alerte |
| ⏳ **En attente** | L'email n'a pas encore pu être envoyé (vérifiez la connexion réseau) |

---

## 6. Emails d'alerte automatiques

Lorsqu'une anomalie est détectée, le système envoie automatiquement un email au responsable de l'entrepôt concerné.

### Contenu d'un email d'alerte

**Objet** : `[ALERTE] Conditions hors seuils — BR01`

**Corps du message** :
```
Entrepôt : BR01 (Entrepôt São Paulo)
Température : 33.1°C (idéal : 29°C ±3°C)
Humidité : 58.4 % (idéal : 55 % ±2 %)
```

**Objet** : `[ALERTE] Lot périmé — LOT-BR-2024-001`

```
Le lot LOT-BR-2024-001 (entrepôt BR01 — Entrepôt São Paulo)
est stocké depuis plus de 365 jours.
```

### Que faire à la réception d'un email d'alerte ?

1. Consultez la page **Alertes** de l'interface pour voir le détail
2. Accédez au **détail du lot** concerné pour visualiser les courbes
3. Suivez la procédure décrite en section 5.3

---

## 7. Créer un nouveau lot

Lorsqu'un nouveau lot de café vert arrive dans un entrepôt, il doit être enregistré dans le système.

> **Note** : l'enregistrement d'un lot se fait actuellement via l'outil informatique de saisie fourni par votre responsable (collection Postman ou interface d'administration). Contactez votre responsable informatique pour effectuer cette opération.

**Informations nécessaires à la création d'un lot :**

| Champ | Description | Exemple |
|-------|-------------|---------|
| Identifiant du lot | Code unique attribué à la livraison | `LOT-BR-2025-042` |
| Code entrepôt | Entrepôt de stockage | `BR01` |
| Date de stockage | Date d'arrivée physique | `2025-09-15` |
| Notes | Informations complémentaires (variété, récolte…) | `Arabica Fazenda Norte — récolte 2025` |

---

## 8. Foire aux questions (FAQ)

### "Le lot que je viens d'enregistrer n'apparaît pas dans la liste"

- Attendez quelques secondes et **rechargez la page** (touche F5 ou bouton de rafraîchissement du navigateur)
- Vérifiez que le **filtre pays** n'est pas activé sur un autre pays
- Confirmez avec votre responsable informatique que l'enregistrement a bien été effectué

### "Les courbes de température et d'humidité sont vides"

- Cela signifie que le capteur de l'entrepôt concerné **ne transmet pas encore de données**
- Ce n'est pas un dysfonctionnement de l'interface mais du capteur physique
- Signalez-le à votre responsable technique

### "Je reçois trop d'emails d'alerte"

- Si les alertes correspondent à des anomalies réelles, **les conditions de l'entrepôt doivent être corrigées** (climatisation, ventilation)
- Si le système génère des fausses alertes (températures correctes mais alerte quand même), signalez-le à votre responsable informatique pour ajuster les seuils

### "Le tableau de bord indique un lot périmé mais il a été expédié"

- Le statut doit être mis à jour dans le système après l'expédition
- Contactez votre responsable informatique pour effectuer la mise à jour

### "La page ne charge pas / affiche 'Erreur'"

- Vérifiez votre connexion internet
- Attendez quelques secondes et rechargez la page
- Si le problème persiste après 5 minutes, contactez votre responsable informatique

### "Les données affichées ne correspondent pas à la réalité terrain"

- Les capteurs transmettent les données toutes les 30 secondes environ
- Un décalage de quelques minutes est normal
- Si le décalage dépasse 1 heure, le capteur est peut-être hors ligne : signalez-le

---

## 9. Contacts en cas de problème

| Problème | À contacter |
|----------|-------------|
| Conditions anormales dans l'entrepôt | Responsable technique de l'entrepôt |
| Lot périmé à expédier | Responsable logistique |
| Interface inaccessible ou données incorrectes | Responsable informatique |
| Question sur le contenu d'une alerte | Responsable d'exploitation du pays |

---

## 10. Glossaire

| Terme | Définition |
|-------|-----------|
| **Lot** | Unité de café vert identifiée par un code unique, entrée à une date précise dans un entrepôt |
| **FIFO** | "Premier Entré, Premier Sorti" — le lot le plus ancien est expédié en priorité |
| **Entrepôt** | Lieu physique de stockage du café vert (ex. : BR01 = Entrepôt São Paulo, Brésil) |
| **Hors plage** | Se dit d'une mesure de température ou d'humidité qui dépasse les limites acceptables |
| **Périmé** | Se dit d'un lot stocké depuis plus de 365 jours |
| **Seuil** | Valeur limite de température ou d'humidité à ne pas dépasser pour garantir la qualité du café |
| **Capteur IoT** | Dispositif électronique installé dans l'entrepôt qui mesure automatiquement la température et l'humidité |
| **Alerte** | Notification générée automatiquement lorsqu'une anomalie est détectée (email + enregistrement dans l'interface) |

---

*Document généré dans le cadre du projet FutureKawa — MSPR Bloc 4 RNCP35584 — EPSI 2025-2026*
