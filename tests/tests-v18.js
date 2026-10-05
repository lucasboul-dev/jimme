// Tests V18 — lot C (astres, danger par distance en probabilités, infos de galaxie, voyages chronométrés, détecteur infrarouge)
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);const J=c=>JSON.parse(E(`JSON.stringify(${c})`));
const txt=()=>{const b=w.document.body.cloneNode(true);b.querySelectorAll('script,style').forEach(x=>x.remove());return b.textContent.replace(/\s+/g,' ')};

// --- Astres
t('galaxie de départ : étoile ordinaire',E("univers.galaxies[0].astre")==='etoile');
t('astre déterministe',E("JSON.stringify(genererUnivers('A1').galaxies.map(g=>g.astre))===JSON.stringify(genererUnivers('A1').galaxies.map(g=>g.astre))"));
const ast=J(`(()=>{const c={pres:{},loin:{}};for(let k=0;k<30;k++)for(const g of genererUnivers('AST'+k).galaxies){if(g.id==='G0')continue;const b=g.eloignement<.35?'pres':g.eloignement>.7?'loin':null;if(b)c[b][g.astre]=(c[b][g.astre]||0)+1}return c})()`);
const part=(o,k)=>(o[k]||0)/Object.values(o).reduce((a,b)=>a+b,0);
t('5 types d\'astres présents',Object.keys({...ast.pres,...ast.loin}).length===5,JSON.stringify(ast));
t('trous noirs bien plus fréquents loin du centre',part(ast.loin,'trou_noir')>part(ast.pres,'trou_noir')*3,`${(part(ast.pres,'trou_noir')*100).toFixed(1)} % → ${(part(ast.loin,'trou_noir')*100).toFixed(1)} %`);
t('les galaxies d\'un même univers sont variées',new Set(J("univers.galaxies.map(g=>g.astre)")).size>=4);

// --- Danger : probabilités selon la distance
t('galaxie de départ inchangée',E("JSON.stringify(chargerGalaxie(univers.galaxies[0]).planetes.map(p=>[p.nom,p.danger,p.classe]))===JSON.stringify(genererGalaxie('JIMEE-001').planetes.map(p=>[p.nom,p.danger,p.classe]))"));
const dist=J(`(()=>{const r={pres:[],loin:[]};for(let k=0;k<12;k++)for(const g of genererUnivers('DD'+k).galaxies){if(g.id==='G0')continue;const b=g.eloignement<.3?'pres':g.eloignement>.8?'loin':null;if(!b)continue;for(const p of chargerGalaxie(g).planetes)r[b].push(rangClasse(p.classe))}
  const f=(l,test)=>l.filter(test).length/l.length;return {moyPres:r.pres.reduce((a,b)=>a+b,0)/r.pres.length,moyLoin:r.loin.reduce((a,b)=>a+b,0)/r.loin.length,
   faiblesPres:f(r.pres,x=>x<=1),fortesPres:f(r.pres,x=>x>=4),faiblesLoin:f(r.loin,x=>x<=1),fortesLoin:f(r.loin,x=>x>=4)}})()`);
t('près du centre : surtout G et F',dist.faiblesPres>.4,(dist.faiblesPres*100).toFixed(0)+' %');
t('au bord : surtout S et plus',dist.fortesLoin>.4,(dist.fortesLoin*100).toFixed(0)+' %');
t('une planète S+ reste possible près du centre (rare)',dist.fortesPres>0&&dist.fortesPres<.15,(dist.fortesPres*100).toFixed(1)+' %');
t('une planète G/F reste possible au bord (rare)',dist.faiblesLoin>0&&dist.faiblesLoin<.2,(dist.faiblesLoin*100).toFixed(1)+' %');
t('pas de niveau fixe par zone : deux galaxies à même distance diffèrent',E("(()=>{const l=univers.galaxies.filter(g=>g.id!=='G0').sort((a,b)=>a.eloignement-b.eloignement);for(let i=1;i<l.length;i++)if(Math.abs(l[i].eloignement-l[i-1].eloignement)<.05&&infoGalaxie(l[i]).dangerMoyen!==infoGalaxie(l[i-1]).dangerMoyen)return true;return false})()"));

// --- Voyages
const cible=E("univers.galaxies.filter(g=>g.id!=='G0'&&visibilite(g)==='connue').sort((a,b)=>distanceGal(galaxieCourante(),a)-distanceGal(galaxieCourante(),b))[0].id");
const d=E(`distanceGal(galaxieCourante(),galaxieParId('${cible}'))`);
t('durée : au moins 5 min, croissante avec la distance',E(`dureeVoyageMin(10)===VOYAGE.minMin&&dureeVoyageMin(100)<dureeVoyageMin(230)`),`${d} kAL → ${E(`dureeVoyageMin(${d})`)} min ; 230 kAL → ${E('dureeVoyageMin(230)')} min`);
t('limite de portée de départ ≈ 30 min',(()=>{const m=E('dureeVoyageMin(porteeMaxKAL())');return m>=25&&m<=35})(),E('porteeMaxKAL()')+' kAL → '+E('dureeVoyageMin(porteeMaxKAL())')+' min');
t('réacteur amélioré : voyage plus court',E("(()=>{const a=dureeVoyageMin(200);etat.vaisseau.reacteur=5;const b=dureeVoyageMin(200);etat.vaisseau.reacteur=1;return b<a})()"));
const carb0=E('etat.vaisseau.carburant');
E(`voyager('${cible}')`);
t('voyage lancé, pas de téléportation',E('etat.voyage!==null')&&E('etat.galaxieActuelle')==='G0');
t('carburant consommé au décollage',E('etat.vaisseau.carburant')<carb0);
t('bandeau : « Voyage en cours », destination, durée, arrivée',/Voyage en cours vers/.test(w.document.querySelector('#statut').textContent)&&/arrivée dans/.test(w.document.querySelector('#statut').textContent));
const autre=E(`univers.galaxies.filter(g=>g.id!=='G0'&&g.id!=='${cible}'&&visibilite(g)==='connue')[0].id`);
t('second voyage impossible',/déjà en route/.test(E(`raisonVoyageImpossible(galaxieParId('${autre}'))`)));
E("etat.jimee=genererJimee('V1','G');etat.credits=9999;selection=galaxie.planetes[0].id;envoyer()");
t('aucune mission depuis la galaxie quittée',E('etat.mission===null'));
E("for(const p of galaxie.planetes)etat.cartographie[cleCarto(p)]=1;lancerExpedition(galaxie.planetes[0].id,1)");
t('aucune escouade pendant le voyage',E('expeditionsActives().length===0'));
E("ecran='carte';selection=galaxie.planetes[1].id;tout()");
t('fiche planète : raison affichée',/en route vers/.test(txt()));
const save=E('JSON.stringify(etat)');
horloge.now+=E(`dureeVoyageMin(${d})`)*60000-60000;
w=ouvrir(save);E=c=>w.ev(c);
t('rechargement avant l\'échéance : toujours en transit, temps restant cohérent',E('etat.voyage!==null')&&E('etat.voyage.fin-Date.now()')<=61000&&E('etat.voyage.fin-Date.now()')>0);
const save2=E('JSON.stringify(etat)');horloge.now+=2*60000;
w=ouvrir(save2);E=c=>w.ev(c);
t('arrivée appliquée au rechargement (app fermée pendant le voyage)',E('etat.voyage===null')&&E('etat.galaxieActuelle')===cible&&E(`etat.galaxiesVisitees.includes('${cible}')`));
t('galaxie de destination chargée',E(`galaxie.planetes.length===galaxieParId('${cible}').nbPlanetes`));
E("etat.params.test=true;etat.vaisseau.carburant=reservoir().capacite;voyager('G0')");
t('mode test : 20 secondes',E('etat.voyage.fin-etat.voyage.depart')===20000);
E("finirVoyageTest()");
t('outil « arriver tout de suite »',E("etat.voyage===null&&etat.galaxieActuelle==='G0'"));
const loin=E("univers.galaxies.filter(g=>visibilite(g)==='connue'&&carburantNecessaire(galaxieCourante(),g)>reservoir().capacite)[0]?.id||null");
if(loin)t('hors de portée : refus et conseil d\'amélioration',/Améliorez le réservoir/.test(E(`raisonVoyageImpossible(galaxieParId('${loin}'))`)));
else{E("BOUTIQUE_TEST.ressourcesAmeliorationsGratuites=true;ameliorer('scanner');ameliorer('scanner');ameliorer('scanner')");const l2=E("univers.galaxies.filter(g=>visibilite(g)==='connue'&&carburantNecessaire(galaxieCourante(),g)>reservoir().capacite)[0]?.id||null");
  t('hors de portée : refus et conseil d\'amélioration',!!l2&&/Améliorez le réservoir/.test(E(`raisonVoyageImpossible(galaxieParId('${l2}'))`)))}

// --- Infos de galaxie (carte univers)
E(`ecran='carte';carteVue='univers';selectionGalaxie='${autre}';tout()`);
let tx=txt();
t('galaxie jamais visitée : astre, durée, « jamais visitée », sans compteurs d\'exploration',/Astre central/.test(tx)&&/Durée du voyage/.test(tx)&&/jamais visitée/.test(tx)&&!/Planètes explorées/.test(tx));
E(`selectionGalaxie='${cible}';tout()`);tx=txt();
t('galaxie visitée : planètes explorées / inconnues et progression',/Planètes explorées\s*\d+ \/ \d+/.test(tx)&&/Progression/.test(tx)&&/Cartographie complète/.test(tx));
t('compteurs justes',(()=>{const m=tx.match(/Planètes explorées\s*(\d+) \/ (\d+)/);return m&&+m[1]===E(`galaxie=chargerGalaxie(galaxieParId('${cible}')),galaxie.planetes.filter(p=>(etat.cartographie[cleCartoG('${cible}',p.id)]||0)>0).length`)})());
E("galaxie=chargerGalaxie()");

// --- Trou noir et détecteur infrarouge
const tn=J(`(()=>{for(let k=0;k<40;k++){const u=genererUnivers('TN'+k);const g=u.galaxies.find(x=>x.astre==='trou_noir');if(g){const p=genererGalaxie(g.seed,{eloignement:g.eloignement,astre:g.astre,nbPlanetes:g.nbPlanetes,distribution:true}).planetes[0];return {astre:p.astre,cache:p.stockCache,sans:Object.keys(ressourcesPlanete(p)),avec:Object.keys(ressourcesPlanete({...p,equipementSpecial:'infrarouge'}))}}}return null})()`);
t('planète sous un trou noir : stock caché tiré',tn&&tn.astre==='trou_noir'&&tn.cache>=1&&tn.cache<=3);
t('ressources rares invisibles sans infrarouge, visibles avec',tn&&tn.avec.length>tn.sans.length&&['noyau','artefact'].some(id=>tn.avec.includes(id)&&!tn.sans.includes(id)),tn&&JSON.stringify({sans:tn.sans,avec:tn.avec}));
t('détecteur infrarouge : plan connu, objet au catalogue',E("PLANS_DEPART.includes('e_infrarouge')&&CATALOGUE.some(m=>m.effet==='infrarouge')"));
t('planeteEffective : équipement spécial seulement si porté ET sous un trou noir',E("(()=>{const j=genererJimee('IR','G');j.equipement.sac_utilitaire=creerObjet(creerRng('IR'),CATALOGUE.find(m=>m.effet==='infrarouge'),3,'C');etat.jimee=j;const p={...galaxie.planetes[0],astre:'trou_noir',stockCache:2};const q={...galaxie.planetes[0],astre:'etoile'};return planeteEffective(p).equipementSpecial==='infrarouge'&&!planeteEffective(q).equipementSpecial&&stockRestant(p,true)===stockRestant(p,false)+2})()"));
const v16=JSON.parse(E('JSON.stringify(etat)'));v16.version=16;v16.plans=v16.plans.filter(x=>x!=='e_infrarouge');delete v16.voyage;
const W=ouvrir(JSON.stringify(v16));t('migration : plan du détecteur ajouté, voyage nul',W.ev("etat.version===CONFIG.versionSauvegarde&&etat.plans.includes('e_infrarouge')&&etat.voyage===null"));
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}carteVue='univers';ecran='carte';tout();return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
