const {ouvrir,horloge,notifs,ntfy}=require('./harness');
(async()=>{
const dort=()=>new Promise(r=>setTimeout(r,30));
const res=[];let erreurs=0;
function ok(nom,cond,detail=''){res.push(`${cond?'✅':'❌'} ${nom}${detail?' — '+detail:''}`);if(!cond)erreurs++}
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let w=ouvrir();
const E=c=>w.ev(c);
const avance=ms=>{horloge.now+=ms};

// ---------- Préparation : recruter + planète G
E(`etat.params.test=false; recruter(); etat.jimee.stats={force:3,endurance:2,agilite:2}; etat.jimee.talents=['mineur','maladroit','sourd'];`);
ok('Recrutement : Jimee créé avec 7 slots vides',E('Object.keys(etat.jimee.equipement).length')===7&&E('objetsEquipes(etat.jimee).length')===0);
ok('Recrutement : 50 cr débités',E('etat.credits')===100);
const pid=E(`(()=>{for(let g=0;g<200;g++){const s=g?'TEST-'+g:'JIMEE-001';const gal=genererGalaxie(s);
  const p=gal.planetes.find(p=>['mine_fer','recolte','filon_rare'].some(x=>p.etapes.includes(x))&&p.etapes.includes('tresor')&&p.etapes.filter(x=>ETAPES_RISQUEES.has(x)).length>=2&&p.classe!=='S');
  if(p){etat.params.galaxie=s;galaxie=gal;return p.id}}})()`);
E(`selection='${pid}'`);

// helper : trouve une seed qui donne un résultat voulu, puis installe la mission terminée
function missionAvec(cond){
  const code=`(()=>{const p=galaxie.planetes.find(x=>x.id==='${pid}');
    for(let i=0;i<20000;i++){const r=simuler(p,etat.jimee,'T/'+i);if((${cond})(r))return i}return -1})()`;
  const i=E(code);
  if(i<0)return null;
  E(`(()=>{const p=galaxie.planetes.find(x=>x.id==='${pid}');const r=simuler(p,etat.jimee,'T/${i}');
     etat.mission={planeteId:p.id,nomPlanete:p.nom,depart:Date.now()-1000,fin:Date.now()-1,resultat:r,notifie:false}})()`);
  return E('etat.mission.resultat');
}
function equiperN(n){
  E(`(()=>{const r=creerRng('KIT${n}'+Math.random());const ordre=['tete','buste','bras_droit','bras_gauche','jambes','sac_stockage','sac_utilitaire'];
    for(const s of SLOTS)etat.jimee.equipement[s.id]=null;
    for(let k=0;k<${n};k++){const sl=SLOTS.find(s=>s.id===ordre[k]);const m=r.pick(CATALOGUE.filter(c=>c.emplacement===sl.accepte));
      etat.jimee.equipement[sl.id]=creerObjet(r,m,1+k,['C','B','A','S'][k%4])}})()`);
}
const recruterNeuf=()=>{E(`etat.jimee=null;etat.credits+=50;recruter();etat.jimee.stats={force:3,endurance:2,agilite:2};etat.jimee.talents=['mineur','maladroit','sourd'];selection='${pid}'`)};

// Test 1 : mission réussie
let avant={c:E('etat.credits'),f:E('totalRessources(etat.ressources)'),inv:E('etat.inventaire.length')};
let r=missionAvec(`r=>r.survie&&totalRessources(r.ressources)>0&&r.objets.length>0`);
E('ouvrirRapport()');
ok('T1 Mission réussie : butin appliqué',E('etat.credits')===avant.c+r.credits&&E('totalRessources(etat.ressources)')===avant.f+Object.values(r.ressources).reduce((a,b)=>a+b,0)&&E('etat.inventaire.length')===avant.inv+r.objets.length&&E('etat.mission')===null&&E('etat.jimee.missions')===1,
  `+${r.credits} cr, ressources ${JSON.stringify(r.ressources)}, +${r.objets.length} objet(s) niv. ${r.objets.map(o=>o.niveau).join('/')}`);
ok('T1 bis : objets trouvés ont emplacement + niveau',r.objets.every(o=>o.emplacement&&o.niveau>=1&&o.niveau<=10));

// Test 2 : mission défavorable (rentré vivant, aucun butin, au moins un événement négatif)
avant={c:E('etat.credits'),f:E('totalRessources(etat.ressources)')};
r=missionAvec(`r=>r.survie&&r.etapes.filter(e=>e.ton==='mauvais').length>=2`);
E('ouvrirRapport()');
ok('T2 Mission défavorable : vivant mais plusieurs revers (perte de butin, outil cassé…)',!!r&&E('etat.credits')===avant.c+r.credits&&E('totalRessources(etat.ressources)')===avant.f+Object.values(r.ressources).reduce((a,b)=>a+b,0)&&E('etat.jimee')!==null,r?r.etapes.filter(e=>e.ton==='mauvais').map(e=>e.txt.slice(0,50)+'…').join(' / '):'');

// Test 3 : Jimee blessé
r=missionAvec(`r=>r.survie&&r.blessures>0`);
E('ouvrirRapport()');
ok('T3 Jimee blessé : blessures comptées et affichées',!!r&&w.document.querySelector('#rap-sous').textContent.includes('blessure'),w.document.querySelector('#rap-sous').textContent);

// Test 4 : mort sans équipement
equiperN(0);let morts=E('etat.morts'),nbAb=E('etat.abandons.length');
r=missionAvec(`r=>!r.survie`);E('ouvrirRapport()');
ok('T4 Mort sans équipement : Jimee perdu, aucun abandon',E('etat.jimee')===null&&E('etat.morts')===morts+1&&E('etat.abandons.length')===nbAb);

// Test 5 : mort avec 1 équipement
recruterNeuf();equiperN(1);let porte=E('objetsEquipes(etat.jimee)');
r=missionAvec(`r=>!r.survie`);E('ouvrirRapport()');
let ab=E('etat.abandons[etat.abandons.length-1]');
ok('T5 Mort avec 1 équipement : 1 objet abandonné identique',ab.objets.length===1&&eq(ab.objets,porte),`${ab.objets[0].nom} niv. ${ab.objets[0].niveau}`);

// Test 6 : mort avec 7 équipements
recruterNeuf();equiperN(7);porte=E('objetsEquipes(etat.jimee)');
r=missionAvec(`r=>!r.survie`);E('ouvrirRapport()');
ab=E('etat.abandons[etat.abandons.length-1]');
ok('T6 Mort avec 7 équipements : 7 objets abandonnés identiques (id, niveau, bonus, rareté…)',ab.objets.length===7&&eq(ab.objets,porte));
await dort();ok('T6 bis : rapport de mort liste les objets restés sur place',w.document.querySelector('#bilan').innerHTML.includes('Restés sur'));

// ---------- Récupérations
// Trouve un instant de lancement qui produit le résultat voulu (le seed dépend de l'heure de lancement)
function lancerAvec(abId,niveau,cond){
  const t=E(`(()=>{const ab=etat.abandons.find(x=>x.id==='${abId}');const id='R'+String(etat.compteurRecup+1).padStart(3,'0');
    for(let k=0;k<50000;k++){const t=Date.now()+k;const res=resoudreRecuperation(ab.objets,${niveau},'RECUP|'+ab.id+'|'+id+'|'+t);if((${cond})(res))return t}return -1})()`);
  if(t<0)return null;
  horloge.now=t;
  E(`lancerRecuperation('${abId}',${niveau})`);
  return E('etat.recuperations[etat.recuperations.length-1]');
}
function nouvelAbandon(n){recruterNeuf();equiperN(n);missionAvec(`r=>!r.survie`);E('ouvrirRapport()');return E('etat.abandons[etat.abandons.length-1]')}
const idsPartout=()=>E(`[...etat.inventaire.map(o=>o.id),...etat.abandons.flatMap(a=>a.objets.map(o=>o.id)),...etat.recuperations.filter(x=>x.statut==='en_cours').flatMap(x=>x.objets.map(o=>o.id)),...(etat.jimee?objetsEquipes(etat.jimee).map(o=>o.id):[])]`);
const sansDoublon=()=>{const ids=idsPartout();return ids.length===new Set(ids).size};

// Test 7 + 11 : niveau 1, retour + 100 %
// V13 : l'agence niveau 3 exige le rang « Associé » (REPUTATION.agence3) depuis la V12
E('etat.reputation=1000');
E('etat.credits=100000');
let rec=lancerAvec(ab.id,1,`r=>r.succes&&r.part===1&&r.recupereIds.length>0&&r.perduIds.length>0`);
let prix=E(`prixAgence(agence(1),etat.recuperations[etat.recuperations.length-1].objets)`);
ok('T7 Récupération niveau 1 lancée : facturée, objets retirés des abandons',rec&&rec.statut==='en_cours'&&E('etat.credits')===100000-prix&&!E(`etat.abandons.some(a=>a.id==='${ab.id}')`),`prix ${prix} cr pour Σniv=${ab.objets.reduce((s,o)=>s+o.niveau,0)}`);
ok('T7 bis : durée = 5 min exactement',rec.fin-rec.debut===300000);
ok('T7 ter : relancer sur le même abandon est impossible',(E(`lancerRecuperation('${ab.id}',1)`),E('etat.recuperations.length'))===1);
let invAvant=E('etat.inventaire.length');
avance(299000);E('tic()');
ok('T7 quater : rien avant 5 min',E(`etat.recuperations[0].statut`)==='en_cours'&&E('etat.inventaire.length')===invAvant);
avance(1000);E('tic()');
rec=E('etat.recuperations[0]');
ok('T11 100 % des slots : 7 objets tentés',rec.resultat.nbTentes===7&&rec.resultat.nonTenteIds.length===0);
let recupObjs=E(`etat.inventaire.filter(o=>${JSON.stringify(rec.resultat.recupereIds)}.includes(o.id))`);
ok('T15 Réussite individuelle : objets réintégrés à l\'identique',recupObjs.length===rec.resultat.recupereIds.length&&recupObjs.every(o=>eq(o,ab.objets.find(x=>x.id===o.id))));
ok('T14 Échec individuel : objets perdus absents partout',rec.resultat.perduIds.length>0&&!idsPartout().some(id=>rec.resultat.perduIds.includes(id)));
ok('T7 fin : statut terminee + notification',rec.statut==='terminee'&&notifs.some(n=>n.includes('récupération est revenue')));
// rapport
E(`ouvrirRapportRecup('${rec.id}')`);
await dort();let rapport=w.document.querySelector('#journal').textContent+w.document.querySelector('#bilan').textContent;
ok('T7 rapport : jets, objets, phrase humoristique',rapport.includes('Jet 1')&&rapport.includes('Jet 2')&&rapport.includes('Récupérés')&&rapport.includes('«')&&E(`etat.recuperations[0].lu`)===true);

// Test 19 : duplication
let invN=E('etat.inventaire.length');
E('finaliserRecuperations();finaliserRecuperations();tic()');
let sauv=E(`localStorage.getItem('jimee-v1')`);w.close();w=ouvrir(sauv);
ok('T19 Anti-duplication : refinaliser + recharger ne duplique rien',E('etat.inventaire.length')===invN&&sansDoublon());

// Test 8 + 12 : niveau 2, tranche 75 %
ab=nouvelAbandon(7);E('etat.credits=100000');
rec=lancerAvec(ab.id,2,`r=>r.succes&&r.part===.75`);
avance(300000);E('tic()');rec=E(`etat.recuperations.find(x=>x.id==='${rec.id}')`);
let abApres=E(`etat.abandons.find(a=>a.id==='${ab.id}')`);
ok('T8 Récupération niveau 2 + T12 75 % : 6 objets tentés sur 7',rec.resultat.nbTentes===6&&rec.statut==='terminee');
// V12 : règle « une seule tentative » (RECUP.nonTentesRestentSurPlace) — l'objet non tenté est perdu si le réglage est à false
ok(E('RECUP.nonTentesRestentSurPlace')?'T12 bis : l\'objet non tenté reste sur la planète':'T12 bis : une seule tentative, l\'objet non tenté est perdu',E('RECUP.nonTentesRestentSurPlace')?(abApres&&abApres.objets.length===1&&abApres.objets[0].id===rec.resultat.nonTenteIds[0]):(!abApres||abApres.objets.length===0));
ok('T8 bis : bonus +10 % appliqué',rec.resultat.essais.every(e=>e.chance===Math.min(100,E(`RECUP.chanceObjetParNiveau[${[...(rec.objets||[]),...ab.objets].find(o=>o.id===e.id).niveau}]`)+10+(ab.bonusBalise||0))));

// Test 9 + 13 : niveau 3, tranche 50 %
ab=nouvelAbandon(7);E('etat.credits=100000');
rec=lancerAvec(ab.id,3,`r=>r.succes&&r.part===.5`);
avance(300000);E('tic()');rec=E(`etat.recuperations.find(x=>x.id==='${rec.id}')`);
ok('T9 Récupération niveau 3 + T13 50 % : 4 objets tentés sur 7 (ceil 3,5)',rec.resultat.nbTentes===4,`tentés ${rec.resultat.nbTentes}, objets ${ab.objets.length}`);
ok('T9 bis : bonus +20 %, plafond 100 %',rec.resultat.essais.every(e=>e.chance<=100&&e.chance===Math.min(100,E(`RECUP.chanceObjetParNiveau[${[...(rec.objets||[]),...ab.objets].find(o=>o.id===e.id).niveau}]`)+20+(ab.bonusBalise||0))),JSON.stringify(rec.resultat.essais.map(e=>[e.chance,[...(rec.objets||[]),...ab.objets].find(o=>o.id===e.id)?.niveau])));
ok('T13 bis : sélection aléatoire (pas toujours les premiers)',(()=>{const ids=E(`etat.recuperations.find(x=>x.id==='${rec.id}').objets.map(o=>o.id)`);return !eq(rec.resultat.essais.map(e=>e.id),ids.slice(0,4))})());

// Test 10 : échec du premier jet
E(`etat.abandons=etat.abandons.filter(a=>a.id!=='${ab.id}')`);
ab=nouvelAbandon(3);E('etat.credits=100000');
rec=lancerAvec(ab.id,1,`r=>!r.succes`);
avance(300000);E('tic()');rec=E(`etat.recuperations.find(x=>x.id==='${rec.id}')`);
E(`ouvrirRapportRecup('${rec.id}')`);await dort();
ok('T10 Échec du jet 1 : aucun objet récupéré'+(E('RECUP.echecEquipeLaisseLesObjets')?', objets toujours sur place':', objets perdus (une seule tentative)'),rec.resultat.recupereIds.length===0&&E(`(etat.abandons.find(a=>a.id==='${ab.id}')||{objets:[]}).objets.length`)===(E('RECUP.echecEquipeLaisseLesObjets')?3:0)&&w.document.querySelector('#bilan').textContent.includes('qui avait autorisé'));
ok('T10 bis : notification d\'échec',notifs.some(n=>n.includes("n'est pas revenue")));

// Test 16, 17, 18 : fermeture / rechargement
E(`etat.abandons=[]`);
ab=nouvelAbandon(5);E('etat.credits=100000');
rec=lancerAvec(ab.id,2,`r=>r.succes`);
const resultatVerrouille=rec.resultat;
avance(120000);
sauv=E(`localStorage.getItem('jimee-v1')`);w.close();w=ouvrir(sauv);
let recR=E(`etat.recuperations.find(x=>x.id==='${rec.id}')`);
ok('T17 Rechargement pendant la récupération : toujours en cours, résultat identique',recR.statut==='en_cours'&&eq(recR.resultat,resultatVerrouille));
ok('T17 bis : timer recalculé depuis le timestamp (reste 3 min)',w.document.querySelector('#statut').textContent.includes('3 min 00 s'));
sauv=E(`localStorage.getItem('jimee-v1')`);w.close();
avance(10*60000);  // jeu fermé 10 minutes
w=ouvrir(sauv);
recR=E(`etat.recuperations.find(x=>x.id==='${rec.id}')`);
ok('T16 + T18 Fermeture : résultat appliqué au retour dans le jeu',recR.statut==='terminee'&&eq(recR.resultat,resultatVerrouille)&&resultatVerrouille.recupereIds.every(id=>E(`etat.inventaire.some(o=>o.id==='${id}')`)));
ok('T18 bis : bouton "Rapport de récupération" visible',w.document.querySelector('#statut').textContent.includes('Rapport de récupération'));

// Test 20 : plusieurs récupérations + limite simultanée
E('etat.abandons=[];etat.recuperations=[]');
const abs=[nouvelAbandon(2),nouvelAbandon(4),nouvelAbandon(6),nouvelAbandon(3)];E('etat.credits=100000');
E(`lancerRecuperation('${abs[0].id}',1)`);avance(60000);
E(`lancerRecuperation('${abs[1].id}',2)`);avance(60000);
E(`lancerRecuperation('${abs[2].id}',3)`);
E(`lancerRecuperation('${abs[3].id}',1)`);
ok('T20 Plusieurs récupérations : 3 en parallèle, la 4e bloquée par la limite',E(`recupsActives().length`)===3&&E(`etat.abandons.some(a=>a.id==='${abs[3].id}')`),`actives ${E('recupsActives().length')}, abs ${JSON.stringify(abs.map(a=>a&&a.objets.length))}`);
avance(181000);E('tic()');
const t1=E(`etat.recuperations.filter(x=>x.statut==='terminee').length`);avance(60000);E('tic()');const t2=E(`etat.recuperations.filter(x=>x.statut==='terminee').length`);
ok('T20 bis : elles se terminent chacune à leur heure (1 puis 2 puis 3)',t1===1&&t2===2);
avance(60000);E('tic()');
ok('T20 ter : intégrité globale, aucun doublon d\'ID',E('recupsActives().length')===0&&sansDoublon());

// Prix insuffisants
E('etat.credits=0');const nR=E('etat.recuperations.length');E(`lancerRecuperation('${abs[3].id}',1)`);
ok('Crédits insuffisants : lancement refusé',E('etat.recuperations.length')===nR);
// Laisser sur place
E(`laisserSurPlace('${abs[3].id}')`);
ok('Laisser sur place : abandon supprimé',!E(`etat.abandons.some(a=>a.id==='${abs[3].id}')`));

// ---------- Équiper / retirer
recruterNeuf();E(`etat.inventaire=[]`);
E(`(()=>{const r=creerRng('EQ');etat.inventaire.push(creerObjet(r,CATALOGUE.find(m=>m.emplacement==='bras'),3,'B'),creerObjet(r,CATALOGUE.find(m=>m.emplacement==='bras'),2,'C'),creerObjet(r,CATALOGUE.find(m=>m.effet==='capacite'),4,'B'))})()`);
const ids=E('etat.inventaire.map(o=>o.id)');
E(`equiper('${ids[0]}','bras_gauche');equiper('${ids[1]}');equiper('${ids[2]}')`);
ok('Équiper : bras gauche choisi, 2e arme en bras droit, sac de stockage',E('etat.jimee.equipement.bras_gauche.id')===ids[0]&&E('etat.jimee.equipement.bras_droit.id')===ids[1]&&E('capaciteCargaison(etat.jimee)')>E('SAC.emplacementsBase'));   // V9 : sac en emplacements
E(`retirer('bras_gauche')`);
ok('Retirer : objet renvoyé en soute',E('etat.jimee.equipement.bras_gauche')===null&&E(`etat.inventaire.some(o=>o.id==='${ids[0]}')`));
E(`etat.mission={fin:Date.now()+1e6,depart:Date.now(),resultat:{},nomPlanete:'x',planeteId:'P0'};retirer('bras_droit')`);
ok('Équipement verrouillé pendant une mission',E('etat.jimee.equipement.bras_droit')!==null);
E('etat.mission=null');

// ---------- Ressources
const obtenues=E(`(()=>{const vu={};let depasse=0;
  for(let g=0;g<40;g++){const gal=genererGalaxie('RES'+g);
    for(const p of gal.planetes)for(let i=0;i<40;i++){const j=genererJimee('RJ'+g+p.id+i);j.stats={force:6,endurance:6,agilite:6};j.talents=['nageur','mineur','grimpeur'];
      const res=simuler(p,j,'RS'+g+p.id+i);for(const id in res.ressources)vu[id]=(vu[id]||0)+res.ressources[id];
      if(emplacementsOccupes(res.ressources,res.objets.length)>res.capacite)depasse++}}
  return {vu,depasse}})()`);
ok('Toutes les ressources sont obtenables en mission',Object.keys(obtenues.vu).length===E('RESSOURCES.length'),Object.keys(obtenues.vu).length+' / '+E('RESSOURCES.length'));
ok('La cargaison ne dépasse jamais la capacité',obtenues.depasse===0);
ok('Registre : chaque étape des biomes a un événement',E(`BIOMES.every(b=>Object.keys(b.etapes).every(id=>EVENEMENTS[id]))&&BIOMES.every(b=>Object.keys(b.ressources).every(id=>RES[id]))`));
E(`etat.ressources={fer:5,perle:2,helium3:1};etat.credits=0`);
E(`vendreRessource('perle')`);
ok('Vente à l\'unité : perles vendues au prix configuré',E('etat.credits')===80&&E('etat.ressources.perle')===undefined);
E(`vendreTout()`);
ok('Tout vendre : soute vidée, crédits corrects',E('etat.credits')===80+5*4+18&&E('totalRessources(etat.ressources)')===0);
// ancienne mission en cours (format V2 avec r.fer) toujours lisible
recruterNeuf();E(`etat.ressources={};etat.mission={planeteId:'P0',nomPlanete:'Ancienne',depart:Date.now()-2,fin:Date.now()-1,notifie:true,resultat:{etapes:[{h:0,ton:'neutre',txt:'x'}],survie:true,fer:7,credits:3,objets:[],blessures:0}};ouvrirRapport()`);
ok('Mission lancée avant la mise à jour : fer appliqué correctement',E('etat.ressources.fer')===7);

// ---------- Univers, scanner, carburant
E(`etat.mission=null;etat.params.galaxie='JIMEE-001';univers=genererUnivers('JIMEE-001');etat.galaxieActuelle='G0';etat.galaxiesVisitees=['G0'];etat.vaisseau={carburant:100,reservoir:1,scanner:1};galaxie=chargerGalaxie();cacheInfoGal.clear()`);
ok('Univers déterministe : même graine = mêmes galaxies',E(`JSON.stringify(genererUnivers('JIMEE-001'))===JSON.stringify(genererUnivers('JIMEE-001'))`)&&E('univers.galaxies.length')===70);
ok('Galaxie de départ identique à l\'ancienne galaxie unique (planètes inchangées)',E(`JSON.stringify(chargerGalaxie(univers.galaxies[0]).planetes.map(p=>[p.nom,p.danger,p.etapes]))===JSON.stringify(genererGalaxie('JIMEE-001').planetes.map(p=>[p.nom,p.danger,p.etapes]))`));
const vis=E(`(()=>{const c={connue:0,faible:0,invisible:0};for(const g of univers.galaxies){const v=visibilite(g);c[v||'invisible']++}return c})()`);
ok('Scanner niveau 1 : galaxies voisines identifiées, les lointaines invisibles',vis.connue>=5&&vis.invisible>30,JSON.stringify(vis));
ok('Plus on s\'éloigne, plus les planètes sont dangereuses',E(`(()=>{const tri=[...univers.galaxies].sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y));const moy=l=>l.reduce((s,g)=>s+infoGalaxie(g).dangerMoyen,0)/l.length;return moy(tri.slice(-10))>moy(tri.slice(0,10))+20})()`));
const cible=E(`univers.galaxies.filter(g=>g.id!=='G0'&&visibilite(g)==='connue').sort((a,b)=>distanceGal(univers.galaxies[0],a)-distanceGal(univers.galaxies[0],b))[0].id`);
const besoin=E(`carburantNecessaire(galaxieCourante(),galaxieParId('${cible}'))`), dist=E(`distanceGal(galaxieCourante(),galaxieParId('${cible}'))`);
ok('Formule carburant = ceil(5 + 0,4 × distance)',besoin===Math.ceil(5+.4*dist),`${dist} kAL → ${besoin} unités`);
E(`etat.mission={fin:Date.now()+1e6,depart:Date.now(),resultat:{},nomPlanete:'x',planeteId:'P0'};voyager('${cible}')`);
ok('Voyage bloqué pendant une mission',E('etat.galaxieActuelle')==='G0');
E(`etat.mission=null;etat.vaisseau.carburant=${besoin-1};voyager('${cible}')`);
ok('Voyage bloqué si carburant insuffisant',E('etat.galaxieActuelle')==='G0'&&E(`raisonVoyageImpossible(galaxieParId('${cible}'))`).includes('il manque 1'));
const loin=E(`univers.galaxies.find(g=>visibilite(g)===null).id`);
E(`etat.vaisseau.carburant=100;voyager('${loin}')`);
ok('Voyage impossible vers une galaxie invisible',E('etat.galaxieActuelle')==='G0');
E(`etat.credits=0;etat.vaisseau.carburant=10;acheterCarburant(50)`);
ok('Achat de carburant gratuit en phase de test',E('etat.vaisseau.carburant')===60&&E('etat.credits')===0);
E(`acheterCarburant(1000)`);
ok('Plein : jamais au-delà de la capacité du réservoir',E('etat.vaisseau.carburant')===100);
E(`voyager('${cible}');finirVoyageTest()`);   // V18 : le voyage prend du temps ; l'outil de test fait arriver tout de suite
ok('Saut effectué : carburant déduit, nouvelle galaxie chargée, visite mémorisée',E('etat.galaxieActuelle')===cible&&E('etat.vaisseau.carburant')===100-besoin&&E(`etat.galaxiesVisitees.includes('${cible}')`)&&E(`galaxie.planetes.length`)===E(`galaxieParId('${cible}').nbPlanetes`));
ok('La galaxie de départ reste identifiée une fois quittée',E(`visibilite(galaxieParId('G0'))`)==='connue');
const avantScan=E(`univers.galaxies.filter(g=>visibilite(g)==='connue').length`);
E(`BOUTIQUE_TEST.ressourcesAmeliorationsGratuites=true;ameliorer('scanner');ameliorer('scanner');ameliorer('reservoir')`);   // V12 : les améliorations coûtent aussi des ressources
ok('Améliorer le scanner révèle plus de galaxies',E(`univers.galaxies.filter(g=>visibilite(g)==='connue').length`)>avantScan&&E('etat.vaisseau.scanner')===3&&E('reservoir().capacite')===E('RESERVOIRS[1].capacite'));
let sv=E(`localStorage.getItem('jimee-v1')`);w.close();w=ouvrir(sv);
ok('Rechargement : position, carburant et niveaux conservés',E('etat.galaxieActuelle')===cible&&E('etat.vaisseau.scanner')===3&&E(`galaxie.planetes[0].nom`)===E(`chargerGalaxie(galaxieParId('${cible}')).planetes[0].nom`));
let uiU=true;try{E(`ecran='carte';carteVue='univers';tout();selectionGalaxie=univers.galaxies.find(g=>visibilite(g)==='faible')?.id;tout();selectionGalaxie='G0';tout();zoomer('tout');zoomer('plus');zoomer('moi');carteVue='univers';tout()`);uiU=uiU&&w.document.body.textContent.includes('Réservoir');E(`carteVue='galaxie';tout();ecran='hangar';tout();ecran='corp';tout()`)}catch(e){uiU=false;console.log(e)}
// V12 : la boutique du vaisseau est passée au hangar ; le réservoir est affiché dans la vue univers
ok('Rendu vue univers, signal faible, zoom, hangar et Corp sans erreur',uiU);

// ---------- Rendu UI de chaque écran (aucune exception)
let uiOk=true;try{for(const e of ['vaisseau','carte','jimee','corp','labo']){E(`ecran='${e}';jimeeStatsSeules=false;tout()`)}E(`ecran='jimee';jimeeStatsSeules=true;tout()`)}catch(e){uiOk=false;console.log(e)}
ok('Rendu de tous les écrans sans erreur',uiOk);

// ---------- Migration d'une sauvegarde V1
w.close();
const v1=JSON.stringify({credits:80,fer:3,inventaire:[{id:'O1',nom:'Bottes à ressorts',rarete:'B',stat:'agilite',bonus:2},{id:'O2',nom:'Thermos infini',rarete:'A',stat:'endurance',bonus:3}],
  jimee:{id:'J1',nom:'Bimzo',matricule:'G-1',classe:'G',stats:{force:2,endurance:1,agilite:3},talents:['nageur','sourd','myope'],objet:{id:'O3',nom:'Marteau rouillé',rarete:'S',stat:'force',bonus:5},missions:4},
  mission:null,compteur:5,morts:1,params:{galaxie:'JIMEE-001',test:true,ntfy:''},ia:'x'});
w=ouvrir(v1);
ok('Migration V1 → V2 : objet équipé placé au bon slot, bonus conservé',E('etat.jimee.equipement.bras_droit.id')==='O3'&&E('etat.jimee.equipement.bras_droit.bonus')===5&&E('etat.jimee.equipement.bras_droit.niveau')===7);
ok('Migration V1 → actuelle : le fer devient une ressource, réservoir plein, galaxie de départ',E('etat.ressources.fer')===3&&E('etat.fer')===undefined&&E('etat.version')===E('CONFIG.versionSauvegarde')&&E('etat.vaisseau.carburant')===100&&E('etat.galaxieActuelle')==='G0');
ok('Migration V1 → V2 : inventaire converti (Thermos → sac utilitaire)',E(`etat.inventaire.find(o=>o.id==='O2').emplacement`)==='sac_utilitaire'&&E(`etat.inventaire.find(o=>o.id==='O1').emplacement`)==='jambes'&&E('etat.credits')===80);

// ---------- Probabilités mesurées (100 000 tirages par agence, 7 objets niveaux 1..7)
const stats=E(`(()=>{const r=creerRng('X');const objs=[1,2,3,4,5,6,7].map(n=>creerObjet(r,CATALOGUE[0],n,'C'));const out={};
  for(const ag of RECUP.agences){let ret=0;const tr={};let okN={},tentN={};
    for(let i=0;i<100000;i++){const x=resoudreRecuperation(objs,ag.niveau,'S'+ag.niveau+'/'+i);
      if(x.succes){ret++;tr[x.part]=(tr[x.part]||0)+1;for(const e of x.essais){const n=objs.find(o=>o.id===e.id).niveau;tentN[n]=(tentN[n]||0)+1;if(e.ok)okN[n]=(okN[n]||0)+1}}}
    out[ag.niveau]={retour:(ret/1000).toFixed(1),t100:(tr[1]/ret*100).toFixed(1),t75:(tr[.75]/ret*100).toFixed(1),t50:(tr[.5]/ret*100).toFixed(1),
      niv1:(okN[1]/tentN[1]*100).toFixed(1),niv5:(okN[5]/tentN[5]*100).toFixed(1),niv7:(okN[7]/tentN[7]*100).toFixed(1)}}
  return out})()`);
for(const n of [1,2,3]){const s=stats[n];res.push(`📊 Agence ${n} : retour ${s.retour} % | tranches 100/75/50 : ${s.t100}/${s.t75}/${s.t50} % | objet niv.1 ${s.niv1} %, niv.5 ${s.niv5} %, niv.7 ${s.niv7} %`)}

// ---------- Équilibrage : simulateur du Labo
E(`ecran='labo';tout();lancerSimulation()`);
const lignes=[...w.document.querySelectorAll('#sim tr')].map(tr=>[...tr.children].map(c=>c.textContent).join(' | '));
res.push('📊 Simulateur (galaxie JIMEE-001) :',...lignes.map(l=>'   '+l));

console.log(res.join('\n'));console.log(`\n${erreurs?erreurs+' ÉCHEC(S)':'TOUS LES TESTS PASSENT'}`);
process.exit(erreurs?1:0);
})();
