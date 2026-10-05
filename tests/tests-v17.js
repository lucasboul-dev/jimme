// Tests V17 — mode à deux (position, missions, épaves, pillage) avec un serveur Supabase factice partagé. Lancer : node tests/tests-v17.js
const {ouvrir,horloge}=require('./harness.js');const {creerServeur}=require('./serveur-factice.js');
globalThis.__horloge=()=>horloge.now;
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
(async()=>{
const srv=creerServeur();
const fen=nom=>{const w=ouvrir();w.fetch=srv.fetch;w.ev(`etat.multi.url='https://faux.supabase.co';etat.multi.cle='sb_publishable_test';etat.multi.pseudo='${nom}';etat.multi.partie='JIMEE-TEST';etat.credits=50000;sauver()`);return w};
const A=fen('Dylan'),B=fen('Ami');const EA=c=>A.ev(c),EB=c=>B.ev(c);
const sync=async w=>{await w.ev('(derniereSync=0,synchroniser(true))');};
const txt=w=>{const b=w.document.body.cloneNode(true);b.querySelectorAll('script,style').forEach(x=>x.remove());return b.textContent.replace(/\s+/g,' ')};
t('sans réglages : mode à deux inactif (jeu inchangé)',ouvrir().ev('multiActif()')===false);
t('identifiants de joueur différents',EA('etat.multi.id')!==EB('etat.multi.id'));
await sync(A);await sync(B);await sync(A);
t('A voit son ami',EA("amis.length===1&&amis[0].pseudo==='Ami'"));
t('connexion signalée dans le Labo',(EA("ecran='labo';tout()"),/Connecté/.test(txt(A))&&/Ami/.test(txt(A))));
// B voyage
const autre=EB("univers.galaxies.find(g=>g.id!=='G0'&&visibilite(g)==='connue').id");
EB(`etat.vaisseau.carburant=reservoir().capacite;voyager('${autre}');finirVoyageTest()`);await sync(B);await sync(A);
t('position de l\'ami à jour après son voyage',EA(`amis[0].galaxie==='${autre}'`));
EA("ecran='carte';carteVue='univers';tout()");
t('carte univers : marqueur de l\'ami',!!A.document.querySelector('.ami-univers'));
// B revient en G0 et part en mission
EB("etat.vaisseau.carburant=reservoir().capacite;voyager('G0');finirVoyageTest();etat.jimee=genererJimee('AMI1','G');etat.params.test=false;selection=galaxie.planetes[2].id;envoyer()");await sync(B);await sync(A);
EA("ecran='carte';carteVue='galaxie';tout()");
t('carte galaxie : trajet de la mission de l\'ami',!!A.document.querySelector('.ami-carte'));
EA("selection=galaxie.planetes[2].id;tout()");
t('fiche planète : mission de l\'ami signalée',/Ami a un Jimee en mission ici/.test(txt(A)));
// Mort du Jimee de B (abandon réel)
EB("(()=>{const j=etat.jimee,r=creerRng('EQ');for(const sl of SLOTS.slice(0,4))j.equipement[sl.id]=creerObjet(r,CATALOGUE.find(m=>m.emplacement===sl.accepte)||CATALOGUE[0],2,'B');etat.mission.resultat={...etat.mission.resultat,survie:false,heureMort:5,causeMort:'lac',cargaisonPerdue:{},etapes:[{h:0,ton:'neutre',txt:'x'}]};etat.mission.fin=Date.now()-1;ouvrirRapport()})()");
t('B : abandon créé avec sa galaxie',EB("etat.abandons.length===1&&etat.abandons[0].galaxie==='G0'"));
await sync(B);await sync(A);
t('A voit l\'épave de B avec ses objets',EA("epavesAmis.length===1&&epavesAmis[0].objets.length===4"));
t('A reçoit la transmission de la mort',/Transmission de Ami/.test(EA('etat.ia'))&&/perdu/.test(EA('etat.ia')));
EA("ecran='carte';carteVue='galaxie';selection=null;tout()");
t('carte galaxie : marque sur la planète de l\'épave',!!A.document.querySelector('.epave-marque'));
EA("ecran='corp';corpOnglet='agence';tout()");
t('agence : section « Épaves de vos amis »',/Épaves de vos amis/.test(txt(A))&&!!A.document.querySelector('[data-action=piller]'));
// Pillage
const cr0=EA('etat.credits');
await EA("piller(epavesAmis[0].id,2)");
t('pillage lancé et facturé',EA("recupsActives().length===1&&recupsActives()[0].pillage===true")&&EA('etat.credits')<cr0);
const res=JSON.parse(EA("JSON.stringify(recupsActives()[0].resultat)"));
t('serveur : tentative enregistrée',srv.db.epaves[0].tentatives.length===1);
t('serveur : objets rapportés ou détruits retirés de l\'épave',JSON.stringify([...srv.db.epaves[0].pilles].sort())===JSON.stringify(res.succes?[...res.recupereIds,...res.perduIds].sort():[]));
const cr1=EA('etat.credits');await EA("piller(epavesAmis.length?epavesAmis[0].id:'x',1)");
t('deuxième tentative refusée, rien facturé',EA('etat.credits')===cr1&&EA('recupsActives().length')===1);
await sync(B);
t('B : les objets pillés disparaissent de son abandon',EB(`(()=>{const ab=etat.abandons[0];const pil=${JSON.stringify(srv.db.epaves[0].pilles)};return pil.length?(!ab||ab.objets.every(o=>!pil.includes(o.id))):true})()`));
t('B : notifié du pillage',/piller/.test(EB('etat.ia')));
// B peut encore tenter sa propre récupération sur ce qui reste
const reste=EB("etat.abandons.length?etat.abandons[0].objets.length:0");
if(reste){EB("lancerRecuperation(etat.abandons[0].id,1)");t('B : sa propre tentative reste possible',EB("recupsActives().length===1"))}else t('B : épave entièrement vidée (rien à tenter)',true);
await sync(B);await sync(A);
t('épave vide ou entamée : plus proposée deux fois à A',EA("!epavesAmis.length||epavesAmis[0].tentatives.includes(etat.multi.id)"));
// Livraison du pillage chez A
const inv0=EA('etat.inventaire.length');horloge.now+=6*60*1000;EA('tic()');
t('pillage livré : objets rapportés dans la soute de A',EA('etat.inventaire.length')===inv0+(res.succes?res.recupereIds.length:0));
t('aucun objet « remis » chez A',EA('etat.abandons.length')===0);
EA("ouvrirRapportRecup(etat.recuperations.find(r=>r.pillage).id)");await new Promise(r=>setTimeout(r,100));
t('rapport du pillage lisible',/Rapport/.test(A.document.querySelector('#rap-titre').textContent)&&A.document.querySelector('#journal').children.length>0);
// Course : l'épave change entre la lecture et le pillage
EB("(()=>{const j=genererJimee('AMI2','G'),r=creerRng('EQ2');etat.jimee=j;j.equipement.tete=creerObjet(r,CATALOGUE.find(m=>m.emplacement==='tete'),2,'C');j.equipement.buste=creerObjet(r,CATALOGUE.find(m=>m.emplacement==='buste'),2,'C');etat.abandons.push({id:'AB099',planeteId:'P1',galaxie:'G0',nomPlanete:galaxie.planetes[1].nom,nomGalaxie:galaxieCourante().nom,jimeeId:j.id,jimeeNom:j.nom,date:Date.now(),objets:objetsEquipes(j).map(o=>({...o}))})})()");
await sync(B);await sync(A);
EB("etat.abandons.find(a=>a.id==='AB099').objets.pop()");await sync(B);   // B a modifié son épave ; A a encore l'ancienne version
const cr2=EA('etat.credits');await EA("piller(epavesAmis.find(e=>e.id.endsWith('AB099')).id,1)");
t('épave modifiée entre-temps : refus, rien facturé',EA('etat.credits')===cr2&&/a changé/.test(EA('etat.ia')));
// Coupure réseau
await new Promise(r=>setTimeout(r,100));srv.db.enPanne=true;await sync(A);
t('réseau coupé : le jeu continue, statut hors connexion',EA('multiInfo.ok')===false&&(EA("ecran='labo';tout()"),/Hors connexion/.test(txt(A))));
const cr3=EA('etat.credits');srv.db.enPanne=true;await EA("piller(epavesAmis[0].id,1)");
t('réseau coupé : pillage refusé sans facturation',EA('etat.credits')===cr3);
srv.db.enPanne=false;await sync(A);
t('reconnexion automatique',EA('multiInfo.ok')===true);
// Migration
const v15=JSON.parse(EA('JSON.stringify(etat)'));v15.version=15;delete v15.multi;
const W=ouvrir(JSON.stringify(v15));t('migration sauvegarde 15 → 16 : bloc multi créé',W.ev("etat.version===CONFIG.versionSauvegarde&&typeof etat.multi.id==='string'&&etat.multi.partie===''"));
t('rendu de tous les écrans sans erreur',EA("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
})();
