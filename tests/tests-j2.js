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
t('l\'atelier fabrique de l\'équipement avec de la ferraille',E(`etat.pieces['${atel}'].stock`)>=1&&E('etat.res.ferraille')<500);
const nG=E('etat.objets.length');E(`recolter('${atel}')`);
t('récolter l\'équipement : il va dans la réserve',E('etat.objets.length')>nG);
const g=E('etat.objets[0].id'),slotG=E('etat.objets[0].slot'),jid=E('etat.jimees[1].id');E(`equiper('${jid}','${g}')`);
t('équiper un objet dans son emplacement : bonus au travail et en mission',E(`jimee('${jid}').equip['${slotG}'].id`)===g&&E(`(()=>{const j=jimee('${jid}'),o=j.equip['${slotG}'];return statBase(j,o.stat)===j.stats[o.stat]+o.bonus&&statMission(j,o.stat)>=statBase(j,o.stat)})()`)===true);

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
t('résolution déterministe (même graine, même résultat)',E("(()=>{const m=JSON.parse(JSON.stringify(etat.missions[0]));m.cartes[0].choix=null;m.cartes[0].res=null;m.morts=[];m.blesses=[];m.butin={credits:0,ferraille:0,objets:[],provisions:[]};m.sac=[];m.xp={};const a=resoudreCarte(m,0,0);return a.ok===etat.missions[0].cartes[0].res.ok})()")===true);
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

// --- V2 : équipement, provisions, option dorée
w=ouvrir();E=c=>w.ev(c);E("document.querySelector('[data-action=\"fermer-annonce\"]').click();etat.guide=false;etat.res.carburant=999;etat.res.credits=3000;etat.res.ferraille=500");
t('40 transmissions (dont 20 nouvelles)',E('CARTES.length')===40);
t('provisions de départ : une corde, une trousse',E('etat.provisions.corde')===1&&E('etat.provisions.trousse')===1);
t('acheter une provision',E("acheterProvision('appat')")===null&&E('etat.provisions.appat')===1&&E('etat.res.credits')===3000-20);
t('objet créé : emplacement, caractéristique, rareté',E("(()=>{const o=creerObjet('t1');return !!(EMPLACEMENTS[o.slot]&&STATS[o.stat]&&o.bonus>=1&&o.bonus<=3&&RARETES[o.rarete])})()")===true);
t('objet légendaire : effet spécial',E("creerObjet('t2',{legendaire:LEGENDAIRES[1]}).effet")==='polyvalent'&&E("(()=>{const j=etat.jimees[0];j.equip.tenue=creerObjet('t3',{legendaire:LEGENDAIRES[1]});const r=CLES_STATS.every(k=>statBase(j,k)>=j.stats[k]+1);j.equip.tenue=null;return r})()")===true);
E("etat.objets.push(creerObjet('a'),creerObjet('b'))");const j0=E('etat.jimees[0].id');
t('équiper puis échanger : l\'ancien revient en réserve',E(`(()=>{const a=etat.objets[0],b={...etat.objets[1],slot:a.slot,id:'Bx'};etat.objets.push(b);equiper('${j0}',a.id);equiper('${j0}','Bx');return jimee('${j0}').equip[a.slot].id==='Bx'&&etat.objets.some(o=>o.id===a.id)})()`)===true);
t('vendre un objet',E("(()=>{const c=etat.res.credits,o=etat.objets[0],v=vendreObjet(o.id);return v===CONFIG.vente[o.rarete]*o.bonus&&etat.res.credits===c+v})()")===true);
t('mission : provisions retirées de la réserve et mises dans le sac',E(`lancerMission('P0',['${j0}'],['corde','appat'])`)===null&&E('etat.provisions.corde')===0&&E("etat.missions[0].sac.join()")==='corde,appat');
t('sac : refus sans la provision',typeof E(`(()=>{etat.pieces.p0.niveau=3;return lancerMission('P0',[etat.jimees[1].id],['lampe'])})()`)==='string');
E("(()=>{const m=etat.missions[0];m.cartes[0].id='crevasse';m.cartes[1].id='oasis';m.cartes[0].t=Date.now()-1})()");
t('option dorée : la corde ouvre une 3e option sur la crevasse',E("optionsCarte(etat.missions[0],carte('crevasse')).length")===3&&E("optionsCarte(etat.missions[0],carte('oasis')).length")===2);
E(`ouvrirTransmission(etat.missions[0].id)`);
t('transmission : option dorée affichée',qa('#transmission .option').length===3&&!!q('#transmission .option.doree'));
t('sans réponse, le Jimee utilise la provision',E('choixAuto(etat.missions[0],0)')===2);
clic('#transmission [data-choix="2"]');
t('option dorée : réussite assurée, provision consommée, butin ×1,5',E('etat.missions[0].cartes[0].res.ok')===true&&E("etat.missions[0].sac.join()")==='appat'&&E('etat.missions[0].cartes[0].res.credits')===Math.round(20*1.5)&&/corde/i.test(q('#transmission').textContent));
clic('[data-action="fermer-transmission"]');
E("(()=>{const m=etat.missions[0];m.cartes.slice(1).forEach((c,k)=>{c.choix=0;c.res={ok:true,consequence:'aucune',acteur:m.equipe[0],stat:'jambes',credits:0,ferraille:0,texte:'x'}});m.fin=Date.now()})()");
const appatAvant=E('etat.provisions.appat');E("ouvrirRapport(etat.missions[0].id)");
t('retour : les provisions inutilisées reviennent',E('etat.provisions.appat')===appatAvant+1&&/Rapporté dans le sac/.test(q('#rapport').textContent));
clic('[data-action="fermer-rapport"]');
t('trousse : soigne sur place la première blessure',E("(()=>{let soins=0,blessesMalgre=0;const j=etat.jimees[0];for(let i=0;i<300;i++){const m={seed:'TR'+i,planete:'P12',equipe:[j.id],morts:[],blesses:[],sac:['trousse'],butin:{credits:0,ferraille:0,objets:[],provisions:[]},xp:{},statut:'en_cours',cartes:[{id:'pont',choix:null,t:0}]};const c=carte('pont'),i2=c.o.findIndex(o=>o.risque!=='sur');const r=resoudreCarte(m,0,i2<0?0:i2);if(r.soigne){soins++;if(m.blesses.includes(j.id)||m.sac.length)blessesMalgre++}}return soins>0&&blessesMalgre===0})()")===true);
t('gardien : butin d\'équipement rare ou légendaire',E("(()=>{const j=etat.jimees[0];j.stats={muscles:10,jambes:10,cervelle:10};const m={seed:'G',planete:'P5',equipe:[j.id],morts:[],blesses:[],sac:[],butin:{credits:0,ferraille:0,objets:[],provisions:[]},xp:{},statut:'en_cours',cartes:[{id:'gardien',choix:null,t:0}]};let r=null;for(let i=0;i<2&&!(r&&r.ok);i++){m.seed='G'+i;m.cartes[0].choix=null;r=resoudreCarte(m,0,i)}return !r.ok||r.objet&&r.objet.bonus>=2})()")===true);

// --- V2 : incidents, accélérer, entraînement
E("etat.jimees.forEach(j=>{j.mission=null;j.blesse=0});affecter(etat.jimees[0].id,'p3')");
t('incident déclenché : la pièce s\'arrête et clignote',E("declencherIncident('p3','rats')")===true&&(E('tout(true)'),!!q('#fusee [data-piece="p3"].incident .alerte-incident')));
const st=E('etat.pieces.p3.stock');avance(5);
t('pas de production pendant l\'incident',E('etat.pieces.p3.stock')===st);
E("feuillePiece('p3')");t('fiche : bouton « Intervenir » avec la chance',/Intervenir/.test(q('#feuille').textContent)&&!!q('#feuille [data-action="incident"]'));
t('incident réglé : récompense',E("(()=>{const c=etat.res.credits,r=resoudreIncident('p3',0);return r.ok&&etat.res.credits>c&&!etat.pieces.p3.incident})()")===true);
E("declencherIncident('p3','rats')");
t('incident raté : un Jimee blessé, le stock perdu',E("(()=>{etat.pieces.p3.stock=9;const r=resoudreIncident('p3',.999);return !r.ok&&!!r.blesse&&etat.pieces.p3.stock===0})()")===true);
E("etat.jimees.forEach(j=>{j.blesse=0});affecter(etat.jimees[0].id,'p3')");E("declencherIncident('p3','rats')");avance(16);
t('incident ignoré : il s\'éteint seul au bout de 15 min',!E('etat.pieces.p3.incident'));
E("etat.pieces.p3.rush=null");
t('accélérer : production immédiate',E("(()=>{const r=etat.res.rations,x=accelerer('p3',.99);return x.gain>=3&&etat.res.rations===r+x.gain})()")===true);
t('accélérer encore : le risque grimpe',E("risqueAcceleration(etat.pieces.p3)")>E("CONFIG.accelerer.risqueBase"));
t('accélérer trop : incident',E("accelerer('p3',0).incident")===true&&!!E('etat.pieces.p3.incident'));
E("etat.pieces.p3.incident=null");
t('salle de sport constructible',E("construire(3,0,'salle_sport')")===null);
const sport=E("etat.etages[3][0]"),jS=E('etat.jimees[1].id');E(`jimee('${jS}').stats.muscles=2;jimee('${jS}').trait='bavard';jimee('${jS}').piece=null`);
t('affecter à la salle de sport',E(`affecter('${jS}','${sport}')`)===null);
avance(30);const m1=E(`jimee('${jS}').stats.muscles`);avance(30);
t('entraînement : +1 muscles après ~40 min',m1===2&&E(`jimee('${jS}').stats.muscles`)===3);
t('entraînement : message de progrès consommé par la boucle',E('(etat.progres||[]).length')===0);
E(`jimee('${jS}').stats.muscles=10`);t('maximum 10 : affectation refusée',typeof E(`(()=>{jimee('${jS}').piece=null;return affecter('${jS}','${sport}')})()`)==='string');
E("feuilleGuichet('boutique')");t('guichet : boutique de provisions',qa('#feuille [data-action="acheter"]').length===7);
E("etat.objets.push(creerObjet('z'));feuilleGuichet('objets')");t('guichet : vente d\'équipement',!!q('#feuille [data-action="vendre"]'));
E(`feuilleJimee('${j0}')`);t('fiche Jimee : 3 emplacements',qa('#feuille .emplacement').length===3);
E("ouvrirCarte();feuillePlanete('P0')");t('fiche planète : sac',!!q('#feuille [data-sac]')&&/Sac/.test(q('#feuille').textContent));
clic('#feuille [data-sac]');t('mettre une provision dans le sac',E('carteSel.sac.length')===1);

E("feuilleGuichet('catalogue')");t('catalogue de la Corp : 3 modèles avec leurs chances',qa('#feuille .mag-modele').length===3&&/LE JIMEE ILLUSTRÉ/.test(q('#feuille').textContent)&&/%/.test(q('#feuille .mag-modele .pct').textContent));

// --- Rendre un Jimee à la Corp
E("etat.jimees.forEach(j=>{j.mission=null});etat.jimees.push(nouveauJimee('R1'))");
const nbAv=E('etat.jimees.length'),jr=E('etat.jimees[etat.jimees.length-1].id');E(`jimee('${jr}').equip.tete=creerObjet('rv')`);
E(`feuilleJimee('${jr}')`);clic('#feuille [data-action="revendre-demande"]');
t('revente : confirmation demandée',!!q('#feuille [data-action="revendre"]')&&E('etat.jimees.length')===nbAv);
const cr=E('etat.res.credits'),prixR=E(`prixRevente(jimee('${jr}'))`),nObj=E('etat.objets.length');clic('#feuille [data-action="revendre"]');
t('revente : crédits, place libérée, équipement gardé',E('etat.jimees.length')===nbAv-1&&E('etat.res.credits')===cr+prixR&&E('etat.objets.length')===nObj+1&&!E(`jimee('${jr}')`));
t('revente refusée en mission',/mission/.test(E("(()=>{const j=etat.jimees[0];j.mission='X';const r=revendreJimee(j.id).erreur;j.mission=null;return r})()")));
t('impossible de rendre le dernier Jimee',/dernier/.test(E("(()=>{const l=etat.jimees;etat.jimees=[l[0]];const r=revendreJimee(l[0].id).erreur;etat.jimees=l;return r})()")));

// --- Migration d'une sauvegarde v1 (gadgets)
const v1=E("(()=>{const e=JSON.parse(JSON.stringify(etat));e.version=1;delete e.objets;delete e.provisions;e.gadgets=[{id:'G1',nom:'Gants',stat:'muscles',bonus:2}];e.jimees.forEach(j=>{delete j.equip;delete j.entrainement});e.jimees[0].gadget={id:'G2',nom:'Bottes',stat:'jambes',bonus:1};return JSON.stringify(e)})()");
const W2=ouvrir(v1);
t('migration v1 → v2 : gadgets devenus accessoires, provisions offertes',W2.ev("etat.version===2&&etat.objets.length===1&&etat.objets[0].slot==='accessoire'&&etat.objets[0].rarete==='rare'&&etat.jimees[0].equip.accessoire.id==='G2'&&!('gadget' in etat.jimees[0])&&etat.provisions.corde>=0")===true);

console.log(`\n${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
