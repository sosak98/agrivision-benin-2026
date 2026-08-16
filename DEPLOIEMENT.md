# Déploiement d’AgriVision Bénin

## 1. Vérification locale

```bash
python3 -m http.server 8000
```

Ouvrir `http://localhost:8000` puis tester toutes les pages.

## 2. Déploiement gratuit sur Render

### Avec GitHub

1. Créer un dépôt GitHub.
2. Placer **le contenu** du dossier `agrivision-benin` à la racine du dépôt.
3. Envoyer les fichiers sur GitHub.
4. Sur Render : **New + → Blueprint**.
5. Sélectionner le dépôt contenant `render.yaml`.
6. Valider la création du site statique.
7. Attendre le déploiement puis ouvrir l’URL HTTPS.

Le fichier `render.yaml` configure le dossier de publication et les principaux en-têtes.

### Mise à jour de l’ancien site Render

Si le site `agrivision-benin.onrender.com` existe déjà, remplacer les anciens fichiers dans son dépôt GitHub par ceux de cette livraison puis lancer **Manual Deploy → Deploy latest commit**.

## 3. Déploiement gratuit sur Netlify

Méthode simple :

1. Extraire le ZIP.
2. Ouvrir Netlify Drop.
3. Déposer le dossier `agrivision-benin`.
4. Netlify publie le site en HTTPS.

Le fichier `netlify.toml` contient la configuration statique et les en-têtes.

## 4. GitHub Pages

1. Envoyer le dossier sur GitHub.
2. Ouvrir **Settings → Pages**.
3. Choisir **Deploy from a branch**.
4. Sélectionner la branche principale et le dossier `/root`.

Les chemins du projet sont relatifs et compatibles avec un sous-dossier GitHub Pages.

## 5. Installation comme application PWA

Après déploiement HTTPS :

### Android / Chrome

- ouvrir le site ;
- toucher **Installer AgriVision** ou le menu du navigateur ;
- choisir **Installer l’application** ou **Ajouter à l’écran d’accueil**.

### Ordinateur / Chrome ou Edge

- ouvrir le site ;
- cliquer sur l’icône d’installation dans la barre d’adresse ;
- confirmer.

### iPhone / iPad

- ouvrir le site dans Safari ;
- toucher **Partager** ;
- choisir **Sur l’écran d’accueil**.

Cette PWA reprend le même code et les mêmes fonctions que le site. Elle ne nécessite pas de Play Store ni d’App Store.

## 6. Création éventuelle d’un APK Android

Une fois la PWA publique et validée :

- utiliser un outil de packaging PWA/TWA tel que PWABuilder ou Bubblewrap ;
- fournir l’URL HTTPS et le manifeste ;
- générer un paquet Android ;
- tester l’APK sur plusieurs téléphones.

Le packaging peut être gratuit, mais publier sur Google Play peut nécessiter un compte développeur payant. L’APK n’ajoute pas de backend : il conserve les mêmes capacités et limites que le site.

## 7. Fonctions hors ligne

Après une première ouverture en ligne, le service worker met en cache :

- pages principales ;
- styles et scripts ;
- carte locale ;
- assistant local ;
- recommandations et rapport ;
- icônes PWA.

Restent dépendants d’Internet :

- OpenStreetMap ;
- Groq ;
- parfois la reconnaissance vocale ;
- première installation et mises à jour.

## 8. Import QGIS

- utiliser une copie GeoJSON simplifiée de moins de 3 Mo ;
- conserver le fichier scientifique complet séparément ;
- les données importées restent dans le navigateur ;
- elles ne sont pas synchronisées entre appareils ;
- vider les données du navigateur peut supprimer l’historique local.

## 9. Checklist avant mise en ligne

- [ ] Tester toutes les pages en HTTPS.
- [ ] Tester l’installation PWA.
- [ ] Ouvrir toutes les pages une fois puis tester hors ligne.
- [ ] Importer le GeoJSON de démonstration.
- [ ] Vérifier la carte, l’historique, le graphe, l’IA et le rapport.
- [ ] Tester Chrome/Edge sur PC et Chrome sur Android.
- [ ] Vérifier les permissions du microphone.
- [ ] Utiliser uniquement une clé Groq temporaire et limitée.
- [ ] Ne jamais présenter la mission J+7 simulée comme réelle.
