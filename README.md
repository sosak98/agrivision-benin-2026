# AgriVision Bénin

AgriVision transforme les résultats issus du drone, de WebODM et de QGIS en cartes, explications simples, recommandations localisées, historique et rapport.

## Démarrage local

```bash
python3 -m http.server 8000
```

Ouvrir ensuite `http://localhost:8000`.

## Pages

- `index.html` — tableau de bord
- `analyse.html` — import QGIS et vision future
- `resultats.html` — carte interactive
- `actions.html` — plan d’action durable
- `qualite.html` — qualité et limites
- `historique.html` — missions et graphe
- `ia.html` — assistant local et Groq facultatif
- `rapport.html` — rapport imprimable

## Déploiement

Consulter `DEPLOIEMENT.md`.

Configurations fournies :

- `render.yaml`
- `netlify.toml`
- manifeste PWA et service worker
- page hors ligne
- icônes d’application

## Capacités actuelles

- frontend statique sans backend ;
- PWA installable ;
- carte locale et recommandations vocales ;
- import GeoJSON web de moins de 3 Mo ;
- mise à jour locale du tableau de bord, de la carte, du plan d’action, de l’historique, de l’IA, de la qualité et du rapport ;
- historique conservé dans le navigateur ;
- assistant pédagogique local ;
- Groq facultatif avec clé temporaire ;
- reconnaissance vocale selon le navigateur.

## Limites

- WebODM et QGIS ne sont pas exécutés par le frontend ;
- les données ne sont pas synchronisées entre appareils ;
- OpenStreetMap, Groq et parfois la dictée vocale nécessitent Internet ;
- la suppression des données du navigateur peut effacer l’historique local ;
- le GeoJSON scientifique complet doit être conservé séparément.
