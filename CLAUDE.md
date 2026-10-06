# Jimee — consignes pour Claude

Lire **JIMEE-RECAP.md** en entier avant toute modification : c'est le document de référence (règles de travail, systèmes, constantes, historique des versions).

## Organisation du dépôt
- Les fichiers du jeu sont à la **racine** du dépôt (`index.html`, `sw.js`, `manifest.webmanifest`, images, `planetes/`).
- `tests/` : tests automatiques (non servis aux joueurs).
- `serveur/` : script SQL Supabase du mode multijoueur (non servi aux joueurs).
- `netlify.toml` : réglages de publication.
- `polices/` : polices du thème cartoon, hébergées avec le jeu.
- `decors/` : décors en SVG, générés par `outils/decors.py` (modifier le script, puis le relancer).
- `DIRECTION-ARTISTIQUE.md` : style graphique, palette, consignes pour les images encore à refaire (planètes).

## Jimee 2 (nouvelle version, en cours)
- Jeu à part dans `jimee2/` (servi à `/jimee2/`), sauvegarde séparée (`jimee2-sauvegarde`). Conception : `jimee2/CONCEPTION.md`.
- Un seul fichier `jimee2/index.html` (style, page, script). Toutes les valeurs d'équilibrage sont dans `CONFIG` en tête du script.
- Réutilise les polices (`../polices/`), les images de planètes (`../planetes/`) et le fond `../decors/carte.svg`.
- Tests : `tests/tests-j2.js` (inclus dans la boucle ci-dessous).

## Indépendance
- Version de Lucas, séparée de celle de Dylan depuis le 6 octobre 2026 (dépôt, Netlify et serveur multijoueur). Ne jamais remettre l'ancien serveur Supabase commun (`zbtoknbzwvbryxmoudcl`).

## Déploiement
- Le jeu est publié par **GitHub Pages** (gratuit, sans crédits) depuis la branche `main`, racine du dépôt :
  - Jimee 1 : https://lucasboul-dev.github.io/jimme/
  - Jimee 2 : https://lucasboul-dev.github.io/jimme/jimee2/
- Chaque push sur `main` republie le site en une minute environ. Pas d'étape de build. Le fichier `.nojekyll` empêche GitHub de transformer les pages : ne pas le supprimer.
- **Netlify n'est plus utilisé** (6 octobre 2026) : les publications y sont arrêtées (« Stopped builds ») pour ne plus consommer de crédits. L'ancienne adresse https://startling-kheer-17da0d.netlify.app reste figée. `netlify.toml` n'est plus lu par GitHub Pages.
- Le dépôt GitHub fait foi. Avant de travailler, faire `git pull` pour partir de la dernière version.

## Tests
    npm i --no-save jsdom
    for t in tests/tests*.js; do node "$t" || echo "ÉCHEC : $t"; done

Tous les tests doivent passer avant chaque push.
