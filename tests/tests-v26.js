// Tests V26 — arrivée progressive (déblocages), guide de la première mission, annonces, rapport animé, bilan vivant. node tests/tests-v26.js
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
const dort=ms=>new Promise(r=>setTimeout(r,ms||30));
(async()=>{
  let w=ouvrir();let E=c=>w.ev(c);const q=s=>w.document.querySelector(s);
  const qa=s=>w.document.querySelectorAll(s);

  // --- Partie neuve
  t('sauvegarde v21',E('etat.version')===21&&E('CONFIG.versionSauvegarde')===21);
  t('partie neuve : rien de débloqué, guide actif',E('Object.keys(etat.deblocages).length')===0&&E('etat.guide')===true);
  t('accueil de la Corp affiché',q('#annonce').style.display==='flex'&&/Capitaine/.test(q('#annonce-titre').textContent));
  q('#annonce-aller').click();
  t('accueil fermé, on reste au vaisseau',q('#annonce').style.display==='none'&&E('ecran')==='vaisseau');
  t('commerce, atelier et hangar verrouillés à l\'accueil',['marche','atelier','hangar'].every(k=>q(`#ecran-vaisseau [data-${k}]`).classList.contains('verrou')));
  t('vue Univers verrouillée',q('[data-vue="univers"]').classList.contains('verrou'));
  q('#ecran-vaisseau [data-marche]').click();
  t('toucher un service verrouillé : on reste au vaisseau, la Corp explique',E('ecran')==='vaisseau'&&/🔒 Commerce/.test(E('etat.ia'))&&q('#toast').classList.contains('vu'));
  q('#ecran-vaisseau [data-hangar]').click();
  t('message de verrou chiffré (missions restantes)',/3 missions terminées \(encore 3\)/.test(E('etat.ia')));
  E("ecran='corp';tout()");
  t('Corp : seul le recrutement, pas de barre d\'onglets',!q('.onglets-corp'));

  // --- Guide de la première mission
  E("ecran='vaisseau';tout()");
  t('guide : étape recruter, la consigne remplace l\'IA',E('etapeGuide()')==='recruter'&&q('#ia').classList.contains('guide')&&/guichet/.test(q('#ia').textContent));
  t('guide : le guichet de la Corp est montré',q('#ecran-vaisseau [data-ecran-corp]').classList.contains('guide-cible'));
  q('#ecran-vaisseau [data-ecran-corp]').click();
  t('guide : dans la Corp, le bouton de recrutement G est montré',q('[data-action="recruter"][data-classe="G"]').classList.contains('guide-cible'));
  q('[data-action="recruter"][data-classe="G"]').click();
  t('recrutement guidé : retour au vaisseau, Jimee sur la banquette',E('ecran')==='vaisseau'&&!!E('etat.jimee')&&!!q('#hotspot-jimee .jimee-banquette svg'));
  t('guide : étape carte',E('etapeGuide()')==='carte'&&q('#ecran-vaisseau [data-holo]').classList.contains('guide-cible'));
  q('#ecran-vaisseau [data-holo]').click();
  const pc=E('planeteConseillee().id');
  t('guide : la planète la moins dangereuse est conseillée',E(`galaxie.planetes.every(p=>p.danger>=planeteConseillee().danger)`)&&q(`#carte-svg [data-planete="${pc}"]`).classList.contains('guide-cible'));
  E(`selection='${pc}';tout()`);
  t('guide : étape envoyer, bouton montré',E('etapeGuide()')==='envoyer'&&q('[data-action="envoyer"]').classList.contains('guide-cible'));
  E("etat.params.test=false");
  q('[data-action="envoyer"]').click();
  t('première mission express : une minute',E('etat.mission.express')===true&&E('etat.mission.fin-etat.mission.depart')===E('GUIDE.missionExpressMs'));
  t('le résultat reste celui de la planète (durée réelle mémorisée)',E('etat.mission.dureeH>=DUREE.minH'));
  t('guide : étape attendre, sans main',E('etapeGuide()')==='attendre'&&q('#guide-doigt').style.display==='none');
  horloge.now+=61000;E('tic()');
  t('guide : étape rapport',E('etapeGuide()')==='rapport'&&q('[data-action="rapport"]').classList.contains('guide-cible'));
  const survie=E('etat.mission.resultat.survie');
  const nbLignes=E('etat.mission.resultat.etapes.length');
  q('[data-action="rapport"]').click();

  // --- Rapport animé
  t('rapport : scène dessinée',!!q('#rap-scene svg.scene')&&q('#rap-scene').style.display==='block');
  t('rapport : une vignette par ligne du journal',qa('#rap-scene .marque').length===nbLignes&&qa('#journal li').length===nbLignes);
  t('rapport : toutes les vignettes révélées à la fin (mouvement réduit)',(await dort(),qa('#rap-scene .marque.vue').length===nbLignes));
  t('rapport : le Jimee de la scène est là',!!q('#scene-jimee svg'));
  t('rapport : la main du guide est rangée',q('#guide-doigt').style.display==='none');
  t('les étapes du journal portent leur identifiant',E("etat.journal[0].lignes.filter(l=>l.id).length")>=nbLignes-1);
  t('l\'archive garde la scène',!!E("etat.journal[0].scene&&etat.journal[0].scene.biome"));
  q('#rap-suivant').click();
  t(survie?'bilan vivant : chiffres du butin':'bilan : contrat terminé',survie?!!q('#bilan .butin .butin-chiffres'):!!q('#bilan .butin.fin')&&/Contrat terminé/.test(q('#bilan').textContent));
  t('bilan : les anciennes lignes sont toujours là',/Résultat|Butin perdu/.test(q('#bilan').textContent));
  t('guide terminé après la première mission',E('etat.guide')===false&&!q('#ia').classList.contains('guide'));
  t(survie?'mission réussie : commerce et rapports débloqués':'mort : agence et mémorial débloqués',
    survie?E("etat.deblocages.marche&&etat.deblocages.rapports")===true:E("etat.deblocages.agence&&etat.deblocages.memorial")===true);
  t(survie?'mort : rien à vendre, pas de commerce':'mort : le commerce reste fermé (rien à vendre)',survie?true:!E("etat.deblocages.marche"));
  t('pas d\'annonce par-dessus le rapport',q('#annonce').style.display!=='flex');
  q('#rap-fermer').click();
  t('annonce du service débloqué à la fermeture du rapport',q('#annonce').style.display==='flex'&&/Nouveau/.test(q('#annonce-tampon').textContent)&&q('#annonce-titre').textContent===(survie?'Commerce':'Agence de récupération'));
  q('#annonce-aller').click();
  t('« Aller voir » ouvre le service',survie?E('ecran')==='marche':E("ecran==='corp'&&corpOnglet==='agence'"));

  // --- Seuils suivants
  E("etat.stats.missions=3;etat.stats.morts=0;tout()");
  t('3 missions : atelier, hangar, contrats, succès',E("['atelier','hangar','contrats','succes'].every(k=>etat.deblocages[k])")===true);
  t('expéditions encore fermées (4 missions)',!E('etat.deblocages.expeditions'));
  t('les annonces se suivent une par une',q('#annonce').style.display==='flex');
  E("annonces.length=0;document.querySelector('#annonce').style.display='none';etat.stats.missions=4;tout()");
  t('4 missions : expéditions',E('etat.deblocages.expeditions')===true);

  // --- Labo
  w=ouvrir();E=c=>w.ev(c);
  E("ecran='labo';tout()");
  t('Labo : bouton tout débloquer',!!w.document.querySelector('[data-action="tout-debloquer"]'));
  w.document.querySelector('[data-action="tout-debloquer"]').click();
  t('tout débloquer (test)',E("Object.keys(DEBLOCAGES).every(k=>etat.deblocages[k])")===true);
  t('Labo : réglage du son',!!w.document.querySelector('[data-param="son"]')&&E('etat.son')===true);
  t('bruitage sans AudioContext : aucune erreur',E("(()=>{try{bruit('fanfare');bruit('mort');return true}catch(e){return false}})()")===true);
  E("etat.params.test=true");
  t('mode test : pas de mission express',E('missionExpress()')===false);

  // --- Migration : une partie existante garde tout, sans guide
  const v20=JSON.parse(E('JSON.stringify(etat)'));v20.version=20;delete v20.deblocages;delete v20.guide;delete v20.son;v20.tutoVu=true;
  const W=ouvrir(JSON.stringify(v20));
  t('migration v20 → v21 : tous les services ouverts',W.ev("etat.version===21&&Object.keys(DEBLOCAGES).every(k=>etat.deblocages[k])&&etat.guide===false&&etat.son===true"));
  t('migration : aucune annonce, aucun verrou',W.document.querySelector('#annonce').style.display!=='flex'&&!W.document.querySelector('#ecran-vaisseau .verrou'));

  // --- Simulation : l'identifiant d'étape n'ajoute aucun tirage (même graine = même mission)
  t('déterminisme conservé',W.ev("(()=>{const p=galaxie.planetes[2],j=genererJimee('DET','B');return JSON.stringify(simuler(p,j,'S1'))===JSON.stringify(simuler(p,j,'S1'))})()"));
  t('chaque ligne du journal de mission a un identifiant',W.ev("(()=>{const r=simuler(galaxie.planetes[1],genererJimee('ID','B'),'S2');return r.etapes.every(e=>typeof e.id==='string')})()"));
  t('vignette par étape : catégories connues',W.ev("Object.values(CATEGORIE_ETAPE).every(c=>PICTOS[c])&&['crane','etoile','danger','bulle'].every(c=>PICTOS[c])"));
  // --- Version indépendante : plus aucun lien avec le serveur de Dylan
  t('aucun serveur multijoueur par défaut',W.ev("MULTI.url===''&&MULTI.cle===''&&!multiActif()"));
  const vd=JSON.parse(W.ev('JSON.stringify(etat)'));vd.multi.url='https://zbtoknbzwvbryxmoudcl.supabase.co';vd.multi.cle='sb_publishable_x';vd.multi.partie='JIMEE-DYL42';
  const WD=ouvrir(JSON.stringify(vd));
  t('une sauvegarde reliée à l\'ancien serveur est déconnectée',WD.ev("etat.multi.url===''&&etat.multi.partie===''&&!multiActif()"));
  t('rendu de tous les écrans sans erreur',W.ev("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));

  console.log(`\n${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
})();
