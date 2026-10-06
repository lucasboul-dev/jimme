// Tests Jimee 2 (jimee2/index.html) — fusée, production, équipage, missions à cartes, Corp. node tests/tests-j2.js
const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path');
const HTML=fs.readFileSync(path.join(__dirname,'..','jimee2','index.html'),'utf8');
const horloge={now:Date.parse('2026-10-06T10:00:00Z')};
function ouvrir(sauvegarde){
  const dom=new JSDOM(HTML,{url:'https://jimee.test/jimee2/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
    if(sauvegarde)w.localStorage.setItem('jimee2-sauvegarde',sauvegarde);
    w.Date.now=()=>horloge.now;w.matchMedia=()=>({matches:true});w.confirm=()=>true;w.fetch=()=>Promise.resolve({});
    w.HTMLElement.prototype.scrollIntoView=function(){}}});
  const w=dom.window;w.ev=c=>{try{return w.eval(c)}catch(e){console.log('  [erreur JS] '+e.message+' ← '+String(c).slice(0,90));return undefined}};return w;
}
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
let w=ouvrir();let E=c=>w.ev(c);const q=s=>w.document.querySelector(s),qa=s=>w.document.querySelectorAll(s);
const clic=s=>{const el=q(s);if(!el)return false;el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));return true};
const avance=min=>{horloge.now+=min*60000;E('tic()')};

// --- Départ
t('partie neuve : 2 Jimees, 5 pièces, accueil affiché',E('etat.jimees.length')===2&&E('Object.keys(etat.pieces).length')===5&&q('#annonce').classList.contains('ouvert'));
t('fusée dessinée : nez, étages, moteurs',!!q('#fusee .nez')&&qa('#fusee .etage').length===4&&!!q('#fusee .moteurs'));
t('les Jimees se promènent dans les pièces',qa('#fusee .habitant').length===2);
t('emplacements vides constructibles',qa('#fusee [data-construire]').length===2);
clic('[data-action="fermer-annonce"]');
t('guide : récolter le réacteur, la bulle est montrée',E('etapeGuide()')==='recolte'&&!!q('[data-piece="p4"] .recolte.guide-cible'));
const carbu0=E('etat.res.carburant');clic('[data-piece="p4"] .recolte');
t('récolte : carburant ajouté, bulle disparue',E('etat.res.carburant')===carbu0+12&&!q('[data-piece="p4"] .recolte'));
t('guide : affecter un Jimee à la cantine',E('etapeGuide()')==='affecte'&&!!q('#fusee [data-piece="p3"].guide-cible'));
clic('#fusee [data-piece="p3"]');
t('fiche de la cantine : production, équipe, candidats',/Production/.test(q('#feuille').textContent)&&qa('#feuille [data-affecter="p3"]').length>=1);
const idle=E("etat.jimees.find(j=>!j.piece).id");clic(`#feuille [data-affecter="p3"][data-j="${idle}"]`);
t('affectation à la cantine',E(`jimee('${idle}').piece`)==='p3'&&E('etat.guideFait.affecte')===true);
t('pas plus de 2 Jimees par pièce de production',E("(()=>{const a=etat.jimees[0];return affecter(a.id,'p3')})()")===null&&typeof E("(()=>{const x=nouveauJimee('X');etat.jimees.push(x);const r=affecter(x.id,'p3');etat.jimees.pop();return r})()")==='string');
E("affecter(etat.jimees.find(j=>j.id!=='"+idle+"').id,'p4')");

// --- Production en temps réel et hors ligne
const r0=E('etat.res.rations'),s0=E("etat.pieces.p3.stock");avance(10);
t('la cantine produit (≈ 0,5 + 0,1 × jambes par minute)',E("etat.pieces.p3.stock")>s0+5,E("etat.pieces.p3.stock").toFixed(1));
t('l\'équipage mange (1 ration / 6 min / Jimee)',Math.abs(r0-E('etat.res.rations')-10*2/6)<.01);
t('stock plafonné',(avance(600),E('etat.pieces.p3.stock'))===30&&E('etat.pieces.p4.stock')===30);
E("etat.res.rations=0");const sF=E("etat.pieces.p4.stock=0");avance(10);const avecFaim=E('etat.pieces.p4.stock');
E("etat.res.rations=50;etat.pieces.p4.stock=0");avance(10);
t('affamé : production divisée par deux',Math.abs(avecFaim*2-E('etat.pieces.p4.stock'))<.2);
E("etat.pieces.p4.stock=0;etat.res.rations=50");const sv=E('JSON.stringify(etat)');horloge.now+=30*60000;w=ouvrir(sv);E=c=>w.ev(c);
t('hors ligne : 30 minutes rattrapées au chargement',E('etat.pieces.p4.stock')>20&&E('etat.res.rations')<50&&E('etat.maj')===horloge.now,E('etat.pieces.p4.stock').toFixed(1));

// --- Construction et amélioration
E("etat.res.credits=5000;etat.res.ferraille=500");
t('construire une infirmerie',E("construire(3,0,'infirmerie')")===null&&E("etat.pieces[etat.etages[3][0]].type")==='infirmerie');
t('construire un atelier',E("construire(3,1,'atelier')")===null);
t('emplacement occupé refusé',typeof E("construire(3,0,'dortoir')")==='string');
t('ajouter un étage',E('ajouterEtage()')===null&&E('etat.etages.length')===5);
t('améliorer le réacteur au niveau 2',E("ameliorer('p4')")===null&&E('etat.pieces.p4.niveau')===2);
t('capacité d\'équipage = 2 + dortoirs',E('capacite()')===4&&(E("construire(4,0,'dortoir')"),E('capacite()'))===6);
const atel=E("etat.etages[3][1]");E(`affecter(etat.jimees[0].id,'${atel}')`);E("etat.pieces['"+atel+"'].stock=0");avance(60);
t('l\'atelier fabrique des gadgets avec de la ferraille',E(`etat.pieces['${atel}'].stock`)>=1&&E('etat.res.ferraille')<500);
const nG=E('etat.gadgets.length');E(`recolter('${atel}')`);
t('récolter les gadgets',E('etat.gadgets.length')>nG);
const g=E('etat.gadgets[0].id'),jid=E('etat.jimees[1].id');E(`equiper('${jid}','${g}')`);
t('équiper un gadget : bonus en mission',E(`jimee('${jid}').gadget.id`)===g&&E(`statMission(jimee('${jid}'),jimee('${jid}').gadget.stat)>jimee('${jid}').stats[jimee('${jid}').gadget.stat]`)===true);

// --- Missions à cartes
E("etat.res.carburant=500");
t('planète 2 fermée tant que la 1 n\'a pas d\'étoile',E("planeteOuverte(PLANETES[1])")===false);
const err=E(`lancerMission('P0',['${jid}'])`);
t('mission lancée',err===null&&E('missionsActives().length')===1,err);
t('mission express pendant le guide (45 s)',E('etat.missions[0].fin-etat.missions[0].depart')===45000);
t('3 transmissions au quart, à la moitié, aux trois quarts',E("etat.missions[0].cartes.map(c=>c.t-etat.missions[0].depart).join()")==='11250,22500,33750');
t('un seul vol à la fois au cockpit niveau 1',typeof E(`lancerMission('P0',[etat.jimees.find(j=>disponible(j)).id])`)==='string');
t('le Jimee quitte sa pièce pendant la mission',E(`jimee('${jid}').mission`)===E('etat.missions[0].id')&&E(`jimee('${jid}').piece`)===null);
horloge.now+=12000;E('tic()');
t('transmission disponible : bouton « Répondre »',E('carteEnAttente(etat.missions[0])')===0&&!!q('.btn-transmission'));
clic('.btn-transmission');
t('carte affichée avec deux choix et leurs chances',q('#transmission').classList.contains('ouvert')&&qa('#transmission .option').length===2&&/%/.test(q('#transmission .option').textContent));
clic('[data-choix="0"]');
t('choix résolu, tampon affiché',E('etat.missions[0].cartes[0].choix')===0&&!!q('#transmission .tampon'));
t('résolution déterministe (même graine, même résultat)',E("(()=>{const m=JSON.parse(JSON.stringify(etat.missions[0]));m.cartes[0].choix=null;m.cartes[0].res=null;m.morts=[];m.blesses=[];m.butin={credits:0,ferraille:0,gadgets:[]};m.xp={};const a=resoudreCarte(m,0,0);return a.ok===etat.missions[0].cartes[0].res.ok})()")===true);
clic('[data-action="fermer-transmission"]');
horloge.now+=60000;E('tic()');
t('sans réponse : le Jimee décide seul',E("etat.missions[0]&&etat.missions[0].cartes.slice(1).every(c=>c.choix!==null&&c.auto||c.annulee)")===true);
t('rapport prêt',E('rapportPret(etat.missions[0])')===true&&!!q('.btn-transmission.rapport'));
const vivant=E("vivants(etat.missions[0]).length")>0,mid=E('etat.missions[0].id');
clic('.btn-transmission.rapport');
t('rapport : lignes, bilan, mission close',q('#rapport').classList.contains('ouvert')&&qa('#rapport .ligne-rap').length>=3&&E('missionsActives().length')===0);
t(vivant?'retour : une étoile au moins, planète suivante ouverte':'mort : affiche et coupon',vivant?E("etoilesDe('P0')>=1&&planeteOuverte(PLANETES[1])")===true:E('etat.memorial.length===1&&etat.coupons.length===1')===true);
t('fin du guide après la première mission',E('etat.guide')===false);
clic('[data-action="fermer-rapport"]');

// --- Chance, risque, personnalité
t('chance bornée entre 5 et 97 %',E("(()=>{const m={planete:'P17',equipe:[etat.jimees[0].id],morts:[]};const a=evaluerOption(m,{stat:'muscles',risque:'risque'}).chance;const m2={planete:'P0',equipe:[etat.jimees[0].id],morts:[]};const b=evaluerOption(m2,{stat:'muscles',risque:'sur'}).chance;return a>=5&&b<=97})()")===true);
t('équipe de deux : meilleure caractéristique +1',E("(()=>{const [a,b]=etat.jimees;const s1=evaluerOption({planete:'P5',equipe:[a.id],morts:[]},{stat:'cervelle',risque:'normal'}).chance,s2=evaluerOption({planete:'P5',equipe:[a.id,b.id],morts:[]},{stat:'cervelle',risque:'normal'}).chance;return s2>=s1})()")===true);
t('prudent choisit le moins risqué, téméraire le plus risqué',E("(()=>{const j=etat.jimees[0],m={seed:'X',planete:'P0',equipe:[j.id],morts:[],cartes:[{id:'pont'}]};j.perso='prudent';const a=choixAuto(m,0);j.perso='temeraire';const b=choixAuto(m,0);return a===1&&b===0})()")===true);
t('une option « prudente » ne tue jamais',E("CONFIG.risques.sur.mort===0&&CONFIG.risques.sur.mortPalier===0")===true);

// --- La Corp : mort rentable, capsules
w=ouvrir();E=c=>w.ev(c);E("document.querySelector('[data-action=\"fermer-annonce\"]').click();etat.guide=false;etat.res.carburant=999;etat.res.credits=2000");
const victime=E('etat.jimees[0].id');E(`lancerMission('P0',['${victime}'])`);
E("(()=>{const m=etat.missions[0];m.cartes.forEach((c,k)=>{c.choix=0;c.res={ok:false,consequence:k===0?'mort':'aucune',acteur:'"+victime+"',stat:'jambes',credits:0,ferraille:0,texte:'x'}});m.morts=['"+victime+"'];m.statut='perdue';m.fin=Date.now()})()");
E(`ouvrirRapport('${E('etat.missions[0].id')}')`);
t('mort : affiche commémorative au mémorial',E('etat.memorial.length')===1&&/hommage|souvenir|deuil|commémoratives/i.test(E('etat.memorial[0].titre'))&&!!q('#rapport .affiche'));
t('mort : le Jimee quitte l\'équipage, compteur de deuils',E('etat.jimees.length')===1&&E('etat.deuils')===1);
t('coupon hommage : −30 % sur la capsule',E('prixCapsule()')===70);
t('bonus de deuil sur les légendaires',E("chancesRarete().find(x=>x.id==='legendaire').poids")>3);
const x=E("JSON.stringify(tirerCapsule())");const X=JSON.parse(x);
t('capsule : un cousin hérite +1 dans la caractéristique fatale',X.jimee.cousinDe&&X.coupon&&X.coupon.stat==='jambes'&&E('etat.coupons.length')===0&&E('etat.jimees.length')===2);
t('capsule payée au prix réduit',E('etat.res.credits')===2000-70);
t('album : apparence enregistrée',E(`etat.album['${X.jimee.couleur}|${X.jimee.chapeau}']`)===true);
E("etat.jimees.push(nouveauJimee('A'),nouveauJimee('B'))");
t('capsule refusée sans place au dortoir',/place/.test(E('tirerCapsule().erreur')));
t('raretés : 75 / 22 / 3 sans deuil',(()=>{const W=ouvrir();const s=W.ev("chancesRarete().map(x=>x.poids).join()");return s==='75,22,3'})());
E("feuilleGuichet('memorial')");t('guichet : onglet mémorial',!!q('#feuille .affiches .affiche'));
E("feuilleGuichet('album')");t('guichet : album des apparences',qa('#feuille .album span').length===54);

// --- Carte et écrans
E("ouvrirCarte()");t('carte : 18 planètes, 3 galaxies',qa('#chemin .noeud').length===18&&qa('#chemin .galaxie-titre').length===3);
E("feuillePlanete('P0')");t('fiche planète : équipe et décollage',!!q('#feuille [data-action="lancer"]')&&qa('#feuille [data-equipe]').length===E('etat.jimees.length'));
t('rendu des fiches sans erreur',E("(()=>{try{feuilleJimee(etat.jimees[0].id);feuillePiece('p3');feuillePiece('p2');feuilleReglages();feuilleConstruire('3/0');return true}catch(e){return e.message}})()")===true);
t('sauvegarde raisonnable',E('JSON.stringify(etat).length')<60000,Math.round(E('JSON.stringify(etat).length')/1024)+' ko');

console.log(`\n${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
