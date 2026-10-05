# PROJET JIMEE — Document de référence (V25)

> **À lire en premier par toute nouvelle session de travail.**
> Version décrite : **V25 (décors cartoon dessinés en SVG) sur la V24 (thème cartoon années 30 : interface, personnages, icône), sauvegarde v20 inchangée** (5 octobre 2026).
> ⚠️ Le travail « V14 » d'une session précédente (météo du jour, objectifs de mission, événements galactiques, anomalies) n'a jamais été livré : il n'est PAS dans le code. Seule l'idée des tailles a été reprise ici.
> **Le code fait foi** : depuis le 5 octobre 2026, la référence est la branche `main` du dépôt GitHub `lucasboul-dev/jimme` ; chaque push redéploie Netlify (https://startling-kheer-17da0d.netlify.app). Plus de ZIP : faire `git pull` avant de travailler. En cas de contradiction entre ce document et le code, suivre le code et signaler l'écart.
> **Style graphique** : voir `DIRECTION-ARTISTIQUE.md` (palette, consignes ChatGPT pour les décors, procédure d'intégration).

---

## 0. Règles de travail

1. **Ne jamais repartir de zéro, ni d'un ancien fichier.** Le jeu évolue vite (plusieurs personnes, plusieurs comptes Claude, un GitHub commun). Vérifier la version (`CONFIG.versionSauvegarde`) avant de coder. Incident du 4 octobre : un lot entier a été codé sur la V5 au lieu de la V12 et a effacé hangar, atelier, commerce et onglets Corp une fois déployé.
2. **Audit avant modification** : ce qui existe, où, comment ça communique, risques de régression.
3. **Valeurs d'équilibrage centralisées** dans les constantes en haut du script (`CONFIG`, `EPREUVES`, `RECUP`, `STOCK_EQUIPEMENTS`, `MIN_ETAPES_DANGEREUSES`, `CLASSES_JIMEE`, `CLASSES_PLANETE`, `RARETES`…). Jamais de nombre magique dispersé.
4. **Ne jamais casser la sauvegarde** : changement de format = incrément de `versionSauvegarde` + étape dans `migrer()`.
5. **Déterminisme** : tout résultat important est tiré une fois à partir d'une seed et sauvegardé. Ajouter un tirage dans un générateur existant = utiliser un **flux séparé** (`creerRng(seed+'/QUELQUECHOSE')`) pour ne pas modifier le reste.
6. **Tests** : `node tests/tests.js` (65 vérifications), `node tests/tests-v13.js` (30) et `node tests/tests-v14.js` (28) `node tests/tests-v15.js` (42) `node tests/tests-v16.js` (16) `node tests/tests-v17.js` (30, serveur factice) `node tests/tests-v18.js` (36) `node tests/tests-v19.js` (27) `node tests/tests-v20.js` (27) `node tests/tests-v21.js` (20) `node tests/tests-v22.js` (20) et `node tests/tests-v23.js` (22), tous doivent passer. Prérequis : Node 18+ et `npm i jsdom`.
7. **Humour Jimee's Corp partout, jamais au détriment de l'information** : pourcentages, prix et conséquences toujours affichés.
8. **Livrable** : commit poussé sur `main` (Netlify redéploie seul) + compte rendu (changements, chiffres du simulateur, tests, limites honnêtes).
9. **Style** : aucune couleur en dur dans le CSS ou le HTML généré ; passer par les variables du thème (`--papier`, `--carte`, `--encre`, `--corp`, `--ia`, `--ia-txt` pour un texte moutarde lisible…). Texte des explications et de l'IA en `--main` (écriture à la main), titres et chiffres en `--titre`.

### Préférences de Dylan
Français ; livrables complets et directs ; évaluations honnêtes et chiffrées ; dicte souvent à la voix (interpréter l'intention) ; teste sur Honor 90 ; valide l'équilibrage avec les chiffres du simulateur ; crée les visuels avec ChatGPT (consignes dans `DIRECTION-ARTISTIQUE.md`).

---

## 1. Systèmes présents dans la V12/V13 (inventaire)

Vaisseau (écran d'accueil avec barre Hangar / Atelier / Commerce), carte galaxie et univers (scanner, réservoir, réacteur, carburant), Jimees à 7 caractéristiques (force, endurance, agilité, perception, intelligence, charisme, volonté), talents évolutifs, personnalités, rangs de vétérance, blessures persistantes et infirmerie, équipement 7 slots avec sets, effets d'objets et légendaires (rareté L), ceinture de consommables, sac à emplacements, 11 biomes, 7 climats, 5 faunes, 10 particularités, zones d'atterrissage (sûre / standard / riche), cartographie progressive (2 missions réussies = risques −20 %, V14), gardien légendaire sur la planète à trésors, 22 ressources, atelier (fabrication, amélioration, recyclage, plans), commerce (marché vivant, pénurie, demande locale), Jimee's Corp (contrats, recrutement, agence de récupération à tentative unique, mémorial, succès, réputation et rangs), quête, notifications natives + ntfy, Labo (mode test, simulateur, matrice, grille).

**Demande du 4 octobre (55 points) : lots A, B et C livrés (V14, V15, V18).**

---

## 2. Changements V13

### Classes (échelle commune `ORDRE_CLASSES` = G, F, B, A, S, SS, SSS)
- **Planètes** (`CLASSES_PLANETE`, seuil de dangerosité) : G 0, F 20, B 35, A 50, S 65, SS 80, SSS 90.
- **Jimees** (`CLASSES_JIMEE`) : G 1-3 (50 cr), **F 2-4 (150 cr, nouveau)**, B 3-5 (350 cr, rang 1), A 5-7 (1 000 cr, rang 2), **S 6-8 (2 500 cr, rang 3, nouveau)**. Maximum : S.
- **Objets** : raretés C, B, A, S, **SS, SSS** (le légendaire L reste au-dessus). Chances normales 69,5 / 20 / 8 / 2 / 0,4 / 0,1 %. Tables renforcées sur planètes SS et SSS (`RARETES_PAR_CLASSE`). Niveau max des objets : 15. Bonus de stat SS +3, SSS +4.
- Toutes les tables par classe ont été étendues (mortalité, lac, atterrissage, richesse, paliers de plans, niveaux d'objets, agence jusqu'au niveau 15).

### Survie selon l'écart de classe (`EPREUVES.ecart`)
- Écart = rang de la planète − rang du Jimee. Au-dessus de sa classe, le Jimee subit un **malus de marge** sur chaque épreuve (`malusMarge`) et chaque échec est **plus souvent mortel** (`mortalite` par écart, multiplié à `EPREUVES.mortalite` de la classe de planète, plafond `mortMax`).
- Branché dans la simulation via `c.palier()` et `c.mortel()` ; le lac utilise aussi le facteur d'écart.
- L'équipement pourrait réduire l'écart (`reductionMax`), réglé à **0** : mesuré, les stats de l'équipement valent déjà environ une classe.
- **Plancher d'étapes dangereuses** par classe (`MIN_ETAPES_DANGEREUSES` : G 1, F 2, B 2, A 2, S 3, SS 4, SSS 5). Les étapes de remplissage sont remplacées en priorité (flux aléatoire séparé `/DANGER`). Les étapes des planètes existantes ont donc pu changer.

Grille mesurée (Jimee nu, Labo → « Grille de survie », 40 planètes × 20 missions par case) :

| Jimee | G | F | B | A | S | SS | SSS |
|---|---|---|---|---|---|---|---|
| G | 92 | 55 | 17 | 1 | 1 | 1 | 0 |
| F | 97 | 84 | 55 | 6 | 1 | 1 | 0 |
| B | 99 | 94 | 88 | 53 | 5 | 1 | 1 |
| A | 100 | 98 | 98 | 92 | 63 | 15 | 1 |
| S | 99 | 98 | 98 | 96 | 85 | 57 | 7 |

Cible : 88 % sur sa classe, ~55 % une classe au-dessus, ~10 % deux classes au-dessus.
Équipement : B sur A passe de 55 % (nu) à 82 % (kit B) et 89 % (kit optimal) ; B sur S de 6 % à 34-56 %.

### Fiche planète
- **Étapes et ressources masquées** tant que la planète n'a jamais été explorée (`etat.cartographie[cle] > 0`).
- Lignes « richesse du sol » et « niveau des objets trouvés » supprimées.
- L'estimation de survie signale l'écart de classe (« chaque échec est environ N fois plus mortel »).

### Stock d'équipements par planète
- Tiré une fois pour toutes (`stockEquipements`, flux séparé `/STOCK`) : G 1-3, F 1-4, B 2-5, A 2-6, S 3-7, SS 3-8, SSS 4-9 ; 8 % de planètes sans aucun équipement ; +2 sur la planète à trésors.
- Décompte dans `etat.equipementsPris[cleCarto]` : seuls les objets **rapportés** (mission réussie) comptent.
- La mission reçoit `stockRestant` à l'envoi ; une fois épuisé, coffres, donjons, épaves et nids donnent « rien du tout », et marchands, campements, kleptomanie et tombes ne proposent plus d'objet. Labo et estimations : stock illimité.
- Affichage seulement quand la cartographie est complète (3 missions) : « N restants sur M », « tous récupérés » ou « aucun ».

### Sauvegarde et tests
- Sauvegarde v13 : ajoute `equipementsPris` (migration depuis v12).
- `tests/tests.js` mis à jour aux règles V12 (agence niveau 3 soumise au rang, tentative unique, sac à emplacements, 22 ressources, coût en ressources des améliorations, boutique au hangar, balise de l'agence). Le harnais n'interrompt plus toute la suite sur une erreur JavaScript : le test concerné échoue et la suite continue.
- `tests/tests-v13.js` : 30 vérifications des nouveautés.

---

## 2 bis. Changements V14 — lot A (missions)

### Taille des planètes et durée
- `TAILLES` (flux séparé `/TAILLE`) : naine 3-4 étapes, petite 5-6, moyenne 7-8, grande 9-11, géante 12-14 (poids 2/3/4/2/1). Lune de métal = naine. La taille fixe aussi le rayon dessiné sur la carte.
- La classe garde ses épreuves dangereuses (plafond + plancher `MIN_ETAPES_DANGEREUSES`), le biome leur type. Le tirage historique est conservé : nom, biome, climat, faune, danger et classe des planètes existantes **ne changent pas** ; leur liste d'étapes, si.
- `DUREE` : durée d'exploration interpolée sur les étapes de la taille (3 → 2 h, 14 → 8 h), au quart d'heure. Mesuré : naine 2-2,5 h, petite 3-3,75 h, moyenne 4,25-4,75 h, grande 5,25-6,25 h, géante 7-8 h. Planète spéciale +1 h (plafond 10 h). Champ `dureeH` sur une planète = durée imposée (futures planètes spéciales).
- Réacteur : `facteur` 1 / 0,95 / 0,9 / 0,85 / 0,8 sur la durée réelle, jamais sous 2 h. La collecte suit la durée d'exploration (le réacteur raccourcit le trajet, pas la récolte).
- Fiche planète : taille et durée d'exploration toujours visibles, durée réelle affichée à côté du bouton d'envoi. Le journal du rapport est mis à l'échelle de la durée réelle.

### Cartographie et objets
- 2 missions réussies suffisent (`EPREUVES.cartographie.missions`).
- Les objets restaient déjà probabilistes (aucun ordre fixe) ; vérifié par test sur une planète à 2 équipements : 1re exploration 0/1/2 objets ≈ 68/20/12 %, puis toutes les suites possibles.

### Rendement (`RENDEMENT`)
- Quantités trouvées aux étapes × rareté : commune ×2, peu commune ×1,5, rare ×1,25, très rare ×1.
- **Collecte en chemin** au retour : 2 à 4 unités communes par heure d'exploration × classe × zone, +3 % par point de perception. Elle s'arrête quand le sac est plein (rien n'est compté comme perdu).
- `SAC.tailleStack` 10 → 20.
- Mesuré (Jimee nu sur sa classe) : G ≈ 15-19 unités par mission (avant ≈ 3 en 12 h, 27 % de missions à zéro), B ≈ 32, S ≈ 34 ; courte (2-3 h) → longue (6-8 h) : G 13 → 28, B 18 → 33, S 24 → 45. Ressources rares : 2 à 5 % des unités. Valeur ≈ 25-40 cr par heure de mission (avant ≈ 2-9).

### Découvert / perdu / ramené
- La simulation tient un registre : `trouves`, `pertes` [{cause, talent, ressources}], `influences`, `risqueIncident`. Causes : sac plein, étape de route (embuscade, ravin…), récolte gâchée (Maladroit, Allergique), échange marchand, pluies acides, **incident au retour**.
- **Incident au retour** : risque de base 5 %, Distrait +15 points, Maladroit +6, Collectionneur × 0,5. Gravité : léger 20-40 % (poids 5), grave 50-80 % (3), total 100 % (2). Le responsable est tiré parmi les talents impliqués ou la malchance. Mesuré : ~5 % des missions sans défaut, ~22 % avec Distrait ; fin à 0 malgré des trouvailles ≈ 1,5 %.
- Distrait n'est plus « 30 % = moitié du butin » : il augmente seulement la probabilité d'incident (c'est le talent appelé « Étourdi » dans la demande de Dylan).
- Rapport : Découvert → Perdu (par cause) → Ramené au vaisseau → Influence du Jimee (talents, perception, sac plein, risque d'incident). Une mission lancée avant la mise à jour garde l'ancien affichage.

### Équilibrage
- `EPREUVES.mortalite.A` 1,4 → 2 (les planètes A sont plus courtes depuis les tailles). Grille (20 × 20) : G/G 91, F/F 83, B/B 88, A/A 91, S/S 85 ; B/A 46, A/S 67, S/SS 52.
- Test de grille V13 passé à 20 planètes × 20 missions (16 × 12 donnait ±3 points de bruit).

---

## 2 ter. Changements V15 — lot B (Jimee, Corp, accueil)

### Fin des points de caractéristique
- Les rangs de vétérance (`RANGS`) ne donnent plus de point à attribuer : titre honorifique, et toujours une qualité offerte au rang Légende. `attribuerPoint` et le bouton « +1 » sont supprimés.
- Migration (sauvegarde 13 → 14) : les points non dépensés sont attribués au hasard (graine `id/POINTS-V15`, déterministe), puis le champ `points` disparaît.

### Progression cachée (`PROGRESSION_CACHEE`)
- Un éveil = +2 de base sur une caractéristique, **une seule fois par caractéristique**, jamais choisi, déclenché, acheté ni annoncé à l'avance.
- Conditions (jamais affichées en jeu) : force = donjons + dragons traversés ; endurance = blessures encaissées en revenant vivant (`j.experience.blessures`) ; agilité = falaises, ravins, ponts de glace, avalanches ; perception = embuscades, essaims, nids, grottes, mirages ; intelligence = ruines, pièges anciens, carrefours, drones, autels ; charisme = villageois, marchands, campements ; volonté = missions réussies sur une planète au-dessus de sa classe (`j.experience.auDessus`).
- Seuil propre à chaque Jimee, tiré dans une fourchette (`seuil:[min,max]`, graine `id/EVEIL/stat`) ; une fois atteint, 50 % de chances par mission réussie (graine dépendant du nombre de missions) : imprévisible mais déterministe.
- Évalué à l'ouverture du rapport d'une mission réussie (`eveilsCaches`). Le rapport l'annonce par une phrase d'ambiance, sans dire pourquoi ; la fiche du Jimee marque la caractéristique d'un ✦.

### Expéditions de récolte de la Corp (`EXPEDITIONS`)
- Corp → onglet **Expéditions**, ou bouton « Envoyer une escouade Corp » sur la fiche d'une planète. **Débloquées dès qu'une planète de la galaxie actuelle a été explorée une fois par le Jimee** (`cartoMin`). Indépendantes du Jimee (il peut partir en même temps).
- Durées 30 min, 1 h, 2 h, 4 h (20 s en mode test). Une à la fois (`max`).
- Récolte : 6 à 10 unités par heure × classe de la planète ; raretés 85 % communes, 13 % peu communes, 2 % rares, jamais de très rare. Équipement : 4 % (2 h) ou 8 % (4 h), pris dans le stock de la planète et réservé au paiement.
- Issues tirées au paiement : accomplie 70 %, pause syndicale 20 % (30 à 50 % perdus), escouade dévorée 7 % (rien), excès de zèle 3 % (× 1,5). Affichées avant de payer, « satisfait ou pas, non remboursable ».
- Prix = valeur attendue × 0,75 → rapport moyen mesuré × 1,12 (légèrement rentable).
- Résultat calculé au paiement (`resoudreExpedition`, pur et déterministe), livré à l'échéance par horodatage (`finaliserExpeditions`, idempotent, fonctionne app fermée), notification + ntfy, rapport Découvert / Perdu / Livré / Bilan.
- Sauvegarde : `expeditions` (10 dernières lues conservées), `compteurExpe`.

### Accueil : baie d'observation
- La bande libre au-dessus de l'image du couloir (écrans plus hauts que l'image) n'est plus une copie floutée : baie spatiale en CSS (nébuleuse, 3 couches d'étoiles en parallaxe, étoile filante, planète à anneau et lune, reflets de vitre, montants latéraux lumineux). Le haut de l'image fond dans la baie.
- Étoiles tirées une fois (graine fixe) ; planète et lune placées selon la hauteur libre (`positionnerBaie`). Animations coupées si « réduire les animations » est activé sur le téléphone. Masquée quand l'image remplit l'écran.

---

## 2 quater. Correctif V16 — cartographie par galaxie
- **Bug** (présent depuis la V11) : `cleCarto` valait « graine de l'univers / P3 », sans la galaxie. Les planètes de même rang (P0 à P7) partageaient donc, d'une galaxie à l'autre, la cartographie, le stock d'équipements pris (V13) et l'accès aux escouades (V15). Les tombes du mémorial apparaissaient aussi sur la planète homonyme des autres galaxies.
- **Correctif** : `cleCarto` = univers / galaxie / planète. Les morts du mémorial enregistrent leur galaxie ; les anciennes tombes restent liées au nom de leur planète.
- **Migration** (sauvegarde 14 → 15) : l'ancienne clé ne dit pas où la planète a été explorée. `migrerCartographie` cherche un indice parmi les galaxies visitées (nom de la planète cité au mémorial, dans les abandons, récupérations, expéditions ou la mission en cours) ; sans indice, la galaxie de départ G0. Exécutée une fois, après le chargement de l'univers (`etat.cartoAMigrer`).

---

## 2 quinquies. V17 — mode à deux (Supabase)
- **Principe** : chaque sauvegarde reste dans son téléphone. Un **code de partie** (Labo → « Jouer à deux », avec un nom de capitaine) relie les joueurs, sans compte. Il faut la **même graine d'univers**. Partagé : position (galaxie), mission en cours, épaves, fil d'actualité.
- **Serveur** : projet Supabase, script `serveur/jimee-multijoueur.sql` (tables `jimee_joueurs`, `jimee_epaves`, `jimee_evenements` ; lecture publique ; écriture uniquement par les fonctions `jimee_presence`, `jimee_publier_epave`, `jimee_piller`, `jimee_evenement`). Projet Supabase `jimee` (réf. `zbtoknbzwvbryxmoudcl`, Paris). URL et clé publique intégrées dans `MULTI.url` / `MULTI.cle`, ou saisies dans le Labo (repli « Serveur »).
- **Synchronisation** : toutes les 10 s app ouverte (`synchroniser`), et au retour au premier plan. API REST, sans bibliothèque. Hors ligne = jeu normal, reprise automatique. Un joueur est « hors ligne » au-delà de 90 s sans signal.
- **Affichage** : carte univers = pastille verte au nom de l'ami sur sa galaxie (même hors de portée du scanner) et croix sur les galaxies à épaves ; carte galaxie = trajet de sa mission (vert) et marque orange sur les planètes à épave ; fiche planète = « Épave de X » et « X a un Jimee en mission ici » ; Labo = liste des amis, dernières nouvelles.
- **Mort** : à l'ouverture du rapport de mort, l'abandon (avec sa galaxie) est publié comme épave et une transmission part au fil (« … l'épave est ouverte au pillage »). Les nouvelles arrivent par le message de l'IA de bord et une notification.
- **Pillage** (choix de Dylan) : Corp → Agence → « Épaves de vos amis ». Mêmes agences, prix et 3 jets. **Ce qui est rapporté appartient au pilleur.** Une tentative par épave **et par joueur** (le propriétaire garde la sienne). Le pillage retire de l'épave ce qu'il rapporte et ce qu'il détruit ; ce qu'il ne tente pas, ou une équipe disparue, laisse les objets sur place. Le serveur vérifie de façon atomique que tous les objets sont encore là (sinon refus « l'épave a changé », rien n'est facturé). Chez le propriétaire, les objets pillés disparaissent de ses abandons à la synchronisation suivante.
- Sauvegarde 16 : bloc `multi` {partie, pseudo, id, url, cle, dernierEvt, publiees, fil}. Les abandons enregistrent `galaxie`. Une récupération de pillage porte `pillage:true` et n'est jamais « remise sur place » chez le pilleur.

---

## 2 sexies. V18 — lot C (galaxies et voyages)

### Astre central (`ASTRES`, flux séparé `/ASTRE`)
- Étoile jaune (rien), naine rouge (glace, cryonite ; danger +2), géante bleue (soufre, obsidienne, hélium-3 ; danger +6), pulsar (hélium-3, cristal résonant ; danger +5), **trou noir** (danger +8 ; ressources cachées cryonite, fragment d'étoile, artefact, cristal + 1 à 3 équipements cachés par planète, détectables seulement avec le **détecteur infrarouge**).
- Poids interpolés entre centre et bord de l'univers : trou noir ≈ 4 % près du centre, ≈ 14 % loin. Galaxie de départ : étoile jaune.
- Dessiné au centre de la vue galaxie et au cœur de chaque galaxie sur la carte univers. La fiche planète décrit l'astre (et l'état du détecteur sous un trou noir).
- **Détecteur infrarouge** : objet utilitaire (sac utilitaire, effet `infrarouge`), plan connu dès le départ (atelier, 30 min : 8 silicium, 4 quartz, 6 cuivre) ; ajouté aux plans des parties existantes. Il peut aussi être trouvé en mission. Branchement : `planeteEffective` pose `equipementSpecial` → `ressourcesPlanete` ajoute les ressources cachées, `stockRestant(p, true)` ajoute le stock caché. Extensible : un nouvel astre peut exiger un autre `equipement`.

### Danger selon la distance (`DANGER_DISTANCE`)
- Le bonus fixe (+0 à +45) est remplacé par un **décalage tiré pour chaque planète** (flux `/NIVEAU/k`) parmi −15, −5, +5, +15, +30, +45, avec des poids interpolés du centre au bord (courbe 1,6) + jitter ±3 + danger de l'astre.
- Mesuré (classes des planètes) : éloignement < 0,15 → G-F-B ; 0,15-0,35 → 63 % G/F, 9 % S et plus ; 0,35-0,6 → mélange ; 0,85-1 → 51 % S et plus, mais encore 9 % de G/F.
- Galaxie de départ G0 strictement inchangée. Les autres galaxies changent de classes (biome, climat, faune, nom identiques) : une partie déjà explorée y verra d'autres niveaux.

### Voyages chronométrés (`VOYAGE`)
- Durée = distance × 0,13 min (minimum 5 min) × facteur du réacteur ; 20 s en mode test. Mesuré : voisine à 63 kAL = 8 min, limite du réservoir niveau 1 (237 kAL) = 31 min.
- **Portée du vaisseau** = distance maximale permise par le réservoir (affichée dans la vue univers) ; au-delà : « Trajet trop long… Améliorez le réservoir au hangar ».
- `etat.voyage` {de, vers, depart, fin, distance, carburant}. Carburant prélevé au départ ; arrivée par horodatage (`finaliserVoyage`, chaque seconde et au chargement, idempotente). Bandeau « Voyage en cours » avec barre, notification et ntfy à l'arrivée.
- Pendant le voyage : pas de second voyage, pas de mission, pas d'escouade (raison affichée). Agence, marché, atelier et hangar restent ouverts. Labo : « Arriver tout de suite (test) ».
- Mode à deux : le voyage est partagé (« en route vers … »).

### Infos de galaxie (carte univers)
- Toujours : nom, type, astre central et sa description, distance (+ « hors de portée »), durée du voyage, carburant, relevé du scanner (nombre et classes des planètes, danger moyen).
- Jamais visitée : « jamais visitée », amis et épaves d'amis signalés, aucun compteur d'exploration.
- Visitée : planètes explorées / inconnues, barre de progression, cartographies complètes, gardien vaincu ou non, vos épaves et celles des amis, amis présents.

---

## 2 septies. V19 — lisibilité (pastilles, explications repliables, rapports, tutoriel)

### Pastilles de ressources
- `listeRessources(stock)` rend désormais des **pastilles** (icône SVG existante + quantité, bordure selon la rareté) au lieu de « 3 fer, 2 cryonite ». `listeRessourcesTexte` garde la version mots pour les messages de l'IA et les notifications.
- Les blocs Découvert / Perdu des rapports (`lignesStock`) passent de une ligne par ressource à une rangée de pastilles. Même traitement pour « il manque … » à l'atelier et au hangar.

### Explications repliables
- Les paragraphes explicatifs (règles, conseils, blagues de la Corp) passent de `<p class="note">` à `<p class="aide">`, **masqués par défaut** (`body.aide-on` les affiche).
- Bouton **?** dans l'en-tête : bascule l'affichage, mémorisé dans `etat.aide` (défaut `false`). Les informations dynamiques (durées, prix, compteurs, raisons de blocage) restent toujours visibles — seule l'explication disparaît.

### Journal des rapports
- `reveler()` archive automatiquement tout rapport affiché dans `etat.journal` (les 20 derniers, `JOURNAL_MAX`) : titre, sous-titre, lignes et bilan HTML tels quels. Type : mission, mort, recup, pillage, expedition (`etat._typeRapport`).
- Corp → onglet **Rapports** : liste du plus récent au plus ancien, avec icône, date et sous-titre ; toucher rouvre le rapport à l'identique (sans ré-archivage, `ouvrirArchive`).

### Tutoriel (`TUTO`)
- 9 étapes : bienvenue, recruter, choisir une planète, la mission et le rapport, ressources et équipement, mort et récupération, escouades, vaisseau et voyages, jouer à deux.
- Affiché au **premier lancement** d'une partie neuve (`etat.tutoVu`), relançable par Labo → « Revoir le tutoriel ». Purement explicatif : il ne modifie rien dans la partie. Les sauvegardes existantes ne le relancent pas.

---

## 2 octies. V20 — lisibilité (suite), carte plein écran, gardiens, durées

### Durées d'exploration : 10 min à 4 h
- `DUREE` : minH 1/6 (10 min), maxH 4, arrondi au multiple de 5 min, spéciales +1 h plafonnées à 6 h. Mesuré : naine 10-30 min, petite 50-75 min, moyenne 1 h 35 - 1 h 55, grande 2 h 15 - 2 h 55, géante 3 h 20 - 4 h.
- `fmtDuree` affiche « 10 min » sous l'heure. Compensation : `RENDEMENT.collecte.parHeure` 2-4 → 4-7, pour garder un butin comparable par mission (G ≈ 15 unités, B ≈ 21, S ≈ 29). Conséquence assumée : le gain **par heure réelle** est environ trois fois plus élevé qu'en V19 (≈ 75-95 cr/h contre ≈ 30).

### Gardiens légendaires
- `GARDIEN.chance` [0,15 au centre ; 1 au bord], interpolé sur l'éloignement, tiré sur la graine de la galaxie (`gardienDansGalaxie`). `GARDIEN.missionsMin` : aucun gardien tant que le joueur n'a pas 8 missions au compteur. Mesuré : ≈ 30 % près du centre, ≈ 95 % au bord.
- `etat.bossVus[univers/galaxie]` : `'vu'` dès qu'une mission a croisé le gardien (mort ou fuite comprise), `'vaincu'` après la victoire. Marque sur la carte de la galaxie, à côté de la planète spéciale : pastille orange ★ si repéré, grise ☠ si vaincu. Migration : les galaxies déjà nettoyées passent directement à `'vaincu'`.

### Carte plein écran
- La carte occupe tout l'écran (`#ecran-carte.carte-pleine`) ; le bandeau du bas se limite au nom de la galaxie et à une invite.
- Toucher une planète (ou une autre galaxie en vue univers) ouvre sa fiche **par-dessus la carte** (`fiche-ouverte`) ; le bouton de retour devient « ‹ Galaxie » / « ‹ Univers » et referme la fiche sans revenir au cockpit (`data-retour-carte`).

### Blocs repliables (`repli`)
- Composant `<details class="repli">` : titre visible, détail au toucher. Appliqué aux talents (puces `.puce-repli`, détail replié), aux pièces d'équipement, aux sets portés, aux effets de biome / climat / faune / particularités, à l'astre central et à la composition de la dangerosité.
- Fiche planète refondue : trois chiffres en pastilles (danger, durée, cartographie), le reste replié. Mesuré : environ 1 000 caractères affichés contre plus de 2 500 en V19.
- Textes déplacés vers `.aide` (bouton ?) : sac et caractéristiques de base, avertissement sur l'équipement perdu, tenues, ceinture, durée et conseils de mission.

---

## 2 nonies. V21 — fiche planète, hangar, armurerie, tiroir de soute
- **Fiche planète** : la vignette de la planète est retirée (elle décalait le titre et les pastilles sur écran étroit). Le titre, le résumé chiffré et les blocs repliables occupent toute la largeur.
- **Hangar** : même mécanique que la carte stellaire. Choisir une pièce ouvre sa fiche **par-dessus le schéma** (`#ecran-hangar.fiche-ouverte`), le bouton de retour devient « ‹ Hangar » (`data-retour-hangar`) et referme la fiche sans revenir au cockpit. Le schéma n'est redessiné qu'à la fermeture.
- **Armurerie** : chaque partie est une carte encadrée (`.section`) avec son titre et son compteur (Talents, Équipement 0/7, Sets portés, Tenues 0/3, Ceinture 0/2, Soute). Les sections vides affichent une phrase courte (`.vide-section`) au lieu de rien.
- **Tiroir de soute** (cockpit) : onglet `▲ Soute <total>` au bas de l'écran du vaisseau. Il ouvre un tiroir listant les ressources en pastilles (icône + quantité + nom), groupées par rareté, avec le total et la valeur de rachat, plus un raccourci vers le commerce. Purement consultatif ; visible uniquement sur l'écran du vaisseau (`souteOuverte`, `majSoute`, `contenuSoute`).

---

## 2 decies. V22 — gardien légendaire et durée

### Durée des planètes à gardien
- L'ancien forfait « planète spéciale : +1 h » est supprimé (il doublait la durée d'une naine et pesait à peine sur une géante, avant même que le joueur sache qu'un gardien existait).
- Nouveau : `DUREE.bonusGardien` = **+75 % de la durée de base**, appliqué uniquement quand `etat.bossVus[galaxie] === 'vu'`, c'est-à-dire après qu'un Jimee a réellement croisé le gardien (mort, fuite ou victoire). Plafond `maxSpecialeH` 7 h. Une fois le gardien vaincu, le supplément disparaît.
- La pastille Durée de la fiche affiche « +75 % gardien » quand il s'applique.

### Affrontement (`GARDIEN`, `chancesGardien`)
- Les trois jets de statistique sont remplacés par un calcul unique : puissance du Jimee = force + endurance + volonté **effectives** (équipement compris), comparée à `GARDIEN.exigence` par classe de planète (G 6 → SSS 32).
- `ecart = puissance / exigence − 1`. Victoire = 0,35 + 1,1 × écart (bornée 3 à 92 %) ; mort = 0,12 + 0,4 × (−écart) (bornée 1 à 50 %) ; le reste est une **fuite blessée**.
- Mesuré : à niveau égal ≈ 35 % de victoire, ≈ 12 % de mort, le reste en fuite. Jimee S sur planète B : 92 % de victoire, 1 % de mort. Jimee B sur planète SSS : 3 % de victoire, 37 % de mort, le reste en fuite.
- **Fuite** : endurance −1 et 30 à 60 % du butin semé sur place, enregistré comme perte `'gardien'` dans le rapport (« Butin semé en fuyant le gardien légendaire »).
- Un antidote en ceinture transforme la mort en fuite.
- `r.gardienRencontre` est désormais renvoyé par la simulation : la marque de la carte apparaît même si le Jimee meurt au gardien.

---

## 2 undecies. V23 — rapport en deux temps, hangar, carte univers, marché / atelier

- Problème : à la fin du défilement, le bilan (butin, pertes, influence du Jimee…) apparaissait sous le journal et prenait la moitié de l'écran ; il fallait faire défiler le journal pour le relire.
- Nouveau déroulé (`reveler`, `etapeRapport`, `finJournal`) : 1. le journal défile seul, sur toute la hauteur, à la même vitesse qu'avant (500 ms par ligne) ; 2. à la fin, un bouton **« Suivant › »** apparaît ; 3. il remplace le journal par le bilan, lui aussi sur toute la hauteur, avec **« ‹ Journal »** (revenir au journal complet) et **« Fermer le rapport »**.
- Toucher le journal pendant le défilement affiche tout d'un coup (pour relire vite un rapport archivé).
- Les minuteurs du défilement sont mémorisés (`minuteursRapport`) et annulés à la fermeture ou à l'ouverture d'un autre rapport : plus de lignes fantômes d'un rapport précédent.
- Le bilan est écrit dans le DOM dès l'ouverture (caché) : les tests qui lisent `#bilan` restent valables.
- S'applique à tous les rapports (mission, mort, récupération, expédition, pillage, archives). Aucun changement de sauvegarde.

### Hangar : pièces du schéma de nouveau visibles
- **Bug V21 corrigé** : la règle CSS `#ecran-hangar #hangar-zones{display:none}` (il manquait `.fiche-ouverte`) masquait en permanence les zones cliquables du schéma. On ne voyait ni les étiquettes « Réacteur · 1/5 », ni le ▲ des améliorations possibles ; seules les cartes du bas restaient. Les tests V21 ne vérifiaient que la fiche ouverte, pas la visibilité des zones.
### Carte de l'univers au format de la vue galaxie
- Sans sélection : bandeau court sur la carte (position, galaxies à portée, signaux) + invite, comme en vue galaxie. Fini le panneau de 22 % de hauteur rempli de lignes à faire défiler.
- Toucher **n'importe quelle galaxie, y compris la sienne (▲)**, ouvre une fiche plein écran avec retour « ‹ Univers ».
- Fiche d'une autre galaxie : pastilles (distance, voyage, carburant nécessaire / disponible, danger moyen) puis blocs repliables Planètes, Exploration, Trajet, et le bouton de départ. Sa propre galaxie : pastilles (planètes, explorées, carburant) puis Exploration (ouvert), Alentours, Vaisseau. Signal non identifié : pastilles distance / scanner actuel / scanner requis.
- Bug corrigé : les boutons de zoom (+ − ◎ ▲) restaient affichés par-dessus la fiche (le style en ligne `display:flex` l'emportait sur la règle CSS) ; règle passée en `!important`.

### Marché et atelier
- Suppression du `padding-top:min(28vh,230px)` qui laissait un grand bloc vide (l'image de fond) au-dessus du titre. L'image reste en fond, plus atténuée ; le contenu commence sous le bouton de retour.

- Cartes du bas du hangar (`etatPiece`) : chaque pièce affiche maintenant son état — « ▲ Niv. 2 possible » (bordure dorée), « Niv. 2 · manque 2 ress. » (orange), ou « Niveau max ».

---

## 2 duodecies. V24 — style cartoon années 30

Demande de Lucas : passer le jeu dans un style graphique plus cartoon (références : dessins animés américains des années 30, croquis du Jimee et d'un second personnage). Aucune règle de jeu ni format de sauvegarde modifié.

### Interface
- Feuille de style réécrite (mêmes sélecteurs, même mise en page) : papier crème, contours d'encre épais, ombres portées pleines, coins légèrement irréguliers, boutons « gros jouets » qui s'enfoncent au toucher, pointillés pour les séparateurs.
- Variables : `--papier`, `--carte`, `--carte2`, `--sep`, `--encre`, `--corp`, `--ia` (remplissage moutarde), `--ia-txt` (moutarde foncée pour le texte), `--bon`, `--mauvais`, `--mort`, `--bleu`, `--violet`. Les anciennes variables (`--vide`, `--panneau`, `--ligne`…) pointent dessus.
- Polices hébergées dans `polices/` (hors ligne, plus d'appel à Google Fonts) : Luckiest Guy (titres, boutons, chiffres), Nunito (texte), Patrick Hand (IA de bord, explications, slogans).
- Grain de film animé et vignettage sur tout l'écran (`html::after`, sans bloquer le toucher, coupé si « réduire les animations »).
- IA de bord en bulle de bande dessinée ; bandeau du haut en carte ; bannière Corp rouge à rayons ; baie d'observation en ciel de nuit dessiné (étoiles crème, planète moutarde cerclée d'encre).
- Couleurs des classes de Jimee ajustées à la palette (G sable, F vert, B bleu, A violet, S moutarde) : purement visuel.
- Icône de l'application et couleurs du manifeste refaites (Jimee sur rayons rouges).

### Personnages (d'après les croquis de Lucas)
- `persoJimee({couleur, lettre, etat, etoiles})` : tête ovale penchée, grands yeux noirs, corps en rectangle, pieds ovales. États : `normal`, `heureux` (reflets), `mort` (yeux en croix, gris, auréole). Ceinture et badge à la couleur de la classe. `dessinJimee(cl, etat)` l'appelle pour le catalogue.
- `persoCorp()` : le représentant de la Jimee's Corp (grand, chauve, gros nez, mains dans les poches, cravate rouge).
- Balancement animé en CSS (`.perso`), coupé si « réduire les animations ».
- Où ils apparaissent : catalogue de recrutement, tête de l'armurerie (portrait), bannière Corp, première étape du tutoriel, tête des rapports (`persoRapport` : Jimee content pour une mission, Jimee mort pour une mort, représentant de la Corp pour agence, pillage et escouade ; les archives retrouvent le bon personnage).

### Décors (en attente)
- Les anciennes images restent, réchauffées par un filtre sépia d'attente.
- `DECORS.cartoon` (en tête de la configuration), à passer à `true` quand les nouveaux décors arrivent : filtre retiré, étiquettes et boutons de l'accueil dessinés par le jeu (`data-etiquette`, classe `bas`, `data-align="droite"`), Jimee dessiné sur la banquette (vide sur la nouvelle image, absent pendant une mission).
- `DIRECTION-ARTISTIQUE.md` : palette, bloc de style, consigne prête à coller pour chacun des 5 décors et des 11 planètes (dont `ville` et `fongique`, encore sans image), positions à respecter, vérifications et procédure d'intégration.

### Dépôt
- Fichiers du jeu à la racine, `netlify.toml` (pas de build, pas de cache sur `index.html` et `sw.js`, `tests/` et `serveur/` non servis), `CLAUDE.md` pour les sessions Claude. Ce document s'appelle désormais `JIMEE-RECAP.md`.

---

## 2 terdecies. V25 — décors cartoon dessinés

- Les 5 décors (vaisseau, hangar, atelier, marché, fond de carte) sont dessinés en SVG dans le même trait d'encre que les personnages (`decors/*.svg`, 1024 × 1536, ≈ 25-40 ko chacun au lieu de plusieurs centaines de ko). Ils sont générés par `outils/decors.py` (palette, tremblement « à la main » par filtre SVG, motifs réutilisables : plantes, caisses, ampoules, fusée, engrenages). Les anciens JPG sont supprimés.
- **Vaisseau** : couloir de fusée à côtes rivetées, armoire ouverte (armurerie), cockpit à hublot, planétaire en laiton (carte stellaire), guichet à auvent rayé (Corp), banquette vide, tapis rouge, sol libre en bas. Les éléments sont dessinés aux positions des zones existantes (`data-hx…`), inchangées.
- **Hangar** : plan cyanotype au mur avec la fusée et 5 encadrés aux positions de `PIECES_HANGAR` (copiées dans le script), vraie fusée garée en dessous.
- **Atelier** (panneau d'outils, bocaux, établi, lampe), **marché** (baie ronde avec fusée amarrée, étals à auvents, lampions, balance), **carte** (ciel de nuit, nébuleuses, étoiles en croix plus nombreuses vers les bords, astéroïdes).
- `DECORS.cartoon` passe à `true` : étiquettes et boutons de l'accueil dessinés par le jeu, Jimee assis sur la banquette (absent pendant une mission). Étiquettes « Carte stellaire » et « Jimee's Corp » décalées (`data-align`) pour ne pas se chevaucher sur écran étroit.
- Atelier et marché : fond cadré en haut (`center top/cover`) et voile crème allégé, pour mieux voir le décor.

---

## 3. Limites connues (honnêtes)
- V25 : les 11 planètes de la carte sont encore les images peintes de l'ancien style (seules images non refaites).
- V25 : décors vérifiés sur un écran de 400 × 860 et 400 × 700 ; sur un écran très large, les bords du vaisseau sont coupés (cadrage inchangé).
- V24 : les icônes des ressources et des produits (SVG existants) n'ont pas été redessinées dans le nouveau style ; elles sont posées sur des pastilles bleu nuit cerclées d'encre.
- V24 : la carte stellaire (soleil, trajectoires, galaxies) garde ses dessins d'origine, seuls les textes ont été restylés.
- V23 : un rapport très court (2-3 lignes) demande quand même un toucher sur « Suivant » pour voir le butin.
- G sur G reste à 92 % (cible 88) et G sur B à 17 % (cible 10) : les plus petites planètes n'ont souvent qu'une seule épreuve.
- A sur SS à 15 % (cible 10).
- La cartographie ne compte que les missions réussies (pas encore la règle du rapport de mi-expédition par pigeon).
- V14 : à 7-8 h, le sac de base (4 emplacements) plafonne souvent la collecte ; c'est voulu (intérêt des sacs), mais l'écart court/long dépend donc du sac.
- V14 : les incidents ne font perdre que des ressources (et des crédits pour Distrait), jamais d'objet.
- V22 : le supplément de 75 % disparaît une fois le gardien vaincu (choix d'équilibrage, à revoir si Dylan préfère qu'il reste).
- V22 : un Jimee très faible meurt le plus souvent avant même d'atteindre le gardien ; la grille d'issues ne s'applique qu'à ceux qui survivent jusque-là.
- V21 : le tiroir de soute ne montre que les ressources ; les objets restent dans l'armurerie et au commerce.
- V21 : l'atelier, le marché et les onglets Corp n'ont pas encore reçu le découpage en sections.
- V20 : l'économie accélère nettement (gain par heure environ triplé) ; à surveiller en jeu, les prix n'ont pas été revus.
- V20 : les expéditions de la Corp gardent leurs durées (30 min à 4 h), inchangées.
- V20 : d'autres écrans (hangar, marché, Corp) restent plus verbeux que la fiche planète.
- V19 : le journal stocke le HTML des rapports (quelques ko chacun, 20 maximum) ; simple et fidèle, mais plus lourd qu'un format structuré.
- V19 : le tutoriel est un diaporama, pas une main guidée pas à pas dans l'interface.
- V19 : l'épuration a porté sur les textes les plus longs ; d'autres écrans restent perfectibles, à voir à l'usage.
- V18 : les effets d'astre (danger, ressources) ne sont pas encore jouées ; le trou noir est la seule galaxie qui exige un équipement.
- V18 : un astre ne change ni le climat ni les étapes des planètes (seulement danger et ressources), pour ne pas modifier les planètes existantes plus que nécessaire.
- V17 : temps réel = interrogation toutes les 10 s app ouverte (pas de websocket) ; app fermée, rien n'est partagé, mais les notifications ntfy de chacun continuent.
- V17 : une épave n'est publiée qu'à l'ouverture du rapport de mort par son propriétaire.
- V17 : si le propriétaire lance sa propre agence **hors ligne** pendant qu'un ami pille les mêmes objets, un objet peut exister en double (fenêtre très étroite, accepté pour un jeu entre amis).
- V17 : sans compte, la clé publique permet de lire les données de toutes les parties : choisir un code de partie peu devinable. Le temps réel n'a été testé qu'avec un serveur factice, pas avec deux vrais téléphones.
- V16 : une planète explorée hors de G0 sans aucun indice dans la sauvegarde a été rattachée à G0 lors de la migration (à refaire à la main si besoin).
- V15 : les fourchettes des éveils sont des estimations non jouées (force ≈ 8-12 donjons, volonté ≈ 4-7 missions au-dessus de sa classe) ; certains éveils (intelligence, perception) dépendent des biomes visités.
- V15 : les expéditions ne ramassent que dans la galaxie actuelle ; un voyage ne les annule pas (la livraison suit le vaisseau).
- V14 : économie non jouée en conditions réelles ; prix des améliorations et des recrues inchangés alors que les gains par heure sont environ 10 fois plus élevés.

---

## 4. Lots suivants

**Demande du 4 octobre (55 points)** : lot A livré (V14). Restent :
- ~~Lot B — Jimee et Corp~~ : **livré en V15**.
- ~~Lot C — Galaxies et voyages~~ : **livré en V18**.

**Lots validés en conception (avant le 4 octobre)** :
2. ~~Génération des étapes + durée variable~~ : **remplacé par le lot A de la V14** (tailles, durée 2-8 h). Les anomalies (planète brutale, calme, vide) restent à faire.
3. **Cartographie complète** (désormais sur 2 explorations depuis la V14) : 1 exploration = étapes et ressources, 2 = carte complète avec nombre et type de donjons liés à la faune (Prédateurs → Tanière, Dragons → Nid de dragon, Herbivores → Grotte abandonnée, sans faune → Ruines piégées). Talent rare « Aventurier aguerri » : carte complète dès la première exploration. Une mort après la moitié du parcours compte (pigeon voyageur astronaute ; message dédié dans les deux cas + rappel de la règle). À fusionner avec la cartographie existante (3 missions, −20 %).
4. **Jackpot** : ~0,3 % par mission, objet SS ou SSS sur n'importe quelle planète, mise en scène dédiée, compris dans le calcul déterministe à l'envoi.
5. ~~Expéditions de récolte Corp~~ (**livré en V15**) : payantes, 30 min / 1 h / 2 h / 4 h, ressources uniquement, planètes déjà visitées, une à la fois au départ. Résultats affichés au paiement : normal 70 %, pause syndicale 20 % (−30 à −50 %), équipe dévorée 7 % (rien), zèle 3 % (+50 %). « Satisfait ou pas, non remboursable. » Légèrement rentable en moyenne.

Idée notée, hors lots : amélioration « Pigeonnier spatial » (seuil de mi-parcours abaissé à 30 %).
