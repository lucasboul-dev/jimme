// Tests V22 — gardien légendaire : trois issues selon l'écart de puissance, et +75 % de durée une fois le gardien croisé
const {ouvrir}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
const w=ouvrir();const E=c=>w.ev(c);const J=c=>JSON.parse(E(`JSON.stringify(${c})`));
const DUREE=J('DUREE');

// --- Durée : +75 %, seulement après la rencontre
E("etat.bossVus={};window.SP={...galaxie.planetes.find(p=>p.speciale)}");
const base=E("dureeExplorationH(SP,true)");
t('avant toute rencontre : durée normale, aucun forfait',E("dureeExplorationH(SP)")===base);
E("etat.bossVus[cleGal()]='vu'");
t('après la rencontre : +75 % de la durée de base',Math.abs(E("dureeExplorationH(SP)")-base*1.75)<=DUREE.arrondiH*1.5,`${Math.round(base*60)} min → ${Math.round(E("dureeExplorationH(SP)")*60)} min`);
t('proportionnel à la taille (une naine reste courte)',E("(()=>{const n={...SP,etapesTaille:3,taille:'naine'};return Math.round(dureeExplorationH(n)*60)<=35})()"),E("Math.round(dureeExplorationH({...SP,etapesTaille:3,taille:'naine'})*60)")+' min');
t('plafond 7 h',E("DUREE.maxSpecialeH")===7&&E("dureeExplorationH({...SP,etapesTaille:14,speciale:true})<=7"));
t('aucun effet sur une planète ordinaire',E("galaxie.planetes.filter(p=>!p.speciale).every(p=>dureeExplorationH(p)===dureeExplorationH(p,true))"));
E("etat.bossVus[cleGal()]='vaincu'");
t('gardien vaincu : la durée redevient normale',E("dureeExplorationH(SP)")===base);
E("etat.bossVus={}");
t('la fiche annonce le supplément',(()=>{E("etat.bossVus[cleGal()]='vu';etat.jimee=genererJimee('F','B');ecran='carte';selection=SP.id;tout()");const r=/\+75 % gardien/.test(w.document.querySelector('#panneau-carte').textContent);E("etat.bossVus={}");return r})());

// --- Issues de l'affrontement
t('trois issues, somme à 1',E("(()=>{for(const pc of ORDRE_CLASSES)for(const n of [3,10,20,40]){const c=chancesGardien({force:n,endurance:n,volonte:n},pc);if(Math.abs(c.victoire+c.fuite+c.mort-1)>1e-9||c.fuite<0)return false}return true})()"));
const grille=J(`(()=>{const o={};for(const jc of ['G','B','A','S']){o[jc]={};for(const pc of ['G','B','S','SSS']){let v=0,m=0;for(let i=0;i<60;i++){const c=chancesGardien(statsEffectives(genererJimee('T'+jc+i,jc)),pc);v+=c.victoire;m+=c.mort}o[jc][pc]=[Math.round(100*v/60),Math.round(100*m/60)]}}return o})()`);
t('à niveau égal : ni victoire systématique ni mort fréquente',[['G','G'],['B','B'],['S','S']].every(([j,p])=>{const [v,m]=grille[j][p];return v>=25&&v<=45&&m<=15}),JSON.stringify([grille.G.G,grille.B.B,grille.S.S]));
t('Jimee très supérieur : victoire presque assurée, mort rare',grille.S.B[0]>=85&&grille.S.B[1]<=3,`S sur planète B : ${grille.S.B[0]} % victoire, ${grille.S.B[1]} % mort`);
t('Jimee très inférieur : victoire rare, mais la fuite reste l\'issue la plus probable',grille.B.SSS[0]<=6&&grille.B.SSS[1]<=45&&100-grille.B.SSS[0]-grille.B.SSS[1]>50,`B sur planète SSS : ${grille.B.SSS[0]} % victoire, ${grille.B.SSS[1]} % mort`);
t('la victoire progresse avec la classe du Jimee',['G','B','A','S'].map(c=>grille[c].S[0]).every((v,i,a)=>!i||v>=a[i-1]),JSON.stringify(['G','B','A','S'].map(c=>grille[c].S[0])));
t('la mort progresse avec la classe de la planète',['G','B','S','SSS'].map(p=>grille.B[p][1]).every((v,i,a)=>!i||v>=a[i-1]));
t('l\'équipement compte autant que la classe',E("(()=>{const j=genererJimee('EQ','B'),nu=chancesGardien(statsEffectives(j),'A').victoire;const r=creerRng('E');for(const sl of SLOTS)j.equipement[sl.id]=creerObjet(r,CATALOGUE.find(m=>m.emplacement===sl.accepte&&m.stat)||CATALOGUE[0],10,'S');return chancesGardien(statsEffectives(j),'A').victoire>nu+.2})()"));

// --- Déroulé réel d'une mission
const sim=J(`(()=>{const j=genererJimee('SIM','S');const p={...planeteEffective(galaxie.planetes.find(x=>x.speciale)),gardien:true,legendaireDispo:null,stockRestant:2};
  let v=0,f=0,m=0,perte=0,vus=0;for(let i=0;i<400;i++){const r=simuler(p,j,'GD/'+i);if(!r.gardienRencontre)continue;vus++;
   if((r.exploits||{}).gardien)v++;else if(r.survie){f++;if((r.pertes||[]).some(e=>e.cause==='gardien'))perte++}else m++}
  return {vus,v,f,m,perte}})()`);
t('le gardien est bien rencontré en mission',sim.vus>0);
t('les trois issues se produisent réellement',sim.v>0&&sim.f>0&&sim.m>0,`${sim.v} victoires, ${sim.f} fuites, ${sim.m} morts sur ${sim.vus}`);
t('la fuite coûte une partie du butin',sim.perte>0&&sim.perte>=sim.f*.6,`${sim.perte} fuites sur ${sim.f} avec perte`);
t('la perte est expliquée dans le rapport',E("libellePerte({cause:'gardien'})").includes('gardien'));
t('rencontre enregistrée même en cas de mort',E("(()=>{const j=genererJimee('MM','G');const p={...planeteEffective(galaxie.planetes.find(x=>x.speciale)),gardien:true,stockRestant:0};for(let i=0;i<300;i++){const r=simuler(p,j,'MO/'+i);if(r.gardienRencontre&&!r.survie)return true}return false})()"));
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
