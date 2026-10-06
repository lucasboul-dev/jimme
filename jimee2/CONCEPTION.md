# Jimee 2 — document de conception

> « Fallout Shelter dans une fusée, avec des cartes à la Reigns pendant les missions, et une Corp qui transforme chaque mort en argument de vente. »
> Version de Lucas (6 octobre 2026). Jeu dans `jimee2/index.html`, servi à `/jimee2/`, sauvegarde séparée (`jimee2-sauvegarde`). Tests : `tests/tests-j2.js`.

## 1. La boucle

1. **Dans la fusée** (sessions de 1 à 3 minutes) : toucher les pièces pour récolter, affecter les Jimees aux pièces, construire et améliorer, équiper, soigner.
2. **En mission** : choisir une planète sur le chemin de la galaxie, une équipe d'un ou deux Jimees, et décoller.
3. **Pendant la mission** : trois **transmissions** arrivent en temps réel. Chacune est une carte avec deux choix (glisser à gauche ou à droite). Sans réponse avant la transmission suivante, le Jimee décide seul, selon sa personnalité.
4. **Au retour** : rapport animé, butin, expérience, étoiles. Ou une **affiche commémorative** de la Corp, et un cousin à recruter.

## 2. La fusée (Fallout Shelter)

- Fusée en coupe, vue de côté. En haut le **cockpit** (missions), en bas les **moteurs**. Entre les deux, des étages de **2 emplacements**.
- Pièces de départ : cockpit, guichet de la Corp, dortoir, cantine, réacteur. À construire : un deuxième dortoir, une infirmerie, un atelier, une deuxième cantine, un deuxième réacteur…
- Chaque pièce accueille **2 Jimees** et a **3 niveaux**.

| Pièce | Produit | Caractéristique utile |
|---|---|---|
| Réacteur | carburant ⛽ (missions) | muscles 💪 |
| Cantine | rations 🍞 (l'équipage mange) | jambes 🦵 |
| Atelier | gadgets (consomme de la ferraille ⚙) | cervelle 🧠 |
| Infirmerie | soigne les blessés | — |
| Dortoir | +2 places d'équipage | — |
| Guichet de la Corp | capsules, vente, mémorial | — |

- Production en temps réel, même app fermée. Un stock plafonné par pièce : quand il y a de quoi récolter, une bulle apparaît ; on la touche.
- L'équipage mange : 1 ration par Jimee toutes les 6 minutes. À zéro ration, les Jimees sont affamés (production divisée par deux, −1 à toutes les épreuves). Personne ne meurt de faim : la Corp a besoin de clients vivants.

## 3. L'équipage

- 3 caractéristiques, de 1 à 10 : **muscles**, **jambes**, **cervelle**.
- Une **personnalité** (téméraire, prudent, curieux, flemmard) : décide quand le joueur ne répond pas, et colore les répliques.
- Un **trait** (costaud, pied léger, petit génie, chanceux, increvable, gourmand, maladroit, bavard).
- Un **gadget** équipé (+1 à +3 à une caractéristique), fabriqué à l'atelier ou trouvé en mission.
- Un **niveau** (1 à 10) : +1 à une caractéristique à chaque niveau.
- **Blessé** : pas de mission tant qu'il n'est pas soigné (infirmerie, ou repos plus long ailleurs).

## 4. Les missions (Reigns)

- **Carte des galaxies** : un chemin de planètes de difficulté croissante (3 galaxies de 6 planètes). Chaque planète donne jusqu'à 3 étoiles : 1 = revenir vivant, 2 = au moins 2 transmissions réussies, 3 = les 3. Une étoile ouvre la planète suivante. La dernière planète d'une galaxie est un gardien.
- **Départ** : coûte du carburant. Durée réelle de 3 à 60 minutes selon la planète. Première mission guidée : 45 secondes.
- **Transmissions** : arrivent au quart, à la moitié et aux trois quarts de la durée. Chaque choix affiche la caractéristique testée, le risque (visage du Jimee) et le gain.
- **Résolution** : chance de réussite = 55 % + 12 points par point de caractéristique au-dessus de la difficulté (bornée de 5 à 97 %). Tirage déterministe (graine de la mission). Équipe de deux : la meilleure caractéristique +1.
- **Échec** : choix prudent = rien de grave ; normal = blessure ou butin perdu, rarement la mort ; risqué = blessure, et la mort possible (plus fréquente loin dans l'univers).

## 5. La Corp (la mort rentable)

- **Distributeur à capsules** au guichet : on tourne la manivelle, la capsule tombe et s'ouvre. Commun 75 %, rare 22 %, légendaire 3 %. Couleur et chapeau au hasard, à collectionner dans l'album.
- **À chaque mort** : la Corp imprime une **affiche commémorative** (« En hommage à Bimlou, tombé d'une falaise, profitez de −30 % sur son cousin »), rangée au **mémorial**.
- Le **cousin** (capsule hommage) hérite +1 dans la caractéristique qui a manqué au défunt. Chaque mort augmente aussi un peu ses chances d'être légendaire. La Corp vous nomme « client fidèle du deuil ».

## 6. Ce qui est repris de Jimee 1

Personnages (Jimee et représentant de la Corp), palette et polices cartoon, décors au trait, 11 biomes et leurs planètes, scène animée du rapport, bruitages rétro, humour de la Corp.

## 7. Ce qui n'est pas (encore) dans ce prototype

Mode à deux, contrats de la Corp, marché vivant, sets d'équipement, galaxies au-delà de 3. Les notifications app fermée passent par ntfy (comme Jimee 1), à régler dans les réglages.
