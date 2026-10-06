# Tests automatiques Jimee

Prérequis : Node 18+ et `npm i jsdom` (dans ce dossier ou au-dessus).

    node tests/tests.js        # 65 vérifications : missions, mort, agence, rechargement, duplication, univers, migration, probabilités, simulateur
    node tests/tests-j2.js     # Jimee 2 : fusée, production hors ligne, équipage, missions à cartes, mort rentable, capsules
    node tests/tests-v26.js    # 50 vérifications : arrivée progressive, guide de la première mission, rapport animé, bilan, migration v21
    node tests/tests-v23.js    # 22 vérifications : rapport en deux temps, pièces du hangar visibles, fiches de la carte univers, marché / atelier sans vide
    node tests/tests-v22.js    # 20 vérifications : issues du gardien selon l'écart de puissance, +75 % de durée après la rencontre
    node tests/tests-v21.js    # 20 vérifications : fiche sans vignette, hangar flottant, armurerie sectionnée, tiroir de soute
    node tests/tests-v20.js    # 27 vérifications : durées 10 min-4 h, gardiens rares et repérés, carte plein écran, blocs repliables
    node tests/tests-v19.js    # 27 vérifications : tutoriel, explications repliables, pastilles, journal des rapports
    node tests/tests-v18.js    # 36 vérifications : astres, danger par distance (probabilités), voyages chronométrés, infos de galaxie, détecteur infrarouge
    node tests/tests-v17.js    # 30 vérifications : mode à deux avec un serveur Supabase factice (position, mission, épaves, pillage, coupure réseau)
    node tests/tests-v16.js    # 16 vérifications : cartographie, stock et tombes propres à chaque galaxie, migration des anciennes clés
    node tests/tests-v15.js    # 42 vérifications : fin des points, éveils cachés, migration, expéditions Corp, baie d'accueil
    node tests/tests-v14.js    # 28 vérifications : durée selon la taille, 2 cartographies, drops aléatoires, rendement, découvert / perdu / ramené, incidents
    node tests/tests-v13.js    # 30 vérifications : classes G→SSS, survie par écart de classe, stock d'équipements, fiche planète, migration V12 → V13

Code de sortie 0 si tout passe. Une erreur JavaScript dans un test fait échouer ce test sans arrêter la suite.
Le dossier tests/ n'est pas nécessaire au jeu : inutile de le déployer sur Netlify.
