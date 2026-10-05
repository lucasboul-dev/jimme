// Tests V16 — correctif : cartographie, stock d'équipements et tombes propres à chaque galaxie. Lancer : node tests/tests-v16.js
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);
const autre=E("univers.galaxies.find(g=>g.id!=='G0'&&visibilite(g)==='connue').id");
t('clé de cartographie = univers / galaxie / planète',E("cleCarto(galaxie.planetes[3])")===E("etat.params.galaxie")+'/G0/P3');
// Mission réelle en G0, puis voyage
E("etat.credits=9999;etat.jimee=genererJimee('C1','S')");
E("etat.mission=null;etat.cartographie[cleCarto(galaxie.planetes[3])]=2;etat.equipementsPris[cleCarto(galaxie.planetes[3])]=1");
const stock0=E("stockRestant(galaxie.planetes[3])");
E(`etat.vaisseau.carburant=reservoir().capacite;voyager('${autre}');finirVoyageTest()`);
t('voyage effectué',E("etat.galaxieActuelle")===autre);
t('nouvelle galaxie : aucune planète cartographiée',E("galaxie.planetes.every(p=>!(etat.cartographie[cleCarto(p)]>0))"));
t('nouvelle galaxie : aucune escouade possible',E("planetesExpedition().length===0"));
t('nouvelle galaxie : stock d\'équipements intact',E("stockRestant(galaxie.planetes[3])===galaxie.planetes[3].stockEquipements"));
E("ecran='carte';selection=galaxie.planetes[3].id;tout()");
const txt=()=>{const b=w.document.body.cloneNode(true);b.querySelectorAll('script,style').forEach(x=>x.remove());return b.textContent.replace(/\s+/g,' ')};
t('fiche : planète homonyme vierge (ni étapes ni cartographie)',!/Étapes/.test(w.document.querySelector('#panneau-carte').textContent)&&/Carto\.\s*0\s*\/\s*2/.test(txt()));   // V20
E("etat.vaisseau.carburant=reservoir().capacite;voyager('G0');finirVoyageTest()");
t('retour en G0 : cartographie conservée',E("etat.cartographie[cleCarto(galaxie.planetes[3])]===2")&&E("stockRestant(galaxie.planetes[3])")===stock0);
// Tombes
E("etat.memorial=[{type:'mort',nom:'Glopi',planeteId:'P2',galaxie:'G0',planete:galaxie.planetes[2].nom}]");
t('tombe propre à sa galaxie (G0)',E("etat.memorial.filter(x=>x.planeteId==='P2'&&(x.galaxie?x.galaxie===etat.galaxieActuelle:x.planete===galaxie.planetes[2].nom)).length")===1);
E(`etat.vaisseau.carburant=reservoir().capacite;voyager('${autre}');finirVoyageTest()`);
t('(voyage) '+E('etat.galaxieActuelle'),E('etat.galaxieActuelle')!=='G0');
t('pas de tombe sur la planète homonyme d\'une autre galaxie',E("etat.memorial.filter(x=>x.planeteId==='P2'&&(x.galaxie?x.galaxie===etat.galaxieActuelle:x.planete===galaxie.planetes[2].nom)).length")===0);

// Migration d'une sauvegarde 14 (anciennes clés sans galaxie)
w=ouvrir();E=c=>w.ev(c);
const seed=E("etat.params.galaxie");
const nomAutreP1=E(`chargerGalaxie(galaxieParId('${autre}')).planetes[1].nom`);
const s14=JSON.parse(E("JSON.stringify(etat)"));
s14.version=14;s14.galaxiesVisitees=['G0',autre];s14.galaxieActuelle=autre;
s14.cartographie={[seed+'/P0']:3,[seed+'/P1']:2,[seed+'/P5']:1};
s14.equipementsPris={[seed+'/P1']:2};
s14.memorial=[{type:'mort',nom:'Bimzo',planeteId:'P1',planete:nomAutreP1}];
w=ouvrir(JSON.stringify(s14));E=c=>w.ev(c);
t("migration : sauvegarde à jour",E("etat.version===CONFIG.versionSauvegarde&&!etat.cartoAMigrer"));
t('migration : sans indice → galaxie de départ',E(`etat.cartographie['${seed}/G0/P0']===3&&etat.cartographie['${seed}/G0/P5']===1`));
t('migration : indice (planète citée au mémorial) → bonne galaxie',E(`etat.cartographie['${seed}/${autre}/P1']===2&&etat.equipementsPris['${seed}/${autre}/P1']===2`));
t('migration : plus aucune ancienne clé',E("Object.keys(etat.cartographie).concat(Object.keys(etat.equipementsPris)).every(k=>k.split('/').length===3)"));
t('migration : la galaxie actuelle ne récupère pas G0',E("galaxie.planetes.filter(p=>etat.cartographie[cleCarto(p)]>0).map(p=>p.id).join()")==='P1');
const s15=E("JSON.stringify(etat)");w=ouvrir(s15);E=c=>w.ev(c);
t('rechargement : rien ne bouge',E("JSON.stringify(etat.cartographie)")===JSON.parse(s15).cartographie&&true||E("JSON.stringify(etat.cartographie)")===JSON.stringify(JSON.parse(s15).cartographie));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
