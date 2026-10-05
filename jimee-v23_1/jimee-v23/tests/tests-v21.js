// Tests V21 — fiche planète sans vignette, hangar en fenêtre flottante, armurerie sectionnée, tiroir de soute
const {ouvrir}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
const w=ouvrir();const E=c=>w.ev(c);const q=s=>w.document.querySelector(s);
E("etat.credits=9000;etat.jimee=genererJimee('V21','B')");

// --- Fiche planète
E("ecran='carte';carteVue='galaxie';selection=galaxie.planetes[0].id;tout()");
t('aucune vignette de planète dans la fiche',!q('#panneau-carte img'));
t('le titre reste en tête, sans décalage',q('#panneau-carte h2').textContent===E("galaxie.planetes[0].nom"));
t('résumé chiffré toujours là',w.document.querySelectorAll('#panneau-carte .resume-chiffres span').length>=3);

// --- Hangar en fenêtre flottante
E("ecran='hangar';hangarSel=null;tout()");
t('hangar : schéma visible, pas de fiche',!q('#ecran-hangar').classList.contains('fiche-ouverte')&&q('#ecran-hangar .retour-flottant').textContent.includes('Vaisseau'));
E("hangarSel='reacteur';tout()");
t('pièce choisie : fiche plein écran',q('#ecran-hangar').classList.contains('fiche-ouverte'));
t('retour vers le hangar, pas vers le cockpit',q('#ecran-hangar .retour-flottant').textContent.includes('Hangar')&&q('#ecran-hangar .retour-flottant').dataset.retourHangar==='1');
q('#ecran-hangar .retour-flottant').click();
t('le retour referme la fiche sans quitter le hangar',E('ecran')==='hangar'&&E('hangarSel')===null&&!q('#ecran-hangar').classList.contains('fiche-ouverte'));

// --- Armurerie sectionnée
E("ecran='jimee';jimeeStatsSeules=false;tout()");
const titres=[...w.document.querySelectorAll('#panneau .section>h3')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
t('sections encadrées et titrées',titres.length>=5,titres.join(' | '));
t('chaque section porte son compteur',titres.some(x=>/Équipement .*\/ 7/.test(x))&&titres.some(x=>/Tenues .*\/ 3/.test(x))&&titres.some(x=>/Ceinture .*\/ 2/.test(x)));
t('sections bien distinctes dans le HTML (aucune imbrication)',E("(()=>{const h=document.querySelector('#panneau').innerHTML;return !/<div class=\"section\">(?:(?!<\\/div>)[\\s\\S])*<div class=\"section\">/.test(h)})()"));
t('section vide : message court au lieu du silence',/Vide\. Les objets rapportés/.test(q('#panneau').textContent)&&/Aucune tenue enregistrée/.test(q('#panneau').textContent));

// --- Tiroir de soute
E("etat.ressources={fer:42,cryonite:5,noyau:1};ecran='vaisseau';souteOuverte=false;tout()");
t('onglet Soute présent dans le cockpit, fermé',!!q('#onglet-soute')&&!q('#tiroir-soute').classList.contains('ouvert')&&q('#onglet-soute').getAttribute('aria-expanded')==='false');
t('total affiché sur l\'onglet',q('#soute-total').textContent==='48');
q('#onglet-soute').click();
t('ouverture au toucher',q('#tiroir-soute').classList.contains('ouvert')&&q('#onglet-soute').getAttribute('aria-expanded')==='true');
const txt=q('#tiroir-soute').textContent.replace(/\s+/g,' ');
t('contenu : unités, valeur, ressources groupées par rareté',/48 unités/.test(txt)&&/cr au rachat/.test(txt)&&/très rare/.test(txt)&&/commune/.test(txt));
t('icônes et quantités, sans passer par le commerce',w.document.querySelectorAll('#tiroir-soute .case-soute').length===3&&w.document.querySelectorAll('#tiroir-soute .case-soute svg').length===3);
t('raccourci vers le commerce',!!q('#tiroir-soute [data-marche]'));
q('#onglet-soute').click();
t('refermeture',!q('#tiroir-soute').classList.contains('ouvert'));
E("etat.ressources={};souteOuverte=true;majSoute()");
t('soute vide : message clair',/Vide\. Le butin des missions arrive ici\./.test(q('#tiroir-soute').textContent));
E("souteOuverte=false;majSoute()");
t('rendu de tous les écrans sans erreur',E("(()=>{for(const e of ['vaisseau','carte','jimee','corp','hangar','atelier','marche','labo'])try{ecran=e;tout()}catch(x){return false}return true})()"));
console.log(`${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
