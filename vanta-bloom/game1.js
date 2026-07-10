'use strict';
'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
var $=function(id){return document.getElementById(id)};
var ui={start:$('start'),play:$('play'),upgrade:$('upgrade'),upgradeCards:$('upgradeCards'),pause:$('pause'),pauseScreen:$('pauseScreen'),resume:$('resume'),restartPause:$('restartPause'),end:$('end'),again:$('again'),timer:$('timer'),score:$('score'),hpBar:$('hpBar'),hpText:$('hpText'),xpBar:$('xpBar'),xpText:$('xpText'),levelLabel:$('levelLabel'),message:$('message'),dash:$('dash'),bloom:$('bloom'),stick:$('stick'),knob:$('knob'),endEye:$('endEye'),endTitle:$('endTitle'),endText:$('endText'),endScore:$('endScore'),endKills:$('endKills'),endLevel:$('endLevel'),bestText:$('bestText')};
var W=0,H=0,DPR=1,S=44,TAU=Math.PI*2;
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))},lerp=function(a,b,t){return a+(b-a)*t},rnd=function(a,b){if(b===undefined)b=0;return b+Math.random()*(a-b)},len=function(x,y){return Math.sqrt(x*x+y*y)};
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);S=clamp(Math.min(W,H)/8.3,38,58)}
addEventListener('resize',resize);resize();

var G={state:'menu',time:0,runTime:0,score:0,kills:0,level:1,xp:0,nextXp:3,spawn:0,bossSpawned:false,bossDead:false,shake:0,flash:0,slow:0,shotCount:0,best:0};
try{G.best=+(localStorage.getItem('vantaBloomBest')||0)}catch(e){}
var P,enemies=[],bullets=[],enemyBullets=[],drops=[],particles=[],rings=[],texts=[],decor=[];
var input={x:0,y:0,id:null,originX:0,originY:0,active:false,keys:{}};
var msgTimer=0,levelPending=false;

function reset(){
 G.time=0;G.runTime=0;G.score=0;G.kills=0;G.level=1;G.xp=0;G.nextXp=3;G.spawn=0;G.bossSpawned=false;G.bossDead=false;G.shake=0;G.flash=0;G.slow=0;G.shotCount=0;levelPending=false;
 enemies=[];bullets=[];enemyBullets=[];drops=[];particles=[];rings=[];texts=[];decor=[];
 P={x:0,y:0,vx:0,vy:0,r:.42,hp:100,maxHp:100,speed:6.1,damage:20,fireRate:.34,fireCd:.1,bulletSpeed:13,shots:1,spread:.16,pierce:0,magnet:5.2,dashCd:2.2,dashReady:0,dashTime:0,inv:0,charge:0,orbiters:0,orbitalDamage:24,shield:0,novaEvery:0,bounces:0,slowPower:0,regen:0,angle:0,trail:[]};
 for(var i=0;i<100;i++){var a=rnd(TAU),r=rnd(34,4);decor.push({x:Math.cos(a)*r+rnd(6,-6),y:Math.sin(a)*r+rnd(6,-6),type:Math.random()<.64?0:1,s:rnd(1.5,.45),rot:rnd(TAU)})}
 spawn('drift',3.3,-1.2);spawn('drift',-3.6,1.2);spawn('drift',1.2,4.1);
 updateUI();
}

function msg(big,small,d){var m=ui.message;m.children[0].textContent=big;m.children[1].textContent=small||'';m.classList.add('show');clearTimeout(msgTimer);msgTimer=setTimeout(function(){m.classList.remove('show')},d||900)}
function updateUI(){
 ui.score.textContent=('000000'+Math.floor(G.score)).slice(-6);var remain=Math.max(0,60-G.runTime);ui.timer.textContent=G.bossSpawned?'BOSS':('0'+Math.floor(remain/60)).slice(-2)+':'+('0'+Math.ceil(remain%60)).slice(-2);
 ui.hpBar.style.width=clamp(P.hp/P.maxHp*100,0,100)+'%';ui.hpText.textContent=Math.ceil(P.hp)+' / '+P.maxHp;ui.xpBar.style.width=clamp(G.xp/G.nextXp*100,0,100)+'%';ui.xpText.textContent=G.xp+' / '+G.nextXp;ui.levelLabel.textContent='LEVEL '+G.level;
 ui.dash.classList.toggle('ready',P.dashReady<=0);ui.bloom.classList.toggle('ready',P.charge>=100);
}

function audio(){
 if(audio.ctx)return audio.ctx;try{audio.ctx=new(window.AudioContext||window.webkitAudioContext)();return audio.ctx}catch(e){return null}
}
function tone(f,d,type,vol,slide){var c=audio();if(!c)return;try{var o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),c.currentTime+d);g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(vol||.05,c.currentTime+.012);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+d+.03)}catch(e){}}
function buzz(v){try{navigator.vibrate&&navigator.vibrate(v)}catch(e){}}

function startGame(){reset();G.state='play';ui.start.classList.add('hidden');ui.end.classList.add('hidden');ui.pauseScreen.classList.add('hidden');ui.upgrade.classList.add('hidden');var c=audio();if(c&&c.state==='suspended')c.resume();msg('INTRUSION','左側をドラッグして移動',1500);tone(180,.35,'sine',.06,220)}
ui.play.addEventListener('click',startGame);ui.again.addEventListener('click',startGame);ui.restartPause.addEventListener('click',startGame);
ui.pause.addEventListener('click',function(){if(G.state==='play'){G.state='pause';ui.pauseScreen.classList.remove('hidden')}});
ui.resume.addEventListener('click',function(){G.state='play';ui.pauseScreen.classList.add('hidden');last=performance.now()});

addEventListener('keydown',function(e){input.keys[e.code]=true;if(e.code==='Space'){e.preventDefault();dash()}if(e.code==='KeyE')bloom();if(e.code==='Escape'&&G.state==='play')ui.pause.click()});
addEventListener('keyup',function(e){input.keys[e.code]=false});
function isButtonTarget(t){return t===ui.dash||t===ui.bloom||t===ui.pause||t.closest&&t.closest('.screen')}
addEventListener('pointerdown',function(e){if(G.state!=='play'||isButtonTarget(e.target)||e.clientX>W*.68)return;input.id=e.pointerId;input.active=true;input.originX=e.clientX;input.originY=e.clientY;input.x=0;input.y=0;ui.stick.style.display='block';ui.stick.style.left=e.clientX+'px';ui.stick.style.top=e.clientY+'px';try{canvas.setPointerCapture(e.pointerId)}catch(_){}},{passive:false});
addEventListener('pointermove',function(e){if(!input.active||e.pointerId!==input.id)return;var dx=e.clientX-input.originX,dy=e.clientY-input.originY,m=len(dx,dy)||1,lim=42,k=Math.min(1,m/lim);input.x=dx/m*k;input.y=dy/m*k;ui.knob.style.transform='translate(calc(-50% + '+input.x*lim+'px),calc(-50% + '+input.y*lim+'px))'},{passive:false});
function releasePointer(e){if(input.active&&(e.pointerId===undefined||e.pointerId===input.id)){input.active=false;input.id=null;input.x=input.y=0;ui.stick.style.display='none';ui.knob.style.transform='translate(-50%,-50%)'}}
addEventListener('pointerup',releasePointer);addEventListener('pointercancel',releasePointer);
ui.dash.addEventListener('pointerdown',function(e){e.preventDefault();dash()});ui.bloom.addEventListener('pointerdown',function(e){e.preventDefault();bloom()});

function burst(x,y,color,n,power){for(var i=0;i<n;i++){var a=rnd(TAU),s=rnd(power||4,.6);particles.push({x:x,y:y,z:rnd(.8,.12),vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:rnd(3,.3),life:rnd(.85,.3),max:1,color:color,size:rnd(.16,.04),drag:rnd(.95,.87)})}}
function ring(x,y,color,r0,r1,d){rings.push({x:x,y:y,r:r0||.3,to:r1||3,life:d||.5,max:d||.5,color:color})}
