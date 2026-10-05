const {JSDOM}=require('jsdom');const fs=require('fs');
const HTML=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const horloge={now:Date.parse('2026-10-02T10:00:00Z')};
const notifs=[], ntfy=[];
function ouvrir(sauvegarde){
  const dom=new JSDOM(HTML,{url:'https://jimee.test/',runScripts:'dangerously',pretendToBeVisual:true,
    beforeParse(w){
      if(sauvegarde)w.localStorage.setItem('jimee-v1',sauvegarde);
      w.Date.now=()=>horloge.now;
      w.matchMedia=()=>({matches:true});
      w.Notification=function(t,o){notifs.push(t)};w.Notification.permission='granted';w.Notification.requestPermission=async()=>'granted';
      w.fetch=(url,o)=>{ntfy.push({url,titre:o.headers.Title,delai:o.headers.Delay});return Promise.resolve({})};
      w.confirm=()=>true;
      w.HTMLElement.prototype.scrollIntoView=function(){};
    }});
  const w=dom.window;
  w.ev=c=>{try{return w.eval(c)}catch(e){console.log("  [erreur JS] "+e.message+" ← "+String(c).slice(0,90).replace(/\s+/g," "));return undefined}};
  return w;
}
module.exports={ouvrir,horloge,notifs,ntfy};
