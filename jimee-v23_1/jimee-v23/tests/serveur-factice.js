// Serveur Supabase factice (en mémoire) reproduisant tests/../serveur/jimee-multijoueur.sql, partagé entre plusieurs fenêtres jsdom.
function creerServeur(){
  const db={joueurs:[],epaves:[],evenements:[],seq:0,enPanne:false};
  const fn={
    jimee_presence(a){const r={id:a.p_id,partie:a.p_partie,pseudo:a.p_pseudo,univers:a.p_univers,galaxie:a.p_galaxie,galaxie_nom:a.p_galaxie_nom,jimee:a.p_jimee,mission:a.p_mission,maj:new Date(globalThis.__horloge()).toISOString()};
      const i=db.joueurs.findIndex(x=>x.id===a.p_id);if(i>=0)db.joueurs[i]=r;else db.joueurs.push(r);return null},
    jimee_publier_epave(a){let e=db.epaves.find(x=>x.id===a.p_id);const pilles=e&&e.proprietaire===a.p_proprietaire?e.pilles:[];
      const objets=a.p_objets.filter(o=>!pilles.includes(o.id));
      if(!e){e={id:a.p_id,partie:a.p_partie,proprietaire:a.p_proprietaire,pseudo:a.p_pseudo,univers:a.p_univers,galaxie:a.p_galaxie,galaxie_nom:a.p_galaxie_nom,planete_id:a.p_planete_id,nom_planete:a.p_nom_planete,jimee_nom:a.p_jimee_nom,objets,pilles:[],tentatives:[]};db.epaves.push(e)}
      else if(e.proprietaire===a.p_proprietaire)e.objets=objets;return pilles},
    jimee_piller(a){const e=db.epaves.find(x=>x.id===a.p_epave);if(!e)return {ok:false,raison:'introuvable'};
      if(e.proprietaire===a.p_joueur)return {ok:false,raison:'proprietaire'};if(e.tentatives.includes(a.p_joueur))return {ok:false,raison:'deja'};
      const dispo=e.objets.map(o=>o.id).filter(id=>!e.pilles.includes(id));if(a.p_tentes.some(id=>!dispo.includes(id)))return {ok:false,raison:'change'};
      e.pilles.push(...a.p_retires);e.tentatives.push(a.p_joueur);db.evenements.push({id:++db.seq,partie:e.partie,joueur:a.p_joueur,pseudo:a.p_pseudo,type:'pillage',texte:a.p_texte,cree:new Date().toISOString()});return {ok:true}},
    jimee_evenement(a){db.evenements.push({id:++db.seq,partie:a.p_partie,joueur:a.p_joueur,pseudo:a.p_pseudo,type:a.p_type,texte:a.p_texte,cree:new Date().toISOString()});return null}
  };
  const tables={jimee_joueurs:'joueurs',jimee_epaves:'epaves',jimee_evenements:'evenements'};
  function lire(table,q){let l=JSON.parse(JSON.stringify(db[tables[table]]));let ordre=null,limite=null;
    for(const part of q.split('&')){const [k,v]=part.split('=');const val=decodeURIComponent(v||'');
      if(k==='order'){ordre=val.split('.');continue}if(k==='limit'){limite=+val;continue}
      const [op,...r]=val.split('.'),x=r.join('.');
      l=l.filter(row=>op==='eq'?String(row[k])===x:op==='neq'?String(row[k])!==x:op==='gt'?row[k]>+x:true)}
    if(ordre)l.sort((a,b)=>(a[ordre[0]]-b[ordre[0]])*(ordre[1]==='desc'?-1:1));if(limite)l=l.slice(0,limite);return l}
  const fetch=async(url,o={})=>{
    if(db.enPanne)throw new Error('réseau coupé');
    const u=new URL(url),m=u.pathname.match(/\/rest\/v1\/(rpc\/)?(\w+)/);if(!m)return {ok:false,status:404};
    if(!(o.headers||{}).apikey)return {ok:false,status:401};
    const res=m[1]?fn[m[2]](JSON.parse(o.body||'{}')):lire(m[2],u.search.slice(1));
    return {ok:true,status:200,json:async()=>res,text:async()=>res==null?'':JSON.stringify(res)}};
  return {db,fetch};
}
module.exports={creerServeur};
