// Tests V20 — durées 10 min à 4 h, gardiens plus rares et repérés sur la carte, carte plein écran, blocs repliables
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);const J=c=>JSON.parse(E(`JSON.stringify(${c})`));
const vu=sel=>w.document.querySelector(sel);

// --- Durées
E("window.POOL=[];for(let i=0;i<4000&&POOL.length<500;i++){const p=genererPlanete('T20/'+i,(i%10)*5);p.speciale=i%19===0;POOL.push(p)}");
t('durée entre 10 min et 4 h (planètes normales)',E("POOL.filter(p=>!p.speciale).every(p=>{const h=dureeExplorationH(p);return h>=1/6-1e-9&&h<=4+1e-9})"));
t('minimum exactement 10 min',E("Math.round(DUREE.minH*60)")===10);
t('planète à gardien : +75 % une fois le gardien croisé, plafond 7 h',E("(()=>{const p=POOL.find(x=>x.taille==='geante'),sp={...p,speciale:true};const b=dureeExplorationH(p,true);if(dureeExplorationH(sp)!==b)return false;etat.bossVus[cleGal()]='vu';const v=dureeExplorationH(sp);etat.bossVus={};return Math.abs(v-Math.min(DUREE.maxSpecialeH,b*(1+DUREE.bonusGardien)))<.09})()")&&E('DUREE.maxSpecialeH')===7);
const pt=J("Object.fromEntries(TAILLES.map(t=>{const l=POOL.filter(p=>!p.speciale&&p.taille===t.id).map(dureeExplorationH);return [t.id,[Math.min(...l),Math.max(...l)]]}))");
t('durée croissante avec la taille',Object.values(pt).every((v,i,a)=>!i||v[0]>=a[i-1][0]),JSON.stringify(Object.fromEntries(Object.entries(pt).map(([k,v])=>[k,v.map(x=>Math.round(x*60)+'min')]))));
t('affichage lisible sous l\'heure',E("fmtDuree(1/6)")==='10 min'&&E("fmtDuree(2.25)")==='2 h 15');
t('rendement maintenu malgré des missions deux fois plus courtes',E("(()=>{const j=genererJimee('RD','B');const l=POOL.filter(p=>p.classe==='B').slice(0,10);let n=0,u=0;for(const p of l)for(let i=0;i<10;i++){const r=simuler(p,j,'RD'+p.seed+i);if(r.survie){n++;u+=totalRessources(r.ressources)}}return u/n>=12})()"));

// --- Gardiens
t('aucun gardien avant quelques missions',E("(()=>{etat.stats.missions=0;return univers.galaxies.every(g=>!gardienDansGalaxie(g))})()"));
E("etat.stats.missions=20");
const g=J(`(()=>{const r={centre:0,nc:0,bord:0,nb:0};for(let k=0;k<12;k++){const u=genererUnivers('GD'+k);for(const x of u.galaxies){if(x.id==='G0')continue;const t=x.eloignement;const p=GARDIEN.chance[0]+(GARDIEN.chance[1]-GARDIEN.chance[0])*t;const present=creerRng(x.seed+'/GARDIEN').f()<p;if(t<.3){r.nc++;if(present)r.centre++}if(t>.8){r.nb++;if(present)r.bord++}}}return r})()`);
t('gardien rare près du centre, systématique au bord',g.centre/g.nc<.45&&g.bord/g.nb>.9,`${Math.round(100*g.centre/g.nc)} % → ${Math.round(100*g.bord/g.nb)} %`);
t('présence déterministe',E("(()=>{const a=univers.galaxies.map(gardienDansGalaxie);return JSON.stringify(a)===JSON.stringify(univers.galaxies.map(gardienDansGalaxie))})()"));
// Marque sur la carte
E("etat.bossVus={};ecran='carte';carteVue='galaxie';selection=null;tout()");
t('aucune marque tant que le gardien n\'a pas été croisé',!vu('.boss-marque'));
E("etat.bossVus[cleGal()]='vu';tout()");
t('gardien croisé : marque sur la planète spéciale',!!vu('.boss-marque')&&/★/.test(vu('.boss-marque').textContent));
E("etat.bossVus[cleGal()]='vaincu';tout()");
t('gardien vaincu : la marque change',/☠/.test(vu('.boss-marque').textContent));
t('la marque est propre à chaque galaxie',E("(()=>{const autre=univers.galaxies.find(x=>x.id!=='G0'&&visibilite(x)==='connue').id;return !etat.bossVus[etat.params.galaxie+'/'+autre]})()"));
const v18=JSON.parse(E('JSON.stringify(etat)'));v18.version=18;delete v18.bossVus;v18.gardiensVaincus=['G0'];
const W=ouvrir(JSON.stringify(v18));
t('migration : les gardiens déjà vaincus restent marqués',W.ev("etat.bossVus[etat.params.galaxie+'/G0']==='vaincu'"));

// --- Carte plein écran et fiche
E("ecran='carte';carteVue='galaxie';selection=null;tout()");
t('carte en plein écran, pas de fiche',vu('#ecran-carte').classList.contains('carte-pleine')&&!vu('#ecran-carte').classList.contains('fiche-ouverte'));
t('retour vers le vaisseau',vu('#retour-carte').textContent.includes('Vaisseau'));
E("selection=galaxie.planetes[0].id;tout()");
t('planète choisie : fiche plein écran, carte masquée',vu('#ecran-carte').classList.contains('fiche-ouverte'));
t('retour vers la galaxie, pas vers le cockpit',vu('#retour-carte').textContent.includes('Galaxie')&&vu('#retour-carte').dataset.retourCarte==='1');
vu('#retour-carte').click();
t('le retour ramène à la carte, pas au cockpit',E('ecran')==='carte'&&E('selection')===null&&!vu('#ecran-carte').classList.contains('fiche-ouverte'));
E("carteVue='univers';selectionGalaxie=univers.galaxies.find(x=>x.id!=='G0'&&visibilite(x)==='connue').id;tout()");
t('même principe sur la carte de l\'univers',vu('#ecran-carte').classList.contains('fiche-ouverte')&&vu('#retour-carte').textContent.includes('Univers'));
E("selectionGalaxie=null;carteVue='galaxie';tout()");

// --- Blocs repliables
E("etat.credits=9000;etat.jimee=genererJimee('RP','B');ecran='jimee';jimeeStatsSeules=false;tout()");
t('talents : titre seul, détail replié',w.document.querySelectorAll('.puce-repli').length===E('etat.jimee.talents.length')&&[...w.document.querySelectorAll('.puce-repli')].every(d=>!d.open));
t('détail du talent accessible au toucher',(()=>{const d=w.document.querySelector('.puce-repli');d.open=true;return d.querySelector('.corps').textContent.length>10})());
t('plus de pavé de description sous les talents',!/Un sens de l'orientation/.test(w.document.querySelector('#panneau').textContent.replace(/\s+/g,' '))||w.document.querySelector('.puce-repli[open]')!==null);
E("ecran='carte';selection=galaxie.planetes[0].id;tout()");
t('fiche planète : résumé chiffré + blocs repliés',w.document.querySelectorAll('#panneau-carte .resume-chiffres span').length>=3&&w.document.querySelectorAll('#panneau-carte .repli').length>=2);
t('détail de la dangerosité disponible',/Composition de la dangerosité/.test(w.document.querySelector('#panneau-carte').textContent));
t('la fiche tient en peu de texte',w.document.querySelector('#panneau-carte').textContent.replace(/\s+/g,' ').length<1400,w.document.querySelector('#panneau-carte').textContent.replace(/\s+/g,' ').length+' caractères');
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
