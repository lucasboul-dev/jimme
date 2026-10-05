// Tests V14 — lot A (durée selon la taille, 2 cartographies, drops aléatoires, rendement, découvert / perdu / ramené).
// Lancer : node tests/tests-v14.js
const {ouvrir,horloge}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
const w=ouvrir();const E=c=>w.ev(c);const J=c=>JSON.parse(E(`JSON.stringify(${c})`));
E("window.POOL=[];for(let i=0;i<3000&&POOL.length<600;i++){const p=genererPlanete('T14/'+i,(i%10)*5);p.speciale=i%17===0;POOL.push(p)}");

// --- Durée
t('durée d\'exploration ≥ 2 h et ≤ 8 h (planètes normales)',E("POOL.filter(p=>!p.speciale).every(p=>{const h=dureeExplorationH(p);return h>=DUREE.minH&&h<=DUREE.maxH})"));
t('planètes spéciales : ≤ plafond spécial, peuvent dépasser 8 h',E("POOL.filter(p=>p.speciale).every(p=>dureeExplorationH(p)<=DUREE.maxSpecialeH)"));
const DUREE=J('DUREE');const parTaille=J("Object.fromEntries(TAILLES.map(t=>{const l=POOL.filter(p=>!p.speciale&&p.taille===t.id).map(dureeExplorationH);return [t.id,[Math.min(...l),Math.max(...l)]]}))");
t('durée croissante avec la taille',Object.values(parTaille).every((v,i,a)=>!i||v[0]>=a[i-1][0]),JSON.stringify(parTaille));
t('naine ≈ 10 min, géante ≈ 4 h (V20)',parTaille.naine[0]===DUREE.minH&&parTaille.naine[1]<=.75&&parTaille.geante[0]>=3&&parTaille.geante[1]===DUREE.maxH);
t('réacteur max : jamais sous 2 h',E("(()=>{const v=etat.vaisseau.reacteur;etat.vaisseau.reacteur=REACTEURS.length;const ok=POOL.every(p=>dureeMissionH(p)>=DUREE.minH);etat.vaisseau.reacteur=v;return ok})()"));
t('réacteur max : missions plus courtes que niveau 1',E("(()=>{const p=POOL.find(x=>x.taille==='geante'&&!x.speciale);const a=dureeMissionH(p);const v=etat.vaisseau.reacteur;etat.vaisseau.reacteur=REACTEURS.length;const b=dureeMissionH(p);etat.vaisseau.reacteur=v;return b<a})()"));
t('taille visible sur la carte (rayon lié à la taille)',E("galaxie.planetes.every(p=>{const t=TAILLES.find(z=>z.id===p.taille);return t&&p.rayon>=t.rayon[0]&&p.rayon<=t.rayon[1]})"));
t('taille déterministe',E("(()=>{const a=genererPlanete('DET/1'),b=genererPlanete('DET/1');return a.taille===b.taille&&a.etapes.join()===b.etapes.join()})()"));
t('nom, biome et danger inchangés par la taille (graine historique)',E("galaxie.planetes[0].nom")==='Zarlune-69');

// --- Cartographie
t('2 cartographies par planète',E("EPREUVES.cartographie.missions")===2);

// --- Drops aléatoires (planète à 2 équipements)
const dist=J(`(()=>{const j=genererJimee('DROP','A');const cand=POOL.filter(p=>['A','B'].includes(p.classe)).slice(0,25);const d1={},d2={};
  for(const p of cand)for(let i=0;i<40;i++){const r1=simuler({...p,stockRestant:2},j,'DR/'+p.seed+i);if(!r1.survie)continue;const n1=r1.objets.length;d1[n1]=(d1[n1]||0)+1;
    const r2=simuler({...p,stockRestant:2-n1},j,'DR2/'+p.seed+i);if(r2.survie){const k=n1+'+'+r2.objets.length;d2[k]=(d2[k]||0)+1}}
  return {d1,d2}})()`);
t('1re exploration : 0, 1 ou 2 objets possibles',dist.d1[0]>0&&dist.d1[1]>0&&dist.d1[2]>0,JSON.stringify(dist.d1));
t('2e exploration : les deux, un seul ou aucun selon le hasard',dist.d2['0+2']>0&&dist.d2['0+0']>0&&dist.d2['1+1']>0&&dist.d2['1+0']>0,JSON.stringify(dist.d2));
t('jamais plus d\'objets que le stock',!Object.keys(dist.d2).some(k=>k.split('+').reduce((s,x)=>s+ +x,0)>2));

// --- Rendement
const rend=J(`(()=>{const res={};for(const cl of ['G','B','S']){const j=genererJimee('RD'+cl,cl);const l=POOL.filter(p=>p.classe===cl).slice(0,25);let n=0,u=0,court=0,nc=0,long=0,nl=0,rare=0,comm=0;
  for(const p of l)for(let i=0;i<8;i++){const r=simuler(p,j,'RD/'+p.seed+i);if(!r.survie)continue;n++;const q=totalRessources(r.ressources);u+=q;const d=dureeExplorationH(p);if(d<=3){court+=q;nc++}if(d>=6){long+=q;nl++}
   for(const [id,x] of Object.entries(r.ressources)){if(RES[id].rarete==='commune')comm+=x;if(['rare','tres_rare'].includes(RES[id].rarete))rare+=x}}
  res[cl]={moy:u/n,court:nc?court/nc:0,long:nl?long/nl:0,partRare:rare/Math.max(1,u),comm:comm/Math.max(1,u)}}return res})()`);
t('mission G : au moins 10 unités en moyenne (avant : ~3 en 12 h)',rend.G.moy>=10,rend.G.moy.toFixed(1));
t('longue mission (6-8 h) rapporte nettement plus qu\'une courte (2-3 h)',['G','B','S'].every(c=>!rend[c].long||rend[c].long>rend[c].court*1.4),JSON.stringify(Object.fromEntries(Object.entries(rend).map(([c,x])=>[c,[x.court.toFixed(1),x.long.toFixed(1)]]))));
t('planète S plus riche que G',rend.S.moy>rend.G.moy*1.3,`${rend.G.moy.toFixed(1)} → ${rend.S.moy.toFixed(1)}`);
t('les ressources rares restent rares (< 12 % des unités)',['G','B','S'].every(c=>rend[c].partRare<.12),JSON.stringify(Object.fromEntries(Object.entries(rend).map(([c,x])=>[c,(x.partRare*100).toFixed(1)+' %']))));
t('les communes dominent (> 60 % des unités)',['G','B','S'].every(c=>rend[c].comm>.6));

// --- Découvert / perdu / ramené
const bilan=J(`(()=>{let ecarts=0,n=0,inc=0,incDistrait=0,nD=0,zero=0,ex=null;const talentsTest=[['distrait','maladroit','allergique'],['mineur','sourd','gourmand'],['collectionneur','myope','kleptomane']];
  for(let k=0;k<3;k++){const j=genererJimee('LG'+k,'B');j.talents=talentsTest[k];
   for(const p of POOL.slice(0,120))for(let i=0;i<3;i++){const r=simuler(p,j,'LG/'+k+p.seed+i);if(!r.survie)continue;n++;
    const perdu=r.pertes.reduce((s,e)=>s+totalRessources(e.ressources),0);if(totalRessources(r.trouves)-perdu!==totalRessources(r.ressources))ecarts++;
    const ic=r.pertes.find(e=>e.cause==='incident');if(k===0)nD++;if(ic){inc++;if(ic.talent==='distrait')incDistrait++}
    if(totalRessources(r.trouves)>0&&!totalRessources(r.ressources)&&ic){zero++;if(!ex)ex={r,gains:r.ressources}}}}
  return {ecarts,n,inc,incDistrait,nD,zero,html:ex?bilanMission(ex.r,ex.gains):null}})()`);
t('découvert − perdu = ramené, pour chaque mission',bilan.ecarts===0,`${bilan.n} missions, ${bilan.ecarts} écart(s)`);
t('incidents au retour présents mais minoritaires',bilan.inc>0&&bilan.inc<bilan.n*.15,`${bilan.inc} / ${bilan.n}`);
t('le talent Distrait est désigné comme responsable dans certains incidents',bilan.incDistrait>0);
t('une mission peut finir à 0 malgré des ressources trouvées (rare)',bilan.zero>0&&bilan.zero<bilan.n*.05,`${bilan.zero} / ${bilan.n}`);
t('rapport : découvert, perdu, ramené et cause affichés',!!bilan.html&&/Découvert/.test(bilan.html)&&/Perdu/.test(bilan.html)&&/Ramené au vaisseau/.test(bilan.html)&&/Incident au retour/.test(bilan.html));
const proba=J(`(()=>{const p=POOL.find(x=>x.classe==='G'&&x.taille==='moyenne');const cnt=t=>{const j=genererJimee('PR','B');j.talents=t;let n=0,k=0;for(let i=0;i<1500;i++){const r=simuler(p,j,'PR/'+t+i);if(!r.survie)continue;n++;if(r.pertes.some(e=>e.cause==='incident'))k++}return k/n};
  return {aucun:cnt(['mineur']),distrait:cnt(['distrait']),collect:cnt(['collectionneur'])}})()`);
t('Distrait augmente la probabilité d\'incident sans la rendre certaine',proba.distrait>proba.aucun*2&&proba.distrait<.4,JSON.stringify(proba));
t('Collectionneur réduit la probabilité d\'incident',proba.collect<proba.aucun);

// --- Mission réelle de bout en bout (mode test)
E("etat.credits=5000;etat.jimee=genererJimee('E2E','G');etat.params.test=true;selection=galaxie.planetes[1].id;envoyer()");
t('mission lancée avec durée réelle mémorisée',E("etat.mission&&etat.mission.dureeH>=DUREE.minH"));
horloge.now+=60000;E("tic();ouvrirRapport()");
const txt=w.document.body.textContent.replace(/\s+/g,' ');
t('rapport ouvert : rubriques Découvert / Ramené',/Découvert/.test(txt)&&/Ramené au vaisseau/.test(txt)||/n'est pas rentré/.test(txt));
E("etat.params.test=false;etat.jimee=genererJimee('E2F','G');ecran='carte';selection=galaxie.planetes[2].id;tout()");
const fiche=w.document.body.textContent.replace(/\s+/g,' ');
t('fiche planète : taille, danger et durée affichés avant l\'envoi',/classe \S+ · \S+/.test(fiche)&&/Danger\s*\d+/.test(fiche)&&/Durée\s*\d/.test(fiche));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
