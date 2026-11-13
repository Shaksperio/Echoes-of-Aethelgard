const IMGSRC={kaelen:'assets/kaelen.jpg',elara:'assets/elara.jpg',sentinel:'assets/sentinel.jpg',spider:'assets/spider.jpg',malakor:'assets/malakor.jpg'};
(()=>{
'use strict';
const W=320,H=180,T=16,SW=960,SH=540,SC=3;
const cv=document.getElementById('c'),g=cv.getContext('2d');
cv.width=SW;cv.height=SH;

/* ---------- entrada ---------- */
const keys={},pr={};
const MAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'jump',Space:'jump',ArrowDown:'down',KeyS:'down',KeyJ:'atk',KeyZ:'atk',KeyK:'mag',KeyX:'mag',KeyL:'dash',KeyC:'dash',KeyE:'act',Enter:'act',KeyQ:'pot',KeyM:'map',Tab:'map',KeyP:'pause',Escape:'pause',KeyR:'spell',KeyI:'equip',KeyN:'music'};
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
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}if(AC){try{musStart()}catch(e){}}}
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
 lord:{name:'O Sentinela Forjado',title:'Guardião corrompido',hp:150,mv:['slash','leap'],col:'#6a6a74',col2:'#b060ff',w:30,h:40,art:'sentinel',dmg:12,relic:'dj',drop:2}},
{n:'Floresta Sussurrante',sub:'Mata dos Ecos',castle:'Castelo das Raízes',len:170,sky:['#0b1a17','#1f4a3b','#7fae7a'],far:'#16342c',near:'#0e241f',tile:['#2b2a1f','#3f6b3a','#1c1b14'],deco:'floresta',
 lord:{name:'Thorne, Senhor das Raízes',title:'Lord da Floresta',hp:220,mv:['slash','volley','dash'],col:'#2f6a3a',col2:'#38e0a0',w:24,h:34,dmg:14,relic:'dash',drop:3}},
{n:'Cavernas Cristalinas',sub:'Galerias de Geodo',castle:'Castelo Geodo',len:180,sky:['#0b0a16','#1b1840','#3b2f7a'],far:'#1a1738',near:'#110f26',tile:['#2a2540','#5a5088','#181530'],deco:'caverna',
 lord:{name:'Araknis, Matriarca de Cristal',title:'Mãe dos Rastejadores',hp:300,mv:['leap','rain','volley'],col:'#5a4a3c',col2:'#4fd0ff',w:36,h:26,art:'spider',dmg:16,relic:'wall',drop:4}},
{n:'Charco Corroído',sub:'Pântano de Éter Abissal',castle:'Castelo Afogado',len:180,sky:['#101a14','#2f4a2a','#a6b45a'],far:'#233a22',near:'#16261a',tile:['#2a2a1c','#5a6a2e','#17180f'],deco:'pantano',
 lord:{name:'Murkal, o Submerso',title:'Lord do Charco',hp:380,mv:['tele','volley','summon'],col:'#3a6a58',col2:'#9ef0c0',w:24,h:32,dmg:18,relic:'glide',drop:-1}},
{n:'Picos de Vidro',sub:'Cordilheira Congelada',castle:'Fortaleza da Geada',len:190,sky:['#0f1a2e','#3a5c86','#cfe4f2'],far:'#4a6a92',near:'#2a4468',tile:['#33445e','#d8e8f4','#1e2a40'],deco:'gelo',
 lord:{name:'Ysmir, a Tempestade',title:'Lord da Geada',hp:470,mv:['dash','rain','slash','volley'],col:'#8ab8e0',col2:'#ffffff',w:26,h:36,dmg:20,relic:'ice',drop:5}},
{n:'Forja Abissal',sub:'Garganta de Brasas',castle:'Castelo da Forja',len:200,sky:['#1a0a0a','#5a1e12','#ff8a3a'],far:'#3a1812',near:'#241010',tile:['#3a2420','#a0482a','#201010'],deco:'vulcao',
 lord:{name:'Cinder, o Ferreiro Rubro',title:'Lord da Forja',hp:560,mv:['leap','volley','rain','dash'],col:'#c8442a',col2:'#ffd070',w:30,h:38,dmg:22,relic:'fire',drop:6}},
{n:'Cidadela do Vazio',sub:'O Coração da Corrupção',castle:'Trono do Vazio',len:220,sky:['#07060e','#1c1030','#5a2a6a'],far:'#1a1230',near:'#0e0a1c',tile:['#2a2438','#6a5a86','#14101e'],deco:'cidadela',
 lord:{name:'Malakor, o Arquiteto do Vazio',title:'Arquiteto do Vazio',hp:900,mv:['slash','leap','volley','dash','rain','tele','summon'],col:'#1c1622',col2:'#ff3a5a',w:28,h:44,art:'malakor',dmg:26,relic:'end',drop:-1}}
];
const RELIC={
 dj:['Manipulação Gravitacional','Salto duplo: pressione pular de novo no ar.'],
 dash:['Aether Dash','Investida de Éter: use o Dash no chão ou no ar.'],
 wall:['Garras de Cristal','Agarre-se às paredes e salte entre elas.'],
 glide:['Capa de Éter','Segure pular durante a queda para planar.'],
 ice:['Espada Etérea Temperada','Ataque muito mais forte. O Dash passa a proteger você.'],
 fire:['Núcleo Sobrecarregado','Mais Éter e Fagulhas bem mais fortes.']
};
const WPN=[
 {n:'Espada Etérea',dmg:6,reach:26,dur:14,cool:16,from:3,to:11,style:'blade',col:'#4fd0ff',kb:1.8},
 {n:'Etérea Temperada',dmg:10,reach:28,dur:14,cool:15,from:3,to:11,style:'blade',col:'#7fe8ff',kb:1.9},
 {n:'Montante do Sentinela',dmg:17,reach:36,dur:26,cool:28,from:11,to:20,style:'great',col:'#c8a0ff',kb:3.2},
 {n:'Lança das Raízes',dmg:12,reach:44,dur:17,cool:18,from:5,to:12,style:'spear',col:'#38e0a0',kb:1.6},
 {n:'Lâmina de Cristal',dmg:14,reach:30,dur:11,cool:12,from:2,to:8,style:'blade',col:'#4fd0ff',kb:1.5},
 {n:'Lâmina de Geada',dmg:20,reach:33,dur:13,cool:14,from:3,to:10,style:'blade',col:'#e8f6ff',kb:2.2},
 {n:'Martelo da Forja',dmg:32,reach:34,dur:30,cool:32,from:13,to:24,style:'great',col:'#ff8a3a',kb:3.6}
];
const SPELL=[{n:'Fagulha de Éter',mp:10},{n:'Lança de Éter',mp:14},{n:'Nova Etérea',mp:22}];
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

/* ====== ARTE RENDERIZADA: ferramentas ====== */
const _mc={};
const hx=c=>{if(c[0]==='r')return c.match(/[\d.]+/g).slice(0,3).map(Number);c=c.replace('#','');if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)]};
function mixc(a,b,t){const k=a+b+t;if(_mc[k])return _mc[k];const A=hx(a),B=hx(b);return _mc[k]='rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')+')'}
function rgba(c,a){const A=hx(c);return'rgba('+A[0]+','+A[1]+','+A[2]+','+a+')'}
function limb(x1,y1,x2,y2,w1,w2,col){
  const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  const gr=g.createLinearGradient(x1-nx*w1/2,y1-ny*w1/2,x1+nx*w1/2,y1+ny*w1/2);
  gr.addColorStop(0,mixc(col,'#ffffff',.3));gr.addColorStop(.5,col);gr.addColorStop(1,mixc(col,'#000000',.5));
  g.fillStyle=gr;
  g.beginPath();g.moveTo(x1+nx*w1/2,y1+ny*w1/2);g.lineTo(x2+nx*w2/2,y2+ny*w2/2);g.lineTo(x2-nx*w2/2,y2-ny*w2/2);g.lineTo(x1-nx*w1/2,y1-ny*w1/2);g.closePath();g.fill();
  g.beginPath();g.arc(x1,y1,w1/2,0,6.283);g.fill();g.beginPath();g.arc(x2,y2,w2/2,0,6.283);g.fill();
}
function orb(x,y,rx,ry,col,hl=.3){
  const gr=g.createRadialGradient(x-rx*.35,y-ry*.4,Math.min(rx,ry)*.08,x,y,Math.max(rx,ry)*1.05);
  gr.addColorStop(0,mixc(col,'#ffffff',hl+.2));gr.addColorStop(.5,col);gr.addColorStop(1,mixc(col,'#000000',.6));
  g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,0,0,6.283);g.fill();
}
function glow(x,y,r,col,a=.5){
  const pv=g.globalCompositeOperation;g.globalCompositeOperation='lighter';
  const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,rgba(col,a));gr.addColorStop(1,rgba(col,0));
  g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();g.globalCompositeOperation=pv;
}
function poly(pts,col,top=.25,bot=.5){
  let y0=1e9,y1=-1e9;pts.forEach(p=>{y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  const gr=g.createLinearGradient(0,y0,0,y1+.01);gr.addColorStop(0,mixc(col,'#ffffff',top));gr.addColorStop(.45,col);gr.addColorStop(1,mixc(col,'#000000',bot));
  g.fillStyle=gr;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fill();
}
function crys(x,y,h,w,col,ang=0){
  g.save();g.translate(x,y);g.rotate(ang);
  poly([[-w/2,0],[-w*.3,-h*.8],[0,-h],[w*.3,-h*.8],[w/2,0]],col,.5,.2);
  g.fillStyle='rgba(255,255,255,.45)';g.beginPath();g.moveTo(-w*.1,-h*.15);g.lineTo(0,-h*.9);g.lineTo(w*.12,-h*.2);g.fill();
  g.restore();glow(x,y-h*.5,h*.9,col,.35);
}
function fk(len,a0,a1){return[Math.sin(a0)*len,Math.cos(a0)*len]}

/* ====== KAELEN ====== */
const COL={skin:'#d9b9a2',hair:'#1d1a24',leather:'#2c2630',steel:'#a9b3c0',cape:'#171a26',cyan:'#4fd0ff'};
function swordShape(x,y,phi,len,wcol,wid,style){
  // lâmina de plasma/aço saindo da mão (x,y) com ângulo phi (0 = para cima, +pi/2 = frente)
  const dx=Math.sin(phi),dy=-Math.cos(phi),ex=x+dx*len,ey=y+dy*len;
  glow((x+ex)/2,(y+ey)/2,len*.75,wcol,.35);
  g.lineCap='round';
  g.strokeStyle=rgba(wcol,.55);g.lineWidth=wid*2.2;g.beginPath();g.moveTo(x+dx*2,y+dy*2);g.lineTo(ex,ey);g.stroke();
  g.strokeStyle=wcol;g.lineWidth=wid*1.3;g.beginPath();g.moveTo(x+dx*2,y+dy*2);g.lineTo(ex,ey);g.stroke();
  g.strokeStyle='#ffffff';g.lineWidth=wid*.5;g.beginPath();g.moveTo(x+dx*2,y+dy*2);g.lineTo(ex,ey);g.stroke();
  if(style==='spear'){poly([[ex,ey-2.4],[ex+4.5,ey],[ex,ey+2.4]],'#e8fbff',.2,.3)}
  // guarda
  g.strokeStyle='#8a929e';g.lineWidth=1.3;g.beginPath();g.moveTo(x-dy*2.2,y+dx*2.2);g.lineTo(x+dy*2.2,y-dx*2.2);g.stroke();
}
function kaelenPose(p){
  const air=!p.ground,run=p.ground&&Math.abs(p.vx)>.45,t=p.ph||0,fr=frame;
  const o={lean:0,y:0,th:[.1,-.12],sh:[.1,-.12],arm:0,phi:2.45,hx:0,trail:0,duck:0};
  const wp=WPN[S.wpn]||WPN[0];
  if(run){const s=Math.sin(t);o.th=[s*.9,-s*.9];o.sh=[o.th[0]-Math.max(0,Math.sin(t+1.7))*1.15,o.th[1]-Math.max(0,-Math.sin(t+1.7))*1.15];o.y=-Math.abs(Math.cos(t))*.9;o.lean=.12;o.phi=2.2+Math.sin(t*2)*.12;}
  else if(!air){o.y=Math.sin(fr*.06)*.25;o.phi=2.45+Math.sin(fr*.06)*.05}
  if(air){if(p.vy<0){o.th=[.75,-.45];o.sh=[-.15,-1.1];o.lean=.1;o.phi=1.9}else{o.th=[.35,-.2];o.sh=[.2,-.45];o.phi=2.7;o.lean=-.05}}
  if(p.wall){o.th=[.5,.2];o.sh=[-.4,-.7];o.lean=-.1}
  if(p.dash>0||p.bd>0){o.lean=p.bd>0?-.35:.55;o.th=[.9,-.7];o.sh=[.2,-1.3];o.phi=p.bd>0?2.6:1.6;o.y=1}
  if(p.atk>0){
    const u=1-p.atk/(p.atkDur||14);
    if(wp.style==='spear'){const th=Math.sin(Math.min(1,u*1.6)*Math.PI);o.phi=1.57;o.hx=2+th*9;o.lean=.2;o.th=[.5,-.4];o.sh=[.5,-.4]}
    else if(wp.style==='great'){const e=u<.35?-(u/.35)*.6:(u-.35)/.65;o.phi=u<.35?-.4-u*1.6:-.96+e*3.9;o.lean=u<.35?-.2:.3;o.th=[.5,-.35];o.sh=[.5,-.35];o.trail=u>.35?1:0;o.u=u}
    else{o.phi=-.5+u*3.0;o.lean=.2;o.th=[.45,-.3];o.sh=[.4,-.3];o.trail=u>.12&&u<.9?1:0;o.u=u}
  }
  if(p.inv>40){o.lean=-.3;o.phi=2.9}
  return o;
}
function drawKaelen(p){
  if(p.inv>0&&p.inv<=40&&Math.floor(p.inv/3)%2)return;
  p.ph=(p.ph||0)+Math.abs(p.vx)*.13;
  const o=kaelenPose(p),wp=WPN[S.wpn]||WPN[0];
  const fx=p.x+p.w/2,fy=p.y+p.h;
  g.save();g.translate(fx,fy+o.y);g.scale(p.face*1.28,1.28);
  const hipY=-9.2,shY=-16.6+o.lean*-1.2,lean=o.lean;
  const hipX=-lean*1.5,shX=lean*3;
  const leg=(i,col,dark)=>{
    const th=o.th[i],sh=o.sh[i],k=[hipX+Math.sin(th)*5.2,hipY+Math.cos(th)*5.2],f=[k[0]+Math.sin(sh)*5.1,k[1]+Math.cos(sh)*5.1];
    limb(hipX,hipY,k[0],k[1],3.3,2.9,col);limb(k[0],k[1],f[0],f[1],2.9,2.3,dark);
    limb(f[0],f[1],f[0]+1.8,f[1]+.3,2.2,2.4,'#3a2a22');
    g.fillStyle=COL.steel;g.beginPath();g.ellipse(k[0],k[1],1.7,1.4,0,0,6.283);g.fill();
  };
  // capa (atrás)
  const sway=Math.sin(frame*.12)*.8,trail=clamp(-p.vx*2.2+(o.lean<0?-2:0),-8,2),fall=p.ground?0:clamp(p.vy*1.1,-5,7);
  poly([[shX-1.4,shY],[shX-3,shY+5],[hipX-3.5+trail-sway,hipY+4+fall*.3],[hipX-5+trail*1.5,hipY+9-fall],[hipX-1+trail*.6,hipY+7],[hipX+1,hipY]],COL.cape,.2,.6);
  g.strokeStyle='rgba(79,208,255,.25)';g.lineWidth=.5;g.beginPath();g.moveTo(shX-2,shY+1);g.lineTo(hipX-3+trail,hipY+7);g.stroke();
  // braço de trás
  const arm=(sx,sy,a1,a2,col)=>{const e=[sx+Math.sin(a1)*4.2,sy+Math.cos(a1)*4.2],h=[e[0]+Math.sin(a2)*4,e[1]+Math.cos(a2)*4];limb(sx,sy,e[0],e[1],2.8,2.4,col);limb(e[0],e[1],h[0],h[1],2.4,2.1,col);return h};
  const bk=Math.sin(p.ph||0)*.7*(p.ground&&Math.abs(p.vx)>.4?1:0);
  arm(shX-.8,shY+.8,-.35-bk,-.15-bk,COL.leather);
  leg(1,'#26222c','#1d1a22');
  // tronco
  poly([[shX-3.6,shY],[shX+3.8,shY],[shX+3,shY+4.8],[hipX+2.6,hipY],[hipX-2.6,hipY],[shX-3,shY+4.8]],'#2f2a36',.18,.5);
  g.fillStyle='#4a3a2a';g.fillRect(hipX-3,hipY-1.3,6,1.5);g.fillStyle='#c0a060';g.fillRect(hipX-.7,hipY-1.4,1.4,1.5);
  g.strokeStyle='#5a4a3a';g.lineWidth=.8;g.beginPath();g.moveTo(shX-3,shY+.4);g.lineTo(hipX+2.5,hipY-1.3);g.stroke();
  // saia de malha
  poly([[hipX-3,hipY-.6],[hipX+3,hipY-.6],[hipX+3.4,hipY+2.8],[hipX-3.4,hipY+2.8]],'#6a7280',.3,.5);
  leg(0,'#2c2832','#211e28');
  // ombreira
  orb(shX+1.2,shY+.6,2.8,2.1,COL.steel);
  // cabeça
  const hy=shY-3.5,hxp=shX+.8;
  limb(shX,shY,hxp,hy+2,1.8,1.6,COL.skin);
  orb(hxp,hy,2.7,2.9,COL.skin,.2);
  // cabelo
  const wind=clamp(-p.vx*1.6,-3.5,1.5)+sway*.4;
  poly([[hxp-3,hy+.6],[hxp-2.6,hy-2.6],[hxp,hy-3.6],[hxp+2.8,hy-2.2],[hxp+3,hy-.2],[hxp+1.5,hy-1.4],[hxp-.5,hy-1.2],[hxp-3-wind*.5,hy+3.5+Math.abs(wind)*.2],[hxp-4.4+wind,hy+1.6]],COL.hair,.35,.3);
  g.fillStyle=COL.cyan;g.fillRect(hxp+.9,hy-.2,1.3,.9);glow(hxp+1.5,hy,3,COL.cyan,.5);
  // braço da espada (esquerdo, com éter)
  const sx=shX+1.4,sy=shY+1;
  const hand=[sx+Math.sin(o.phi*.55+.4)*5.6+o.hx*.6,sy+4.1+Math.abs(Math.cos(o.phi*.6))*2.4-(o.phi<1?3.4:0)];
  const el=[(sx+hand[0])/2+.2,(sy+hand[1])/2+1.5];
  limb(sx,sy,el[0],el[1],2.7,2.4,'#3a3440');limb(el[0],el[1],hand[0],hand[1],2.5,2.1,'#2a6a98');
  glow(el[0]+.5,el[1]+.4,5.2,COL.cyan,.5);
  g.strokeStyle='rgba(180,240,255,.9)';g.lineWidth=.45;g.beginPath();g.moveTo(el[0],el[1]);g.lineTo(hand[0],hand[1]);g.stroke();
  g.fillStyle='#bcd6e8';g.beginPath();g.arc(hand[0],hand[1],1.3,0,6.283);g.fill();
  // lâmina e rastro
  const len=wp.reach*.55+4,bl=wp.col||COL.cyan,wid=wp.style==='great'?2.1:wp.style==='spear'?.9:1.3;
  if(o.trail){
    const a1=o.phi-.9,a0=o.phi-(wp.style==='great'?2.6:2.1);
    g.save();g.lineCap='butt';
    for(let k=0;k<4;k++){g.strokeStyle=rgba(bl,.17+.07*k);g.lineWidth=2.8+k*1.4;g.beginPath();g.arc(hand[0],hand[1],len*(.72+k*.08),a0-1.5708+k*.12,o.phi-1.5708,false);g.stroke()}
    g.restore();
  }
  swordShape(hand[0],hand[1],o.phi,len,bl,wid,wp.style);
  g.restore();
  if(p.dash>0||p.bd>0){glow(fx-p.face*8,fy-10,16,COL.cyan,.35)}
  if(p.wall){glow(fx+p.wall*7,fy-9,8,'#b8e8ff',.3)}
}

/* ====== ELARA (guia) ====== */
function drawElara(x,y){
  const t=frame*.05;
  g.save();g.translate(x,y);g.scale(1.28,1.28);
  const br=Math.sin(t)*.25;
  limb(-1.4,-9,-1.6,-.4,3,2.4,'#1f4a38');limb(1.4,-9,1.8,-.4,3,2.4,'#1b3f31');
  g.fillStyle='#4a3a2a';g.fillRect(-2.6,-.6,2.4,1.2);g.fillRect(.6,-.6,2.4,1.2);
  poly([[-4,-17+br],[4,-17+br],[3.4,-8],[-3.4,-8]],'#1e5a40',.3,.5);
  poly([[-4.4,-9],[4.4,-9],[5.4,-2.5],[-5.4,-2.5]],'#235a40',.25,.5);
  g.strokeStyle='#8a5a30';g.lineWidth=1.1;g.beginPath();g.moveTo(-3,-16.5);g.lineTo(3.4,-9.2);g.stroke();
  orb(3.6,-16.4+br,2.4,2,'#b8794a');orb(-3.6,-16.4+br,2.1,1.8,'#b8794a');
  limb(0,-17,0,-19.5,1.8,1.6,'#d9b9a2');orb(0,-22,2.8,3,'#dcbfa8',.2);
  poly([[-3.2,-23],[-2.4,-26.4],[1,-26.8],[3,-24],[2,-22.4],[0,-24.4],[-1.8,-23.6],[-3.4,-17],[-2.4,-14.5],[-4,-17]],'#14111b',.35,.3);
  poly([[3,-23.4],[3.9,-17],[3,-15],[2.4,-18]],'#14111b',.35,.3);
  g.fillStyle='#8fe8c0';g.fillRect(.6,-22.6,1.2,.8);g.fillStyle='#cfd8e0';g.fillRect(-2.6,-25.2,5.4,.7);
  // cajado
  g.strokeStyle='#5a4028';g.lineWidth=1.2;g.beginPath();g.moveTo(8,0);g.quadraticCurveTo(7,-14,8.6,-27);g.stroke();
  const ox=8.6,oy=-28+Math.sin(t*1.4)*.8;
  limb(4,-15.2,6.6,-13.2,2.2,1.9,'#1e5a40');
  orb(ox,oy,2.3,2.3,'#38e0a0',.5);glow(ox,oy,16,'#38e0a0',.55);
  for(let i=0;i<3;i++){const a=t*2+i*2.1;glow(ox+Math.cos(a)*6,oy+Math.sin(a)*4,3,'#9affd0',.6)}
  g.restore();
}

/* ====== INIMIGOS ====== */
const ENART={
 rato(e,F,c,c2,t){const r=Math.sin(t*2)*1.2;
  limb(-3,2,-3+r,4.5,1.2,1,F('#5a4a46'));limb(3,2,3-r,4.5,1.2,1,F('#5a4a46'));
  g.strokeStyle=F('#b88a8a');g.lineWidth=.8;g.beginPath();g.moveTo(-6,1);g.quadraticCurveTo(-10,-1+r,-9,-4);g.stroke();
  orb(0,1,6,3.8,F(c));orb(5.2,.4,3.2,2.5,F(c));poly([[4,-1],[4.8,-3.6],[6,-1]],F('#c88a8a'));
  g.fillStyle=F(c2);g.fillRect(6,-.2,1.2,1.2);glow(6.4,.4,3,c2,.7);g.fillStyle='#e8c8c8';g.fillRect(7.6,.8,1.4,.8)},
 corvo(e,F,c,c2,t){const f=Math.sin(frame*.35+e.ph)*5;
  poly([[-1,-1],[-6,-5-f],[-10,-1-f*.5],[-4,2]],F(c),.2,.4);poly([[1,-1],[6,-5-f],[10,-1-f*.5],[4,2]],F(mixc(c,'#4a4260',.3)),.2,.4);
  orb(0,0,4.8,3.4,F(c));orb(4.4,-1.2,2.4,2.2,F(c));poly([[6,-1.6],[9,-.8],[6,-.2]],F('#e8c36a'),.3,.3);
  g.fillStyle=F(c2);g.fillRect(5,-2,1,1);glow(5.4,-1.5,3,c2,.6);poly([[-4,0],[-8,2],[-4,2]],F(c))},
 lobo(e,F,c,c2,t){const r=Math.sin(t*1.8)*2.4,sh=e.st===1?Math.sin(frame*.9)*.6:0;g.translate(sh,0);
  limb(-5,2,-6+r,6,2,1.5,F('#3a3a46'));limb(5,2,6-r,6,2,1.5,F('#3a3a46'));
  g.strokeStyle=F(c);g.lineWidth=2;g.beginPath();g.moveTo(-8,-1);g.quadraticCurveTo(-13,-1,-12,-5+r*.3);g.stroke();
  orb(0,0,8.4,4.6,F(c));limb(-5,2,-5-r,6.6,2.2,1.6,F(mixc(c,'#000',.2)));limb(5,2,5+r,6.6,2.2,1.6,F(mixc(c,'#000',.2)));
  orb(8,-2,4.2,3.2,F(c));poly([[8,-1],[13,0.6],[8,2]],F(mixc(c,'#000',.15)));poly([[6,-4],[6.4,-8],[8.6,-4.4]],F(c));
  g.fillStyle=F(c2);g.fillRect(8.2,-2.8,1.6,1.1);glow(9,-2.2,4,c2,.8);g.fillStyle='#fff';g.fillRect(11,1.4,.9,1)},
 broto(e,F,c,c2,t){const s=Math.sin(t)*.6;
  limb(0,8,s,-1,2.8,2.2,F(mixc(c,'#000',.25)));poly([[1,5],[6,2],[3,6]],F(c));poly([[-1,5],[-6,3],[-3,6]],F(c));
  for(let i=0;i<6;i++){const a=i/6*6.283+t*.3;poly([[Math.cos(a)*4+s,-5+Math.sin(a)*4],[Math.cos(a)*8.4+s,-5+Math.sin(a)*8.4],[Math.cos(a+.4)*4+s,-5+Math.sin(a+.4)*4]],F('#2f5a2a'))}
  orb(s,-5,5,5,F(c));glow(s,-5,9,c2,.6+.2*Math.sin(frame*.15));orb(s,-5,2.2,2.2,F(c2),.5)},
 rastejador(e,F,c,c2,t){const r=Math.sin(t*2);
  g.strokeStyle=F('#4a3c30');g.lineWidth=1.3;
  for(let i=0;i<3;i++){const k=(i%2?1:-1)*r;[[-1,-1],[1,1]].forEach(([s])=>{});
   g.beginPath();g.moveTo(-3+i*3,1);g.lineTo(-8+i*4.5-k,-3+k*.6);g.lineTo(-10+i*4.5-k,5);g.stroke();
   g.beginPath();g.moveTo(-3+i*3,1);g.lineTo(-5+i*4.5+k,-4);g.lineTo(-6+i*4.5+k*.4,5);g.stroke()}
  for(let i=0;i<5;i++)crys(-5+i*2.6,-3.4+Math.abs(i-2)*.6,6+((i*7)%4),2.8,F('#4fd0ff'),(i-2)*.2);
  orb(0,.6,7.6,4.4,F(c));orb(6.6,1.4,3.2,2.8,F(mixc(c,'#000',.1)));
  g.fillStyle=F('#c8f6ff');g.fillRect(7.4,.6,1.2,1.2);g.fillRect(8.8,1.4,.9,.9);glow(8.2,1.2,4,'#4fd0ff',.8)},
 golem(e,F,c,c2,t){const s=Math.sin(t*1.4)*.8;
  limb(-3,2,-3.4,9,5,4.4,F(mixc(c,'#000',.15)));limb(3,2,3.4,9,5,4.4,F(mixc(c,'#000',.15)));
  poly([[-7,-8],[7,-8],[8,3],[-8,3]],F(c));glow(0,-3,10,c2,.45);
  g.strokeStyle=F(c2);g.lineWidth=.8;g.beginPath();g.moveTo(-5,-6);g.lineTo(-1,-2);g.lineTo(-4,2);g.moveTo(4,-7);g.lineTo(2,-3);g.lineTo(5,1);g.stroke();
  limb(-8,-6,-10,2+s,5,4.6,F(c));limb(8,-6,10.4,3-s,5,4.6,F(c));orb(-10,4+s,3.2,3,F(mixc(c,'#fff',.1)));orb(10.4,5-s,3.2,3,F(mixc(c,'#fff',.1)));
  poly([[-3.4,-14],[3.4,-14],[4,-8],[-4,-8]],F(mixc(c,'#fff',.1)));g.fillStyle=F(c2);g.fillRect(.4,-12,1.6,1.1);glow(1.2,-11.4,4,c2,.9)},
 sapo(e,F,c,c2,t){const q=e.ground?1:.82;
  orb(0,3,8,5.4*q,F(c));limb(-6,5,-9,7,3,2,F(mixc(c,'#000',.2)));limb(6,5,9,7,3,2,F(mixc(c,'#000',.2)));
  orb(-3.6,-1.4,2.8,2.8,F('#e0f06a'));orb(3.6,-1.4,2.8,2.8,F('#e0f06a'));g.fillStyle='#14210e';g.fillRect(-4,-1.6,1.2,2.6);g.fillRect(3.2,-1.6,1.2,2.6);
  g.strokeStyle=F('#2a4a22');g.lineWidth=.7;g.beginPath();g.arc(0,2.6,4,.15,2.99);g.stroke();
  [[-4,4],[2,5.4],[5,3]].forEach(p=>orb(p[0],p[1],.9,.9,F(c2)))},
 fatuo(e,F,c,c2,t){for(let i=5;i>0;i--){const a=.5-i*.08;glow(-i*2.6,Math.sin(t*2+i)*1.6,3.6+i*.4,c,a)}
  glow(0,0,13,c,.7);orb(0,0,4.4,4.4,F(c),.5);g.fillStyle='#fff';g.beginPath();g.arc(-.8,-.8,1.4,0,6.283);g.fill()},
 espectro(e,F,c,c2,t){const w=Math.sin(t*1.5);
  g.globalAlpha=.88;poly([[-5,-9],[5,-9],[7,2],[4,6+w],[1,3],[-2,7-w],[-5,3],[-7,2]],F(c),.4,.3);g.globalAlpha=1;
  orb(0,-9,4,4.4,F(mixc(c,'#fff',.2)));g.fillStyle=F(c2);g.fillRect(-2.6,-9.6,1.8,2.2);g.fillRect(.9,-9.6,1.8,2.2);glow(0,-8.6,8,c2,.8);
  limb(-5,-4,-9,w,1.6,1.2,F(c));limb(5,-4,9,-w,1.6,1.2,F(c))},
 cavgelo(e,F,c,c2,t){const r=Math.sin(t*1.6)*1.6;
  limb(-2,3,-2+r,10,3.2,2.8,F('#4a6288'));limb(2,3,2-r,10,3.2,2.8,F('#3e547a'));
  poly([[-5,-9],[5,-9],[4,4],[-4,4]],F(c));glow(0,-4,7,c2,.3);orb(-6,-8,3.2,2.6,F(mixc(c,'#fff',.2)));orb(6,-8,3.2,2.6,F(mixc(c,'#fff',.2)));
  orb(0,-13,3.8,4,F(mixc(c,'#fff',.15)));poly([[-3,-15],[-5.6,-19],[-1.6,-16.4]],F(c2));poly([[3,-15],[5.6,-19],[1.6,-16.4]],F(c2));
  g.fillStyle=F(c2);g.fillRect(.4,-13.4,2,1);glow(1.4,-13,4,c2,.9);
  limb(4,-6,8,-1,2.4,2,F(c));limb(8,-1,10,-8,1,.8,F(c2));glow(10,-8,6,c2,.6);orb(-7,-1,3,4.6,F('#7a98c0'))},
 diabrete(e,F,c,c2,t){const f=Math.sin(frame*.3+e.ph)*4;
  poly([[-2,-2],[-9,-7-f],[-6,0]],F(mixc(c,'#000',.3)));poly([[2,-2],[9,-7-f],[6,0]],F(mixc(c,'#000',.3)));
  g.strokeStyle=F(c);g.lineWidth=.9;g.beginPath();g.moveTo(-3,3);g.quadraticCurveTo(-9,4,-8,-1);g.stroke();
  orb(0,1,4.2,4.4,F(c));orb(0,-4.6,3.4,3.2,F(c));poly([[-2.4,-6.4],[-3.4,-10],[-1,-7]],F('#2a1410'));poly([[2.4,-6.4],[3.4,-10],[1,-7]],F('#2a1410'));
  g.fillStyle=F(c2);g.fillRect(-1.8,-4.8,1.2,1);g.fillRect(.8,-4.8,1.2,1);glow(0,-4.6,6,c2,.8);glow(0,1,9,c2,.25)},
 rastejante(e,F,c,c2,t){
  for(let i=7;i>=0;i--){const x=-9+i*2.8,y=Math.sin(t*2+i*.8)*1.6,r=3.8-i*.18;orb(x,y+1,r,r*.9,F(mixc(c,c2,i%2?.25:0)));glow(x,y+1,r*2.2,c2,.18)}
  orb(10,0,4,3.4,F(c));g.fillStyle=F(c2);g.fillRect(11.4,-1,1.4,1.2);glow(12,-.4,5,c2,.9);poly([[10,2],[14,3.4],[10,3.8]],F('#2a1008'))},
 cultista(e,F,c,c2,t){const b=Math.sin(t)*1;
  poly([[-4.4,-10],[4.4,-10],[7,10],[-7,10]],F(c),.3,.5);poly([[-4,-10],[0,-17],[4,-10],[2,-6],[-2,-6]],F(mixc(c,'#000',.15)));
  g.fillStyle='#07040c';g.beginPath();g.ellipse(0,-9.6,2.6,2.8,0,0,6.283);g.fill();g.fillStyle=F(c2);g.fillRect(-1.6,-10,1,1.2);g.fillRect(.8,-10,1,1.2);glow(0,-9.6,5,c2,.9);
  limb(-4,-5,-7,0,2.2,1.8,F(c));limb(4,-5,7,0,2.2,1.8,F(c));
  orb(0,-1+b,3.4,3.4,F(c2),.6);glow(0,-1+b,12,c2,.55)},
 cavnegro(e,F,c,c2,t){const r=Math.sin(t*1.5)*1.5;
  limb(-2,3,-2+r,10,3.4,3,F('#1d1a28'));limb(2,3,2-r,10,3.4,3,F('#161422'));
  poly([[-5.4,-9],[5.4,-9],[4.4,4],[-4.4,4]],F(c));g.strokeStyle=F(c2);g.lineWidth=.8;g.beginPath();g.moveTo(-4,-8);g.lineTo(0,-3);g.lineTo(4,-8);g.stroke();glow(0,-4,7,c2,.3);
  orb(-6.4,-8,3.6,2.8,F(mixc(c,'#fff',.15)));orb(6.4,-8,3.6,2.8,F(mixc(c,'#fff',.15)));
  orb(0,-13,3.9,4.2,F(mixc(c,'#fff',.1)));g.fillStyle='#07040c';g.fillRect(-2.2,-14,4.6,1.8);g.fillStyle=F(c2);g.fillRect(.2,-13.6,2,.9);glow(1,-13.2,5,c2,.9);
  limb(5,-6,9,-1,2.6,2.2,F(c));poly([[9,-12],[11,-12],[11,6],[9,6]],F('#aab2c0'));glow(10,-3,10,c2,.35)},
 gargula(e,F,c,c2,t){const f=Math.sin(frame*.25+e.ph)*5;
  poly([[-3,-3],[-12,-9-f],[-8,-1],[-4,3]],F(mixc(c,'#000',.2)));poly([[3,-3],[12,-9-f],[8,-1],[4,3]],F(mixc(c,'#000',.2)));
  orb(0,0,5.6,6,F(c));orb(0,-6,3.8,3.4,F(c));poly([[-2.6,-8],[-4.6,-12],[-1,-9]],F(mixc(c,'#000',.3)));poly([[2.6,-8],[4.6,-12],[1,-9]],F(mixc(c,'#000',.3)));
  g.fillStyle=F(c2);g.fillRect(-2,-6.4,1.2,1);g.fillRect(.8,-6.4,1.2,1);glow(0,-6,6,c2,.9);limb(-3,5,-4,9,2,1.6,F(c));limb(3,5,4,9,2,1.6,F(c))}
};
function drawEnemyArt(e){
  const d=e.d,fn=ENART[e.t];if(!fn)return;
  const F=c=>e.flash>0?'#ffffff':c;
  g.save();g.translate(e.x+e.w/2,e.y+e.h/2);
  const k=e.t==='lobo'||e.t==='rastejante'?1.1:1.28;g.scale((e.dir||1)*k,k);
  if(e.st===1&&e.t==='charge')g.translate(0,0);
  fn(e,F,d.c,d.c2,(e.tm*.06)+(e.ph||0));
  g.restore();
}

/* ====== CHEFES (origem nos pés, virados para a direita) ====== */
const BOSSART=[
 // 0 Sentinela Forjado
 (b,F,tele,t)=>{const s=Math.sin(t)*.6,hs=b.st==='slash'&&b.sw&&b.t>=22;
  limb(-5,-12,-6,-1,8,7,F('#5b5b66'));limb(5,-12,6,-1,8,7,F('#51515c'));poly([[-9,0],[-2,0],[-2,-3],[-9,-3]],F('#3a3a44'));poly([[2,0],[10,0],[10,-3],[2,-3]],F('#3a3a44'));
  poly([[-11,-34],[11,-34],[13,-12],[-13,-12]],F('#6a6a74'),.3,.5);
  for(let i=0;i<4;i++){g.strokeStyle=F('#b060ff');g.lineWidth=1.1;g.beginPath();g.moveTo(-7+i*4.6,-31);g.lineTo(-5+i*4.6,-26);g.lineTo(-8+i*4.6,-20);g.stroke();glow(-6+i*4.6,-26,8,'#b060ff',.35)}
  poly([[-13,-20],[13,-20],[11,-14],[-11,-14]],F('#4a4a55'));g.fillStyle=F('#8a5a2a');for(let i=0;i<5;i++)g.fillRect(-10+i*5,-18.4,2.2,1.6);
  orb(-13,-33,6.4,5.2,F('#767682'));orb(13,-33,6.4,5.2,F('#767682'));g.fillStyle=F('#caa45a');g.beginPath();g.arc(-13,-33,1.2,0,6.283);g.arc(13,-33,1.2,0,6.283);g.fill();
  poly([[-7,-42],[7,-42],[8,-34],[-8,-34]],F('#707080'));g.fillStyle='#10081c';g.fillRect(-4.6,-39.4,9.2,2.2);g.fillStyle='#d09aff';g.fillRect(-3,-39,6,1.2);glow(0,-38.6,14,'#b060ff',.7);
  poly([[-3,-42],[3,-42],[4,-47],[-4,-47]],F('#8a8a98'));
  poly([[-12,-36],[-24,-30],[-24,-6],[-14,-10]],F('#8c7a4a'),.2,.4);g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=.6;g.beginPath();g.moveTo(-18,-32);g.lineTo(-19,-8);g.stroke();
  limb(-12,-30,-15,-18+s,6,5,F('#5b5b66'));orb(-15,-15+s,4,4,F('#6a6a74'));
  const hy=tele?-56:hs?-18:-22+s,hx=hs?22:14;
  limb(12,-30,hx-2,hy+8,6,5,F('#5b5b66'));
  g.strokeStyle='#4a3828';g.lineWidth=2.2;g.beginPath();g.moveTo(hx,hy+10);g.lineTo(hx+(hs?0:3),hy-18);g.stroke();
  poly([[hx-9,hy-26],[hx+9,hy-26],[hx+9,hy-10],[hx-9,hy-10]],F('#707080'),.3,.5);poly([[hx-10,hy-18],[hx+10,hy-18],[hx+10,hy-15],[hx-10,hy-15]],F('#8a5a2a'));
  glow(hx,hy-18,12,'#b060ff',.25)},
 // 1 Thorne
 (b,F,tele,t)=>{const s=Math.sin(t)*.7;
  limb(-3,-14,-4,-1,5,4,F('#3a2a1c'));limb(3,-14,4,-1,5,4,F('#33261a'));
  poly([[-6,-3],[-1,-3],[-1,0],[-6,0]],F('#2a2014'));poly([[1,-3],[7,-3],[7,0],[1,0]],F('#2a2014'));
  poly([[-9,-34],[-9,-30],[-5,-14],[5,-14],[9,-30],[9,-34]],F('#4a3a26'),.25,.5);
  for(let i=0;i<5;i++){g.strokeStyle=F('#38e0a0');g.lineWidth=1.2;g.beginPath();g.moveTo(-6+i*3,-32);g.bezierCurveTo(-8+i*3,-26,-4+i*3,-20,-6+i*3,-15);g.stroke();glow(-6+i*3,-24,6,'#38e0a0',.28)}
  for(let i=0;i<5;i++)poly([[-8+i*4,-34],[-6+i*4,-40+(i%2)*2],[-4+i*4,-34]],F('#2f6a3a'));
  orb(-10,-33,5,4.2,F('#3a5a2a'));orb(10,-33,5,4.2,F('#3a5a2a'));
  poly([[-9,-33],[-18,-26],[-12,-14],[-6,-24]],F('#1d3a24'),.1,.4);
  orb(0,-41,4.2,4.6,F('#4a5a3a'));g.fillStyle=F('#b6ffd8');g.fillRect(-2.6,-42,1.8,1.4);g.fillRect(.8,-42,1.8,1.4);glow(0,-41.6,10,'#38e0a0',.8);
  for(let i=-2;i<=2;i++)poly([[i*2.1-1,-44],[i*3.6,-52-Math.abs(i)*-1.5],[i*2.1+1,-44]],F('#6a8a4a'));
  limb(-9,-31,-12,-20+s,4.6,4,F('#3a5a2a'));
  const swing=tele?-1.4:b.st==='slash'&&b.sw?1.2:.5;limb(9,-31,16,-24,4.6,4,F('#3a5a2a'));
  const ex=16+Math.sin(swing)*3,ey=-24;g.strokeStyle='#6a4a2a';g.lineWidth=2;g.beginPath();g.moveTo(ex-Math.sin(swing)*10,ey+Math.cos(swing)*-10+8);g.lineTo(ex+Math.sin(swing)*14,ey-Math.cos(swing)*14);g.stroke();
  const tx=ex+Math.sin(swing)*14,ty=ey-Math.cos(swing)*14;glow(tx,ty,14,'#38e0a0',.7);poly([[tx-2,ty+2],[tx+7,ty-3],[tx+1,ty+6]],F('#b6ffd8'),.2,.2)},
 // 2 Araknis
 (b,F,tele,t)=>{const r=Math.sin(t*1.6);
  g.strokeStyle=F('#5a4a3c');g.lineCap='round';
  for(let i=0;i<4;i++){const k=(i%2?1:-1)*r*2.4;g.lineWidth=3.2;
   g.beginPath();g.moveTo(-6+i*5,-13);g.lineTo(-16+i*8-k,-24+k*.4);g.lineTo(-20+i*9-k,0);g.stroke();
   g.beginPath();g.moveTo(-4+i*5,-12);g.lineTo(-8+i*8+k,-28);g.lineTo(-10+i*8+k*.5,0);g.stroke();
   g.strokeStyle=F('#7a6a58');g.lineWidth=1;g.beginPath();g.moveTo(-5+i*5,-13.6);g.lineTo(-15+i*8-k,-24.6+k*.4);g.stroke();g.strokeStyle=F('#5a4a3c')}
  orb(-6,-14,15,10,F('#5a4a3c'));orb(13,-12,9,7.6,F('#4e4034'));
  for(let i=0;i<8;i++)crys(-16+i*3.4,-21-Math.sin(i*1.3)*1.5,9+((i*5)%6),4.4,F('#4fd0ff'),(i-4)*.12);
  for(let i=0;i<4;i++){g.fillStyle=F('#d8f8ff');g.beginPath();g.arc(15+(i%2)*3.4,-14+Math.floor(i/2)*2.8,1.3,0,6.283);g.fill();glow(15+(i%2)*3.4,-14+Math.floor(i/2)*2.8,6,'#4fd0ff',.8)}
  poly([[18,-8],[22,-4],[18,-6]],F('#c8c0b0'));poly([[16,-6],[17,-1],[14,-5]],F('#c8c0b0'))},
 // 3 Murkal
 (b,F,tele,t)=>{const s=Math.sin(t)*.8;
  limb(-5,-9,-7,-1,7,6,F('#2a4a40'));limb(5,-9,7,-1,7,6,F('#2a4a40'));
  g.strokeStyle=F('#2a5a48');g.lineWidth=5;g.beginPath();g.moveTo(-6,-10);g.quadraticCurveTo(-18,-6+s,-16,-18);g.stroke();
  orb(0,-18,12,12,F('#3a6a58'));for(let i=0;i<6;i++)orb(-8+i*3.2,-14+(i%2)*6,1.6,1.6,F('#5aa888'));
  limb(-9,-22,-15,-9+s,5,4,F('#3a6a58'));limb(9,-22,15,-12-s,5,4,F('#3a6a58'));
  for(let i=0;i<3;i++){poly([[-17+i*2,-8+s],[-16+i*2,-3+s],[-15+i*2,-8+s]],F('#c8e8d8'));poly([[14+i*2,-11-s],[16+i*2,-6-s],[17+i*2,-11-s]],F('#c8e8d8'))}
  orb(2,-31,7.4,6.4,F('#4a7a68'));for(let i=0;i<5;i++)poly([[-4+i*2.8,-35],[-3+i*2.8,-43+(i%2)*2],[-1.4+i*2.8,-35]],F('#2f8a6a'));
  g.fillStyle=F('#e8ffc0');g.fillRect(.4,-32.6,2.4,2.2);g.fillRect(4.6,-32.6,2.4,2.2);glow(3.4,-31.6,12,'#9ef0c0',.9);
  g.strokeStyle='#14281f';g.lineWidth=1;g.beginPath();g.arc(3.6,-28.6,3.4,.2,2.9);g.stroke();
  g.fillStyle='rgba(158,240,192,.55)';for(let i=0;i<4;i++)g.fillRect(-6+i*5,-8+((frame*.5+i*9)%14),1.2,2.4)},
 // 4 Ysmir
 (b,F,tele,t)=>{const hv=-9+Math.sin(t*1.4)*2.4;g.save();g.translate(0,hv);
  poly([[-9,-32],[9,-32],[14,-4],[8,0],[0,-3],[-8,0],[-14,-4]],F('#cfe4f2'),.3,.5);poly([[-6,-30],[6,-30],[8,-8],[-8,-8]],F('#8ab8e0'),.2,.4);
  glow(0,-18,16,'#8ab8e0',.5);orb(0,-34,5,5.4,F('#e8f6ff'));poly([[-6,-36],[0,-46],[6,-36],[3,-31],[-3,-31]],F('#8ab8e0'));
  g.fillStyle=F('#1a3a6a');g.fillRect(-2.4,-35,1.6,1.6);g.fillRect(.8,-35,1.6,1.6);glow(0,-34.4,9,'#4fd0ff',.9);
  for(let i=0;i<6;i++)crys(-7+i*2.8,-45+Math.abs(i-2.5)*2,6+(i%2)*3,2.8,F('#bfeaff'),(i-2.5)*.18);
  const up=tele||b.st==='rain';limb(-8,-30,-16,up?-42:-20,4.4,3.4,F('#a8c8e0'));limb(8,-30,15,up?-40:-18,4.4,3.4,F('#a8c8e0'));
  g.strokeStyle='#d8f0ff';g.lineWidth=1.4;g.beginPath();g.moveTo(17,-6);g.lineTo(16.4,-46);g.stroke();crys(16.4,-46,12,5,F('#bfeaff'));glow(16.4,-52,18,'#ffffff',.5);
  for(let i=0;i<10;i++){const a=t*1.2+i*.63,rr=18+(i%3)*5;g.fillStyle='rgba(235,248,255,.85)';g.beginPath();g.arc(Math.cos(a)*rr,-22+Math.sin(a*1.3)*14,1+(i%3)*.4,0,6.283);g.fill()}
  g.restore()},
 // 5 Cinder
 (b,F,tele,t)=>{const s=Math.sin(t*1.3)*.8,sw=b.st==='slash'&&b.sw&&b.t>=22;
  limb(-6,-13,-7,-1,8.4,7.4,F('#3a2420'));limb(6,-13,7,-1,8.4,7.4,F('#33201c'));poly([[-12,0],[-2,0],[-2,-4],[-12,-4]],F('#241210'));poly([[2,0],[12,0],[12,-4],[2,-4]],F('#241210'));
  poly([[-12,-36],[12,-36],[14,-12],[-14,-12]],F('#5a3a30'),.2,.5);glow(0,-24,18,'#ff7a2a',.5);orb(0,-24,6,6,F('#ffb04f'),.5);g.strokeStyle='#ffd070';g.lineWidth=.9;
  for(let i=0;i<5;i++){const a=i*1.26+.3;g.beginPath();g.moveTo(Math.cos(a)*6,-24+Math.sin(a)*6);g.lineTo(Math.cos(a)*11,-24+Math.sin(a)*10);g.stroke()}
  poly([[-8,-20],[8,-20],[10,-6],[-10,-6]],F('#7a4a28'),.2,.5);
  orb(-14,-34,7.2,5.8,F('#4a2c24'));orb(14,-34,7.2,5.8,F('#4a2c24'));
  poly([[-7,-46],[7,-46],[8,-36],[-8,-36]],F('#4a3a38'));poly([[-7,-46],[-12,-54],[-5,-46]],F('#8a8a90'));poly([[7,-46],[12,-54],[5,-46]],F('#8a8a90'));
  g.fillStyle='#ffd070';g.fillRect(-4,-42,8,2.2);glow(0,-41,13,'#ff7a2a',.9);
  limb(-13,-31,-15,-17+s,7,6,F('#5a3a30'));
  const a=tele?-2.3:sw?1.3:.6,hx=16,hy=-26;limb(13,-31,hx,hy,6.4,5.6,F('#5a3a30'));
  g.save();g.translate(hx,hy);g.rotate(a-1.2);g.strokeStyle='#5a4030';g.lineWidth=3;g.beginPath();g.moveTo(0,4);g.lineTo(0,-22);g.stroke();
  poly([[-10,-32],[10,-32],[10,-18],[-10,-18]],F('#6a6a74'),.3,.5);glow(0,-25,16,'#ff7a2a',.6);g.restore();
  for(let i=0;i<7;i++){g.fillStyle='rgba(255,170,60,'+(.8-i*.1)+')';g.fillRect(-14+((frame*.7+i*17)%28),-6-((frame*1.1+i*9)%30),1.2,1.2)}},
 // 6 Malakor
 (b,F,tele,t)=>{const hv=-7+Math.sin(t*1.2)*2.2;g.save();g.translate(0,hv);
  poly([[-10,-38],[-16,-12],[-8,-3],[-3,-9],[2,-2],[8,-8],[15,-14],[11,-38]],F('#2a1038'),.1,.6);
  g.fillStyle='#1a0a26';for(let i=0;i<5;i++){g.beginPath();g.moveTo(-14+i*5.6,-8);g.lineTo(-12+i*5.6,-1-(i%2)*3);g.lineTo(-9+i*5.6,-8);g.fill()}
  limb(-3,-20,-3.6,-6,5,4,F('#241a30'));limb(3,-20,3.6,-6,5,4,F('#241a30'));poly([[-5,-5],[5,-5],[4,0],[-4,0]],F('#3a2a48'));
  poly([[-8,-42],[8,-42],[6,-20],[-6,-20]],F('#2a2230'),.25,.5);
  g.strokeStyle=F('#ff3a5a');g.lineWidth=1.1;g.beginPath();g.moveTo(0,-41);g.lineTo(0,-23);g.moveTo(-4.6,-38);g.lineTo(-3,-26);g.moveTo(4.6,-38);g.lineTo(3,-26);g.stroke();glow(0,-33,12,'#ff3a5a',.55);
  poly([[-7,-24],[7,-24],[8,-19],[-8,-19]],F('#3a2a40'));g.fillStyle='#a08a50';g.fillRect(-1,-24,2,5);
  poly([[-9,-44],[-18,-47],[-14,-38],[-8,-36]],F('#3a3040'),.3,.4);poly([[9,-44],[18,-47],[14,-38],[8,-36]],F('#3a3040'),.3,.4);
  limb(-8,-40,-12,-28,4.4,3.6,F('#2a2230'));limb(8,-40,13,-30,4.4,3.6,F('#2a2230'));
  const up=tele?-12:0;g.strokeStyle='#a08a50';g.lineWidth=1.6;g.beginPath();g.moveTo(14,-14+up*.2);g.lineTo(14,-52);g.stroke();
  g.strokeStyle='#c8a85a';g.lineWidth=1;g.beginPath();g.arc(14,-56,3.4,.4,5.9);g.stroke();glow(14,-56,12,'#9a60ff',.7);
  // cabeça-vórtice
  g.fillStyle='#07030c';g.beginPath();g.arc(0,-52,8.6,0,6.283);g.fill();
  const vg=g.createRadialGradient(0,-52,1,0,-52,10);vg.addColorStop(0,'rgba(255,58,90,.9)');vg.addColorStop(.3,'rgba(90,20,70,.9)');vg.addColorStop(1,'rgba(30,8,50,0)');g.fillStyle=vg;g.beginPath();g.arc(0,-52,10.4,0,6.283);g.fill();
  g.strokeStyle='rgba(190,60,110,.8)';g.lineWidth=1;for(let i=0;i<3;i++){g.beginPath();g.arc(0,-52,3+i*2.4,t*(1.4+i*.3)+i,t*(1.4+i*.3)+i+3.8);g.stroke()}
  g.fillStyle='#ff3a5a';g.beginPath();g.arc(0,-52,2,0,6.283);g.fill();glow(0,-52,18,'#ff3a5a',.7);
  for(let i=0;i<7;i++){const a=t*.9+i*.9,rr=14+(i%2)*4;poly([[Math.cos(a)*rr-1,-52+Math.sin(a)*rr*.5-2],[Math.cos(a)*rr+2,-52+Math.sin(a)*rr*.5],[Math.cos(a)*rr-1,-52+Math.sin(a)*rr*.5+3]],F('#5a3a6a'))}
  g.restore();
  for(let i=0;i<6;i++){const a=t*.6+i*1.05;poly([[Math.cos(a)*16-3,Math.sin(a)*2-1],[Math.cos(a)*16+4,Math.sin(a)*2],[Math.cos(a)*16-2,Math.sin(a)*2+3]],F('#1a1020'))}}
];
function drawBossArt(b,cx,cy,sc,flip){
  const k=b.d?REG[L.r].lord:b;const idx=L.r;
  const F=c=>b.flash>0?'#ffffff':c;
  const tele=(b.st==='slash'&&b.sw&&b.t<22)||(b.st==='dash'&&b.t<26)||b.st==='leap'&&b.t<3;
  g.save();g.translate(cx,cy);g.scale(flip*sc,sc);
  BOSSART[idx](b,F,tele,(frame*.06)+0);
  g.restore();
}

/* ---------- estado salvo ---------- */
const SAVEKEY='noctaria_save_v1';
function newState(){return{hp:70,mp:30,maxHp:70,maxMp:30,lvl:1,xp:0,coins:0,pots:2,wpn:0,wpns:[0],spell:0,spells:[0],fam:0,seen:{},ab:{dj:0,dash:0,wall:0,glide:0,ice:0,fire:0},dead:[],chests:{},altars:{'0:0':1},cur:{r:0,i:0},time:0,intro:0}}
let S=newState();
function saveGame(){try{localStorage.setItem(SAVEKEY,JSON.stringify(S))}catch(e){}}
function loadGame(){try{const s=localStorage.getItem(SAVEKEY);if(!s)return false;const o=JSON.parse(s);S=Object.assign(newState(),o);S.ab=Object.assign(newState().ab,o.ab);if(!S.wpns||!S.wpns.length)S.wpns=[0];if(!S.wpns.includes(S.wpn))S.wpn=S.wpns[0];if(!S.spells)S.spells=[0];if(!S.seen)S.seen={};return true}catch(e){return false}}
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
  lv.candles=[];lv.torches=[];lv.lights=[];
  for(let a=6;a<lv.Wt-6;a++){
    let sy=-1;for(let b=6;b<HT;b++){const v=grid[b*MAXW+a];if(v===1){sy=b;break}if(v===2)break}
    if(sy<2)continue;const inC=a*T>=lv.castle.x0,h2=hash(a*53+r*701);
    if(h2<(inC?.05:.028)&&grid[(sy-1)*MAXW+a]===0&&grid[(sy-2)*MAXW+a]===0&&a>14)lv.candles.push({x:a*T+8,y:sy*T,alive:true});
    if(inC&&a%11===3&&sy>=10)lv.torches.push({x:a*T+8,y:(sy-7)*T});
  }
  lv.altars.forEach(al=>lv.lights.push({x:al.x,y:al.y-20,r:60,col:'#38e0a0'}));
  lv.lights.push({x:lv.portal.x,y:lv.portal.y-18,r:70,col:'#4fd0ff'});
  lv.torches.forEach(t=>lv.lights.push({x:t.x,y:t.y,r:64,col:'#ffb04f'}));
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
const atkPow=()=>Math.round(WPN[S.wpn].dmg+S.lvl*1.7+(S.ab.ice?3:0));
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
function mkPlayer(x,y){return{x:x-5,y:y-18,w:10,h:18,vx:0,vy:0,face:1,ground:false,coy:0,jbuf:0,dj:false,adash:false,dash:0,dashDir:1,dcool:0,atk:0,acool:0,hit:new Set(),inv:0,wall:0,kick:0,kvx:0,mcool:0,drop:0,safe:{x:x-5,y:y-18},rest:0,ph:0,bd:0,atkDur:14}}
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
  pl=mkPlayer(sp.x,sp.y);pick=[];initFam();
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
  shake=7;freeze=4;sfx('hurt');puff(pl.x+5,pl.y+9,'#ff5a6a',8,2);
  pop.push({x:pl.x,y:pl.y-6,t:30,s:'-'+dmg,c:'#ff8a8a'});
  if(S.hp<=0){S.hp=0;mode='dead';menu={i:0};sfx('boss')}
}
function gainXp(n){
  S.xp+=n;
  while(S.xp>=need()){S.xp-=need();S.lvl++;S.maxHp+=7;S.maxMp+=2;S.hp=Math.min(S.maxHp,S.hp+20);toast('Nível '+S.lvl+'!');sfx('lvl')}
}
function hitEnemy(e,dmg,kx){
  e.hp-=dmg;e.flash=8;e.vx=kx*(WPN[S.wpn].kb||1.8);freeze=Math.max(freeze,e.hp<=0?5:2);
  puff(e.x+e.w/2,e.y+e.h/2,e.d?e.d.c2:'#fff',5);sfx('hit');
  pop.push({x:e.x,y:e.y-6,t:24,s:''+dmg,c:'#fff'});
  if(e.hp<=0&&e.alive){
    e.alive=false;
    if(e.d){gainXp(e.d.xp);dropLoot(e.x+e.w/2,e.y+e.h/2,1)}
    
    puff(e.x+e.w/2,e.y+e.h/2,e.d?e.d.c:'#fff',14,2.2);sfx('coin');
  }
}
function shootAt(x,y,tx,ty,spd,dmg,col){
  const a=Math.atan2(ty-y,tx-x);
  proj.push({x:x-3,y:y-3,w:6,h:6,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,pl:0,life:140,col});
}
function swordBox(){
  const wp=WPN[S.wpn],len=wp.reach+(S.ab.ice?3:0);
  return{x:pl.face>0?pl.x+pl.w-2:pl.x-len+2,y:wp.style==='spear'?pl.y+4:pl.y-(wp.style==='great'?8:3),w:len,h:wp.style==='spear'?8:pl.h+(wp.style==='great'?16:6)};
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
  if(dirIn&&p.atk<=0&&p.kick<=0&&p.bd<=0)p.face=dirIn;
  const wantBack=P('dash')&&p.ground&&p.dcool<=0&&p.dash<=0&&p.bd<=0&&(keys.down||!S.ab.dash);
  if(wantBack){p.bd=11;p.dcool=26;p.inv=Math.max(p.inv,14);sfx('dash');puff(p.x+5,p.y+9,'#4fd0ff',8,1.6)}
  if(P('dash')&&S.ab.dash&&!wantBack&&p.bd<=0&&p.dcool<=0&&p.dash<=0&&(p.ground||!p.adash)){
    p.dash=13;p.dcool=34;if(!p.ground)p.adash=true;p.dashDir=dirIn||p.face;p.face=p.dashDir;sfx('dash');
    puff(p.x+5,p.y+9,'#4fd0ff',8,1.6);
  }
  if(p.dash>0){p.dash--;p.vx=p.dashDir*5;p.vy=0;if(p.dash%3===0)puff(p.x+5,p.y+9,'#4fd0ff',1,.4)}
  else if(p.bd>0){p.bd--;p.vx=-p.face*3.3;p.vy+=.38;if(p.vy>7.5)p.vy=7.5}
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
  const WP=WPN[S.wpn];
  if(P('atk')&&p.acool<=0&&p.dash<=0&&p.bd<=0){p.atk=WP.dur;p.atkDur=WP.dur;p.acool=WP.cool;p.hit=new Set();sfx('atk')}
  if(p.atk>0){
    p.atk--;
    if(WP.dur-p.atk>=WP.from&&WP.dur-p.atk<=WP.to){
      const sb=swordBox();hitCandles(sb);
      ens.forEach(e=>{if(e.alive&&!p.hit.has(e)&&ov(sb,e)){p.hit.add(e);hitEnemy(e,atkPow(),p.face)}});
      if(boss&&boss.act&&boss.alive&&boss.vis&&!p.hit.has(boss)&&ov(sb,boss)){p.hit.add(boss);hitBoss(atkPow())}
      proj.forEach(q=>{if(!q.pl&&ov(sb,q)){q.life=0;puff(q.x,q.y,q.col,4)}});
    }
  }
  if(P('mag'))castSpell();
  if(false){
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
  const b=boss;b.hp-=dmg;b.flash=6;freeze=Math.max(freeze,2);sfx('hit');
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
    bossRewards(b);
    if(rel==='fire'){S.maxMp+=20;S.mp=S.maxMp}
    portal={x:L.portal.x,y:L.portal.y};
    saveGame();sfx('pick');
    say([{who:'Kaelen',port:'kaelen',t:b.d.name+' caiu.'},{who:'Poder obtido',t:RELIC[rel][0]+'. '+RELIC[rel][1]},...rewardLines,{who:'Elara',port:'elara',t:'O portal do castelo se abriu, Kaelen. Siga em frente.'}]);
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
      hitCandles(q);ens.forEach(e=>{if(e.alive&&q.life>0&&ov(q,e)&&!(q.hs&&q.hs.has(e))){hitEnemy(e,q.dmg,Math.sign(q.vx));if(q.pierce)(q.hs=q.hs||new Set()).add(e);else q.life=0}});
      if(boss&&boss.act&&boss.alive&&boss.vis&&q.life>0&&ov(q,boss)){if(!q.pierce||!(q.hs&&q.hs.has(boss))){hitBoss(q.dmg);if(q.pierce)(q.hs=q.hs||new Set()).add(boss);else q.life=0}}
    }else if(ov(q,pl)){hurt(q.dmg,q.x);q.life=0}
    if(q.life<=0)puff(q.x,q.y,q.col,3,1);
  });
  proj=proj.filter(q=>q.life>0);
}

/* ====== EXTRAS ESTILO SotN ====== */
let freeze=0,pick=[],fam=null,rewardLines=[];const novas=[];
function initFam(){fam=S.fam?{x:pl.x,y:pl.y-20,cd:60,ph:0}:null}
function mkPick(x,y,k,v){return{x,y,vx:rnd(-1.3,1.3),vy:-3.2,k,v,t:900}}
function dropLoot(x,y,m){
  const n=Math.random()<.45?2:1;
  for(let i=0;i<n;i++)if(Math.random()<.75*m)pick.push(mkPick(x,y,'coin',Math.round(2+Math.random()*4+L.r*2)));
  const r=Math.random();
  if(r<.14*m)pick.push(mkPick(x,y,'mp',6));else if(r<.22*m)pick.push(mkPick(x,y,'hp',12+L.r*3));else if(r<.245*m)pick.push(mkPick(x,y,'pot',1));
}
function collect(p){
  if(p.k==='coin'){S.coins+=p.v;sfx('coin')}else if(p.k==='mp'){S.mp=Math.min(S.maxMp,S.mp+p.v);sfx('coin')}
  else if(p.k==='hp'){S.hp=Math.min(S.maxHp,S.hp+p.v);sfx('coin')}else{S.pots++;toast('Poção de Éter');sfx('pick')}
  pop.push({x:p.x-4,y:p.y-6,t:22,s:p.k==='coin'?'+'+p.v:p.k==='pot'?'+1':'+'+p.v,c:p.k==='coin'?'#ffd070':p.k==='mp'?'#7fd0ff':p.k==='hp'?'#ff9a9a':'#9affd0'});
}
function updPicks(){
  pick.forEach(p=>{
    p.t--;p.vy+=.25;if(p.vy>5)p.vy=5;p.x+=p.vx;p.y+=p.vy;
    const gy=Math.floor((p.y+4)/T),tv=tile(Math.floor(p.x/T),gy);
    if(p.vy>=0&&(tv===1||tv===2)){p.y=gy*T-4;p.vy=-p.vy*.35;if(Math.abs(p.vy)<.8)p.vy=0;p.vx*=.7}
    if(tile(Math.floor((p.x+Math.sign(p.vx)*3)/T),Math.floor(p.y/T))===1)p.vx*=-.5;
    const dx=pl.x+5-p.x,dy=pl.y+9-p.y,d=Math.hypot(dx,dy);
    if(d<48&&p.t<860){p.x+=dx/d*1.7;p.y+=dy/d*1.7;p.vy=0}
    if(d<9){collect(p);p.t=0}
    if(p.y>HT*T)p.t=0;
  });
  pick=pick.filter(p=>p.t>0);
}
function hitCandles(b){
  L.candles.forEach(c=>{if(c.alive&&b.x<c.x+5&&b.x+b.w>c.x-5&&b.y<c.y&&b.y+b.h>c.y-14){c.alive=false;puff(c.x,c.y-8,'#ffb04f',10,1.6);sfx('hit');dropLoot(c.x,c.y-10,1.7)}});
}
function castSpell(){
  const sp=SPELL[S.spell],p=pl;if(p.mcool>0||S.mp<sp.mp)return;
  S.mp-=sp.mp;p.mcool=22;sfx('mag');
  if(S.spell===0)proj.push({x:p.x+(p.face>0?p.w:-8),y:p.y+6,w:8,h:6,vx:p.face*4.4,vy:0,dmg:magPow(),pl:1,life:70,col:S.ab.fire?'#ffb04f':'#4fd0ff'});
  else if(S.spell===1)proj.push({x:p.x+(p.face>0?p.w:-16),y:p.y+4,w:16,h:8,vx:p.face*6,vy:0,dmg:Math.round(magPow()*1.5),pl:1,life:60,col:'#38e0a0',pierce:1});
  else{
    shake=10;freeze=3;puff(p.x+5,p.y+9,'#4fd0ff',30,3.6);const dm=Math.round(magPow()*1.7),cx=p.x+5,cy=p.y+9;
    ens.forEach(e=>{if(e.alive&&Math.hypot(e.x+e.w/2-cx,e.y+e.h/2-cy)<64)hitEnemy(e,dm,Math.sign(e.x-p.x)||1)});
    if(boss&&boss.act&&boss.alive&&boss.vis&&Math.hypot(boss.x+boss.w/2-cx,boss.y+boss.h/2-cy)<72)hitBoss(dm);
    L.candles.forEach(c=>{if(c.alive&&Math.hypot(c.x-cx,c.y-cy)<64)hitCandles({x:c.x-2,y:c.y-4,w:4,h:4})});
    proj.forEach(q=>{if(!q.pl&&Math.hypot(q.x-cx,q.y-cy)<64)q.life=0});
    novas.push({x:cx,y:cy,t:0});
  }
}
function updFam(){
  if(!fam)return;
  fam.ph+=.05;const tx=pl.x+5-pl.face*14,ty=pl.y-6+Math.sin(fam.ph*1.7)*4;
  fam.x+=(tx-fam.x)*.07;fam.y+=(ty-fam.y)*.07;fam.cd--;
  if(fam.cd>0)return;
  let best=null,bd=150;
  ens.forEach(e=>{if(!e.alive)return;const d=Math.hypot(e.x+e.w/2-fam.x,e.y+e.h/2-fam.y);if(d<bd){bd=d;best=e}});
  if(boss&&boss.act&&boss.alive&&boss.vis){const d=Math.hypot(boss.x+boss.w/2-fam.x,boss.y+boss.h/2-fam.y);if(d<bd){bd=d;best=boss}}
  if(best){const a=Math.atan2(best.y+best.h/2-fam.y,best.x+best.w/2-fam.x);proj.push({x:fam.x-2,y:fam.y-2,w:5,h:5,vx:Math.cos(a)*3.4,vy:Math.sin(a)*3.4,dmg:3+Math.round(S.lvl*.8),pl:1,life:60,col:'#9affd0'});fam.cd=62}else fam.cd=10;
}
function bossRewards(b){
  rewardLines=[];const dw=b.d.drop,r=L.r;
  if(dw>=0&&!S.wpns.includes(dw)){S.wpns.push(dw);rewardLines.push({who:'Arma obtida',t:WPN[dw].n+'. Abra o equipamento com I.'})}
  if(r===0&&!S.fam){S.fam=1;initFam();rewardLines.push({who:'Elara',port:'elara',t:'Leve o Eco comigo, Kaelen. Ele ataca quem chegar perto de você.'})}
  if(r===1&&!S.spells.includes(1)){S.spells.push(1);rewardLines.push({who:'Magia aprendida',t:'Lança de Éter. Troque de magia com R.'})}
  if(r===3&&!S.spells.includes(2)){S.spells.push(2);rewardLines.push({who:'Magia aprendida',t:'Nova Etérea. Troque de magia com R.'})}
}
function markSeen(){
  const cx=Math.floor((pl.x+5)/(20*T)),cy=Math.floor((pl.y+9)/(11*T)),k=L.r+':'+cx+','+cy;
  if(!S.seen[k]){S.seen[k]=1}
}

/* ====== RENDER DO MUNDO ====== */
const BGI={};['village','forest','cave','arch','forge','citadel'].forEach(k=>{const i=new Image();i.src='assets/bg_'+k+'.jpg';BGI[k]=i});
const BGMAP=['village','forest','cave','forest','arch','forge','citadel'];
const TINT=['rgba(30,40,90,.22)','rgba(10,70,40,.30)','rgba(30,30,110,.22)','rgba(100,120,10,.38)','rgba(110,170,255,.30)','rgba(255,90,20,.26)','rgba(120,30,130,.30)'];
const AMB=[.30,.34,.46,.40,.28,.34,.48];
const LC=document.createElement('canvas');LC.width=SW;LC.height=SH;const lg2=LC.getContext('2d');
const TS=T*SC;
function mkTile(fn){const c=document.createElement('canvas');c.width=c.height=TS;fn(c.getContext('2d'));return c}
function makeTiles(r){
  const R=REG[r],[base,top,dk]=R.tile,out={fill:[],top:[],cfill:[],ctop:[],plat:null,spike:null};
  const brick=(x,col,hh,castle)=>{
    const gr=x.createLinearGradient(0,0,TS,TS);gr.addColorStop(0,mixc(col,'#ffffff',.08));gr.addColorStop(1,mixc(col,'#000000',.35));x.fillStyle=gr;x.fillRect(0,0,TS,TS);
    x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=2;const off=hh>.5?TS/2:TS/3;
    x.beginPath();x.moveTo(0,TS/2);x.lineTo(TS,TS/2);x.moveTo(off,0);x.lineTo(off,TS/2);x.moveTo(TS-off,TS/2);x.lineTo(TS-off,TS);x.stroke();
    x.strokeStyle='rgba(255,255,255,.07)';x.beginPath();x.moveTo(0,TS/2+2);x.lineTo(TS,TS/2+2);x.moveTo(0,2);x.lineTo(TS,2);x.stroke();
    for(let i=0;i<14;i++){x.fillStyle='rgba('+(hh>.3?'0,0,0':'255,255,255')+','+(.05+Math.random()*.07)+')';x.fillRect(Math.random()*TS,Math.random()*TS,2+Math.random()*4,1+Math.random()*3)}
    if(castle&&hh>.62){x.strokeStyle='rgba(79,208,255,.55)';x.lineWidth=2;x.beginPath();x.moveTo(5,TS*.75);x.lineTo(TS-5,TS*.75);x.stroke()}
    if(hh>.8){x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=1.5;x.beginPath();x.moveTo(TS*.3,TS*.55);x.lineTo(TS*.4,TS*.7);x.lineTo(TS*.34,TS*.9);x.stroke()}
  };
  const topDeco=(x,deco,hh)=>{
    const g1=x.createLinearGradient(0,0,0,16);g1.addColorStop(0,mixc(top,'#ffffff',.25));g1.addColorStop(1,top);x.fillStyle=g1;x.fillRect(0,0,TS,14);
    x.fillStyle='rgba(0,0,0,.28)';x.fillRect(0,14,TS,3);
    x.fillStyle='rgba(255,255,255,.35)';x.fillRect(0,0,TS,2);
    if(deco==='floresta'||deco==='pantano'){x.fillStyle=mixc(top,'#9aff8a',.2);for(let i=0;i<9;i++){const bx=i*5.4+hh*3;x.beginPath();x.moveTo(bx,6);x.lineTo(bx+2,-2-Math.random()*5+4);x.lineTo(bx+4,6);x.fill()}}
    if(deco==='gelo'){x.fillStyle='#ffffff';x.beginPath();x.moveTo(0,10);for(let i=0;i<=6;i++)x.lineTo(i*8,14+((i*7+hh*9)%7));x.lineTo(TS,10);x.lineTo(TS,0);x.lineTo(0,0);x.fill()}
    if(deco==='vulcao'){x.strokeStyle='#ffb04f';x.lineWidth=2;x.beginPath();x.moveTo(8,18);x.lineTo(16,28);x.lineTo(24,22);x.stroke();x.fillStyle='rgba(255,140,50,.4)';x.fillRect(0,14,TS,3)}
    if(deco==='caverna'){for(let i=0;i<3;i++){x.fillStyle='rgba(79,208,255,.8)';x.beginPath();x.moveTo(6+i*15,2);x.lineTo(10+i*15,-8-hh*6+6);x.lineTo(14+i*15,2);x.fill()}}
    if(deco==='vila'||deco==='cidadela'){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=1.5;for(let i=0;i<3;i++){x.beginPath();x.moveTo(i*16+4,0);x.lineTo(i*16+4,14);x.stroke()}}
  };
  for(let v=0;v<4;v++){
    out.fill.push(mkTile(x=>brick(x,base,hash(v*17+r),false)));
    out.top.push(mkTile(x=>{brick(x,base,hash(v*17+r+9),false);topDeco(x,R.deco,hash(v*31+r))}));
    out.cfill.push(mkTile(x=>brick(x,'#2b2740',hash(v*13+r),true)));
    out.ctop.push(mkTile(x=>{brick(x,'#2b2740',hash(v*13+r+4),true);const g1=x.createLinearGradient(0,0,0,12);g1.addColorStop(0,'#6a6290');g1.addColorStop(1,'#3a3458');x.fillStyle=g1;x.fillRect(0,0,TS,12);x.fillStyle='rgba(79,208,255,.7)';x.fillRect(0,0,TS,2)}));
  }
  out.plat=mkTile(x=>{x.fillStyle='#14111f';x.fillRect(0,0,TS,12);const g1=x.createLinearGradient(0,0,0,12);g1.addColorStop(0,'#6a7080');g1.addColorStop(1,'#242030');x.fillStyle=g1;x.fillRect(0,0,TS,10);x.fillStyle='#4fd0ff';x.fillRect(0,0,TS,2);x.fillStyle='rgba(0,0,0,.5)';for(let i=0;i<5;i++)x.fillRect(4+i*9,4,4,5)});
  out.spike=mkTile(x=>{x.fillStyle=mixc(base,'#000000',.4);x.fillRect(0,TS-9,TS,9);for(let k=0;k<3;k++){const bx=k*16;const g1=x.createLinearGradient(bx,0,bx+16,0);g1.addColorStop(0,'#e8eef4');g1.addColorStop(1,'#6a7280');x.fillStyle=g1;x.beginPath();x.moveTo(bx+1,TS-9);x.lineTo(bx+8,8);x.lineTo(bx+15,TS-9);x.fill();x.fillStyle='rgba(79,208,255,.8)';x.fillRect(bx+7,8,2,5)}});
  return out;
}
function drawTiles(){
  if(!L.ts)L.ts=makeTiles(L.r);
  const T0=L.ts,x0=Math.max(0,Math.floor(cam.x/T)-1),x1=Math.min(L.Wt,Math.ceil((cam.x+W)/T)+1),y0=Math.max(0,Math.floor(cam.y/T)-1),y1=Math.min(HT,Math.ceil((cam.y+H)/T)+1),cx0=L.castle.x0/T;
  for(let ty=y0;ty<y1;ty++)for(let tx=x0;tx<x1;tx++){
    const v=L.grid[ty*MAXW+tx];if(!v)continue;
    const vi=Math.floor(hash(tx*7+ty*13+L.r)*4),cs=tx>=cx0;
    if(v===1){const ex=tile(tx,ty-1)!==1;g.drawImage(cs?(ex?T0.ctop[vi]:T0.cfill[vi]):(ex?T0.top[vi]:T0.fill[vi]),tx*T,ty*T,T,T);
      if(tile(tx,ty+1)===0&&tile(tx,ty)===1&&ty>2){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(tx*T,ty*T+T-3,T,3)}}
    else if(v===2)g.drawImage(T0.plat,tx*T,ty*T,T,T);
    else if(v===3)g.drawImage(T0.spike,tx*T,ty*T,T,T);
  }
}
function fogBlob(x,y,r,a){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(150,160,200,'+a+')');gr.addColorStop(1,'rgba(150,160,200,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
function drawBG(){
  const R=REG[L.r],inC=cam.x+W/2>L.castle.x0+T*2;
  const gr=g.createLinearGradient(0,0,0,SH);gr.addColorStop(0,R.sky[0]);gr.addColorStop(.6,R.sky[1]);gr.addColorStop(1,R.sky[2]);g.fillStyle=gr;g.fillRect(0,0,SW,SH);
  const img=BGI[BGMAP[L.r]];
  if(img&&img.complete&&img.naturalWidth){
    const w=img.naturalWidth*(SH/img.naturalHeight),oy=-Math.min(1,cam.y/(HT*T-H))*28;let ox=-((cam.x*SC*.2)%w);if(ox>0)ox-=w;
    g.globalAlpha=inC?.5:.95;for(let x=ox;x<SW;x+=w)g.drawImage(img,x,oy,w,SH+30);g.globalAlpha=1;
  }
  g.fillStyle=TINT[L.r];g.fillRect(0,0,SW,SH);
  // luzes em feixe
  g.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const bx=((i*340+120-cam.x*SC*.3)%1100+1100)%1100-100;const lgp=g.createLinearGradient(bx,0,bx+160,SH);lgp.addColorStop(0,'rgba(180,200,255,.07)');lgp.addColorStop(1,'rgba(180,200,255,0)');g.fillStyle=lgp;g.beginPath();g.moveTo(bx,0);g.lineTo(bx+70,0);g.lineTo(bx+250,SH);g.lineTo(bx+60,SH);g.fill()}g.globalCompositeOperation='source-over';
  if(inC){
    g.fillStyle='rgba(6,4,14,.5)';g.fillRect(0,0,SW,SH);
    const aw=420,ox2=-((cam.x*SC*.45)%aw);
    for(let x=ox2-aw;x<SW+aw;x+=aw){
      g.fillStyle='#0a0814';g.fillRect(x+aw-30,0,60,SH);const cg=g.createLinearGradient(x+aw-30,0,x+aw+30,0);cg.addColorStop(0,'#2a2440');cg.addColorStop(.5,'#0a0814');cg.addColorStop(1,'#1c1830');g.fillStyle=cg;g.fillRect(x+aw-30,0,60,SH);
      g.beginPath();g.moveTo(x+60,SH);g.lineTo(x+60,250);g.quadraticCurveTo(x+aw/2,40,x+aw-60,250);g.lineTo(x+aw-60,SH);g.closePath();
      const wg=g.createLinearGradient(0,60,0,SH);wg.addColorStop(0,'rgba(79,208,255,.20)');wg.addColorStop(1,'rgba(79,208,255,0)');g.fillStyle=wg;g.fill();g.strokeStyle='rgba(120,110,170,.6)';g.lineWidth=5;g.stroke();
      g.strokeStyle='rgba(79,208,255,.18)';g.lineWidth=2;for(let k=1;k<4;k++){g.beginPath();g.moveTo(x+60+k*(aw-120)/4,100);g.lineTo(x+60+k*(aw-120)/4,SH);g.stroke()}
    }
    g.strokeStyle='rgba(79,208,255,.35)';g.lineWidth=5;for(let k=0;k<2;k++){const py=120+k*180-(cam.y*SC*.2%80);g.beginPath();g.moveTo(0,py);g.lineTo(SW,py);g.stroke();g.strokeStyle='rgba(200,160,90,.5)';g.lineWidth=2;for(let jx=-((cam.x*SC*.45)%140);jx<SW;jx+=140){g.beginPath();g.arc(jx,py,5,0,6.283);g.stroke()}g.strokeStyle='rgba(79,208,255,.35)';g.lineWidth=5}
  }
  for(let k=0;k<5;k++){const fx=((k*260-cam.x*SC*(.3+k*.04)-frame*(.2+k*.05))%1400+1400)%1400-200;fogBlob(fx,SH*.72+Math.sin(frame*.01+k)*20,230,.12)}
  for(let i=0;i<22;i++){const mx=((hash(i*3+L.r)*SW*1.5-cam.x*SC*.25-frame*.2*(hash(i)-.3))%SW+SW)%SW,my=(hash(i*7+1)*SH+Math.sin(frame*.02+i)*12+SH)%SH;g.fillStyle=i%2?'rgba(79,208,255,.5)':'rgba(56,224,160,.5)';g.globalAlpha=.3+.3*Math.sin(frame*.05+i);g.fillRect(mx,my,3,3)}
  g.globalAlpha=1;
}
function drawLightMask(){
  const castle=cam.x+W/2>L.castle.x0+T*2,a=castle?AMB[L.r]+.18:AMB[L.r];
  lg2.globalCompositeOperation='source-over';lg2.clearRect(0,0,SW,SH);lg2.fillStyle='rgba(5,4,14,'+Math.min(.82,a+.2)+')';lg2.fillRect(0,0,SW,SH);
  lg2.globalCompositeOperation='destination-out';
  const cut=(x,y,r,k=1)=>{const sx=(x-cam.x)*SC,sy=(y-cam.y)*SC,rr=r*SC;if(sx<-rr||sx>SW+rr||sy<-rr||sy>SH+rr)return;const gr=lg2.createRadialGradient(sx,sy,rr*.08,sx,sy,rr);gr.addColorStop(0,'rgba(0,0,0,'+k+')');gr.addColorStop(.6,'rgba(0,0,0,'+k*.45+')');gr.addColorStop(1,'rgba(0,0,0,0)');lg2.fillStyle=gr;lg2.beginPath();lg2.arc(sx,sy,rr,0,6.283);lg2.fill()};
  cut(pl.x+5,pl.y+8,92,1);
  L.lights.forEach(l=>cut(l.x,l.y,l.r,.9));
  L.candles.forEach(c=>{if(c.alive)cut(c.x,c.y-10,30,.7)});
  proj.forEach(q=>cut(q.x+q.w/2,q.y+q.h/2,26,.9));
  if(fam)cut(fam.x,fam.y,34,.8);
  if(boss&&boss.alive&&boss.act)cut(boss.x+boss.w/2,boss.y+boss.h/2,110,.9);
  ens.forEach(e=>{if(e.alive)cut(e.x+e.w/2,e.y+e.h/2,24,.5)});
  g.setTransform(1,0,0,1,0,0);g.drawImage(LC,0,0);
}
function drawWorldObjects(){
  L.torches.forEach(t=>{const x=t.x,y=t.y;if(x<cam.x-20||x>cam.x+W+20)return;
    g.fillStyle='#3a3020';g.fillRect(x-1,y,2,6);poly([[x-3.5,y-1],[x+3.5,y-1],[x+2,y+3],[x-2,y+3]],'#8a6a3a');
    const fl=Math.sin(frame*.3+x)*.6;poly([[x-2,y-1],[x+2,y-1],[x+fl,y-8]],'#ffb04f',.4,.1);glow(x,y-3,16,'#ffb04f',.65)});
  L.candles.forEach(c=>{if(!c.alive)return;const x=c.x,y=c.y;if(x<cam.x-20||x>cam.x+W+20)return;
    g.fillStyle='#2a2438';g.fillRect(x-.8,y-9,1.6,9);poly([[x-4,y],[x+4,y],[x+2.4,y-2.6],[x-2.4,y-2.6]],'#4a4660');
    poly([[x-3,y-10],[x+3,y-10],[x+2,y-8],[x-2,y-8]],'#8a6a3a');const fl=Math.sin(frame*.35+x)*.7;poly([[x-1.4,y-10],[x+1.4,y-10],[x+fl,y-16]],'#ffd070',.4,.1);glow(x,y-12,14,'#ffb04f',.7)});
  L.altars.forEach(a=>{const x=a.x,y=a.y,on=S.altars[L.r+':'+a.i];if(x<cam.x-30||x>cam.x+W+30)return;
    poly([[x-9,y],[x+9,y],[x+7,y-5],[x-7,y-5]],'#4a4666');poly([[x-6,y-5],[x+6,y-5],[x+4,y-11],[x-4,y-11]],'#5a5678');
    const fl=Math.sin(frame*.06)*2.4,c=on?'#38e0a0':'#4fd0ff';crys(x,y-12+fl,13,6,c);glow(x,y-20+fl,26,c,.55);
    g.strokeStyle=rgba(c,.5);g.lineWidth=.8;g.beginPath();g.ellipse(x,y-2,10,2.4,0,0,6.283);g.stroke()});
  L.npcs.forEach(n=>{if(n.x<cam.x-30||n.x>cam.x+W+30)return;drawElara(n.x,n.y)});
  L.chests.forEach(c=>{const x=c.x,y=c.y;if(x<cam.x-20||x>cam.x+W+20)return;
    poly([[x,y+4],[x+16,y+4],[x+16,y+12],[x,y+12]],'#5a3a24',.2,.5);
    if(c.open){poly([[x,y+4],[x+16,y+4],[x+14,y-2],[x+2,y-2]],'#4a2e1c');glow(x+8,y+3,12,'#4fd0ff',.6)}else{poly([[x,y+4],[x+16,y+4],[x+16,y+1],[x+13,y-2],[x+3,y-2],[x,y+1]],'#6a4a30',.3,.4);g.fillStyle='#4fd0ff';g.fillRect(x+7,y+2,2,3);glow(x+8,y+4,9,'#4fd0ff',.5)}
    g.fillStyle='#8a929e';g.fillRect(x,y+7,16,1.4);g.fillRect(x+2,y-2,1.4,14);g.fillRect(x+12.6,y-2,1.4,14)});
  L.doors.forEach(d=>{if(d.x<cam.x-30||d.x>cam.x+W+30)return;g.fillStyle='#07050d';g.beginPath();g.moveTo(d.x-8,d.y);g.lineTo(d.x-8,d.y-22);g.arc(d.x,d.y-22,8,Math.PI,0);g.lineTo(d.x+8,d.y);g.fill();g.strokeStyle='rgba(79,208,255,.8)';g.lineWidth=1.2;g.stroke();glow(d.x,d.y-14,18,'#4fd0ff',.3)});
  if(portal){const x=portal.x,y=portal.y;glow(x,y-18,40,'#4fd0ff',.55);for(let i=0;i<4;i++){g.strokeStyle=rgba(i%2?'#38e0a0':'#4fd0ff',.85-.15*i);g.lineWidth=1.8;g.beginPath();g.ellipse(x,y-18,9+i*2.6+Math.sin(frame*.08+i)*1.4,22-i*2.6,0,frame*.01*i,6.283+frame*.01*i);g.stroke()}
    for(let i=0;i<6;i++){const a=frame*.06+i*1.05;glow(x+Math.cos(a)*10,y-18+Math.sin(a)*18,4,'#b8f0ff',.7)}}
  if(boss&&boss.act){const a=L.arena.plug,x=a.x*T,y=a.y0*T,h=(a.y1-a.y0+1)*T,gr=g.createLinearGradient(x,0,x+T,0);gr.addColorStop(0,'rgba(154,96,255,.9)');gr.addColorStop(1,'rgba(79,208,255,.7)');g.fillStyle=gr;g.fillRect(x,y,T,h);glow(x+8,y+h/2,60,'#9a60ff',.4)}
}
function drawPicks(){pick.forEach(p=>{const bob=Math.sin(frame*.15+p.x)*1;
  if(p.k==='coin'){orb(p.x,p.y+bob,3.2,3.2,'#e8c36a',.5);glow(p.x,p.y,8,'#ffd070',.5)}
  else if(p.k==='mp'){orb(p.x,p.y+bob,3,3,'#3a8ae8',.5);glow(p.x,p.y,10,'#4fd0ff',.6)}
  else if(p.k==='hp'){orb(p.x,p.y+bob,3.2,3.2,'#d8454f',.5);glow(p.x,p.y,10,'#ff6a6a',.6)}
  else{poly([[p.x-2,p.y-4],[p.x+2,p.y-4],[p.x+3,p.y+3],[p.x-3,p.y+3]],'#5affb0');glow(p.x,p.y,10,'#7dffb8',.6)}})}
function drawFx(){
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;glow(p.x,p.y,p.s*2.6,p.col,Math.min(.9,p.life/16))});parts=parts.filter(p=>p.life>0);
  novas.forEach(n=>{n.t++;const r=n.t*3.2;g.strokeStyle=rgba('#4fd0ff',Math.max(0,1-n.t/20));g.lineWidth=3;g.beginPath();g.arc(n.x,n.y,r,0,6.283);g.stroke();glow(n.x,n.y,r,'#4fd0ff',.25*(1-n.t/20))});
  for(let i=novas.length-1;i>=0;i--)if(novas[i].t>20)novas.splice(i,1);
  proj.forEach(q=>{const cx=q.x+q.w/2,cy=q.y+q.h/2;glow(cx,cy,q.w*2.2,q.col,.8);const gr=g.createRadialGradient(cx,cy,0,cx,cy,q.w*.9);gr.addColorStop(0,'#fff');gr.addColorStop(1,q.col);g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy,q.w*.62,q.h*.6,0,0,6.283);g.fill();
    if(q.pl&&Math.abs(q.vx)>0){g.strokeStyle=rgba(q.col,.4);g.lineWidth=q.h*.6;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx-q.vx*3.4,cy);g.stroke()}});
  g.font='bold 7px Spectral,Georgia,serif';g.textAlign='center';
  pop.forEach(p=>{p.t--;p.y-=.45;g.fillStyle='rgba(0,0,0,.6)';g.fillText(p.s,p.x+5.4,p.y+.6);g.fillStyle=p.c;g.globalAlpha=Math.min(1,p.t/12);g.fillText(p.s,p.x+5,p.y);g.globalAlpha=1});pop=pop.filter(p=>p.t>0);
}
function drawFam(){if(!fam)return;const x=fam.x,y=fam.y;for(let i=4;i>0;i--)glow(x-pl.face*i*2.2,y+Math.sin(fam.ph*2+i)*1.4,3+i*.3,'#38e0a0',.2);glow(x,y,13,'#38e0a0',.7);orb(x,y,3.2,3.2,'#b8ffd8',.6);g.fillStyle='#fff';g.fillRect(x-.6,y-.6,1.4,1.4)}
function renderWorld(){
  g.setTransform(1,0,0,1,0,0);drawBG();
  g.setTransform(SC,0,0,SC,-Math.round(cam.x*SC),-Math.round(cam.y*SC));
  drawTiles();drawWorldObjects();drawPicks();
  ens.forEach(e=>{if(e.alive&&e.x>cam.x-40&&e.x<cam.x+W+40)drawEnemyArt(e)});
  if(boss&&boss.alive&&boss.vis)drawBossArt(boss,boss.x+boss.w/2,boss.y+boss.h,1.45,boss.face<0?-1:1);
  drawKaelen(pl);drawFam();drawFx();
  drawLightMask();
  g.setTransform(1,0,0,1,0,0);
  const vg=g.createRadialGradient(SW/2,SH/2,SH*.45,SW/2,SH/2,SH*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,SW,SH);
}

/* ====== MÚSICA PROCEDURAL ====== */
const MUS={on:true,timer:null,step:0,next:0};
function nt(f,d,type,vol,when){
  if(!AC)return;try{const o=AC.createOscillator(),gn=AC.createGain();o.type=type;o.frequency.value=f;
    gn.gain.setValueAtTime(0.0001,when);gn.gain.exponentialRampToValueAtTime(vol,when+.03);gn.gain.exponentialRampToValueAtTime(0.0001,when+d);
    o.connect(gn).connect(AC.destination);o.start(when);o.stop(when+d+.05)}catch(e){}
}
function musStart(){if(!AC||MUS.timer)return;MUS.next=AC.currentTime+.15;MUS.timer=setInterval(musTick,40)}
function musTick(){
  if(!AC||!MUS.on)return;
  if(AC.state==='suspended'){try{AC.resume()}catch(e){}return}
  const bossOn=boss&&boss.act&&boss.alive,bpm=bossOn?120:mode==='title'?62:78,sp=60/bpm/2,r=L?L.r:0;
  while(MUS.next<AC.currentTime+.3){
    const s=MUS.step++,bar=Math.floor(s/8)%8,root=[0,-5,-2,3,-7,2,-1][r],prog=[0,-4,-2,-1,0,-4,-7,-8],base=110*Math.pow(2,(root+prog[bar])/12);
    const arp=[0,3,7,12,15,19,12,7][s%8],w=MUS.next;
    nt(base*2*Math.pow(2,arp/12),sp*1.9,'triangle',.02,w);
    if(s%4===0)nt(base,sp*3.8,'sawtooth',.014,w);
    if(s%8===0){nt(base*2,sp*7.6,'sine',.022,w);nt(base*3.0,sp*7.6,'sine',.014,w);nt(base*2*Math.pow(2,15/12),sp*7.6,'sine',.012,w)}
    if(bossOn&&s%2===0)nt(55,sp*1.2,'square',.03,w);
    if(bossOn&&s%4===2)nt(base*4*Math.pow(2,arp/12),sp*.8,'square',.01,w);
    MUS.next+=sp;
  }
}

/* ====== UI ====== */
const HF="'IM Fell English SC',Georgia,serif",BF="Spectral,Georgia,serif";
function tx(s,x,y,col='#ebe3d2',al='left',sz=18,font=BF){g.font=(font===HF?'':'600 ')+sz+'px '+font;g.textAlign=al;g.fillStyle=col;g.fillText(s,x,y)}
function panel(x,y,w,h,a=.82){
  const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'rgba(24,20,40,'+a+')');gr.addColorStop(1,'rgba(8,6,16,'+a+')');g.fillStyle=gr;g.fillRect(x,y,w,h);
  g.strokeStyle='rgba(120,110,170,.7)';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);g.strokeStyle='rgba(79,208,255,.55)';g.lineWidth=1;g.strokeRect(x+5,y+5,w-10,h-10);
  g.fillStyle='#4fd0ff';[[x+2,y+2],[x+w-8,y+2],[x+2,y+h-8],[x+w-8,y+h-8]].forEach(p=>g.fillRect(p[0],p[1],6,6));
}
function bar2(x,y,w,h,v,m,c1,c2,lab){
  g.fillStyle='#05030a';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle='#1c1830';g.fillRect(x,y,w,h);
  const f=clamp(v/m,0,1)*w,gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,mixc(c2,'#ffffff',.35));gr.addColorStop(.5,c1);gr.addColorStop(1,mixc(c1,'#000000',.4));g.fillStyle=gr;g.fillRect(x,y,f,h);
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x,y+1,f,2);g.strokeStyle='rgba(180,170,220,.5)';g.lineWidth=1;g.strokeRect(x-1.5,y-1.5,w+3,h+3);
  if(lab)tx(lab,x+w-6,y+h-3,'#fff','right',Math.max(10,h-3));
}
function hudMini(x,y){
  const cw=17,ch=11,cols=9,rows=3,cur={cx:Math.floor((pl.x+5)/(20*T)),cy:Math.floor((pl.y+9)/(11*T))};
  panel(x,y,cols*cw+16,rows*ch+16,.7);
  const c0=cur.cx-4,r0=cur.cy-1;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const cx=c0+i,cy=r0+j,k=L.r+':'+cx+','+cy,px=x+8+i*cw,py=y+8+j*ch;
    if(S.seen[k]){g.fillStyle='rgba(90,84,150,.9)';g.fillRect(px+1,py+1,cw-2,ch-2);g.strokeStyle='#cfc8ff';g.lineWidth=1;g.strokeRect(px+1.5,py+1.5,cw-3,ch-3)}
    else{g.fillStyle='rgba(20,16,36,.8)';g.fillRect(px+1,py+1,cw-2,ch-2)}
    L.altars.forEach(a=>{if(Math.floor(a.x/(20*T))===cx&&Math.floor((a.y-4)/(11*T))===cy&&S.seen[k]){g.fillStyle='#38e0a0';g.fillRect(px+cw/2-2,py+ch/2-2,4,4)}});
    if(S.dead.includes(L.r)&&portal&&Math.floor(portal.x/(20*T))===cx&&Math.floor((portal.y-4)/(11*T))===cy){g.fillStyle='#4fd0ff';g.fillRect(px+cw/2-2,py+ch/2-2,4,4)}
    if(i===4&&j===1&&Math.floor(frame/20)%2){g.fillStyle='#fff';g.fillRect(px+cw/2-3,py+ch/2-3,6,6)}
  }
}
function drawHUD(){
  panel(14,12,336,88);
  tx('Kaelen',30,38,'#ebe3d2','left',22,HF);tx('Nv '+S.lvl,334,38,'#4fd0ff','right',18,HF);
  bar2(30,48,290,16,S.hp,S.maxHp,'#c4434f','#ff8a8a',Math.ceil(S.hp)+'/'+S.maxHp);
  bar2(30,70,230,11,S.mp,S.maxMp,'#2a78c4','#4fd0ff');
  bar2(30,88,290,4,S.xp,need(),'#c8a85a','#ffe9a0');
  const wp=WPN[S.wpn],sp=SPELL[S.spell];
  panel(SW-312,12,298,88);
  tx(wp.n,SW-296,36,'#ebe3d2','left',17);tx('R: '+sp.n+' ('+sp.mp+')',SW-296,58,S.mp>=sp.mp?'#7fd0ff':'#6a6a80','left',15);
  tx(S.coins+' moedas',SW-296,82,'#e8c36a','left',15);tx(S.pots+' poções (Q)',SW-26,82,'#7dffb8','right',15);
  hudMini(SW-190,108);
  tx(REG[L.r].n,SW/2,34,'rgba(235,227,210,.8)','center',20,HF);
  if(boss&&boss.act&&boss.alive){const bw=560,bx=(SW-bw)/2,by=SH-48;panel(bx-16,by-38,bw+32,66,.8);tx(boss.d.name,SW/2,by-12,'#fff','center',22,HF);bar2(bx,by,bw,14,boss.hp,boss.max,'#8a2a8a','#ff3a5a')}
  if(toastT>0){toastT--;g.globalAlpha=Math.min(1,toastT/20);panel(SW/2-260,SH-120,520,38,.85);tx(toastMsg,SW/2,SH-95,'#7fd8ff','center',18);g.globalAlpha=1}
  const hint=interactHint();if(hint&&mode==='play')tx('[E] '+hint,(pl.x+5-cam.x)*SC,(pl.y-cam.y)*SC-26,'#fff','center',17);
}
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
    S.hp=S.maxHp;S.mp=S.maxMp;S.altars[L.r+':'+a.i]=1;S.cur={r:L.r,i:a.i};saveGame();sfx('pick');puff(a.x,a.y-20,'#38e0a0',16,2);
    ens.forEach(e=>{if(!e.alive){e.alive=true;e.hp=e.d.hp}});toast('Progresso salvo e Éter restaurado');return true}
  for(const n of L.npcs)if(Math.abs(n.x-cx)<22&&Math.abs(n.y-cy)<26){say(n.lines.map(t=>({who:'Elara',port:'elara',t:t.replace(/^Elara: /,'')})));return true}
  for(const c of L.chests)if(!c.open&&Math.abs(c.x+8-cx)<20&&Math.abs(c.y-cy)<24){
    c.open=true;S.chests[c.id]=1;sfx('pick');const it=c.item;
    if(it==='coin'){const n=30+L.r*25;S.coins+=n;toast('+'+n+' moedas')}
    else if(it==='hp'){S.maxHp+=10;S.hp=S.maxHp;toast('Vitalidade máxima aumentou')}
    else if(it==='mp'){S.maxMp+=6;S.mp=S.maxMp;toast('Éter máximo aumentou')}
    else if(it==='pot'){S.pots+=2;toast('+2 Poções de Éter')}
    else if(it==='wpn'){if(!S.wpns.includes(1))S.wpns.push(1);toast('Arma obtida: '+WPN[1].n)}
    else S.coins+=40;
    saveGame();return true}
  for(const d of L.doors)if(Math.abs(d.x-cx)<14&&Math.abs(d.y-cy)<26){enterRegion(d.to,'portal');pl.x=L.portal.x-5;return true}
  if(portal&&Math.abs(portal.x-cx)<16&&Math.abs(portal.y-cy)<28){
    const nr=L.r+1;if(nr>=REG.length)return true;
    S.cur={r:nr,i:0};S.altars[nr+':0']=1;saveGame();enterRegion(nr,'start');toast('Nova terra: '+REG[nr].n);return true}
  return false;
}
function wrapT(s,x,y,mw,lh,sz){
  const w=s.split(' ');let line='',yy=y;g.font='600 '+sz+'px '+BF;g.textAlign='left';g.fillStyle='#ebe3d2';
  for(const t of w){const test=line?line+' '+t:t;if(g.measureText(test).width>mw&&line){g.fillText(line,x,yy);line=t;yy+=lh}else line=test}
  g.fillText(line,x,yy);
}
function drawDialog(){
  const d=dlg,l=d.lines[d.i],h=170,y=SH-h-24;panel(36,y,SW-72,h,.92);
  let x0=60;
  if(l.port&&IMG[l.port]&&IMG[l.port].complete&&IMG[l.port].naturalWidth){
    const im=IMG[l.port],ph=h-28,pw=150;g.save();g.beginPath();g.rect(52,y+14,pw,ph);g.clip();
    const sh=im.naturalHeight,sw=im.naturalWidth,srcW=sh*(pw/ph),sx=l.port==='elara'?sw*.34:sw*.31;g.drawImage(im,sx,0,srcW,sh,52,y+14,pw,ph);g.restore();
    g.strokeStyle='rgba(79,208,255,.7)';g.lineWidth=2;g.strokeRect(52,y+14,pw,ph);x0=224;
  }
  if(l.who)tx(l.who,x0,y+42,'#4fd0ff','left',24,HF);
  d.c=Math.min(l.t.length,d.c+1);wrapT(l.t.slice(0,d.c),x0,y+78,SW-x0-70,30,20);
  if(d.c>=l.t.length&&frame%50<30)tx('E',SW-70,y+h-22,'#a29bb2','right',16);
}
function drawCard(){
  const c=card;c.t++;
  g.fillStyle='#000';g.fillRect(0,0,SW,SH);
  const a=Math.min(1,c.t/24);g.globalAlpha=a;
  if(c.art&&IMG[c.art]&&IMG[c.art].complete&&IMG[c.art].naturalWidth){
    const im=IMG[c.art],sc=Math.max(SW/im.naturalWidth,SH/im.naturalHeight),w=im.naturalWidth*sc,h=im.naturalHeight*sc,zm=1+c.t/900;g.drawImage(im,(SW-w*zm)/2,(SH-h*zm)/2,w*zm,h*zm);
  }else{
    const R=REG[L.r];const gr=g.createLinearGradient(0,0,0,SH);gr.addColorStop(0,R.sky[0]);gr.addColorStop(1,R.sky[2]);g.fillStyle=gr;g.fillRect(0,0,SW,SH);
    const img=BGI[BGMAP[L.r]];if(img&&img.complete&&img.naturalWidth){const w=img.naturalWidth*(SH/img.naturalHeight);g.globalAlpha=.7*a;for(let x=0;x<SW;x+=w)g.drawImage(img,x,0,w,SH);g.globalAlpha=a}
    g.fillStyle=TINT[L.r];g.fillRect(0,0,SW,SH);
    g.setTransform(1,0,0,1,0,0);g.save();g.translate(0,0);
    const fake={st:'idle',sw:0,t:0,flash:0,d:REG[L.r].lord};g.translate(SW*.5,SH*.9);g.scale(4.6,4.6);glow(0,-20,70,c.col,.4);
    BOSSART[L.r](fake,x=>x,false,c.t*.04);g.restore();
  }
  const vg=g.createLinearGradient(0,SH*.55,0,SH);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.92)');g.fillStyle=vg;g.fillRect(0,SH*.55,SW,SH*.45);
  tx(c.title,SW/2,SH-96,c.col,'center',26,HF);tx(c.name,SW/2,SH-48,'#fff','center',52,HF);g.globalAlpha=1;
}
function drawMap(){
  g.fillStyle='rgba(6,4,12,.97)';g.fillRect(0,0,SW,SH);
  tx('Mapa de Aethelgard',SW/2,56,'#4fd0ff','center',34,HF);
  const n=REG.length,bw=112,gap=14,x0=(SW-(n*bw+(n-1)*gap))/2;
  for(let i=0;i<n;i++){const x=x0+i*(bw+gap),y=76,R=REG[i],un=i===0||S.dead.includes(i-1),done=S.dead.includes(i);
    g.fillStyle=un?R.sky[1]:'#1a1626';g.fillRect(x,y,bw,56);g.strokeStyle=i===L.r?'#fff':done?'#38e0a0':'#2b2640';g.lineWidth=i===L.r?3:1.5;g.strokeRect(x+1,y+1,bw-2,54);
    tx(un?R.n:'???',x+bw/2,y+24,un?'#fff':'#4a4560','center',13);tx(done?'Lord vencido':un?R.lord.title:'',x+bw/2,y+44,done?'#38e0a0':'#a29bb2','center',11)}
  const cols=Math.ceil(L.Wt/20),cw=Math.min(52,Math.floor((SW-120)/cols)),ch=Math.round(cw*.66),gx=(SW-cols*cw)/2,gy=160;
  tx(REG[L.r].n+' — '+REG[L.r].castle,SW/2,148,'#ebe3d2','center',18);
  const cur={cx:Math.floor((pl.x+5)/(20*T)),cy:Math.floor((pl.y+9)/(11*T))};
  for(let j=1;j<=3;j++)for(let i=0;i<cols;i++){
    const k=L.r+':'+i+','+j,px=gx+i*cw,py=gy+(j-1)*ch,seen=S.seen[k];
    g.fillStyle=seen?'rgba(96,88,160,.92)':'rgba(18,14,32,.9)';g.fillRect(px+1,py+1,cw-2,ch-2);if(seen){g.strokeStyle='#d8d0ff';g.lineWidth=1.5;g.strokeRect(px+2,py+2,cw-4,ch-4)}
    const mark=(col)=>{g.fillStyle=col;g.fillRect(px+cw/2-4,py+ch/2-4,8,8)};
    if(seen){L.altars.forEach(a=>{if(Math.floor(a.x/(20*T))===i&&Math.floor((a.y-4)/(11*T))===j)mark('#38e0a0')});
      if(Math.floor(L.arena.x0/(20*T))===i&&Math.floor((L.arena.gy-4)/(11*T))===j)mark('#ff3a5a');
      if(S.dead.includes(L.r)&&Math.floor(L.portal.x/(20*T))===i&&Math.floor((L.portal.y-4)/(11*T))===j)mark('#4fd0ff')}
    if(cur.cx===i&&cur.cy===j&&Math.floor(frame/20)%2){g.fillStyle='#fff';g.fillRect(px+cw/2-5,py+ch/2-5,10,10)}
  }
  tx('Verde: Eco-Santuário   Vermelho: Lord   Azul: portal   Branco: você',SW/2,gy+3*ch+26,'#a29bb2','center',14);
  const ty0=gy+3*ch+54;tx('Viagem rápida: setas escolhem, E viaja',SW/2,ty0,'#4fd0ff','center',18);
  menu=menu||{i:0};const alts=[];for(let r=0;r<n;r++)for(let k=0;k<2;k++)if(S.altars[r+':'+k])alts.push([r,k]);
  const c4=4,cw2=222;alts.forEach((a,idx)=>{const px=(SW-c4*cw2)/2+(idx%c4)*cw2,py=ty0+16+Math.floor(idx/c4)*34,sel=idx===menu.i;
    g.fillStyle=sel?'#2a2340':'#14101f';g.fillRect(px,py,cw2-8,28);if(sel){g.strokeStyle='#4fd0ff';g.lineWidth=2;g.strokeRect(px+1,py+1,cw2-10,26)}
    tx(REG[a[0]].n+(a[1]?' (castelo)':''),px+10,py+20,'#ebe3d2','left',14)});
  menu.alts=alts;tx('M ou Esc: fechar',SW/2,SH-16,'#a29bb2','center',14);
}
function drawEquip(){
  g.fillStyle='rgba(6,4,12,.97)';g.fillRect(0,0,SW,SH);tx('Equipamento',SW/2,60,'#4fd0ff','center',36,HF);
  menu=menu||{i:Math.max(0,S.wpns.indexOf(S.wpn))};
  panel(60,90,480,400,.9);tx('Armas (E equipa)',84,126,'#ebe3d2','left',20,HF);
  S.wpns.forEach((id,i)=>{const w=WPN[id],y=150+i*48,sel=i===menu.i;g.fillStyle=sel?'#2a2340':'rgba(20,16,36,.6)';g.fillRect(80,y,440,40);if(sel){g.strokeStyle='#4fd0ff';g.lineWidth=2;g.strokeRect(81,y+1,438,38)}
    g.fillStyle=w.col;g.fillRect(90,y+8,10,24);tx(w.n+(id===S.wpn?'  (equipada)':''),112,y+25,'#ebe3d2','left',17);tx('Dano '+w.dmg+'  Alcance '+w.reach,510,y+25,'#a29bb2','right',14)});
  panel(570,90,330,400,.9);
  tx('Atributos',594,126,'#ebe3d2','left',20,HF);
  [['Nível',S.lvl],['Vida',S.maxHp],['Éter',S.maxMp],['Ataque',atkPow()],['Magia',magPow()],['Moedas',S.coins]].forEach((r,i)=>{tx(r[0],594,160+i*28,'#a29bb2','left',16);tx(''+r[1],880,160+i*28,'#fff','right',16)});
  tx('Poderes',594,350,'#ebe3d2','left',20,HF);
  [['dj','Gravidade'],['dash','Aether Dash'],['wall','Garras'],['glide','Capa de Éter'],['ice','Temperada'],['fire','Núcleo']].forEach((a,i)=>tx((S.ab[a[0]]?'✔ ':'· ')+a[1],594+(i%2)*150,380+Math.floor(i/2)*26,S.ab[a[0]]?'#4fd0ff':'#5a5470','left',15));
  tx('Magia: '+SPELL[S.spell].n+'  (R troca)',594,470,'#7fd0ff','left',15);
  tx('I ou Esc: fechar',SW/2,SH-20,'#a29bb2','center',14);
}
function drawTitle(){
  const gr=g.createLinearGradient(0,0,0,SH);gr.addColorStop(0,'#07060e');gr.addColorStop(.6,'#1c1030');gr.addColorStop(1,'#14394a');g.fillStyle=gr;g.fillRect(0,0,SW,SH);
  const im=IMG.kaelen;if(im&&im.complete&&im.naturalWidth){const sc=Math.max(SW/im.naturalWidth,SH/im.naturalHeight),w=im.naturalWidth*sc,h=im.naturalHeight*sc;g.globalAlpha=.6;g.drawImage(im,(SW-w)/2-Math.sin(frame*.004)*10,(SH-h)/2,w,h);g.globalAlpha=1}
  const vg=g.createLinearGradient(0,0,0,SH);vg.addColorStop(0,'rgba(7,5,14,.85)');vg.addColorStop(.5,'rgba(7,5,14,.1)');vg.addColorStop(1,'rgba(7,5,14,.9)');g.fillStyle=vg;g.fillRect(0,0,SW,SH);
  tx('ECHOES OF',SW/2,130,'#a29bb2','center',30,HF);glow(SW/2,190,300,'#4fd0ff',.12);tx('AETHELGARD',SW/2,206,'#fff','center',86,HF);
  g.fillStyle='rgba(79,208,255,.8)';g.fillRect(SW/2-200,226,400,2);
  const items=hasSave()?['Continuar','Novo jogo']:['Novo jogo'];menu=menu||{i:0};
  items.forEach((t,i)=>tx((menu.i===i?'▸ ':'   ')+t,SW/2,SH-150+i*44,menu.i===i?'#fff':'#a29bb2','center',30,HF));
  menu.n=items.length;menu.items=items;tx('Setas e Enter  ·  N liga ou desliga a música',SW/2,SH-30,'#a29bb2','center',15);
}
function drawEnd(a,sub,col){g.fillStyle='rgba(7,5,13,.82)';g.fillRect(0,0,SW,SH);tx(a,SW/2,SH/2-10,col,'center',64,HF);tx(sub,SW/2,SH/2+36,'#ebe3d2','center',20)}

/* ====== LOOP ====== */
function startGame(cont){
  if(cont&&loadGame()){const c=S.cur;enterRegion(c.r,'altar',c.i)}
  else{S=newState();enterRegion(0,'start');setTimeout(()=>{if(mode==='play')say([{who:'Elara',port:'elara',t:'Kaelen, a corrupção do Éter Abissal cobre Aethelgard. Em cada terra há um castelo e um Lord.'},{who:'Elara',port:'elara',t:'Atravesse a vila, a floresta, as cavernas e além. Vença os sete Lordes e chegue ao Trono do Vazio.'},{who:'Elara',port:'elara',t:'Use ↓ + L para recuar rápido. Quebre as velas: elas guardam moedas e Éter.'}])},300)}
}
function respawn(){S.hp=S.maxHp;S.mp=S.maxMp;S.coins=Math.floor(S.coins*.85);const c=S.cur;enterRegion(c.r,'altar',c.i)}
function stepDialog(){
  if(P('act')||P('atk')||P('jump')){const l=dlg.lines[dlg.i];if(dlg.c<l.t.length){dlg.c=l.t.length;return}
    dlg.i++;dlg.c=0;sfx('menu');if(dlg.i>=dlg.lines.length){const cb=dlg.cb;dlg=null;mode='play';if(cb)cb()}}
}
function update(){
  frame++;
  if(P('music')){MUS.on=!MUS.on;if(MUS.on)toast('Música ligada')}
  if(mode==='title'){
    menu=menu||{i:0};
    if(P('down')||P('right'))menu.i=Math.min((menu.n||1)-1,menu.i+1);if(P('up')||P('left'))menu.i=Math.max(0,menu.i-1);
    if(P('act')||P('atk')||P('jump')){const it=(menu.items||['Novo jogo'])[menu.i];sfx('menu');if(it==='Continuar')startGame(true);else{try{localStorage.removeItem(SAVEKEY)}catch(e){}startGame(false)}menu=null}
    return;
  }
  if(mode==='dialog'){stepDialog();return}
  if(mode==='card'){if(card&&card.t>30&&(P('act')||P('atk')||P('jump'))||card&&card.t>170){mode='play';boss.act=true;boss.tm=40;card=null}return}
  if(mode==='map'){
    menu=menu||{i:0};const alts=menu.alts||[];
    if(P('right'))menu.i=Math.min(alts.length-1,menu.i+1);if(P('left'))menu.i=Math.max(0,menu.i-1);if(P('down'))menu.i=Math.min(alts.length-1,menu.i+4);if(P('up')||P('jump'))menu.i=Math.max(0,menu.i-4);
    if(P('map')||P('pause')){mode='play';menu=null;return}
    if(P('act')&&alts[menu.i]){const a=alts[menu.i];S.cur={r:a[0],i:a[1]};menu=null;enterRegion(a[0],'altar',a[1]);sfx('open')}
    return;
  }
  if(mode==='equip'){
    menu=menu||{i:0};
    if(P('down'))menu.i=Math.min(S.wpns.length-1,menu.i+1);if(P('up')||P('jump'))menu.i=Math.max(0,menu.i-1);
    if(P('left')||P('right')){const a=S.spells;S.spell=a[(a.indexOf(S.spell)+(P('right')?1:a.length-1))%a.length]}
    if(P('act')){S.wpn=S.wpns[menu.i];sfx('pick');toast('Equipada: '+WPN[S.wpn].n)}
    if(P('equip')||P('pause')){mode='play';menu=null;saveGame()}
    return;
  }
  if(mode==='pause'){if(P('pause'))mode='play';return}
  if(mode==='dead'){if(P('act')||P('atk')||P('jump')){menu=null;respawn()}return}
  if(mode==='win'){if(P('act')){try{localStorage.removeItem(SAVEKEY)}catch(e){}mode='title';menu=null}return}
  if(P('pause')){mode='pause';return}
  if(P('map')){mode='map';menu={i:0};return}
  if(P('equip')){mode='equip';menu={i:Math.max(0,S.wpns.indexOf(S.wpn))};return}
  if(P('spell')){const a=S.spells;S.spell=a[(a.indexOf(S.spell)+1)%a.length];toast('Magia: '+SPELL[S.spell].n);sfx('menu')}
  if(freeze>0){freeze--;return}
  if(P('act')&&pl.ground)doInteract();
  if(mode!=='play')return;
  S.time++;
  updPlayer();
  ens.forEach(e=>{if(e.alive)updEnemy(e)});
  if(ens.length>40)ens=ens.filter(e=>e.alive);
  if(boss&&boss.alive){if(!boss.act&&mode==='play'&&pl.x>L.arena.x0+T*6&&!card)bossStart();else if(boss.act)updBoss(boss)}
  updProj();updPicks();updFam();markSeen();
  const tx2=pl.x+5-W/2+pl.face*18,ty2=pl.y-H*.58;let minX=0,maxX=L.Wt*T-W;
  if(boss&&boss.act){minX=L.arena.x0-T;maxX=L.arena.x1-W+T}
  cam.x+=(clamp(tx2,minX,maxX)-cam.x)*.12;cam.y+=(clamp(ty2,0,HT*T-H)-cam.y)*.1;
  if(shake>0){shake--;cam.x+=rnd(-shake,shake)*.2;cam.y+=rnd(-shake,shake)*.2}
}
function render(){
  g.setTransform(1,0,0,1,0,0);
  if(mode==='title'){drawTitle();return}
  renderWorld();drawHUD();
  if(mode==='dialog')drawDialog();
  if(mode==='card')drawCard();
  if(mode==='map')drawMap();
  if(mode==='equip')drawEquip();
  if(mode==='pause'){g.fillStyle='rgba(7,5,13,.7)';g.fillRect(0,0,SW,SH);tx('Pausa',SW/2,SH/2,'#fff','center',60,HF)}
  if(mode==='dead')drawEnd('Você caiu','Pressione Ação para renascer no último Eco-Santuário','#ff5a6a');
  if(mode==='win')drawEnd('O Vazio foi selado','Malakor caiu e Aethelgard respira de novo. Obrigado por jogar. (Ação: voltar ao título)','#38e0a0');
}
let last=performance.now(),acc=0;
function loop(t){acc+=Math.min(100,t-last);last=t;while(acc>=16.667){update();for(const k in pr)pr[k]=false;acc-=16.667}render();requestAnimationFrame(loop)}
menu={i:0};requestAnimationFrame(loop);
window.__game={get S(){return S},get mode(){return mode}};
})();
