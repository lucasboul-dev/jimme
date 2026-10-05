// Tests V15 — lot B (fin des points, progression cachée, expéditions de la Corp, baie d'observation). Lancer : node tests/tests-v15.js
const {ouvrir,horloge}=require('./harness.js');
(async()=>{
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);const J=c=>JSON.parse(E(`JSON.stringify(${c})`));
const txt=()=>{const b=w.document.body.cloneNode(true);b.querySelectorAll('script,style').forEach(x=>x.remove());return b.textContent.replace(/\s+/g,' ')};

// --- Points de caractéristique supprimés
t('nouveau Jimee : ni points, mais expérience et éveils',E("(()=>{const j=genererJimee('P1','B');return !('points' in j)&&j.experience&&Array.isArray(j.eveils)})()"));
t('plus de fonction d\'attribution',E("typeof attribuerPoint")==='undefined');
E("etat.credits=9999;etat.jimee=genererJimee('UI','G');etat.jimee.points=2;ecran='jimee';tout()");
t('aucun bouton « +1 » dans l\'armurerie',!/à attribuer/.test(txt())&&!w.document.querySelector('[data-action=point]'));
t('fiche Jimee : explication de l\'éveil',/seul le vécu d'un Jimee peut l'éveiller/.test(txt()));
// Promotion : plus de point
E("(()=>{const j=etat.jimee;j.missions=2;const p=galaxie.planetes.find(x=>x.classe==='G');etat.params.test=true;selection=p.id;envoyer()})()");
horloge.now+=60000;E("tic();if(etat.mission&&etat.mission.resultat.survie)ouvrirRapport()");
t('promotion sans point à attribuer',!/point de caractéristique/.test(txt()));

// --- Migration V13/V14 → sauvegarde 14
const v13=J("etat");v13.version=13;delete v13.expeditions;delete v13.compteurExpe;
v13.jimee=J("genererJimee('MIG','G')");delete v13.jimee.experience;delete v13.jimee.eveils;v13.jimee.points=3;
const somme=Object.values(v13.jimee.stats).reduce((a,b)=>a+b,0);
let w2=ouvrir(JSON.stringify(v13));
t('migration : version 14, expéditions créées',w2.ev("etat.version===CONFIG.versionSauvegarde&&Array.isArray(etat.expeditions)&&etat.compteurExpe===0"));
t('migration : points non dépensés attribués (somme +3), champ supprimé',w2.ev(`Object.values(etat.jimee.stats).reduce((a,b)=>a+b,0)===${somme+3}&&!('points' in etat.jimee)`));
t('migration : expérience et éveils initialisés',w2.ev("etat.jimee.experience.blessures===0&&etat.jimee.eveils.length===0"));
const w3=ouvrir(JSON.stringify(v13));
t('migration déterministe',w3.ev("JSON.stringify(etat.jimee.stats)")===w2.ev("JSON.stringify(etat.jimee.stats)"));

// --- Progression cachée
t('7 éveils définis, un par caractéristique',E("Object.keys(PROGRESSION_CACHEE.eveils).sort().join()===Object.keys(STATS_NOMS).sort().join()"));
t('seuil propre au Jimee, dans la fourchette, stable',E("Object.entries(PROGRESSION_CACHEE.eveils).every(([k,d])=>{const j=genererJimee('S'+k,'G'),s=seuilEveil(j,k);return s>=d.seuil[0]&&s<=d.seuil[1]&&s===seuilEveil(j,k)})"));
t('les seuils varient d\'un Jimee à l\'autre',new Set(J("Array.from({length:30},(_,i)=>seuilEveil(genererJimee('V'+i,'G'),'force'))")).size>1);
const ev=J(`(()=>{const j=genererJimee('EV','G'),f0=j.stats.force;const avant=eveilsCaches(j).length;j.vecu.donjon=20;let n=0,premier=null;
  for(let m=0;m<20;m++){j.missions=m;const e=eveilsCaches(j);if(e.length&&premier===null)premier=m;n+=e.filter(x=>x.stat==='force').length}
  return {avant,n,gain:j.stats.force-f0,premier,eveils:j.eveils}})()`);
t('aucun éveil sans vécu',ev.avant===0);
t('éveil de la force après assez de donjons',ev.n===1&&ev.eveils.includes('force'),JSON.stringify(ev));
t('+2 de base, une seule fois (jamais deux)',ev.gain===2);
t('éveil pas forcément immédiat (chance par mission) mais déterministe',ev.premier!==null&&J(`(()=>{const j=genererJimee('EV','G');j.vecu.donjon=20;for(let m=0;m<20;m++){j.missions=m;if(eveilsCaches(j).length)return m}return -1})()`)===ev.premier);
t('volonté : compteur de missions au-dessus de sa classe',E("(()=>{const j=genererJimee('VO','G');j.experience.auDessus=50;for(let m=0;m<30;m++){j.missions=m;eveilsCaches(j)}return j.eveils.includes('volonte')})()"));
t('les conditions ne sont affichées nulle part',(()=>{E("ecran='jimee';tout()");return !/donjons? survécus|seuil/.test(txt())})());
// Bout en bout : l'ouverture du rapport déclenche l'éveil et l'affiche
E("(()=>{etat.mission=null;const j=genererJimee('E2E','B');j.vecu={donjon:40,falaise:40,embuscade:40,ruines_anciennes:40,villageois:40};j.experience={blessures:40,auDessus:40};etat.jimee=j;etat.params.test=true;selection=galaxie.planetes.find(x=>x.classe==='G').id;envoyer()})()");
horloge.now+=60000;E("tic();ouvrirRapport()");

const surv=E("etat.jimee!==null");
await new Promise(r=>setTimeout(r,300));
const bil=w.document.querySelector('#bilan').innerHTML;
t('rapport : éveil(s) annoncé(s) sans révéler la condition',!surv||E("etat.jimee.eveils.length===0")||(/Éveil/.test(bil)&&!/donjon|seuil/i.test(bil.split('Éveil')[1]||'')),E("etat.jimee?etat.jimee.eveils.join():'mort'"));

// --- Expéditions
w=ouvrir();E=c=>w.ev(c);
E("etat.credits=100000;etat.jimee=genererJimee('XP','G');etat.params.test=false");
t('aucune planète éligible avant exploration',E("planetesExpedition().length===0"));
E("corpOnglet='expeditions';ecran='corp';tout()");
t('onglet Expéditions : message d\'attente',/Aucune planète éligible/.test(txt()));
E("for(const p of galaxie.planetes.slice(0,3))etat.cartographie[cleCarto(p)]=1;tout()");
t('planètes explorées éligibles',E("planetesExpedition().length===3"));
t('onglet : issues et pourcentages affichés',/Pause syndicale : 20 %/.test(txt())&&/Escouade dévorée : 7 %/.test(txt())&&/non remboursable/.test(txt()));
t('prix croissant avec la durée',E("(()=>{const p=planetesExpedition()[0];const l=EXPEDITIONS.durees.map(h=>prixExpedition(p,h));return l.every((v,i)=>!i||v>l[i-1])})()"));
const stats=J(`(()=>{const p=planetesExpedition()[0];const c={};let gain=0,paye=0,tres=0,obj=0;const N=20000;
  for(let i=0;i<N;i++){const h=EXPEDITIONS.durees[i%4],r=resoudreExpedition(p,h,'ST'+i,5);c[r.issue]=(c[r.issue]||0)+1;gain+=valeurRessources(r.ressources);paye+=prixExpedition(p,h);
   if(Object.keys(r.ressources).some(id=>RES[id].rarete==='tres_rare'))tres++;if(r.objet)obj++}
  return {pct:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,+(v/N*100).toFixed(1)])),ratio:gain/paye,tres,obj:obj/N}})()`);
t('issues ≈ 70 / 20 / 7 / 3 %',Math.abs(stats.pct.normal-70)<1.5&&Math.abs(stats.pct.pause-20)<1.2&&Math.abs(stats.pct.devoree-7)<.8&&Math.abs(stats.pct.zele-3)<.6,JSON.stringify(stats.pct));
t('légèrement rentable en moyenne (× 1,05 à 1,3)',stats.ratio>1.05&&stats.ratio<1.3,stats.ratio.toFixed(2));
t('jamais de ressource très rare',stats.tres===0);
t('équipement rare (< 5 % des expéditions)',stats.obj>0&&stats.obj<.05,(stats.obj*100).toFixed(1)+' %');
t('résultat déterministe (même seed)',E("(()=>{const p=planetesExpedition()[0];return JSON.stringify(resoudreExpedition(p,2,'D1',3))===JSON.stringify(resoudreExpedition(p,2,'D1',3))})()"));
t('pas d\'équipement si la planète est vidée',E("(()=>{const p=planetesExpedition()[0];for(let i=0;i<3000;i++)if(resoudreExpedition(p,4,'V'+i,0).objet)return false;return true})()"));
// Lancement réel
const c0=E("etat.credits");
E("expeSel=planetesExpedition()[1].id;expeDuree=2;lancerExpedition(expeSel,2)");
t('expédition lancée et payée',E("expeditionsActives().length===1")&&E("etat.credits")<c0);
t('une seule à la fois',(()=>{E("lancerExpedition(planetesExpedition()[0].id,1)");return E("expeditionsActives().length")===1})());
t('le Jimee reste libre pendant l\'expédition',(()=>{E("selection=galaxie.planetes[0].id;etat.params.test=true;envoyer()");const r=E("etat.mission!==null");E("etat.mission=null;etat.params.test=false");return r})());
t('bandeau : escouade en cours',/Escouade X1/.test(w.document.querySelector('#statut').textContent));
const ress0=E("JSON.stringify(etat.ressources)"),inv0=E("etat.inventaire.length");
const save=E("JSON.stringify(etat)");
horloge.now+=2*3600*1000+1000;
w=ouvrir(save);E=c=>w.ev(c);
t('livrée au rechargement (app fermée)',E("etat.expeditions[0].statut==='terminee'"));
const res=J("etat.expeditions[0].resultat");
t('ressources ajoutées exactement une fois',E(`(()=>{const a=${ress0},r=${JSON.stringify(res.ressources)};return Object.entries(r).every(([id,q])=>(etat.ressources[id]||0)===(a[id]||0)+q)})()`));
E("finaliserExpeditions();finaliserExpeditions();tic()");
t('aucune duplication (idempotent)',E(`(()=>{const a=${ress0},r=${JSON.stringify(res.ressources)};return Object.entries(r).every(([id,q])=>(etat.ressources[id]||0)===(a[id]||0)+q)&&etat.inventaire.length===${inv0}+(${res.objet?1:0})})()`));
E("ouvrirRapportExpedition(etat.expeditions[0].id)");horloge.now+=1;
t('rapport lu',E("etat.expeditions[0].lu===true"));
// Mode test : 20 s
E("etat.params.test=true;lancerExpedition(planetesExpedition()[0].id,4)");
t('mode test : 20 secondes',E("(()=>{const x=expeditionsActives()[0];return x&&x.fin-x.debut===EXPEDITIONS.dureeTestMs})()"));
t('fiche planète : raccourci vers l\'escouade',(()=>{E("ecran='carte';selection=planetesExpedition()[0].id;tout()");return /Envoyer une escouade Corp/.test(txt())})());

// --- Baie d'observation
E("ecran='vaisseau';tout()");
t('baie : étoiles générées',E("+document.querySelector('.baie .e1').dataset.n>100"));
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
})();
