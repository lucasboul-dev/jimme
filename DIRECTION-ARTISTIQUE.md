# Jimee — direction artistique cartoon (V24)

> Guide pour refaire tous les décors avec ChatGPT dans le nouveau style. L'interface, le Jimee et le représentant de la Corp sont déjà dessinés dans le code ; il reste les **5 décors** et les **11 planètes**.

---

## 1. Le style en une phrase

Un dessin animé américain des années 1930 (style « rubber hose ») qui raconte de la science-fiction rétro : décors peints à la main, gros traits d'encre, couleurs chaudes un peu passées, grain de vieux film.

**Références à garder en tête** (sans jamais les citer à ChatGPT) : les jeux et dessins animés en style années 30, les illustrations pulp de science-fiction (fusées à ailerons, hublots ronds, rivets).

> Ne pas écrire « style Cuphead » ou « style Disney » dans les consignes : ChatGPT refuse souvent, ou copie de trop près un style protégé. Décrire le style, comme ci-dessous, donne un résultat à nous.

### Palette

| Rôle | Couleur | Code |
|---|---|---|
| Papier (fond) | crème | `#F4E7C8` |
| Encre (contours) | brun très foncé | `#221B16` |
| Corp | rouge brique | `#D63A2F` |
| Accent | moutarde | `#E9A93A` |
| Ciel de nuit | bleu ardoise | `#1F2A45` → `#3C5C8C` |
| Secondaires | bleu `#3F7CB8`, vert sauge `#5E9E4A`, sarcelle `#2F8F8B`, violet `#8A5AA8`, brun `#6E5B49` |

### Ce qui est déjà fait dans le jeu (ne pas le peindre dans les décors)
- **Le Jimee** et **le représentant de la Corp** : dessinés par le code d'après les croquis, animés.
- **Toutes les étiquettes et tous les boutons** (Armurerie, Cockpit, Hangar, Atelier, Commerce…) : dessinés par le code.
- **Les planètes sur la carte** : chaque planète est une image séparée (section 4) posée par le jeu.

---

## 2. Bloc « style » à coller au début de chaque demande

```
Style : dessin animé américain des années 1930 (« rubber hose »), décor peint à la main à l'aquarelle et à la gouache, contours à l'encre brun-noir épais et légèrement irréguliers, couleurs chaudes un peu passées (crème, rouge brique, moutarde, bleu ardoise, vert sauge, brun), ombres simples et douces, formes rondes et gonflées, perspective légèrement exagérée, objets qui ont du caractère (un peu bombés, un peu tordus). Science-fiction rétro façon pulp des années 30 : fusées à ailerons, hublots ronds, rivets, cuivre et laiton, cadrans à aiguille, tuyaux, ampoules. Léger grain de vieux film, bords de l'image légèrement assombris.
Interdit : aucun texte, aucune lettre, aucun chiffre, aucun logo, aucun panneau écrit ; aucun personnage ; pas de rendu 3D, pas de néons, pas d'hologrammes, pas d'écrans lumineux modernes.
```

**Conseils pour ChatGPT**
- Faire tous les décors **dans la même conversation**, et commencer chaque nouvelle demande par « même style exactement que l'image précédente ».
- Commencer par le vaisseau : c'est lui qui fixe le style des autres.
- Si un texte apparaît quand même sur l'image (ça arrive souvent), demander « refais la même image sans aucun texte ni lettre ».

---

## 3. Les 5 décors

**Format commun : portrait 1024 × 1536 pixels (2:3), JPG.** Les positions sont en pourcentage de l'image (0 % = bord gauche ou haut). Elles sont importantes : les zones à toucher du jeu sont posées dessus. Après l'intégration, Claude les remesure sur la nouvelle image, mais plus la composition est proche, moins il y a de travail.

### 3.1 `vaisseau.jpg` — l'écran d'accueil (le couloir du vaisseau)

```
[bloc style]
Intérieur d'une petite fusée rétro des années 30, vu depuis l'entrée d'un couloir étroit qui file droit vers le cockpit au fond. Image portrait 1024 × 1536.
- En haut (le premier quart de l'image) : plafond bombé avec rivets, tuyaux et lampes en forme d'ampoule.
- À gauche, au premier tiers de la hauteur : une grande armoire-vestiaire en métal riveté, porte entrouverte, une combinaison d'astronaute rétro et un casque rond à l'intérieur.
- Au fond, au centre : le cockpit, un fauteuil de pilote rembourré et un grand hublot rond qui montre l'espace étoilé et une planète.
- À droite de l'armoire, un peu plus loin : une carte du ciel mécanique (planétaire en laiton avec des planètes sur des bras, posé sur un socle).
- Tout à droite, à la même hauteur : un petit guichet de bureau en bois avec un auvent rouge brique, une sonnette de comptoir et une pile de formulaires (sans texte).
- À gauche, à mi-hauteur : une banquette rembourrée VIDE avec un coussin et une petite table basse avec une tasse.
- Le bas de l'image (le dernier cinquième) : le sol du couloir, simple et dégagé, sans objet important.
```

| Élément | Zone à respecter (x · y, en % de l'image) |
|---|---|
| Armoire (armurerie) | x 16-35 % · y 27-47 % |
| Cockpit et hublot | x 37-61 % · y 29-49 % |
| Carte du ciel (planétaire) | x 60-78 % · y 32-50 % |
| Guichet de la Corp | x 78-94 % · y 31-50 % |
| Banquette **vide** (le jeu y dessine le Jimee) | x 5-31 % · y 47-61 % |
| Sol libre (le jeu y pose Hangar / Atelier / Commerce) | y 78-92 % |

### 3.2 `hangar.jpg` — le hangar de maintenance

```
[bloc style]
Mur d'un atelier de hangar des années 30. Au centre, dans la moitié haute de l'image, un grand plan de construction punaisé au mur, façon cyanotype (papier bleu, traits blancs), qui montre une fusée rétro de profil. Autour de la fusée, 5 petits encadrés dessinés sur le même plan, chacun relié à la fusée par un trait : en haut à gauche une soute de fret (caisse), en haut à droite une antenne de radar, à gauche un réservoir de carburant rond, à droite un réacteur à tuyères, en bas à droite une plaque de blindage rivetée. Encadrés vides de texte. Dans la moitié basse, le sol du hangar avec la vraie fusée garée de trois quarts, des caisses, des bidons et une échelle. Image portrait 1024 × 1536.
```

| Élément | Zone (x · y) |
|---|---|
| Plan au mur (ensemble) | x 19-83 % · y 19-43 % |
| Encadré soute | x 22-36 % · y 20-26 % |
| Encadré antenne (scanner) | x 66-80 % · y 20-26 % |
| Encadré réservoir | x 20-33 % · y 34-41 % |
| Encadré réacteur | x 68-82 % · y 28-35 % |
| Encadré blindage (coque) | x 67-82 % · y 36-42 % |

Le bas de l'écran est couvert par la fiche du hangar : la fusée garée n'est visible qu'en partie.

### 3.3 `carte.jpg` — le fond de la carte stellaire

```
[bloc style]
Ciel de nuit peint à la gouache, bleu ardoise profond (du #1F2A45 au #3C5C8C), parsemé de petites étoiles crème en forme de croix à quatre branches et de points, une nébuleuse douce violette et sarcelle, quelques petits astéroïdes ronds dessinés aux bords. Le centre de l'image reste calme et assez vide. Aucune planète, aucun soleil. Image portrait 1024 × 1536.
```

Le jeu dessine par-dessus le soleil, les planètes et leurs noms : le fond doit rester discret.

### 3.4 `atelier.jpg` — l'atelier de fabrication

```
[bloc style]
Établi d'inventeur des années 30 dans un coin de fusée : panneau perforé avec clés, marteaux et engrenages accrochés, étau, lampe articulée allumée, bocaux de boulons, tuyaux de cuivre, plans roulés. Lumière chaude. Le plus intéressant doit se trouver dans le tiers haut de l'image. Image portrait 1024 × 1536.
```

Seul le tiers haut se voit vraiment : le reste est recouvert par la liste des recettes (fondu crème).

### 3.5 `marche.jpg` — le marché intergalactique

```
[bloc style]
Bazar spatial des années 30 sur un quai de station : étals avec auvents rayés rouge brique et crème, caisses, sacs, bocaux de minerais colorés qui brillent un peu, lampions ronds suspendus, une fusée amarrée au loin derrière une grande baie vitrée ronde. Pas de personnage. Le plus intéressant doit se trouver dans le tiers haut de l'image. Image portrait 1024 × 1536.
```

---

## 4. Les 11 planètes

**Format : carré 512 × 512 pixels, fond transparent (PNG), planète ronde centrée, diamètre ≈ 456 pixels (marge transparente tout autour).** Claude les convertit en WebP à l'intégration.

```
[bloc style, sans la phrase « aucun personnage »]
Une seule planète ronde vue de face, centrée, sur fond transparent, contour d'encre épais, couleurs plates à la gouache, ombre en croissant en bas à droite, petit reflet crème en haut à gauche. Pas de visage, pas d'anneau sauf si demandé. Image carrée 512 × 512, la planète occupe presque toute l'image avec une petite marge.
Planète : [description ci-dessous]
```

| Fichier | Biome | Description à mettre dans la consigne |
|---|---|---|
| `planetes/roche.webp` | Rocheux | planète brune et grise couverte de rochers, de cratères et de fissures |
| `planetes/ocean.webp` | Océanique | océan bleu avec quelques îles vertes et des nuages blancs en tourbillon |
| `planetes/jungle.webp` | Jungle | planète couverte de jungle vert profond avec des rivières sinueuses |
| `planetes/volcan.webp` | Volcanique | planète noire et rouge, coulées de lave orange, volcans fumants |
| `planetes/glace.webp` | Glacial | planète bleu pâle et blanche, banquises, crevasses, calottes de neige |
| `planetes/desert.webp` | Désert | planète ocre et sable, dunes, tempête de sable en spirale |
| `planetes/marecage.webp` | Marécage | planète vert olive et brun, mares, roseaux, brume jaunâtre |
| `planetes/cristal.webp` | Monde cristallin | planète violette hérissée de grands cristaux pointus |
| `planetes/ville.webp` | Ville morte | planète grise couverte de ruines de villes et de tours effondrées, quelques fenêtres éteintes |
| `planetes/fongique.webp` | Forêt fongique | planète couverte de champignons géants aux chapeaux ronds, couleurs rose, crème et violet |
| `planetes/metal.webp` | Lune de métal | petite lune en plaques de métal rivetées, panneaux et trappes |

`ville` et `fongique` n'ont pas encore d'image : le jeu réutilise en attendant celles de `metal` et `jungle` (`IMAGE_SECOURS` dans `index.html`, à vider quand les deux images arrivent).

---

## 5. Avant d'intégrer : vérifier chaque image

- [ ] Aucun texte, lettre, chiffre ni logo (regarder de près les écrans, panneaux et caisses).
- [ ] Format portrait 1024 × 1536 (décors) ou carré 512 × 512 à fond transparent (planètes).
- [ ] Les éléments sont à peu près aux positions du tableau.
- [ ] Banquette vide sur `vaisseau.jpg` (sinon il y aura deux Jimees).
- [ ] Même style que les autres images (traits, couleurs, grain).

## 6. Intégration dans le jeu

1. Envoyer les images à Claude (ou les déposer dans le dépôt GitHub) avec **exactement** les noms de fichiers ci-dessus.
2. Demander : « nouveaux décors cartoon : intègre-les, remesure les zones et active les décors cartoon ».
3. Claude :
   - convertit les planètes en WebP et vide `IMAGE_SECOURS` si `ville` et `fongique` sont fournies ;
   - remesure les zones de l'accueil (`data-hx/hy/hw/hh` des boutons de `#ecran-vaisseau`, `ZONE_VAISSEAU`) et du hangar (`PIECES_HANGAR`, `ZONE_HANGAR`) ;
   - passe `DECORS.cartoon` à `true` dans `index.html` : le filtre sépia d'attente disparaît, l'accueil affiche ses propres étiquettes et boutons, et le Jimee s'assoit sur la banquette ;
   - lance les tests, contrôle les écrans au format téléphone, puis pousse sur `main` (Netlify redéploie seul).

On peut intégrer les images au fil de l'eau : une image remplacée sans les autres fonctionne, mais l'interrupteur `DECORS.cartoon` ne se met qu'une fois `vaisseau.jpg` et `hangar.jpg` refaits (ce sont eux qui portent les zones à toucher).
