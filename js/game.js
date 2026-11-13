const IMGSRC={kaelen:'assets/kaelen.jpg',elara:'assets/elara.jpg',sentinel:'assets/sentinel.jpg',spider:'assets/spider.jpg',malakor:'assets/malakor.jpg'};
(()=>{
'use strict';
const W=480,H=270,T=16;
const cv=document.getElementById('c'),g=cv.getContext('2d');
cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;

/* ---------- entrada ---------- */
const keys={},pr={};
const MAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'jump',Space:'jump',ArrowDown:'down',KeyS:'down',KeyJ:'atk',KeyZ:'atk',KeyK:'mag',KeyX:'mag',KeyL:'dash',KeyC:'dash',KeyE:'act',Enter:'act',KeyQ:'pot',KeyM:'map',Tab:'map',KeyP:'pause',Escape:'pause'};
function setKey(a,v){if(v&&!keys[a])pr[a]=true;keys[a]=v;if(a==='up')setKey2('jump',v)}
function setKey2(a,v){if(v&&!keys[a])pr[a]=true;keys[a]=v}
addEventListener('keydown',e=>{const a=MAP[e.code];if(!a)return;e.preventDefault();audioInit();if(!e.repeat)setKey(a,true)});
addEventListener('keyup',e=>{const a=MAP[e.code];if(!a)return;setKey(a,false)});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
document.querySelectorAll('#touch button').forEach(b=>{
  const a=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();audioInit();setKey(a,true);if(a==='jump')setKey2('up',false)});
  const up=()=>setKey(a,false);
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
});
cv.addEventListener('pointerdown',()=>{cv.focus();audioInit()});
const P=a=>!!pr[a];

/* ---------- som ---------- */
let AC=null;
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}
function tone(f,d,type='square',vol=.04,slide=0){
  if(!AC)return;try{
    const o=AC.createOscillator(),gn=AC.createGain();o.type=type;o.frequency.value=f;
    if(slide)o.frequency.linearRampToValueAtTime(Math.max(30,f+slide),AC.currentTime+d);
    gn.gain.value=vol;gn.gain.linearRampToValueAtTime(0,AC.currentTime+d);
    o.connect(gn).connect(AC.destination);o.start();o.stop(AC.currentTime+d);
  }catch(e){}
}
const SFX={
  jump:()=>tone(300,.12,'square',.03,260),dj:()=>tone(420,.14,'square',.03,320),
  atk:()=>tone(180,.09,'sawtooth',.035,-90),hit:()=>tone(120,.1,'square',.05,-60),
  hurt:()=>tone(160,.25,'sawtooth',.06,-120),mag:()=>tone(520,.16,'triangle',.04,300),
  coin:()=>tone(880,.07,'square',.025,200),dash:()=>tone(240,.12,'sawtooth',.03,200),
  lvl:()=>{tone(440,.12,'triangle',.05);setTimeout(()=>tone(660,.2,'triangle',.05),110)},
  boss:()=>tone(70,.5,'sawtooth',.07,-30),open:()=>tone(330,.25,'triangle',.05,330),
  pick:()=>{tone(523,.1,'triangle',.05);setTimeout(()=>tone(784,.25,'triangle',.05),100)},
  menu:()=>tone(500,.04,'square',.02)
};
const sfx=n=>{try{SFX[n]&&SFX[n]()}catch(e){}};

/* ---------- utilidades ---------- */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hash=(n)=>{n=Math.imul(n^61,0x45d9f3b);n=Math.imul(n^(n>>>15),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

/* ---------- dados do mundo ---------- */
// sky: 3 cores do céu; far/near: silhuetas; tile: [base, topo, detalhe]; deco: estilo do cenário
const REG=[
{n:'Vila Ferrugem',sub:'Ruínas dos Arquitetos',castle:'Posto da Guarda Quebrada',len:150,sky:['#17142b','#4a3a63','#d08a6c'],far:'#2a2342',near:'#1d1830',tile:['#3b3040','#6b5864','#2a2030'],deco:'vila',
 lord:{name:'O Sentinela Forjado',title:'Guardião corrompido',hp:150,mv:['slash','leap'],col:'#6a6a74',col2:'#b060ff',w:30,h:40,art:'sentinel',dmg:12,relic:'dj'}},
{n:'Floresta Sussurrante',sub:'Mata dos Ecos',castle:'Castelo das Raízes',len:170,sky:['#0b1a17','#1f4a3b','#7fae7a'],far:'#16342c',near:'#0e241f',tile:['#2b2a1f','#3f6b3a','#1c1b14'],deco:'floresta',
 lord:{name:'Thorne, Senhor das Raízes',title:'Lord da Floresta',hp:220,mv:['slash','volley','dash'],col:'#2f6a3a',col2:'#38e0a0',w:24,h:34,dmg:14,relic:'dash'}},
{n:'Cavernas Cristalinas',sub:'Galerias de Geodo',castle:'Castelo Geodo',len:180,sky:['#0b0a16','#1b1840','#3b2f7a'],far:'#1a1738',near:'#110f26',tile:['#2a2540','#5a5088','#181530'],deco:'caverna',
 lord:{name:'Araknis, Matriarca de Cristal',title:'Mãe dos Rastejadores',hp:300,mv:['leap','rain','volley'],col:'#5a4a3c',col2:'#4fd0ff',w:36,h:26,art:'spider',dmg:16,relic:'wall'}},
{n:'Charco Corroído',sub:'Pântano de Éter Abissal',castle:'Castelo Afogado',len:180,sky:['#101a14','#2f4a2a','#a6b45a'],far:'#233a22',near:'#16261a',tile:['#2a2a1c','#5a6a2e','#17180f'],deco:'pantano',
 lord:{name:'Murkal, o Submerso',title:'Lord do Charco',hp:380,mv:['tele','volley','summon'],col:'#3a6a58',col2:'#9ef0c0',w:24,h:32,dmg:18,relic:'glide'}},
{n:'Picos de Vidro',sub:'Cordilheira Congelada',castle:'Fortaleza da Geada',len:190,sky:['#0f1a2e','#3a5c86','#cfe4f2'],far:'#4a6a92',near:'#2a4468',tile:['#33445e','#d8e8f4','#1e2a40'],deco:'gelo',
 lord:{name:'Ysmir, a Tempestade',title:'Lord da Geada',hp:470,mv:['dash','rain','slash','volley'],col:'#8ab8e0',col2:'#ffffff',w:26,h:36,dmg:20,relic:'ice'}},
{n:'Forja Abissal',sub:'Garganta de Brasas',castle:'Castelo da Forja',len:200,sky:['#1a0a0a','#5a1e12','#ff8a3a'],far:'#3a1812',near:'#241010',tile:['#3a2420','#a0482a','#201010'],deco:'vulcao',
 lord:{name:'Cinder, o Ferreiro Rubro',title:'Lord da Forja',hp:560,mv:['leap','volley','rain','dash'],col:'#c8442a',col2:'#ffd070',w:30,h:38,dmg:22,relic:'fire'}},
{n:'Cidadela do Vazio',sub:'O Coração da Corrupção',castle:'Trono do Vazio',len:220,sky:['#07060e','#1c1030','#5a2a6a'],far:'#1a1230',near:'#0e0a1c',tile:['#2a2438','#6a5a86','#14101e'],deco:'cidadela',
 lord:{name:'Malakor, o Arquiteto do Vazio',title:'Arquiteto do Vazio',hp:900,mv:['slash','leap','volley','dash','rain','tele','summon'],col:'#1c1622',col2:'#ff3a5a',w:28,h:44,art:'malakor',dmg:26,relic:'end'}}
];
const RELIC={
 dj:['Manipulação Gravitacional','Salto duplo: pressione pular de novo no ar.'],
 dash:['Aether Dash','Investida de Éter: use o Dash no chão ou no ar.'],
 wall:['Garras de Cristal','Agarre-se às paredes e salte entre elas.'],
 glide:['Capa de Éter','Segure pular durante a queda para planar.'],
 ice:['Espada Etérea Temperada','Ataque muito mais forte. O Dash passa a proteger você.'],
 fire:['Núcleo Sobrecarregado','Mais Éter e Fagulhas bem mais fortes.']
};
// inimigos: k = comportamento
const ENM={
 rato:{k:'walk',hp:8,dmg:6,w:12,h:9,sp:.7,xp:5,c:'#8a7a72',c2:'#c86a6a'},
 corvo:{k:'fly',hp:6,dmg:6,w:12,h:9,sp:.9,xp:6,c:'#2c2838',c2:'#ffd36a'},
 lobo:{k:'charge',hp:16,dmg:9,w:18,h:12,sp:.6,xp:10,c:'#5a5a68',c2:'#ffcf5a'},
 broto:{k:'turret',hp:14,dmg:8,w:12,h:14,sp:0,xp:10,c:'#3f7a3a',c2:'#e8e05a'},
 rastejador:{k:'crawl',hp:14,dmg:9,w:18,h:10,sp:.9,xp:12,c:'#5a4a3c',c2:'#4fd0ff'},
 golem:{k:'walk',hp:40,dmg:13,w:18,h:20,sp:.45,xp:22,c:'#5a5078',c2:'#b8a8ff'},
 sapo:{k:'hop',hp:24,dmg:11,w:16,h:12,sp:1.1,xp:16,c:'#4a7a3a',c2:'#e0f06a'},
 fatuo:{k:'turret',hp:18,dmg:11,w:12,h:12,sp:0,xp:16,c:'#6af0b0',c2:'#ffffff',float:1},
 espectro:{k:'fly',hp:26,dmg:13,w:14,h:18,sp:.8,xp:22,c:'#bcd8f0',c2:'#4a78c0'},
 cavgelo:{k:'walk',hp:60,dmg:16,w:14,h:22,sp:.55,xp:30,c:'#6a88b0',c2:'#e8f6ff'},
 diabrete:{k:'hop',hp:34,dmg:15,w:12,h:12,sp:1.2,xp:26,c:'#c8442a',c2:'#ffd070'},
 rastejante:{k:'charge',hp:50,dmg:17,w:20,h:10,sp:.7,xp:30,c:'#6a2a1a',c2:'#ff8a3a'},
 cultista:{k:'turret',hp:34,dmg:16,w:12,h:20,sp:0,xp:30,c:'#3a2a5a',c2:'#b06aff'},
 cavnegro:{k:'walk',hp:80,dmg:20,w:14,h:22,sp:.6,xp:40,c:'#2a2638',c2:'#9a8ac8'},
 gargula:{k:'fly',hp:44,dmg:18,w:18,h:14,sp:1.1,xp:36,c:'#585068',c2:'#ff5a5a'}
};
const REGEN=[['rato','corvo'],['lobo','broto','corvo'],['rastejador','golem'],['sapo','fatuo'],['espectro','cavgelo'],['diabrete','rastejante'],['cultista','cavnegro','gargula']];
const WEAPON=['Espada Etérea','Etérea Temperada','Etérea Abissal'];
const NPCTXT=[
 ['Elara: Eu sou Elara, Eco-Vigilante. Este santuário guarda o seu caminho, Kaelen.','Em cada terra há um Lord e um castelo. Derrote o Sentinela Forjado aqui, na Vila Ferrugem.','Descanse nos Eco-Santuários. Eles curam, salvam e permitem viajar.'],
 ['Elara: A Floresta Sussurrante é o meu lar. Os Ecos pedem cautela.','Há muralhas que só quem tem a Manipulação Gravitacional alcança.'],
 ['Elara: Nas Cavernas Cristalinas vivem os Rastejadores do Éter.','Abismos largos pedem o Aether Dash. Paredes altas pedem garras.'],
 ['Elara: O Charco Corroído devora o chão sem aviso. Fique atento.','Murkal observa debaixo da água.'],
 ['Elara: O vento dos Picos carrega quem sabe planar.','Ysmir não perdoa quem hesita.'],
 ['Elara: A Forja Abissal derrete o aço comum.','Cinder forja armas com Éter corrompido.'],
 ['Elara: Malakor espera no trono. Eu o vejo flutuar sobre as ruínas dos Arquitetos.','Reúna sua coragem, Kaelen. Os Ecos estão com você.']
];

/* ---------- estado salvo ---------- */
const SAVEKEY='noctaria_save_v1';
function newState(){return{hp:70,mp:30,maxHp:70,maxMp:30,lvl:1,xp:0,coins:0,pots:2,wpn:0,ab:{dj:0,dash:0,wall:0,glide:0,ice:0,fire:0},dead:[],chests:{},altars:{'0:0':1},cur:{r:0,i:0},time:0,intro:0}}
let S=newState();
function saveGame(){try{localStorage.setItem(SAVEKEY,JSON.stringify(S))}catch(e){}}
function loadGame(){try{const s=localStorage.getItem(SAVEKEY);if(!s)return false;const o=JSON.parse(s);S=Object.assign(newState(),o);S.ab=Object.assign(newState().ab,o.ab);return true}catch(e){return false}}
function hasSave(){try{return !!localStorage.getItem(SAVEKEY)}catch(e){return false}}

/* ---------- gerador de fases ---------- */
const MAXW=400,HT=44;
let L=null;
const PLAN=[
 ['r8','r14e2','p3','r10e2','s-2','r12e3','c','p3','r8e2','s2','x:dj:hp','r10e2','x:dash:mp','r8e2'],
 ['r10e2','p3','r12e3','s-2','r10e2','c','w5','r10e2','p3','r8e3','s2','x:dash:hp','r10e2','q5','r12e3','x:wall:pot','r8e2'],
 ['r10e2','q5','r12e3','q7','r8e2','c','w5','r12e3','s-2','r8e2','x:wall:wpn','r10e3','q6','r10e2','x:glide:hp','r8e2'],
 ['r10e2','h12','r8e3','q7','r10e3','c','q5','r12e3','s2','r8e3','w5','r10e2','x:glide:mp','r8e2','x:dj:hp','r8e2'],
 ['r10e2','g13,6','u3','r10e3','h12','r8e3','q7','r10e3','c','w5','r10e3','x:wall:hp','r8e3','x:glide:mp','r8e2'],
 ['r10e3','g13,6','u3','r8e3','q7','r8e3','h12','r8e3','c','w5','q7','r8e3','x:dash:hp','r8e3','x:wall:mp','r8e2'],
 ['r10e3','h12','r8e3','g13,6','u3','r8e3','q7','r8e3','w5','c','r10e4','x:glide:hp','r8e3','x:wall:mp','r8e3']
];
const INNER=[
 ['r8e2','k3','r8e2','p3','r6e2'],
 ['r8e2','w5','r8e3','p3','r6e2'],
 ['r8e2','q7','r8e3','w5','r6e2'],
 ['r8e3','h8','r8e3','q7','r6e3'],
 ['r8e3','g13,6','u3','r8e3','h8','r6e3'],
 ['r8e3','q7','r6e3','w5','r8e3','h8','r6e3'],
 ['r8e3','h8','r8e3','g13,6','u3','r8e3','q7','r8e3','w5','r6e3']
];

function buildLevel(r){
  const R=REG[r],rd=mulberry(r*7919+5);
  const grid=new Uint8Array(MAXW*HT);
  const lv={r,Wt:MAXW,grid,en:[],chests:[],altars:[],npcs:[],doors:[],decor:[],castle:null,arena:null,portal:null,start:null};
  const set=(a,b,v)=>{if(a>=0&&a<MAXW&&b>=0&&b<HT)grid[b*MAXW+a]=v};
  const col=(a,top,v=1)=>{for(let y=top;y<HT;y++)set(a,y,v)};
  const rect=(a,b,w,h,v=1)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)set(a+i,b+j,v)};
  const pick=a=>a[Math.floor(rd()*a.length)];
  let x=0,gr=28,cn=0;
  const enemy=(n)=>{const t=pick(REGEN[r]);lv.en.push({t,x:(x+n)*T,gy:gr*T})};
  const run=(n,ne=0)=>{for(let i=0;i<n;i++)col(x+i,gr);for(let k=0;k<ne;k++){const t=pick(REGEN[r]);lv.en.push({t,x:(x+2+(k+.5)*(n-4)/ne)*T,gy:gr*T})}x+=n};
  const plat=(a,w,row)=>rect(a,row,w,1,2);
  const chest=(a,row,item)=>lv.chests.push({id:r+'-'+(cn++),x:a*T,y:row*T-12,item,w:16,h:12});
  const pit=(w,mid)=>{if(mid)plat(x+Math.floor(w/2)-1,2,gr-1);x+=w};
  const step=d=>{gr+=d};
  const spk=n=>{for(let i=0;i<n;i++){col(x+i,gr);set(x+i,gr-1,3)}x+=n};
  const wall=h=>{col(x,gr);col(x+1,gr);rect(x,gr-h,2,h);x+=2;run(3)};
  const shaft=(h,open)=>{ // poço de paredes: exige Garras de Cristal
    for(let i=0;i<7;i++)col(x+i,gr);
    rect(x,gr-h,2,h-2);   // parede esquerda com porta de 2 tiles
    rect(x+5,gr-h,2,h);   // parede direita fechada
    x+=7;run(4);
  };
  const stairs=k=>{for(let i=0;i<k;i++){run(3);step(-2)}run(2)};
  const chasm=(w,d)=>{x+=w;step(d)};
  const secret=(type,item)=>{
    const b=x;
    if(type==='dj'){run(14);plat(b+5,4,gr-5);chest(b+6,gr-5,item)}
    else if(type==='dash'){run(6);x+=9;run(8);chest(x-4,gr,item)}
    else if(type==='wall'){run(16);rect(b+3,gr-13,2,13);rect(b+8,gr-13,2,13);chest(b+8,gr-13,item)}
    else{run(30);plat(b+1,3,gr-3);plat(b+5,3,gr-6);plat(b+9,3,gr-9);plat(b+25,4,gr-4);chest(b+26,gr-4,item)}
  };
  const parse=(tok)=>{
    let m;
    if((m=/^r(\d+)(?:e(\d+))?$/.exec(tok)))run(+m[1],+(m[2]||0));
    else if((m=/^p(\d+)$/.exec(tok)))pit(+m[1],0);
    else if((m=/^q(\d+)$/.exec(tok)))pit(+m[1],1);
    else if((m=/^s(-?\d+)$/.exec(tok)))step(+m[1]);
    else if((m=/^w(\d+)$/.exec(tok)))wall(+m[1]);
    else if((m=/^h(\d+)$/.exec(tok)))shaft(+m[1]);
    else if((m=/^g(\d+),(\d+)$/.exec(tok)))chasm(+m[1],+m[2]);
    else if((m=/^u(\d+)$/.exec(tok)))stairs(+m[1]);
    else if((m=/^k(\d+)$/.exec(tok)))spk(+m[1]);
    else if(tok==='c'){run(5);chest(x-3,gr,'coin')}
    else if((m=/^x:(\w+):(\w+)$/.exec(tok)))secret(m[1],m[2]);
  };
  // abertura
  rect(0,0,1,HT);
  run(6);
  if(r>0)lv.doors.push({x:2*T,y:gr*T,to:r-1,back:1});
  lv.altars.push({x:7*T,y:gr*T,i:0});
  run(8);
  lv.npcs.push({x:11*T,y:gr*T,lines:NPCTXT[r]});
  run(4);
  lv.start={x:7*T,y:gr*T};
  PLAN[r].forEach(parse);
  // castelo
  run(6);lv.altars.push({x:(x-3)*T,y:gr*T,i:1});run(3);
  const gx=x,gr0=gr;
  run(4);
  INNER[r].forEach(parse);
  if(gr!==gr0)gr=gr0;
  const ax=x,alen=r===6?36:28;
  run(alen);
  const endx=ax+alen;
  rect(endx,0,4,HT,1);
  // tetos
  for(let a=gx;a<ax;a++)for(let b=0;b<=gr0-12;b++)set(a,b,1);
  for(let a=ax;a<endx;a++)for(let b=0;b<=gr0-16;b++)set(a,b,1);
  lv.castle={x0:gx*T,x1:endx*T,gr:gr0};
  lv.arena={x0:ax*T,x1:endx*T,plug:{x:ax,y0:gr0-15,y1:gr0-1},gy:gr0*T};
  lv.portal={x:(endx-4)*T,y:gr0*T};
  lv.bossSpawn={x:(endx-9)*T,y:gr0*T};
  lv.Wt=endx+4;
  // decoração por superfície
  for(let a=3;a<lv.Wt-4;a++){
    let sy=-1;for(let b=8;b<HT;b++){const v=grid[b*MAXW+a];if(v===1){sy=b;break}if(v===2)break}
    if(sy<0)continue;
    const inCastle=a*T>=lv.castle.x0;
    if(!inCastle&&hash(a*13+r*977)<.14)lv.decor.push({a,y:sy*T,s:hash(a*7+r)});
  }
  lv.bg=null;
  return lv;
}
function tile(tx,ty){
  if(tx<0||tx>=L.Wt)return 1;
  if(ty<0)return 0;
  if(ty>=HT)return 0;
  return L.grid[ty*MAXW+tx];
}

/* ---------- imagens do elenco ---------- */
const IMG={};
for(const k in IMGSRC){const i=new Image();i.src=IMGSRC[k];IMG[k]=i;const f=document.getElementById('im-'+k);if(f)f.src=IMGSRC[k]}

/* ---------- runtime ---------- */
let mode='title',pl=null,ens=[],proj=[],parts=[],boss=null,portal=null;
let cam={x:0,y:0},shake=0,frame=0,dlg=null,menu=null,toastT=0,toastMsg='',card=null,pop=[];
let bossBgCache={};
const need=()=>Math.floor(22*Math.pow(S.lvl,1.45));
const atkPow=()=>Math.round(7+S.lvl*1.7+[0,5,12][S.wpn]+(S.ab.ice?4:0));
const magPow=()=>Math.round(5+S.lvl*1.4+(S.ab.fire?9:0));
function toast(m){toastMsg=m;toastT=170}
function say(lines,cb){dlg={lines:lines.map(l=>typeof l==='string'?{t:l}:l),i:0,c:0,cb};mode='dialog'}
function puff(x,y,col,n=6,sp=1.4){for(let i=0;i<n;i++)parts.push({x,y,vx:rnd(-sp,sp),vy:rnd(-sp,sp)*.8-.3,life:rnd(14,30),col,s:rnd(1,2.5)})}

/* ---------- física ---------- */
function moveX(e,dx){
  e.x+=dx;
  const y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T),x0=Math.floor(e.x/T),x1=Math.floor((e.x+e.w-.01)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(tile(tx,ty)===1){if(dx>0)e.x=tx*T-e.w;else if(dx<0)e.x=(tx+1)*T;return true}
  return false;
}
function moveY(e,dy,drop){
  const pb=e.y+e.h;e.y+=dy;
  const y0=Math.floor(e.y/T),y1=Math.floor((e.y+e.h-.01)/T),x0=Math.floor(e.x/T),x1=Math.floor((e.x+e.w-.01)/T);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const v=tile(tx,ty);
    if(v===1){if(dy>0){e.y=ty*T-e.h;e.vy=0;return 1}if(dy<0){e.y=(ty+1)*T;e.vy=0;return -1}}
    else if(v===2&&dy>0&&!drop&&pb<=ty*T+.6){e.y=ty*T-e.h;e.vy=0;return 1}
  }
  return 0;
}
const solidBelow=(x,y)=>{const v=tile(Math.floor(x/T),Math.floor(y/T));return v===1||v===2};

/* ---------- regiões ---------- */
function mkPlayer(x,y){return{x:x-5,y:y-18,w:10,h:18,vx:0,vy:0,face:1,ground:false,coy:0,jbuf:0,dj:false,adash:false,dash:0,dashDir:1,dcool:0,atk:0,acool:0,hit:new Set(),inv:0,wall:0,kick:0,kvx:0,mcool:0,drop:0,safe:{x:x-5,y:y-18},rest:0}}
function spawnEnemy(s){
  const d=ENM[s.t];
  const fl=d.k==='fly'?-46-(Math.random()*20):d.float?-30:0;
  return{t:s.t,d,x:s.x,y:s.gy-d.h+fl,w:d.w,h:d.h,vx:0,vy:0,hp:d.hp,dir:Math.random()<.5?-1:1,flash:0,tm:Math.floor(Math.random()*90),st:0,by:s.gy-d.h+fl,ph:Math.random()*6.28,alive:true};
}
function enterRegion(r,where,idx){
  L=buildLevel(r);
  L.bg=null;
  ens=L.en.map(spawnEnemy);proj=[];parts=[];boss=null;card=null;pop=[];
  L.chests.forEach(c=>c.open=!!S.chests[c.id]);
  let sp=L.start;
  if(where==='altar'){const a=L.altars.find(a=>a.i===idx)||L.altars[0];sp={x:a.x+8,y:a.y}}
  else if(where==='portal')sp={x:L.portal.x,y:L.portal.y};
  pl=mkPlayer(sp.x,sp.y);
  const done=S.dead.includes(r);
  portal=done?{x:L.portal.x,y:L.portal.y}:null;
  if(!done)boss=mkBoss(L);
  cam.x=clamp(pl.x-W/2,0,L.Wt*T-W);cam.y=clamp(pl.y-H*.6,0,HT*T-H);
  mode='play';
  if(S.visited!==undefined){}
}
function mkBoss(lv){
  const D=REG[lv.r].lord;
  return{x:lv.bossSpawn.x,y:lv.bossSpawn.y-D.h,w:D.w,h:D.h,vx:0,vy:0,hp:D.hp,max:D.hp,d:D,st:'idle',t:0,tm:50,face:-1,ph:1,flash:0,act:false,sw:0,vis:true,mvq:[],alive:true};
}

/* ---------- dano ---------- */
function hurt(dmg,fx){
  if(pl.inv>0)return;
  if(pl.dash>0&&S.ab.ice)return;
  S.hp-=dmg;pl.inv=55;pl.vy=-3;pl.vx=(pl.x+5<fx?-1:1)*2.4;pl.kick=0;pl.dash=0;
  shake=7;sfx('hurt');puff(pl.x+5,pl.y+9,'#ff5a6a',8,2);
  pop.push({x:pl.x,y:pl.y-6,t:30,s:'-'+dmg,c:'#ff8a8a'});
  if(S.hp<=0){S.hp=0;mode='dead';menu={i:0};sfx('boss')}
}
function gainXp(n){
  S.xp+=n;
  while(S.xp>=need()){S.xp-=need();S.lvl++;S.maxHp+=7;S.maxMp+=2;S.hp=Math.min(S.maxHp,S.hp+20);toast('Nível '+S.lvl+'!');sfx('lvl')}
}
function hitEnemy(e,dmg,kx){
  e.hp-=dmg;e.flash=8;e.vx=kx*1.8;
  puff(e.x+e.w/2,e.y+e.h/2,e.d?e.d.c2:'#fff',5);sfx('hit');
  pop.push({x:e.x,y:e.y-6,t:24,s:''+dmg,c:'#fff'});
  if(e.hp<=0&&e.alive){
    e.alive=false;
    if(e.d){S.coins+=Math.round(2+Math.random()*4+L.r*2);gainXp(e.d.xp);S.mp=Math.min(S.maxMp,S.mp+3)}
    if(Math.random()<.07){S.pots++;toast('Poção de Éter encontrada')}
    puff(e.x+e.w/2,e.y+e.h/2,e.d?e.d.c:'#fff',14,2.2);sfx('coin');
  }
}
function shootAt(x,y,tx,ty,spd,dmg,col){
  const a=Math.atan2(ty-y,tx-x);
  proj.push({x:x-3,y:y-3,w:6,h:6,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,pl:0,life:140,col});
}
function swordBox(){
  const len=26+(S.wpn>0?4:0)+(S.ab.ice?4:0);
  return{x:pl.face>0?pl.x+pl.w-2:pl.x-len+2,y:pl.y-3,w:len,h:pl.h+6};
}

/* ---------- jogador ---------- */
function updPlayer(){
  const p=pl;
  const dirIn=(keys.right?1:0)-(keys.left?1:0),J=keys.jump;
  if(p.inv>0)p.inv--;if(p.acool>0)p.acool--;if(p.mcool>0)p.mcool--;if(p.dcool>0)p.dcool--;if(p.drop>0)p.drop--;
  p.wall=0;
  if(!p.ground&&S.ab.wall){
    const ty=Math.floor((p.y+p.h/2)/T);
    if(tile(Math.floor((p.x-1)/T),ty)===1)p.wall=-1;
    else if(tile(Math.floor((p.x+p.w+1)/T),ty)===1)p.wall=1;
  }
  if(p.wall){p.dj=false;p.adash=false}
  if(dirIn&&p.atk<=0&&p.kick<=0)p.face=dirIn;
  if(P('dash')&&S.ab.dash&&p.dcool<=0&&p.dash<=0&&(p.ground||!p.adash)){
    p.dash=13;p.dcool=34;if(!p.ground)p.adash=true;p.dashDir=dirIn||p.face;p.face=p.dashDir;sfx('dash');
    puff(p.x+5,p.y+9,'#4fd0ff',8,1.6);
  }
  if(p.dash>0){p.dash--;p.vx=p.dashDir*5;p.vy=0;if(p.dash%3===0)puff(p.x+5,p.y+9,'#4fd0ff',1,.4)}
  else{
    if(p.kick>0){p.kick--;p.vx=p.kvx}
    else p.vx+=(dirIn*1.6-p.vx)*(p.ground?.4:.22);
    p.vy+=.38;if(p.vy>7.5)p.vy=7.5;
    if(p.wall&&p.vy>0&&dirIn===p.wall)p.vy=Math.min(p.vy,1.1);
    if(S.ab.glide&&J&&p.vy>.9&&!p.ground&&!p.wall)p.vy=.9;
  }
  if(P('jump')){
    if(keys.down&&p.ground){p.drop=12;p.vy=1;p.ground=false;pr.jump=false}
    else p.jbuf=7;
  }else if(p.jbuf>0)p.jbuf--;
  if(p.ground)p.coy=6;else if(p.coy>0)p.coy--;
  if(p.jbuf>0&&p.dash<=0){
    if(p.coy>0){p.vy=-6.6;p.jbuf=0;p.coy=0;p.ground=false;sfx('jump')}
    else if(p.wall){p.vy=-6.4;p.kvx=-p.wall*2.4;p.kick=14;p.face=-p.wall;p.jbuf=0;sfx('jump');puff(p.x+5,p.y+9,'#b8e8ff',5)}
    else if(S.ab.dj&&!p.dj){p.vy=-6.2;p.dj=true;p.jbuf=0;sfx('dj');puff(p.x+5,p.y+18,'#b8e8ff',7)}
  }
  if(!J&&p.vy<-3&&p.kick<=0&&p.dash<=0)p.vy=-3;
  const hx=moveX(p,p.vx);if(hx&&p.dash>0)p.dash=0;
  const r=moveY(p,p.vy,p.drop>0);
  if(r===1){p.ground=true;p.dj=false;p.adash=false}else p.ground=false;
  // posição segura
  if(p.ground&&solidBelow(p.x+1,p.y+p.h+2)&&solidBelow(p.x+p.w-1,p.y+p.h+2)&&tile(Math.floor((p.x+5)/T),Math.floor((p.y+p.h-2)/T))!==3){p.safe.x=p.x;p.safe.y=p.y}
  // espinhos
  const sx=Math.floor((p.x+5)/T),sy=Math.floor((p.y+p.h-2)/T);
  if(tile(sx,sy)===3)hurt(12,p.x+5+(Math.random()<.5?-4:4));
  // queda no abismo
  if(p.y>HT*T-24){hurt(10,p.x);p.x=p.safe.x;p.y=p.safe.y;p.vx=p.vy=0;p.inv=70;if(S.hp<=0){}}
  // ataque
  if(P('atk')&&p.acool<=0&&p.dash<=0){p.atk=14;p.acool=17;p.hit=new Set();sfx('atk')}
  if(p.atk>0){
    p.atk--;
    if(p.atk<=11&&p.atk>=3){
      const sb=swordBox();
      ens.forEach(e=>{if(e.alive&&!p.hit.has(e)&&ov(sb,e)){p.hit.add(e);hitEnemy(e,atkPow(),p.face)}});
      if(boss&&boss.act&&boss.alive&&boss.vis&&!p.hit.has(boss)&&ov(sb,boss)){p.hit.add(boss);hitBoss(atkPow())}
      proj.forEach(q=>{if(!q.pl&&ov(sb,q)){q.life=0;puff(q.x,q.y,q.col,4)}});
    }
  }
  if(P('mag')&&p.mcool<=0&&S.mp>=10){
    S.mp-=10;p.mcool=20;sfx('mag');
    proj.push({x:p.x+(p.face>0?p.w:-8),y:p.y+6,w:8,h:6,vx:p.face*4.4,vy:0,dmg:magPow(),pl:1,life:70,col:S.ab.fire?'#ffb04f':'#4fd0ff'});
  }
  if(P('pot')&&S.pots>0&&S.hp<S.maxHp){S.pots--;S.hp=Math.min(S.maxHp,S.hp+Math.ceil(S.maxHp*.45));toast('Poção de Éter usada');sfx('pick');puff(p.x+5,p.y+9,'#7dffb8',10)}
  S.mp=Math.min(S.maxMp,S.mp+.035);
}

/* ---------- inimigos ---------- */
function updEnemy(e){
  const d=e.d,px=pl.x+5,py=pl.y+9;
  const dx=px-(e.x+e.w/2),dy=py-(e.y+e.h/2),dist=Math.abs(dx);
  if(e.flash>0)e.flash--;
  e.tm++;
  if(d.k==='walk'||d.k==='crawl'){
    let sp=d.sp;
    if(dist<120&&Math.abs(dy)<44){e.dir=dx>0?1:-1;sp*=1.6}
    const ax=Math.floor((e.x+(e.dir>0?e.w+2:-2))/T),fy=Math.floor((e.y+e.h+2)/T),tv=tile(ax,fy);
    if(tv===0||tv===3)e.dir*=-1;
    e.vx=e.dir*sp+e.vx*.3;e.vy+=.38;if(e.vy>7)e.vy=7;
    if(moveX(e,e.vx))e.dir*=-1;moveY(e,e.vy);
    if(d.k==='crawl'&&e.tm%120===0&&dist<170)shootAt(e.x+e.w/2,e.y+3,px,py,1.7,Math.round(d.dmg*.8),'#9aff6a');
  }else if(d.k==='fly'){
    e.ph+=.06;
    let tx=0,ty=0;
    if(dist<190&&Math.abs(dy)<150){tx=Math.sign(dx)*d.sp;ty=Math.sign(dy)*d.sp*.5}
    else{ty=(e.by+Math.sin(e.ph)*14-e.y)*.04}
    e.vx+=(tx-e.vx)*.06;e.vy+=(ty-e.vy)*.06;
    if(moveX(e,e.vx))e.vx*=-1;if(moveY(e,e.vy))e.vy*=-1;
  }else if(d.k==='charge'){
    e.vy+=.38;
    if(e.st===0){
      e.vx*=.8;
      if(dist<150&&Math.abs(dy)<30){e.dir=dx>0?1:-1;e.st=1;e.tm=0}
      else{e.vx=e.dir*d.sp*.6;const ax=Math.floor((e.x+(e.dir>0?e.w+2:-2))/T),tv=tile(ax,Math.floor((e.y+e.h+2)/T));if(tv===0||tv===3)e.dir*=-1}
    }else if(e.st===1){e.vx=0;if(e.tm>26){e.st=2;e.tm=0}}
    else if(e.st===2){e.vx=e.dir*2.6;const ax=Math.floor((e.x+(e.dir>0?e.w+2:-2))/T),tv=tile(ax,Math.floor((e.y+e.h+2)/T));if(e.tm>42||tv===0||tv===3){e.st=3;e.tm=0}}
    else{e.vx=0;if(e.tm>50){e.st=0;e.tm=0}}
    if(moveX(e,e.vx)&&e.st===2){e.st=3;e.tm=0}
    moveY(e,e.vy);
  }else if(d.k==='hop'){
    e.vy+=.38;
    if(e.ground&&e.tm>60){e.vy=-5.2;e.vx=(dx>0?1:-1)*d.sp*1.4;e.tm=0;e.ground=false}
    if(e.ground)e.vx*=.6;
    moveX(e,e.vx);e.ground=moveY(e,e.vy)===1;
  }else if(d.k==='turret'){
    e.ph+=.05;if(d.float)e.y=e.by+Math.sin(e.ph)*5;
    if(e.tm%105===0&&dist<190&&Math.abs(dy)<120)shootAt(e.x+e.w/2,e.y+e.h/2,px,py,1.6,Math.round(d.dmg*.9),d.c2);
  }
  if(ov(e,pl))hurt(d.dmg,e.x+e.w/2);
}

/* ---------- chefes ---------- */
function hitBoss(dmg){
  const b=boss;b.hp-=dmg;b.flash=6;sfx('hit');
  puff(b.x+b.w/2,b.y+b.h/2,b.d.col2,6,2);
  pop.push({x:b.x+b.w/2,y:b.y-8,t:24,s:''+dmg,c:'#fff'});
  if(b.ph===1&&b.hp<b.max/2){b.ph=2;shake=18;sfx('boss');toast('O Lord se enfurece!')}
  if(b.hp<=0)killBoss();
}
function killBoss(){
  const b=boss;b.alive=false;b.act=false;proj=proj.filter(q=>q.pl);
  puff(b.x+b.w/2,b.y+b.h/2,b.d.col2,40,3.5);shake=30;sfx('boss');
  S.dead.push(L.r);
  const a=L.arena.plug;for(let y=a.y0;y<=a.y1;y++)L.grid[y*MAXW+a.x]=0;
  gainXp(60+L.r*50);S.coins+=100+L.r*60;
  const rel=b.d.relic;
  S.hp=Math.min(S.maxHp,S.hp+Math.floor(S.maxHp*.4));
  setTimeout(()=>{
    if(rel==='end'){mode='win';menu=null;saveGame();return}
    S.ab[rel]=1;
    if(rel==='ice')S.wpn=Math.max(S.wpn,2);
    if(rel==='fire'){S.maxMp+=20;S.mp=S.maxMp}
    portal={x:L.portal.x,y:L.portal.y};
    saveGame();sfx('pick');
    say([{who:'Kaelen',port:'kaelen',t:b.d.name+' caiu.'},{who:'Poder obtido',t:RELIC[rel][0]+'. '+RELIC[rel][1]},{who:'Elara',port:'elara',t:'O portal do castelo se abriu, Kaelen. Siga em frente.'}]);
  },900);
}
function bossStart(){
  const b=boss,D=b.d;
  const a=L.arena.plug;for(let y=a.y0;y<=a.y1;y++)L.grid[y*MAXW+a.x]=1;
  card={art:D.art||null,name:D.name,title:D.title,t:0,col:D.col2};
  mode='card';sfx('boss');
}
function endMove(b,t){b.st='idle';b.tm=t;b.sw=0;b.t=0}
function pickMove(b){
  const mv=b.d.mv;let m=mv[Math.floor(Math.random()*mv.length)];
  if(m===b.last&&mv.length>1)m=mv[(mv.indexOf(m)+1)%mv.length];
  b.last=m;return m;
}
function updBoss(b){
  if(b.flash>0)b.flash--;
  const px=pl.x+5,bx=b.x+b.w/2,dx=px-bx,ad=Math.abs(dx),D=b.d,sp=(D.relic==='end'?1.1:.8)*(b.ph===2?1.3:1);
  const ground=()=>{b.vy+=.38;if(b.vy>8)b.vy=8;moveX(b,b.vx);return moveY(b,b.vy)===1};
  const dmgC=D.dmg;
  const face=()=>{b.face=dx>0?1:-1};
  const A=L.arena;
  switch(b.st){
    case 'idle':
      face();b.vx*=.8;ground();b.tm--;
      if(b.tm<=0){b.st=pickMove(b);b.t=0;b.sw=0}
      break;
    case 'slash':
      b.t++;
      if(!b.sw){face();b.vx=b.face*sp;ground();if(ad<46||b.t>150){b.sw=1;b.t=0;b.vx=0}}
      else{
        b.vx=0;ground();
        if(b.t>=22&&b.t<=32){
          const hb={x:b.face>0?b.x+b.w-4:b.x-40,y:b.y+4,w:44,h:b.h-4};
          if(ov(hb,pl))hurt(dmgC,bx);
        }
        if(b.t>=44)endMove(b,b.ph===2?20:42);
      }
      break;
    case 'leap':
      if(b.t===0){face();b.vy=-9;b.vx=clamp(dx/36,-3.6,3.6);b.air=true}
      b.t++;
      {const g=ground();if(g&&b.t>6){
        b.vx=0;shake=8;
        proj.push({x:bx-4,y:b.y+b.h-8,w:10,h:8,vx:2.4,vy:0,dmg:Math.round(dmgC*.8),pl:0,life:90,col:D.col2,flat:1});
        proj.push({x:bx-6,y:b.y+b.h-8,w:10,h:8,vx:-2.4,vy:0,dmg:Math.round(dmgC*.8),pl:0,life:90,col:D.col2,flat:1});
        endMove(b,b.ph===2?24:50);
      }}
      break;
    case 'volley':
      b.t++;b.vx=0;ground();face();
      if(b.t%22===0&&b.t<=(b.ph===2?88:66)){
        const n=b.ph===2?4:3,ay=Math.atan2(pl.y+9-(b.y+10),px-bx);
        for(let i=0;i<n;i++){const a=ay+(i-(n-1)/2)*.22;proj.push({x:bx-3,y:b.y+8,w:7,h:7,vx:Math.cos(a)*2.1,vy:Math.sin(a)*2.1,dmg:Math.round(dmgC*.8),pl:0,life:160,col:D.col2})}
        sfx('mag');
      }
      if(b.t>96)endMove(b,b.ph===2?20:44);
      break;
    case 'dash':
      b.t++;ground();
      if(b.t<26){face();b.vx=0;if(b.t%4===0)puff(bx,b.y+b.h,D.col2,1,.6)}
      else{
        b.vx=b.face*(b.ph===2?4.6:3.8);
        if(ov(b,pl))hurt(dmgC,bx);
        if(b.t>78||b.x<A.x0+T*2||b.x+b.w>A.x1-T*1){b.vx=0;endMove(b,b.ph===2?24:50)}
      }
      break;
    case 'rain':
      b.t++;b.vx=0;ground();
      if(b.t%11===0&&b.t<=(b.ph===2?88:66)){
        const rx=clamp(px+rnd(-70,70),A.x0+T*2,A.x1-T*2);
        proj.push({x:rx,y:A.gy-15*T,w:8,h:10,vx:0,vy:1.2,gv:.12,dmg:Math.round(dmgC*.8),pl:0,life:200,col:D.col2});
      }
      if(b.t>100)endMove(b,b.ph===2?20:44);
      break;
    case 'summon':
      b.t++;b.vx=0;ground();
      if(b.t===12){
        const alive=ens.filter(e=>e.alive).length;
        if(alive<4)for(let i=0;i<2;i++){const t=REGEN[L.r][i%REGEN[L.r].length];const e=spawnEnemy({t,x:clamp(px+(i?60:-60),A.x0+T*3,A.x1-T*3),gy:A.gy});e.y-=30;ens.push(e)}
        sfx('open');puff(bx,b.y,D.col2,16,2);
      }
      if(b.t>70)endMove(b,40);
      break;
    case 'tele':
      b.t++;b.vx=0;ground();
      if(b.t===14){b.vis=false;puff(bx,b.y+b.h/2,D.col2,20,2.4)}
      if(b.t===40){
        b.x=clamp(pl.x-b.face*42,A.x0+T*2,A.x1-T*3);b.y=pl.y+pl.h-b.h;b.vis=true;puff(b.x+b.w/2,b.y+b.h/2,D.col2,20,2.4);
        b.st='slash';b.sw=1;b.t=10;face();
      }
      break;
  }
  if(b.vis&&ov(b,pl)&&b.st!=='tele')hurt(Math.round(dmgC*.7),bx);
}

/* ---------- projéteis ---------- */
function updProj(){
  proj.forEach(q=>{
    q.life--;
    if(q.gv)q.vy+=q.gv;
    q.x+=q.vx;q.y+=q.vy;
    const v=tile(Math.floor((q.x+q.w/2)/T),Math.floor((q.y+q.h/2)/T));
    if(v===1&&!q.flat)q.life=0;
    if(q.flat&&tile(Math.floor((q.x+q.w/2)/T),Math.floor((q.y+q.h/2)/T))===1)q.life=0;
    if(q.pl){
      ens.forEach(e=>{if(e.alive&&q.life>0&&ov(q,e)){hitEnemy(e,q.dmg,Math.sign(q.vx));q.life=0}});
      if(boss&&boss.act&&boss.alive&&boss.vis&&q.life>0&&ov(q,boss)){hitBoss(q.dmg);q.life=0}
    }else if(ov(q,pl)){hurt(q.dmg,q.x);q.life=0}
    if(q.life<=0)puff(q.x,q.y,q.col,3,1);
  });
  proj=proj.filter(q=>q.life>0);
}

/* ---------- renderização ---------- */
const NEON='#4fd0ff',EMER='#38e0a0';
function renderTiles(){
  const c=document.createElement('canvas');c.width=L.Wt*T;c.height=HT*T;const x=c.getContext('2d');
  const R=REG[L.r],[base,top,dk]=R.tile,cx0=L.castle.x0/T;
  for(let ty=0;ty<HT;ty++)for(let tx=0;tx<L.Wt;tx++){
    const v=L.grid[ty*MAXW+tx];if(!v)continue;
    const px=tx*T,py=ty*T,hh=hash(tx*131+ty*17+L.r*7);
    if(v===1){
      const exp=tile(tx,ty-1)!==1;
      x.fillStyle=base;x.fillRect(px,py,T,T);
      x.fillStyle='rgba(0,0,0,'+(.1+hh*.16)+')';x.fillRect(px,py,T,T);
      x.fillStyle=dk;
      x.fillRect(px,py+7,T,1);x.fillRect(px+((ty+tx)%2?5:11),py,1,8);x.fillRect(px+((ty+tx)%2?11:4),py+8,1,8);
      x.fillStyle='rgba(255,255,255,.05)';x.fillRect(px,py,T,1);
      if(tx>=cx0&&hh>.9){x.fillStyle=NEON;x.globalAlpha=.55;x.fillRect(px+2,py+10,12,1);x.globalAlpha=1}
      if(exp){x.fillStyle=top;x.fillRect(px,py,T,4);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(px,py,T,1);
        if(tx<cx0&&hh>.45){x.fillStyle=top;x.fillRect(px+2,py+4,2,2);x.fillRect(px+9,py+4,3,1)}}
    }else if(v===2){
      x.fillStyle=dk;x.fillRect(px,py,T,4);x.fillStyle=top;x.fillRect(px,py,T,2);
      x.fillStyle=NEON;x.globalAlpha=.6;x.fillRect(px,py+2,T,1);x.globalAlpha=1;
    }else if(v===3){
      x.fillStyle=R.tile[0];x.fillRect(px,py+T-3,T,3);
      x.fillStyle='#c9d4de';
      for(let k=0;k<3;k++){x.beginPath();x.moveTo(px+k*5+.5,py+T-3);x.lineTo(px+k*5+3,py+3);x.lineTo(px+k*5+5.5,py+T-3);x.fill()}
      x.fillStyle=NEON;x.globalAlpha=.7;for(let k=0;k<3;k++)x.fillRect(px+k*5+2,py+3,1,2);x.globalAlpha=1;
    }
  }
  return c;
}
function gear(cx,cy,r,teeth,rot,col,a){
  g.save();g.translate(cx,cy);g.rotate(rot);g.globalAlpha=a;g.strokeStyle=col;g.fillStyle=col;g.lineWidth=3;
  g.beginPath();g.arc(0,0,r*.72,0,6.283);g.stroke();
  for(let i=0;i<teeth;i++){g.save();g.rotate(i/teeth*6.283);g.fillRect(-2,-r,4,r*.3);g.restore()}
  g.lineWidth=2;for(let i=0;i<4;i++){g.save();g.rotate(i*1.5708);g.beginPath();g.moveTo(0,0);g.lineTo(0,-r*.72);g.stroke();g.restore()}
  g.beginPath();g.arc(0,0,r*.18,0,6.283);g.fill();
  g.restore();
}
function drawBG(){
  const R=REG[L.r],inC=cam.x+W/2>L.castle.x0+T*2;
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,R.sky[0]);gr.addColorStop(.55,R.sky[1]);gr.addColorStop(1,R.sky[2]);
  g.fillStyle=gr;g.fillRect(0,0,W,H);
  const oy=-cam.y*.12+30;
  // motes de éter
  for(let i=0;i<26;i++){const mx=(hash(i*3+L.r)*W*1.4-cam.x*.2+frame*.1*(hash(i)-.5))%W,my=(hash(i*7+1)*H+Math.sin(frame*.02+i)*6);g.fillStyle=i%2?NEON:EMER;g.globalAlpha=.25+.2*Math.sin(frame*.05+i);g.fillRect((mx+W)%W,my,1.5,1.5)}
  g.globalAlpha=1;
  // engrenagens ao fundo (arcane punk)
  for(let i=0;i<5;i++){const wx=i*190+60-((cam.x*.18)%190);gear((wx+W*3)%(W+190)-40,70+hash(i+L.r*5)*80+oy*.4,28+hash(i*9)*22,10,frame*.004*(i%2?1:-1)+i,R.far,.55)}
  // silhueta distante
  g.fillStyle=R.far;
  const off=cam.x*.15;
  g.beginPath();g.moveTo(0,H);
  for(let i=0;i<=W/6+1;i++){const wx=i*6+off,h=70+Math.sin(wx*.011+L.r)*30+Math.sin(wx*.027)*16+(R.deco==='gelo'?Math.abs(Math.sin(wx*.02))*50:0);g.lineTo(i*6-(off%6),H*.74-h+oy)}
  g.lineTo(W,H);g.fill();
  // camada próxima por estilo
  g.fillStyle=R.near;
  const o2=cam.x*.4,by=H*.82+oy*1.4;
  for(let k=-1;k<W/60+2;k++){
    const wi=Math.floor((o2)/60)+k,hh=hash(wi*5+L.r*31),hx=wi*60-o2+hh*24;
    switch(R.deco){
      case 'vila':{const w=34+hh*20,h=40+hh*40;g.fillRect(hx,by-h,w,h);g.beginPath();g.moveTo(hx-3,by-h);g.lineTo(hx+w/2,by-h-16);g.lineTo(hx+w+3,by-h);g.fill();g.fillStyle=hh>.4?NEON:'#e8b36a';g.globalAlpha=.7;g.fillRect(hx+6,by-h+12,5,6);g.fillRect(hx+w-12,by-h+12,5,6);g.globalAlpha=1;g.fillStyle=R.near;break}
      case 'floresta':{const h=70+hh*60;g.fillRect(hx+8,by-h,6,h);g.beginPath();g.ellipse(hx+11,by-h,22,26,0,0,6.283);g.fill();g.fillStyle=EMER;g.globalAlpha=.3;g.fillRect(hx+4,by-h*.5,1,14);g.globalAlpha=1;g.fillStyle=R.near;break}
      case 'caverna':{g.beginPath();g.moveTo(hx,0);g.lineTo(hx+10,30+hh*60);g.lineTo(hx+20,0);g.fill();g.fillStyle=NEON;g.globalAlpha=.5;g.beginPath();g.moveTo(hx+30,by);g.lineTo(hx+36,by-26-hh*26);g.lineTo(hx+42,by);g.fill();g.globalAlpha=1;g.fillStyle=R.near;break}
      case 'pantano':{g.fillRect(hx+6,by-60-hh*40,3,60+hh*40);g.fillRect(hx-6,by-48,20,2);g.fillRect(hx+8,by-70,14,2);g.fillStyle=EMER;g.globalAlpha=.12;g.fillRect(hx-20,by-14,90,10);g.globalAlpha=1;g.fillStyle=R.near;break}
      case 'gelo':{g.beginPath();g.moveTo(hx,by);g.lineTo(hx+16,by-60-hh*50);g.lineTo(hx+32,by);g.fill();g.fillStyle='#e8f6ff';g.globalAlpha=.5;g.beginPath();g.moveTo(hx+11,by-40-hh*50);g.lineTo(hx+16,by-60-hh*50);g.lineTo(hx+21,by-40-hh*50);g.fill();g.globalAlpha=1;g.fillStyle=R.near;break}
      case 'vulcao':{g.beginPath();g.moveTo(hx,by);g.lineTo(hx+12,by-50-hh*50);g.lineTo(hx+26,by);g.fill();g.fillStyle='#ff7a2a';g.globalAlpha=.35;g.fillRect(hx+10,by-30,3,26);g.globalAlpha=1;g.fillStyle=R.near;break}
      default:{const h=80+hh*70;g.fillRect(hx,by-h,12,h);g.fillRect(hx-3,by-h,18,5);g.fillStyle='#ff3a5a';g.globalAlpha=.35;g.fillRect(hx+4,by-h+10,3,h-20);g.globalAlpha=1;g.fillStyle=R.near}
    }
  }
  if(R.deco==='vulcao'){const lg=g.createLinearGradient(0,H-60,0,H);lg.addColorStop(0,'rgba(255,100,30,0)');lg.addColorStop(1,'rgba(255,100,30,.35)');g.fillStyle=lg;g.fillRect(0,H-60,W,60)}
  if(inC){
    g.fillStyle='#0b0914';g.fillRect(0,0,W,H);
    const bx=-(cam.x*.8%32),byy=-(cam.y*.8%16);
    g.fillStyle='#161227';for(let y=0;y<H+16;y+=16)for(let x=0;x<W+32;x+=32){g.fillRect(x+bx+((y/16)%2?16:0),y+byy,31,15)}
    g.strokeStyle=NEON;g.globalAlpha=.25;g.lineWidth=2;
    for(let k=0;k<3;k++){const py=40+k*70+Math.sin(frame*.01+k)*2-(cam.y*.5%70);g.beginPath();g.moveTo(0,py);g.lineTo(W,py);g.stroke()}
    g.globalAlpha=1;
    for(let k=0;k<4;k++){const tx=((k*130+40-cam.x*.6)%(W+60)+W+60)%(W+60)-30;g.fillStyle='#ffb04f';g.globalAlpha=.7+.2*Math.sin(frame*.2+k);g.beginPath();g.arc(tx,86,3,0,6.283);g.fill();g.globalAlpha=.12;g.beginPath();g.arc(tx,86,20,0,6.283);g.fill();g.globalAlpha=1}
    gear(((cam.x*-.5+400)%520+520)%520-40,90,34,12,frame*.006,'#3a3050',.9);
  }
}
function drawCastleFacade(){
  const x0=L.castle.x0-cam.x,gy=L.castle.gr*T-cam.y;
  if(x0<-200||x0>W+40)return;
  const R=REG[L.r];
  g.fillStyle=R.near;g.fillRect(x0-150,gy-210,150,210);
  g.fillStyle=R.far;g.fillRect(x0-150,gy-210,150,5);
  for(let i=0;i<5;i++)g.fillRect(x0-150+i*32,gy-222,16,12);
  g.fillStyle=R.near;g.fillRect(x0-150,gy-250,34,40);g.fillRect(x0-48,gy-270,38,60);
  g.beginPath();g.moveTo(x0-154,gy-250);g.lineTo(x0-133,gy-276);g.lineTo(x0-112,gy-250);g.fill();
  g.beginPath();g.moveTo(x0-52,gy-270);g.lineTo(x0-29,gy-298);g.lineTo(x0-6,gy-270);g.fill();
  for(let i=0;i<8;i++){g.fillStyle=i%2?NEON:EMER;g.globalAlpha=.55+.25*Math.sin(frame*.05+i);g.fillRect(x0-136+(i%4)*30,gy-190+Math.floor(i/4)*40,6,12);g.globalAlpha=1}
  g.fillStyle='#07050d';g.beginPath();g.moveTo(x0-34,gy);g.lineTo(x0-34,gy-44);g.arc(x0-18,gy-44,16,Math.PI,0);g.lineTo(x0-2,gy);g.fill();
  g.strokeStyle=NEON;g.lineWidth=2;g.globalAlpha=.8;g.beginPath();g.moveTo(x0-34,gy);g.lineTo(x0-34,gy-44);g.arc(x0-18,gy-44,16,Math.PI,0);g.lineTo(x0-2,gy);g.stroke();g.globalAlpha=1;
}
function drawDecor(){
  const R=REG[L.r];
  L.decor.forEach(d=>{
    const x=d.a*T-cam.x,y=d.y-cam.y;if(x<-40||x>W+40)return;
    g.fillStyle=R.near;
    switch(R.deco){
      case 'vila':g.fillRect(x+4,y-8-d.s*6,2,8+d.s*6);g.fillStyle=NEON;g.globalAlpha=.8;g.fillRect(x+3,y-12-d.s*6,4,3);g.globalAlpha=1;break;
      case 'floresta':g.fillRect(x+6,y-14,3,14);g.fillStyle=R.tile[1];g.beginPath();g.arc(x+7,y-18,7+d.s*4,0,6.283);g.fill();break;
      case 'caverna':g.fillStyle=NEON;g.globalAlpha=.75;g.beginPath();g.moveTo(x,y);g.lineTo(x+4,y-10-d.s*10);g.lineTo(x+8,y);g.fill();g.globalAlpha=1;break;
      case 'pantano':g.fillStyle=EMER;g.globalAlpha=.6;g.fillRect(x+7,y-10,1,10);g.fillRect(x+5,y-12,5,3);g.globalAlpha=1;break;
      case 'gelo':g.fillStyle='#e8f6ff';g.beginPath();g.moveTo(x,y);g.lineTo(x+4,y-8-d.s*8);g.lineTo(x+8,y);g.fill();break;
      case 'vulcao':g.fillStyle='#ff7a2a';g.globalAlpha=.8;g.fillRect(x+3,y-4,6,4);g.globalAlpha=1;break;
      default:g.fillStyle='#ff3a5a';g.globalAlpha=.6;g.fillRect(x+6,y-12,2,12);g.globalAlpha=1;
    }
  });
}
function drawKaelen(){
  const p=pl;
  if(p.inv>0&&Math.floor(p.inv/3)%2)return;
  const x=Math.round(p.x-cam.x),y=Math.round(p.y-cam.y);
  g.save();g.translate(x+5,y);if(p.face<0)g.scale(-1,1);
  const run=p.ground&&Math.abs(p.vx)>.4,lg=run?Math.sin(frame*.35)*3:0,air=!p.ground;
  // capa
  g.fillStyle='#14101c';const cw=air?3:run?-3:0;
  g.beginPath();g.moveTo(-3,6);g.lineTo(-9+cw,13);g.lineTo(-8+cw,19);g.lineTo(-2,15);g.fill();
  // pernas
  g.fillStyle='#2a2420';g.fillRect(-3+(air?-1:lg),12,3,6);g.fillRect(0+(air?1:-lg),12,3,6);
  g.fillStyle='#8a929e';g.fillRect(-3+(air?-1:lg),15,3,2);g.fillRect(0+(air?1:-lg),15,3,2);
  // tronco
  g.fillStyle='#2f2a2e';g.fillRect(-4,5,8,8);g.fillStyle='#9aa4b0';g.fillRect(-5,5,4,3);g.fillStyle='#4a3a2a';g.fillRect(-4,11,8,1);
  // cabeça
  g.fillStyle='#d8b8a0';g.fillRect(-3,0,6,5);g.fillStyle='#1c1820';g.fillRect(-4,-1,8,3);g.fillRect(-4,0,2,4);
  g.fillStyle=NEON;g.fillRect(1,2,2,1);
  // braço de éter e espada
  const sw=p.atk>0?(14-p.atk)/14:-1;
  g.fillStyle=NEON;g.globalAlpha=.9;g.fillRect(2,6,3,3);g.globalAlpha=1;
  g.strokeStyle=NEON;g.lineWidth=2.4;g.lineCap='round';
  g.beginPath();
  if(sw<0){g.moveTo(4,8);g.lineTo(11,14)}
  else{const a=-1.4+sw*2.9;g.moveTo(4,8);g.lineTo(4+Math.cos(a)*(S.ab.ice?20:16),8+Math.sin(a)*(S.ab.ice?20:16))}
  g.stroke();g.strokeStyle='#e8fbff';g.lineWidth=1;g.stroke();
  g.restore();
  if(p.dash>0){g.fillStyle=NEON;g.globalAlpha=.25;g.fillRect(x-p.dashDir*10,y+2,10,14);g.globalAlpha=1}
  if(p.wall){g.fillStyle=NEON;g.globalAlpha=.5;g.fillRect(x+(p.wall>0?10:-1),y+4,1,10);g.globalAlpha=1}
}
function drawEnemy(e){
  if(!e.alive)return;
  const d=e.d,x=Math.round(e.x-cam.x),y=Math.round(e.y-cam.y);
  if(x<-40||x>W+40||y<-40||y>H+40)return;
  const fc=c=>e.flash>0?'#fff':c,dir=e.dir||1;
  g.save();g.translate(x+e.w/2,y+e.h/2);if(dir<0)g.scale(-1,1);
  const w=e.w,h=e.h;
  if(e.t==='rastejador'){
    const lg=Math.sin(frame*.3+e.ph)*2;
    g.fillStyle=fc(d.c);g.fillRect(-w/2+2,-h/2+2,w-4,h-4);
    g.strokeStyle=fc('#3a2e26');g.lineWidth=1.5;
    for(let i=0;i<3;i++){g.beginPath();g.moveTo(-5+i*5,h/2-3);g.lineTo(-7+i*5+(i%2?lg:-lg),h/2+2);g.stroke()}
    g.fillStyle=fc(NEON);for(let i=0;i<4;i++){g.beginPath();g.moveTo(-6+i*4,-h/2+3);g.lineTo(-4+i*4,-h/2-4-(i%2)*2);g.lineTo(-2+i*4,-h/2+3);g.fill()}
    g.fillStyle=fc('#b8f0ff');g.fillRect(w/2-5,-2,3,3);
  }else if(d.k==='fly'){
    const f=Math.sin(frame*.35+e.ph)*4;
    g.fillStyle=fc(d.c);g.beginPath();g.moveTo(-2,0);g.lineTo(-w/2-2,-5-f);g.lineTo(-w/2+3,3);g.fill();g.beginPath();g.moveTo(2,0);g.lineTo(w/2+2,-5-f);g.lineTo(w/2-3,3);g.fill();
    g.beginPath();g.ellipse(0,0,w/3,h/2.2,0,0,6.283);g.fill();g.fillStyle=fc(d.c2);g.fillRect(1,-2,2,2);
  }else if(d.k==='turret'){
    g.fillStyle=fc(d.c);
    if(d.float){g.globalAlpha=.9;g.beginPath();g.arc(0,0,w/2,0,6.283);g.fill();g.fillStyle=fc('#fff');g.fillRect(-1,-1,3,3);g.globalAlpha=1}
    else if(e.t==='broto'){g.fillRect(-2,0,4,h/2);g.beginPath();g.arc(0,-2,6,0,6.283);g.fill();g.fillStyle=fc(d.c2);g.fillRect(-1,-3,3,3)}
    else{g.fillRect(-w/2,-h/2+4,w,h-4);g.beginPath();g.moveTo(-w/2-1,-h/2+5);g.lineTo(0,-h/2-3);g.lineTo(w/2+1,-h/2+5);g.fill();g.fillStyle=fc(d.c2);g.fillRect(-1,-h/2+6,3,2)}
  }else if(d.k==='hop'){
    const sq=e.ground?0:2;g.fillStyle=fc(d.c);g.beginPath();g.ellipse(0,2,w/2,h/2-sq,0,0,6.283);g.fill();g.fillStyle=fc(d.c2);g.fillRect(-3,-3,2,2);g.fillRect(2,-3,2,2);
  }else{
    const lg=Math.sin(frame*.3+e.ph)*2,tel=e.st===1&&Math.floor(frame/3)%2;
    g.fillStyle=fc(tel?'#fff':d.c);g.fillRect(-w/2,-h/2+2,w,h-6);
    g.fillRect(-w/2+2,h/2-4,3,4+lg*.5);g.fillRect(w/2-5,h/2-4,3,4-lg*.5);
    if(d.hp>=40){g.fillStyle=fc(d.c2);g.globalAlpha=.7;g.fillRect(-w/2+3,-h/2+5,w-6,2);g.globalAlpha=1;g.fillRect(-w/2,-h/2-1,w,3)}
    g.fillStyle=fc(d.c2);g.fillRect(w/2-5,-h/2+4,3,2);
  }
  g.restore();
}
function drawBoss(b){
  if(!b.vis)return;
  const x=b.x-cam.x,y=b.y-cam.y,D=b.d,fc=c=>b.flash>0?'#fff':c;
  const tele=(b.st==='slash'&&b.sw&&b.t<22)||(b.st==='dash'&&b.t<26);
  g.save();g.translate(x+b.w/2,y+b.h);if(b.face>0)g.scale(-1,1);
  const w=b.w,h=b.h,br=Math.sin(frame*.06)*1.5;
  if(L.r===0){ // Sentinela Forjado
    g.fillStyle=fc('#5a5a64');g.fillRect(-w/2+4,-h+16,w-8,h-14);
    g.fillStyle=fc(D.col2);g.globalAlpha=.7;for(let i=0;i<4;i++)g.fillRect(-w/2+6+(i%2)*10,-h+20+i*7,5,2);g.globalAlpha=1;
    g.fillStyle=fc('#777784');g.fillRect(-w/2,-h+10,w,12);g.fillRect(-w/2+6,-h,w-12,12);
    g.fillStyle=fc(D.col2);g.fillRect(-w/2+9,-h+4,3,2);g.fillRect(-w/2+15,-h+4,3,2);
    g.fillStyle=fc('#4a4a54');g.fillRect(-w/2+3,-9,9,9);g.fillRect(w/2-12,-9,9,9);
    const hy=tele?-h-8:-h+24;g.fillStyle=fc('#6a6a72');g.fillRect(-w/2-14,hy,16,12);g.fillStyle=fc('#3a3a42');g.fillRect(-w/2-2,hy+4,w/2,3);
    if(b.st==='slash'&&b.sw&&b.t>=22){g.fillStyle=fc('#6a6a72');g.fillRect(-w/2-26,-14,18,12)}
  }else if(L.r===2){ // Araknis
    const lg=Math.sin(frame*.2)*2;
    g.strokeStyle=fc('#6a5a4a');g.lineWidth=3;
    for(let i=0;i<4;i++){const o=-w/2+4+i*(w/4);g.beginPath();g.moveTo(o+8,-h+10);g.lineTo(o-6,-h-4+(i%2)*lg);g.lineTo(o-10,0);g.stroke()}
    g.fillStyle=fc('#5a4a3c');g.beginPath();g.ellipse(0,-h/2-2,w/2-2,h/2-2,0,0,6.283);g.fill();
    g.fillStyle=fc(NEON);for(let i=0;i<7;i++){g.beginPath();g.moveTo(-14+i*5,-h+8);g.lineTo(-12+i*5,-h-7-(i%3)*3);g.lineTo(-10+i*5,-h+8);g.fill()}
    g.fillStyle=fc('#4a3c30');g.beginPath();g.arc(w/2-8,-h/2,9,0,6.283);g.fill();g.fillStyle=fc('#b8f0ff');g.fillRect(w/2-9,-h/2-3,5,4);
  }else if(L.r===6){ // Malakor
    const fy=-8+br;g.translate(0,fy);
    g.fillStyle=fc('#2a1038');g.beginPath();g.moveTo(-w/2,-h+14);g.lineTo(-w/2-8,0);g.lineTo(-4,-4);g.lineTo(4,0);g.lineTo(w/2+8,0);g.lineTo(w/2,-h+14);g.fill();
    g.fillStyle=fc('#1a1422');g.fillRect(-w/2+4,-h+14,w-8,h-30);g.fillRect(-w/2+2,-h+12,w-4,6);
    g.fillStyle=fc('#ff3a5a');g.globalAlpha=.8;g.fillRect(-2,-h+20,4,16);g.fillRect(-w/2+6,-h+22,3,10);g.fillRect(w/2-9,-h+22,3,10);g.globalAlpha=1;
    g.fillStyle=fc('#07050c');g.beginPath();g.arc(0,-h+6,9,0,6.283);g.fill();
    g.strokeStyle=fc('#b03a6a');g.lineWidth=2;g.beginPath();g.arc(0,-h+6,6+Math.sin(frame*.1)*1.5,frame*.12,frame*.12+4);g.stroke();
    g.fillStyle=fc('#ff3a5a');g.fillRect(-1,-h+5,3,3);
    for(let i=0;i<5;i++){const a=frame*.03+i*1.25;g.fillStyle=fc('#8a5ac8');g.fillRect(Math.cos(a)*18,-h-4+Math.sin(a)*5,3,4)}
    g.strokeStyle=fc('#a08a50');g.lineWidth=2;g.beginPath();g.moveTo(-w/2-3,-h+16);g.lineTo(-w/2-10,tele?-h-8:0);g.stroke();
  }else{ // Lord genérico
    g.fillStyle=fc(D.col);g.beginPath();g.moveTo(-w/2,-h+10);g.lineTo(-w/2-4,0);g.lineTo(w/2+4,0);g.lineTo(w/2,-h+10);g.fill();
    g.fillStyle=fc('#1a1622');g.fillRect(-w/2+3,-h+10,w-6,h-16);
    g.fillStyle=fc(D.col);g.fillRect(-w/2,-h+8,w,8);g.fillRect(-6,-h,12,10);
    g.fillStyle=fc(D.col2);g.fillRect(-4,-h+4,8,2);g.fillRect(-w/2+6,-h+24,w-12,2);
    g.fillRect(-5,-h-5,2,5);g.fillRect(-1,-h-7,2,7);g.fillRect(3,-h-5,2,5);
    g.strokeStyle=fc(D.col2);g.lineWidth=2.4;g.beginPath();g.moveTo(-w/2-2,-h+16);g.lineTo(-w/2-14,tele?-h-4:-10);g.stroke();
  }
  g.restore();
  if(tele&&Math.floor(frame/4)%2){g.fillStyle='#fff';g.globalAlpha=.25;g.fillRect(x,y,b.w,b.h);g.globalAlpha=1}
}
function drawWorldObjects(){
  // altares
  L.altars.forEach(a=>{
    const x=a.x-cam.x,y=a.y-cam.y,on=S.altars[L.r+':'+a.i];
    if(x<-30||x>W+30)return;
    g.fillStyle='#2a2438';g.fillRect(x-8,y-8,16,8);g.fillRect(x-5,y-14,10,6);
    g.fillStyle=on?EMER:NEON;g.globalAlpha=.9;const fl=Math.sin(frame*.06)*2;
    g.beginPath();g.moveTo(x,y-30+fl);g.lineTo(x+5,y-22+fl);g.lineTo(x,y-14+fl);g.lineTo(x-5,y-22+fl);g.fill();
    g.globalAlpha=.15;g.beginPath();g.arc(x,y-22+fl,16,0,6.283);g.fill();g.globalAlpha=1;
  });
  // Elara
  L.npcs.forEach(n=>{
    const x=n.x-cam.x,y=n.y-cam.y;if(x<-30||x>W+30)return;
    g.fillStyle='#1c4a3a';g.fillRect(x-4,y-16,8,16);g.fillStyle='#c8a890';g.fillRect(x-3,y-22,6,6);g.fillStyle='#14101c';g.fillRect(x-4,y-24,8,3);g.fillRect(x-4,y-22,2,10);g.fillRect(x+2,y-22,2,10);
    g.fillStyle='#b06a3a';g.fillRect(x-4,y-9,8,2);
    g.strokeStyle='#6a4a2a';g.lineWidth=1.5;g.beginPath();g.moveTo(x+7,y);g.lineTo(x+7,y-26);g.stroke();
    g.fillStyle=EMER;g.globalAlpha=.9;g.beginPath();g.arc(x+7,y-28+Math.sin(frame*.07)*1.5,3,0,6.283);g.fill();g.globalAlpha=.2;g.beginPath();g.arc(x+7,y-28,10,0,6.283);g.fill();g.globalAlpha=1;
  });
  // baús
  L.chests.forEach(c=>{
    const x=c.x-cam.x,y=c.y-cam.y;if(x<-20||x>W+20)return;
    g.fillStyle='#5a3a24';g.fillRect(x,y+(c.open?4:2),16,c.open?8:10);
    g.fillStyle='#8a929e';g.fillRect(x,y+5,16,1.5);
    if(c.open){g.fillStyle='#4a2e1c';g.fillRect(x,y-2,16,4)}else{g.fillStyle='#6a4a30';g.fillRect(x,y,16,4);g.fillStyle=NEON;g.fillRect(x+7,y+4,2,3)}
  });
  // portas
  L.doors.forEach(d=>{
    const x=d.x-cam.x,y=d.y-cam.y;if(x<-30||x>W+30)return;
    g.fillStyle='#07050d';g.fillRect(x-8,y-30,16,30);g.strokeStyle=NEON;g.lineWidth=1.5;g.globalAlpha=.7;g.strokeRect(x-8,y-30,16,30);g.globalAlpha=1;
  });
  // portal de saída
  if(portal){
    const x=portal.x-cam.x,y=portal.y-cam.y;
    for(let i=0;i<3;i++){g.strokeStyle=i%2?EMER:NEON;g.lineWidth=2;g.globalAlpha=.8-.2*i;g.beginPath();g.ellipse(x,y-18,10+i*3+Math.sin(frame*.08+i)*1.5,22-i*3,0,0,6.283);g.stroke()}
    g.globalAlpha=1;
  }
  // porta da arena
  if(boss&&boss.act){const a=L.arena.plug,x=a.x*T-cam.x,y=a.y0*T-cam.y;g.fillStyle=R_door();g.fillRect(x,y,T,(a.y1-a.y0+1)*T)}
}
const R_door=()=>'#2a1038';
function drawProj(){
  proj.forEach(q=>{
    const x=q.x-cam.x,y=q.y-cam.y;g.fillStyle=q.col;g.globalAlpha=.3;g.fillRect(x-2,y-2,q.w+4,q.h+4);g.globalAlpha=1;g.fillRect(x,y,q.w,q.h);g.fillStyle='#fff';g.fillRect(x+q.w/2-1,y+q.h/2-1,2,2);
  });
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;g.fillStyle=p.col;g.globalAlpha=Math.min(1,p.life/14);g.fillRect(p.x-cam.x,p.y-cam.y,p.s,p.s)});
  g.globalAlpha=1;parts=parts.filter(p=>p.life>0);
  g.font='bold 9px Spectral,serif';g.textAlign='center';
  pop.forEach(p=>{p.t--;p.y-=.5;g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.t/12);g.fillText(p.s,p.x-cam.x+5,p.y-cam.y)});
  g.globalAlpha=1;pop=pop.filter(p=>p.t>0);
}

/* ---------- HUD e telas ---------- */
function txt(s,x,y,col='#ebe3d2',al='left',sz=9,font='Spectral,Georgia,serif'){g.font=(sz>=12?'':'600 ')+sz+'px '+font;g.textAlign=al;g.fillStyle=col;g.fillText(s,x,y)}
function bar(x,y,w,h,v,m,c1,c2){
  g.fillStyle='#07050d';g.fillRect(x-1,y-1,w+2,h+2);
  g.fillStyle='#2a2438';g.fillRect(x,y,w,h);
  const f=clamp(v/m,0,1)*w;const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,c1);gr.addColorStop(1,c2);
  g.fillStyle=gr;g.fillRect(x,y,f,h);g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x,y,f,1);
}
function drawHUD(){
  g.fillStyle='rgba(7,5,13,.72)';g.fillRect(6,6,150,38);
  g.strokeStyle='#2b2640';g.lineWidth=1;g.strokeRect(6.5,6.5,150,38);
  txt('Kaelen  Nv '+S.lvl,12,17,'#ebe3d2','left',9);
  bar(12,21,mw(S.maxHp),6,S.hp,S.maxHp,'#c4434f','#ff8a8a');
  bar(12,31,mw(S.maxMp),5,S.mp,S.maxMp,'#2a78c4','#4fd0ff');
  txt('XP '+S.xp+'/'+need(),12+mw(S.maxHp)+8,27,'#a29bb2','left',8);
  txt('Moedas '+S.coins,W-8,14,'#e8c36a','right',9);
  txt('Poções '+S.pots+' (Q)',W-8,25,'#7dffb8','right',9);
  const R=REG[L.r];
  txt(R.n,W/2,14,'rgba(235,227,210,.75)','center',9);
  if(boss&&boss.act&&boss.alive){
    const bw=260,bx=(W-bw)/2,by=H-24;
    txt(boss.d.name,W/2,by-5,'#ebe3d2','center',10);
    bar(bx,by,bw,7,boss.hp,boss.max,boss.d.col2==='#ffffff'?'#8ab8e0':boss.d.col2,'#ff3a5a');
  }
  if(toastT>0){toastT--;g.globalAlpha=Math.min(1,toastT/20);g.fillStyle='rgba(7,5,13,.8)';const w=g.measureText(toastMsg).width+24;g.fillRect(W/2-100,H-54,200,18);txt(toastMsg,W/2,H-41,'#4fd0ff','center',10);g.globalAlpha=1}
  // dica de interação
  const hint=interactHint();
  if(hint){txt('[E] '+hint,pl.x+5-cam.x,pl.y-cam.y-10,'#fff','center',9)}
}
const mw=v=>Math.min(100,Math.round(v*.9));
function interactHint(){
  const cx=pl.x+5,cy=pl.y+9;
  for(const a of L.altars)if(Math.abs(a.x-cx)<18&&Math.abs(a.y-cy)<26)return 'Eco-Santuário';
  for(const n of L.npcs)if(Math.abs(n.x-cx)<22&&Math.abs(n.y-cy)<26)return 'Falar com Elara';
  for(const c of L.chests)if(!c.open&&Math.abs(c.x+8-cx)<20&&Math.abs(c.y-cy)<24)return 'Abrir baú';
  for(const d of L.doors)if(Math.abs(d.x-cx)<14&&Math.abs(d.y-cy)<26)return 'Voltar';
  if(portal&&Math.abs(portal.x-cx)<16&&Math.abs(portal.y-cy)<28)return 'Entrar no portal';
  return null;
}
function doInteract(){
  const cx=pl.x+5,cy=pl.y+9;
  for(const a of L.altars)if(Math.abs(a.x-cx)<18&&Math.abs(a.y-cy)<26){
    S.hp=S.maxHp;S.mp=S.maxMp;S.altars[L.r+':'+a.i]=1;S.cur={r:L.r,i:a.i};saveGame();sfx('pick');puff(a.x,a.y-20,EMER,16,2);
    ens.forEach(e=>{if(!e.alive){e.alive=true;e.hp=e.d.hp;e.x=e.sx!==undefined?e.sx:e.x}});
    toast('Progresso salvo e Éter restaurado');return true}
  for(const n of L.npcs)if(Math.abs(n.x-cx)<22&&Math.abs(n.y-cy)<26){say(n.lines.map(t=>({who:'Elara',port:'elara',t:t.replace(/^Elara: /,'')})));return true}
  for(const c of L.chests)if(!c.open&&Math.abs(c.x+8-cx)<20&&Math.abs(c.y-cy)<24){
    c.open=true;S.chests[c.id]=1;sfx('pick');
    const it=c.item;
    if(it==='coin'){const n=30+L.r*25;S.coins+=n;toast('+'+n+' moedas')}
    else if(it==='hp'){S.maxHp+=10;S.hp=S.maxHp;toast('Vitalidade máxima aumentou')}
    else if(it==='mp'){S.maxMp+=6;S.mp=S.maxMp;toast('Éter máximo aumentou')}
    else if(it==='pot'){S.pots+=2;toast('+2 Poções de Éter')}
    else if(it==='wpn'){S.wpn=Math.max(S.wpn,1);toast('Espada Etérea Temperada!')}
    else{S.coins+=40}
    saveGame();return true}
  for(const d of L.doors)if(Math.abs(d.x-cx)<14&&Math.abs(d.y-cy)<26){enterRegion(d.to,'portal');pl.x=L.portal.x-5;return true}
  if(portal&&Math.abs(portal.x-cx)<16&&Math.abs(portal.y-cy)<28){
    const nr=L.r+1;if(nr>=REG.length)return true;
    S.cur={r:nr,i:0};S.altars[nr+':0']=1;saveGame();enterRegion(nr,'start');
    toast('Nova terra: '+REG[nr].n);return true}
  return false;
}
function drawDialog(){
  const d=dlg,l=d.lines[d.i];
  const h=64,y=H-h-8;
  g.fillStyle='rgba(7,5,13,.92)';g.fillRect(10,y,W-20,h);g.strokeStyle='#4fd0ff';g.globalAlpha=.6;g.strokeRect(10.5,y+.5,W-21,h-1);g.globalAlpha=1;
  let tx=20;
  if(l.port&&IMG[l.port]&&IMG[l.port].complete){
    g.save();g.beginPath();g.rect(16,y+6,52,h-12);g.clip();
    const im=IMG[l.port],sh=im.height,sw=im.width,srcW=sh*(52/(h-12));
    const sx=l.port==='elara'?sw*.36:sw*.34;
    try{g.drawImage(im,sx,0,srcW,sh,16,y+6,52,h-12)}catch(e){}
    g.restore();tx=76;
  }
  if(l.who)txt(l.who,tx,y+16,'#4fd0ff','left',11,'IM Fell English SC,Georgia,serif');
  d.c=Math.min(l.t.length,d.c+1);
  wrapText(l.t.slice(0,d.c),tx,y+30,W-tx-22,12);
  if(d.c>=l.t.length&&frame%50<30)txt('E',W-24,y+h-8,'#a29bb2','right',9);
}
function wrapText(s,x,y,mw2,lh){
  const w=s.split(' ');let line='',yy=y;g.font='600 10px Spectral,Georgia,serif';g.textAlign='left';g.fillStyle='#ebe3d2';
  for(const t of w){const test=line?line+' '+t:t;if(g.measureText(test).width>mw2&&line){g.fillText(line,x,yy);line=t;yy+=lh}else line=test}
  g.fillText(line,x,yy);
}
function drawCard(){
  const c=card;c.t++;
  g.fillStyle='rgba(0,0,0,'+Math.min(.85,c.t/20)+')';g.fillRect(0,0,W,H);
  const a=Math.min(1,c.t/24);g.globalAlpha=a;
  if(c.art&&IMG[c.art]&&IMG[c.art].complete){
    const im=IMG[c.art],ih=H-30,iw=ih*im.width/im.height;
    g.save();g.beginPath();g.rect((W-iw)/2,15,iw,ih);g.clip();g.drawImage(im,(W-iw)/2,15,iw,ih);
    const vg=g.createLinearGradient(0,H-110,0,H-15);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.92)');g.fillStyle=vg;g.fillRect((W-iw)/2,H-110,iw,95);g.restore();
  }
  txt(c.title,W/2,H-58,c.col,'center',12,'IM Fell English SC,Georgia,serif');
  txt(c.name,W/2,H-34,'#fff','center',20,'IM Fell English SC,Georgia,serif');
  g.globalAlpha=1;
  if(c.t>110){mode='play';boss.act=true;boss.tm=40;card=null}
}
function drawMap(){
  g.fillStyle='rgba(7,5,13,.94)';g.fillRect(0,0,W,H);
  txt('Mapa de Aethelgard',W/2,26,'#4fd0ff','center',16,'IM Fell English SC,Georgia,serif');
  const n=REG.length,bw=56,gap=8,x0=(W-(n*bw+(n-1)*gap))/2;
  for(let i=0;i<n;i++){
    const x=x0+i*(bw+gap),y=60,R=REG[i],unlocked=i===0||S.dead.includes(i-1),done=S.dead.includes(i);
    g.fillStyle=unlocked?R.sky[1]:'#1a1626';g.fillRect(x,y,bw,60);
    g.strokeStyle=i===L.r?'#fff':done?EMER:'#2b2640';g.lineWidth=i===L.r?2:1;g.strokeRect(x+.5,y+.5,bw-1,59);
    txt(String(i+1),x+bw/2,y+36,unlocked?'#fff':'#4a4560','center',20,'IM Fell English SC,Georgia,serif');
    txt(unlocked?R.n:'???',x+bw/2,y+76,unlocked?'#ebe3d2':'#4a4560','center',7);
    txt(done?'Lord vencido':unlocked?R.lord.title:'',x+bw/2,y+86,done?EMER:'#a29bb2','center',6.5);
    if(i<n-1){g.fillStyle='#2b2640';g.fillRect(x+bw,y+29,gap,2)}
  }
  const alts=[];for(let r=0;r<n;r++)for(let k=0;k<2;k++)if(S.altars[r+':'+k])alts.push([r,k]);
  txt('Eco-Santuários: use as setas para escolher, E para viajar',W/2,150,'#a29bb2','center',9);
  menu=menu||{i:0};
  const cols=4,cw=108;
  alts.forEach((a,idx)=>{
    const cx=20+(idx%cols)*(cw+6),cy=162+Math.floor(idx/cols)*18;
    const sel=idx===menu.i;
    g.fillStyle=sel?'#2a2340':'#14101f';g.fillRect(cx,cy,cw,15);if(sel){g.strokeStyle=NEON;g.strokeRect(cx+.5,cy+.5,cw-1,14)}
    txt(REG[a[0]].n.slice(0,12)+(a[1]?' (castelo)':''),cx+4,cy+11,'#ebe3d2','left',8);
  });
  menu.alts=alts;
  const hs=['Poções '+S.pots,'Espada: '+WEAPON[S.wpn],'Ataque '+atkPow(),'Magia '+magPow()];
  txt(hs.join('   ·   '),W/2,H-34,'#a29bb2','center',9);
  const ab=[['dj','Gravidade'],['dash','Aether Dash'],['wall','Garras'],['glide','Capa'],['ice','Temperada'],['fire','Núcleo']].map(a=>(S.ab[a[0]]?'✔ ':'· ')+a[1]);
  txt(ab.join('   '),W/2,H-20,'#4fd0ff','center',9);
  txt('M ou Esc: fechar',W/2,H-6,'#a29bb2','center',8);
}
function drawTitle(){
  const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#07060e');gr.addColorStop(.6,'#1c1030');gr.addColorStop(1,'#14394a');g.fillStyle=gr;g.fillRect(0,0,W,H);
  const im=IMG.kaelen;
  if(im&&im.complete&&im.width){g.globalAlpha=.55;const ih=H,iw=ih*im.width/im.height;g.drawImage(im,(W-iw)/2,0,iw,ih);g.globalAlpha=1}
  const vg=g.createLinearGradient(0,0,0,H);vg.addColorStop(0,'rgba(7,5,14,.78)');vg.addColorStop(.5,'rgba(7,5,14,.1)');vg.addColorStop(1,'rgba(7,5,14,.85)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  txt('ECHOES OF',W/2,64,'#a29bb2','center',14,'IM Fell English SC,Georgia,serif');
  txt('AETHELGARD',W/2,100,'#fff','center',40,'IM Fell English SC,Georgia,serif');
  g.fillStyle=NEON;g.globalAlpha=.8;g.fillRect(W/2-90,108,180,1);g.globalAlpha=1;
  const items=hasSave()?['Continuar','Novo jogo']:['Novo jogo'];
  menu=menu||{i:0};
  items.forEach((t,i)=>{txt((menu.i===i?'▸ ':'   ')+t,W/2,H-74+i*20,menu.i===i?'#fff':'#a29bb2','center',13,'IM Fell English SC,Georgia,serif')});
  menu.n=items.length;menu.items=items;
  txt('Enter, E ou Ataque para escolher',W/2,H-16,'#a29bb2','center',8);
}
function drawEnd(txtA,sub,col){
  g.fillStyle='rgba(7,5,13,.82)';g.fillRect(0,0,W,H);
  txt(txtA,W/2,H/2-8,col,'center',28,'IM Fell English SC,Georgia,serif');
  txt(sub,W/2,H/2+16,'#ebe3d2','center',10);
}

/* ---------- loop ---------- */
function startGame(cont){
  if(cont&&loadGame()){const c=S.cur;enterRegion(c.r,'altar',c.i)}
  else{S=newState();enterRegion(0,'start');
    setTimeout(()=>{if(mode==='play')say([{who:'Elara',port:'elara',t:'Kaelen, a corrupção do Éter Abissal cobre Aethelgard. Em cada terra há um castelo e um Lord.'},{who:'Elara',port:'elara',t:'Atravesse a vila, a floresta, as cavernas e além. Vença os sete Lordes e chegue ao Trono do Vazio.'}])},300)}
}
function respawn(){
  S.hp=S.maxHp;S.mp=S.maxMp;S.coins=Math.floor(S.coins*.85);
  const c=S.cur;enterRegion(c.r,'altar',c.i);
}
function stepDialog(){
  if(P('act')||P('atk')||P('jump')){
    const l=dlg.lines[dlg.i];
    if(dlg.c<l.t.length){dlg.c=l.t.length;return}
    dlg.i++;dlg.c=0;sfx('menu');
    if(dlg.i>=dlg.lines.length){const cb=dlg.cb;dlg=null;mode='play';if(cb)cb()}
  }
}
function update(){
  frame++;
  if(mode==='title'){
    menu=menu||{i:0};
    if(P('down')||P('right'))menu.i=Math.min((menu.n||1)-1,menu.i+1);
    if(P('up')||P('left'))menu.i=Math.max(0,menu.i-1);
    if(P('act')||P('atk')||P('jump')){
      const it=(menu.items||['Novo jogo'])[menu.i];sfx('menu');
      if(it==='Continuar')startGame(true);else{try{localStorage.removeItem(SAVEKEY)}catch(e){}startGame(false)}
      menu=null;
    }
    return;
  }
  if(mode==='dialog'){stepDialog();return}
  if(mode==='card'){if(card&&card.t>30&&(P('act')||P('atk')||P('jump'))){mode='play';boss.act=true;boss.tm=40;card=null}return}
  if(mode==='map'){
    menu=menu||{i:0};const alts=menu.alts||[];
    if(P('right'))menu.i=Math.min(alts.length-1,menu.i+1);
    if(P('left'))menu.i=Math.max(0,menu.i-1);
    if(P('down'))menu.i=Math.min(alts.length-1,menu.i+4);
    if(P('up')||P('jump'))menu.i=Math.max(0,menu.i-4);
    if(P('map')||P('pause')){mode='play';menu=null;return}
    if(P('act')&&alts[menu.i]){
      const a=alts[menu.i];S.cur={r:a[0],i:a[1]};menu=null;enterRegion(a[0],'altar',a[1]);sfx('open');
    }
    return;
  }
  if(mode==='pause'){if(P('pause'))mode='play';return}
  if(mode==='dead'){
    if(P('act')||P('atk')||P('jump')){menu=null;respawn()}
    return;
  }
  if(mode==='win'){if(P('act')){try{localStorage.removeItem(SAVEKEY)}catch(e){}mode='title';menu=null}return}
  // jogo
  if(P('pause')){mode='pause';return}
  if(P('map')){mode='map';menu={i:0};return}
  if(P('act')&&pl.ground)doInteract();
  if(mode!=='play')return;
  S.time++;
  updPlayer();
  ens.forEach(e=>{if(e.alive)updEnemy(e)});
  if(ens.length>40)ens=ens.filter(e=>e.alive);
  if(boss&&boss.alive){
    if(!boss.act&&mode==='play'&&pl.x>L.arena.x0+T*6&&!card){bossStart()}
    else if(boss.act){updBoss(boss)}
  }
  updProj();
  // câmera
  const tx=pl.x+5-W/2+pl.face*22,ty=pl.y-H*.58;
  let minX=0,maxX=L.Wt*T-W;
  if(boss&&boss.act){minX=L.arena.x0-T;maxX=L.arena.x1-W+T}
  cam.x+=(clamp(tx,minX,maxX)-cam.x)*.12;cam.y+=(clamp(ty,0,HT*T-H)-cam.y)*.1;
  if(shake>0){shake--;cam.x+=rnd(-shake,shake)*.3;cam.y+=rnd(-shake,shake)*.3}
}
function render(){
  g.setTransform(1,0,0,1,0,0);
  if(mode==='title'){drawTitle();return}
  if(!L.tiles)L.tiles=renderTiles();
  drawBG();drawCastleFacade();
  const cx=Math.round(cam.x),cy=Math.round(cam.y);
  g.drawImage(L.tiles,cx,cy,W,H,0,0,W,H);
  const sx=cam.x,sy=cam.y;cam.x=cx;cam.y=cy;
  drawDecor();drawWorldObjects();
  ens.forEach(drawEnemy);if(boss&&boss.alive)drawBoss(boss);
  drawKaelen();drawProj();
  // lanterna de éter ambiente
  const lg=g.createRadialGradient(pl.x+5-cam.x,pl.y+8-cam.y,20,pl.x+5-cam.x,pl.y+8-cam.y,230);
  lg.addColorStop(0,'rgba(0,0,0,0)');lg.addColorStop(1,'rgba(4,3,10,.38)');g.fillStyle=lg;g.fillRect(0,0,W,H);
  cam.x=sx;cam.y=sy;
  drawHUD();
  if(mode==='dialog')drawDialog();
  if(mode==='card')drawCard();
  if(mode==='map')drawMap();
  if(mode==='pause'){g.fillStyle='rgba(7,5,13,.7)';g.fillRect(0,0,W,H);txt('Pausa',W/2,H/2,'#fff','center',24,'IM Fell English SC,Georgia,serif')}
  if(mode==='dead'){drawEnd('Você caiu','Pressione Ação para renascer no último Eco-Santuário','#ff5a6a')}
  if(mode==='win'){drawEnd('O Vazio foi selado','Malakor caiu. Aethelgard respira de novo. Obrigado por jogar. (Ação: voltar ao título)',EMER)}
}
// passo fixo de 60 Hz
let last=performance.now(),acc=0;
function loop(t){
  acc+=Math.min(100,t-last);last=t;
  while(acc>=16.667){update();for(const k in pr)pr[k]=false;acc-=16.667}
  render();
  requestAnimationFrame(loop);
}
menu={i:0};
requestAnimationFrame(loop);
// instantâneo para depuração rápida
})();
