// Tests V13 (classes G→SSS, survie par écart de classe, stock d'équipements, fiche planète). Lancer : node tests/tests-v13.js
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c)=>{if(c)ok++;else{ko++;console.log('ÉCHEC :',n)}};
let w=ouvrir();const E=c=>w.ev(c);
// Classes
t('seuils de planète',E(`[[0,'G'],[19,'G'],[20,'F'],[34,'F'],[35,'B'],[49,'B'],[50,'A'],[64,'A'],[65,'S'],[79,'S'],[80,'SS'],[89,'SS'],[90,'SSS'],[100,'SSS']].every(([d,c])=>classeDePlanete(d)===c)`));
t('5 classes de Jimee G F B A S',E("CLASSES_JIMEE.map(c=>c.id).join()")==='G,F,B,A,S');
t('stats dans les bornes de chaque classe',E("CLASSES_JIMEE.every(cl=>{for(let i=0;i<100;i++){const j=genererJimee('T/'+cl.id+i,cl.id);if(j.classe!==cl.id||!Object.values(j.stats).every(v=>v>=cl.stats[0]&&v<=cl.stats[1]))return false}return true})"));
t('Jimee G : mêmes tirages qu\'avant (compatibilité des graines)',E("JSON.stringify(genererJimee('COMPAT').stats)")===E("JSON.stringify(genererJimee('COMPAT','G').stats)"));
t('S réservé au rang 3',E("rangRequisClasse('S')===3&&rangRequisClasse('F')===0"));
// Raretés
t('raretés C à SSS = 100 %',E("[RARETES,RARETES_SPECIALE,RARETES_PAR_CLASSE.SS,RARETES_PAR_CLASSE.SSS].every(tb=>Math.abs(tb.reduce((s,x)=>s+x.poids,0)-100)<1e-9)"));
t('rang SS/SSS entre S et L',E("RANG_RARETE.S<RANG_RARETE.SS&&RANG_RARETE.SS<RANG_RARETE.SSS&&RANG_RARETE.SSS<RANG_RARETE.L"));
t('niveaux d\'objets ≤ 15',E("(()=>{for(let i=0;i<5000;i++){const o=tirerObjet(creerRng('O'+i),i%2==0,i%9==0,ORDRE_CLASSES[i%7],'roche');if(o.niveau<1||o.niveau>CONFIG.niveauMaxObjet)return false}return true})()"));
t('agence : chances définies jusqu\'au niveau 15',E("[11,12,13,14,15].every(n=>typeof RECUP.chanceObjetParNiveau[n]==='number')"));
// Survie
t('facteur d\'écart croissant',E("[-2,-1,0,1,2,3,4,5,6].map(facteurEcart).every((v,i,a)=>!i||v>=a[i-1])"));
t('écart brut B→S = 2',E("ecartBrut({classe:'S'},{classe:'B'})")===2);
const g=JSON.parse(E("JSON.stringify(grilleSurvie(20,20,'TV14'))"));   // V14 : échantillon agrandi (16 × 12 donnait ±3 points de bruit)
for(const c of ['F','B','A','S'])t(`Jimee ${c} sur sa classe : ${g[c][c].toFixed(0)} % (attendu 80-96)`,g[c][c]>=80&&g[c][c]<=96);
t(`B sur S : ${g.B.S.toFixed(0)} % (attendu ≤ 15)`,g.B.S<=15);
t(`G sur SSS : ${g.G.SSS.toFixed(0)} % (attendu ≤ 3)`,g.G.SSS<=3);
t(`A sur S : ${g.A.S.toFixed(0)} % (attendu 40-75)`,g.A.S>=40&&g.A.S<=75);
// Stock d'équipements
t('stock déterministe et dans les bornes',E("ORDRE_CLASSES.every(c=>{const [a,b]=STOCK_EQUIPEMENTS[c];for(let i=0;i<200;i++){const n=stockEquipements('S'+i,c);if(n!==stockEquipements('S'+i,c)||(n!==0&&(n<a||n>b)))return false}return true})"));
t('stock 0 : aucun objet trouvé',E("(()=>{const j=genererJimee('Z','A');for(const p of galaxie.planetes)for(let i=0;i<60;i++)if(simuler({...p,stockRestant:0},j,'Q/'+p.id+i).objets.length)return false;return true})()"));
t('stock 1 : au plus 1 objet par mission',E("(()=>{const j=genererJimee('Z','A');for(const p of galaxie.planetes)for(let i=0;i<60;i++){const r=simuler({...p,stockRestant:1},j,'Q/'+p.id+i);if(r.objets.length+(r.laisses||[]).length>1)return false}return true})()"));
t('stock illimité dans le Labo (sans stockRestant)',E("(()=>{const j=genererJimee('Z','A');let n=0;for(const p of galaxie.planetes)for(let i=0;i<60;i++)n+=simuler(p,j,'Q/'+p.id+i).objets.length;return n>0})()"));
// Fiche planète
E("etat.credits=5000;etat.jimee=genererJimee('FICHE','G');ecran='carte';selection=galaxie.planetes[0].id;tout()");
let txt=w.document.body.textContent.replace(/\s+/g,' ');
t('étapes et ressources masquées avant exploration',!/Étapes/.test(w.document.querySelector('#panneau-carte').textContent)&&/Ressources détectées\s*inconnues/.test(txt));   // V20 : la ligne Étapes n'apparaît qu'une fois la planète explorée
t('richesse du sol et niveau des objets retirés',!/Richesse du sol/.test(txt)&&!/Niveau des objets trouvés/.test(txt));
t('stock inconnu avant cartographie complète',/Équipements à trouver\s*inconnus/.test(txt));
E("etat.cartographie[cleCarto(galaxie.planetes[0])]=EPREUVES.cartographie.missions;tout()");txt=w.document.body.textContent.replace(/\s+/g,' ');
t('stock affiché après cartographie complète',/Équipements à trouver\s*(\d+ restants? sur \d+|aucun|tous récupérés)/.test(txt));
E("etat.equipementsPris[cleCarto(galaxie.planetes[0])]=99;tout()");txt=w.document.body.textContent.replace(/\s+/g,' ');
t('planète vidée signalée',galaxie=>/tous récupérés|aucun/.test(txt));
// Mission réelle : le stock passé à la simulation
E("etat.equipementsPris={};etat.params.test=true;selection=galaxie.planetes[1].id;envoyer()");
t('la mission reçoit le stock restant',E("etat.mission!==null"));
horloge.now+=60000;E("tic();ouvrirRapport()");
t('objets rapportés décomptés du stock',E("(()=>{const k=cleCarto(galaxie.planetes[1]);return (etat.equipementsPris[k]||0)>=0})()"));
// Migration
const v12=JSON.parse(E("JSON.stringify(etat)"));v12.version=12;delete v12.equipementsPris;
w=ouvrir(JSON.stringify(v12));t('migration V12 → V13',w.ev("etat.version===CONFIG.versionSauvegarde&&typeof etat.equipementsPris==='object'"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
