// Tests V23 — rapport en deux temps : journal qui défile, puis « Suivant » ouvre le bilan sur tout l'écran
const {ouvrir}=require('./harness.js');
let ok=0,ko=0;const t=(n,c,info)=>{if(c){ok++;console.log('✅',n,info||'')}else{ko++;console.log('❌ ÉCHEC :',n,info||'')}};
const dort=ms=>new Promise(r=>setTimeout(r,ms||30));
const w=ouvrir();const E=c=>w.ev(c);const q=s=>w.document.querySelector(s);
const vis=s=>q(s).style.display!=='none';
(async()=>{
  const lignes=JSON.stringify(Array.from({length:12},(_,i)=>({ton:i===11?'bon':'neutre',etiquette:'T+'+i+'h00',txt:'Étape '+i})));
  E(`reveler('Rapport de mission : Test-1','Sous-titre',${lignes},'<div class="bloc"><b>Ressources :</b> 12 fer</div>',true)`);
  t('le journal est affiché seul au départ',vis('#journal')&&!vis('#bilan')&&!vis('#rap-fermer')&&!vis('#rap-retour'));
  t('le bilan est déjà préparé mais caché',q('#bilan').innerHTML.includes('12 fer')&&!vis('#bilan'));
  await dort();
  t('fin du défilement : toutes les lignes visibles',w.document.querySelectorAll('#journal li.vu').length===12);
  t('fin du défilement : bouton Suivant, pas encore de Fermer',vis('#rap-suivant')&&!vis('#rap-fermer'));
  q('#rap-suivant').click();
  t('Suivant : le bilan remplace le journal',!vis('#journal')&&vis('#bilan'));
  t('Suivant : boutons ‹ Journal et Fermer',vis('#rap-retour')&&vis('#rap-fermer')&&!vis('#rap-suivant'));
  t('le bilan n\'est plus limité à la moitié de l\'écran',!/max-height:48vh/.test(w.document.querySelector('style').textContent));
  q('#rap-retour').click();
  t('‹ Journal : retour au journal complet',vis('#journal')&&!vis('#bilan')&&vis('#rap-suivant')&&w.document.querySelectorAll('#journal li.vu').length===12);
  q('#rap-suivant').click();q('#rap-fermer').click();
  t('Fermer : le rapport disparaît',q('#rapport').style.display==='none');

  // Toucher le journal pendant le défilement affiche tout d'un coup
  E("window.matchMedia=()=>({matches:false})");
  E(`reveler('Rapport de mission : Test-2','',${lignes},'<p>bilan 2</p>',true)`);
  t('défilement lent : Suivant absent au début',!vis('#rap-suivant')&&w.document.querySelectorAll('#journal li.vu').length<12);
  q('#journal').click();
  t('toucher le journal : tout s\'affiche et Suivant apparaît',w.document.querySelectorAll('#journal li.vu').length===12&&vis('#rap-suivant'));
  // Un nouveau rapport ouvert en plein défilement repart proprement
  E(`reveler('Rapport de mission : Test-3','',${lignes},'<p>bilan 3</p>',true)`);
  E(`reveler('Rapport de mission : Test-4','',${JSON.stringify([{ton:'bon',etiquette:'T+0h00',txt:'Seule'}])},'<p>bilan 4</p>',true)`);
  await dort(1200);
  t('rapport suivant : pas de reste du précédent',w.document.querySelectorAll('#journal li').length===1&&q('#bilan').innerHTML.includes('bilan 4')&&vis('#rap-suivant'));
  E("window.matchMedia=()=>({matches:true})");


  // Hangar : les pièces du schéma sont visibles (bug V21 : #hangar-zones toujours masqué) + état sur les cartes du bas
  E("etat.ressources={fer:30,cuivre:3,soufre:12};etat.vaisseau.reacteur=1;etat.vaisseau.scanner=1;etat.vaisseau.reservoir=1;ecran='hangar';hangarSel=null;tout()");
  const zones=q('#hangar-zones');
  t('hangar : le calque des pièces n\'est plus masqué',w.getComputedStyle(zones).display!=='none'&&w.document.querySelectorAll('#hangar-zones .zone-piece').length===5);
  t('hangar : pièce améliorable signalée ▲ sur le schéma',q('#hangar-zones [data-piece="reacteur"]').classList.contains('pret')&&!q('#hangar-zones [data-piece="scanner"]').classList.contains('pret'));
  t('hangar : cartes du bas indiquent possible / manquant',/Niv\. 2 possible/.test(q('.resume-pieces [data-piece="reacteur"]').textContent)&&/manque 2 ress/.test(q('.resume-pieces [data-piece="scanner"]').textContent));
  E("hangarSel='reacteur';tout()");
  t('hangar : fiche ouverte, schéma masqué',w.getComputedStyle(zones).display==='none');
  E("hangarSel=null;ecran='vaisseau';tout()");
  // Carte univers au format de la vue galaxie, marché et atelier sans grand vide
  E("ecran='carte';carteVue='univers';selectionGalaxie=null;tout()");
  t('univers : bandeau court sur la carte, pas de fiche',!q('#ecran-carte').classList.contains('fiche-ouverte')&&/Touchez une galaxie/.test(q('#panneau-carte').textContent)&&!q('#panneau-carte h2'));
  E("selectionGalaxie=etat.galaxieActuelle;tout()");
  t('univers : sa propre galaxie ouvre une fiche plein écran',q('#ecran-carte').classList.contains('fiche-ouverte')&&/Votre position/.test(q('#panneau-carte').textContent)&&w.document.querySelectorAll('#panneau-carte .resume-chiffres span').length>=3);
  E("selectionGalaxie=univers.galaxies.find(x=>x.id!==etat.galaxieActuelle&&visibilite(x)==='connue').id;tout()");
  t('univers : fiche d\'une autre galaxie en pastilles + blocs repliables',w.document.querySelectorAll('#panneau-carte .resume-chiffres span').length===4&&w.document.querySelectorAll('#panneau-carte details.repli').length===3&&!!q('#panneau-carte [data-action="voyager"]'));
  t('univers : outils de zoom masqués sur une fiche',w.getComputedStyle(q('#zoom-outils')).display==='none');
  q('#retour-carte').click();
  t('univers : le retour revient à la carte',E('ecran')==='carte'&&E('selectionGalaxie')===null);
  const css=[...w.document.querySelectorAll('style')].map(x=>x.textContent).join('');
  t('marché / atelier : plus de grand espace vide au-dessus du titre',!/mode-marche #panneau\{padding-top/.test(css)&&!/mode-atelier #panneau\{padding-top/.test(css));
  E("carteVue='galaxie';ecran='vaisseau';tout()");
  q('#rap-fermer').click();
  console.log(`\n${ok} réussis, ${ko} échoués`);process.exit(ko?1:0);
})();
