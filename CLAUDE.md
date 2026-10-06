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

## Indépendance
- Version de Lucas, séparée de celle de Dylan depuis le 6 octobre 2026 (dépôt, Netlify et serveur multijoueur). Ne jamais remettre l'ancien serveur Supabase commun (`zbtoknbzwvbryxmoudcl`).

## Déploiement
- Site Netlify : https://startling-kheer-17da0d.netlify.app
- Chaque push sur `main` redéploie automatiquement le site. Pas d'étape de build.
- Le dépôt GitHub fait foi : on ne déploie plus par ZIP. Avant de travailler, faire `git pull` pour partir de la dernière version.

## Tests
    npm i --no-save jsdom
    for t in tests/tests*.js; do node "$t" || echo "ÉCHEC : $t"; done

Tous les tests doivent passer avant chaque push.
