// Tests V19 — journal des rapports, pastilles de ressources, explications repliables, tutoriel. node tests/tests-v19.js
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);
const txt=()=>{const b=w.document.body.cloneNode(true);b.querySelectorAll('script,style').forEach(x=>x.remove());return b.textContent.replace(/\s+/g,' ')};

// --- Tutoriel
// V26 : une partie neuve ne lance plus le diaporama ; elle commence par l'accueil de la Corp et le guide de la première mission (tests-v26.js).
t('premier lancement : accueil de la Corp au lieu du diaporama',w.document.querySelector('#tuto').style.display!=='flex'&&w.document.querySelector('#annonce').style.display==='flex');
E("document.querySelector('#annonce-aller').click();lancerTuto()");
t('9 étapes, repères affichés (diaporama relancé depuis le Labo)',E('TUTO.length')===9&&w.document.querySelectorAll('#tuto-points i').length===9&&/Bienvenue à bord/.test(txt()));
E("montrerTuto(0)");t('première étape : pas de « Précédent »',w.document.querySelector('#tuto-prec').style.visibility==='hidden');
E("montrerTuto(TUTO.length-1)");
t('dernière étape : bouton « Commencer », plus de « Passer »',w.document.querySelector('#tuto-suiv').textContent==='Commencer'&&w.document.querySelector('#tuto-passer').style.display==='none');
E("fermerTuto()");
t('fermé et mémorisé',w.document.querySelector('#tuto').style.display==='none'&&E('etat.tutoVu')===true);
let sv=E("localStorage.getItem('jimee-v1')");w=ouvrir(sv);E=c=>w.ev(c);
t('ne se relance pas au rechargement',w.document.querySelector('#tuto').style.display!=='flex');
E("lancerTuto()");t('relançable (Labo)',w.document.querySelector('#tuto').style.display==='flex');E("fermerTuto()");
const v17=JSON.parse(E('JSON.stringify(etat)'));v17.version=17;delete v17.tutoVu;delete v17.journal;delete v17.aide;
const W=ouvrir(JSON.stringify(v17));
t('partie existante : pas de tutoriel, journal créé',W.ev("etat.tutoVu===true&&Array.isArray(etat.journal)&&etat.version===CONFIG.versionSauvegarde")&&W.document.querySelector('#tuto').style.display!=='flex');

// --- Explications repliables
t('explications masquées par défaut',E('etat.aide')===false&&!w.document.body.classList.contains('aide-on'));
E("ecran='corp';corpOnglet='expeditions';tout()");
t('texte d\'explication absent de l\'écran tant que ? est éteint',w.document.querySelectorAll('.aide').length>0&&!w.document.body.classList.contains('aide-on'));
w.document.querySelector('#btn-aide').click();
t('bouton ? : explications affichées et mémorisées',E('etat.aide')===true&&w.document.body.classList.contains('aide-on')&&w.document.querySelector('#btn-aide').getAttribute('aria-pressed')==='true');
w.document.querySelector('#btn-aide').click();
t('second appui : masquées',E('etat.aide')===false);

// --- Pastilles
t('liste de ressources : icônes + quantités, sans les noms',E("(()=>{const h=listeRessources({fer:3,cryonite:2});return h.includes('past-res')&&h.includes('<svg')&&h.includes('>3<')&&!/fer/i.test(h.replace(/title=\"[^\"]*\"/g,''))})()"));
t('version texte conservée pour les messages',E("listeRessourcesTexte({fer:3})")==='3 fer');
t('stock vide : rien affiché',E("listeRessources({})")===''&&E("listeRessources({fer:0})")==='');
t('rareté marquée sur la pastille',E("listeRessources({noyau:1}).includes('res-tres_rare')"));

// --- Journal des rapports
E("etat.journal=[];etat.compteurJournal=0;etat.credits=20000;etat.jimee=genererJimee('J1','S');etat.params.test=true;selection=galaxie.planetes[0].id;envoyer()");
horloge.now+=60000;E("tic();ouvrirRapport()");
t('rapport de mission archivé',E('etat.journal.length')===1&&['mission','mort'].includes(E('etat.journal[0].type')));
E("ecran='corp';corpOnglet='rapports';tout()");
t('onglet Rapports : entrée listée avec date',/Rapports/.test(txt())&&!!w.document.querySelector('[data-action=archive]'));
const avant=E('etat.journal.length');
E("ouvrirArchive(etat.journal[0].id)");
t('rapport relu sans être ré-archivé',E('etat.journal.length')===avant&&w.document.querySelector('#rapport').style.display==='flex');
t('contenu identique à l\'original',w.document.querySelector('#rap-titre').textContent===E('etat.journal[0].titre')&&w.document.querySelector('#journal').children.length===E('etat.journal[0].lignes.length'));
// Expédition et récupération archivées aussi
E("etat.mission=null;document.querySelector('#rap-fermer').click();for(const p of galaxie.planetes)etat.cartographie[cleCarto(p)]=1;lancerExpedition(galaxie.planetes[0].id,1)");
horloge.now+=60000;E("tic();ouvrirRapportExpedition(etat.expeditions[0].id)");
t('rapport d\'expédition archivé avec son type',E("etat.journal[0].type")==='expedition');
E("(()=>{const r=creerRng('EQ');const objs=[creerObjet(r,CATALOGUE[0],2,'C')];etat.abandons.push({id:'AB1',planeteId:'P0',galaxie:'G0',nomPlanete:galaxie.planetes[0].nom,jimeeId:'x',jimeeNom:'Zaz',date:Date.now(),objets:objs});lancerRecuperation('AB1',1)})()");
horloge.now+=10*60000;E("tic();ouvrirRapportRecup(etat.recuperations[etat.recuperations.length-1].id)");
t('rapport de récupération archivé',E("etat.journal[0].type")==='recup');
t('ordre du plus récent au plus ancien',E("etat.journal[0].date>=etat.journal[1].date&&etat.journal[1].date>=etat.journal[2].date"));
E(`for(let i=0;i<${E('JOURNAL_MAX')}+6;i++)archiverRapport('T'+i,'s',[{ton:'bon',etiquette:'a',txt:'b'}],'<p>x</p>','mission')`);
t('seuls les 20 derniers sont conservés',E('etat.journal.length')===E('JOURNAL_MAX'));
sv=E("localStorage.getItem('jimee-v1')");w=ouvrir(sv);E=c=>w.ev(c);
t('journal conservé au rechargement',E('etat.journal.length')===E('JOURNAL_MAX'));
t('taille de sauvegarde raisonnable',E("localStorage.getItem('jimee-v1').length")<1500000,Math.round(E("localStorage.getItem('jimee-v1').length")/1024)+' ko');
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}for(const o of ['contrats','recrutement','expeditions','agence','rapports','memorial','succes']){corpOnglet=o;ecran='corp';tout()}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
