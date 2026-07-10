function floatText(x,y,text,color,size){texts.push({x:x,y:y,z:1.4,text:text,color:color||'#eee9df',life:.75,max:.75,size:size||12})}

function spawn(type,x,y){
 if(x===undefined){var a=rnd(TAU),r=rnd(9,6.5);x=P.x+Math.cos(a)*r;y=P.y+Math.sin(a)*r}
 var e={type:type,x:x,y:y,vx:0,vy:0,hit:0,dead:false,angle:0,phase:rnd(TAU),cool:rnd(2,.4),state:0,contact:0};
 if(type==='drift'){e.r=.42;e.hp=e.max=20+G.runTime*.18;e.speed=1.7+G.runTime*.006;e.color='#8b8f88';e.xp=1;e.damage=10}
 if(type==='blade'){e.r=.48;e.hp=e.max=58+G.runTime*.32;e.speed=1.25;e.color='#c39755';e.xp=2;e.damage=15;e.cool=rnd(2.4,1)}
 if(type==='seer'){e.r=.5;e.hp=e.max=48+G.runTime*.3;e.speed=.8;e.color='#668f91';e.xp=2;e.damage=12;e.cool=rnd(1.8,.8)}
 if(type==='split'){e.r=.62;e.hp=e.max=95+G.runTime*.45;e.speed=.95;e.color='#8b6f78';e.xp=3;e.damage=18}
 if(type==='mite'){e.r=.25;e.hp=e.max=15;e.speed=2.6;e.color='#9a7e88';e.xp=0;e.damage=6}
 if(type==='boss'){e.r=1.45;e.hp=e.max=1850;e.speed=.72;e.color='#c9c2b0';e.xp=20;e.damage=24;e.cool=1.5;e.phase2=false;e.phase3=false;e.name='CURATOR'}
 enemies.push(e);return e;
}
function spawnDirector(dt){
 if(G.bossSpawned)return;G.spawn-=dt;if(G.spawn>0)return;var t=G.runTime,roll=Math.random();
 if(t<12)spawn('drift');else if(t<25)spawn(roll<.72?'drift':'blade');else if(t<42)spawn(roll<.52?'drift':roll<.76?'blade':'seer');else spawn(roll<.38?'drift':roll<.62?'blade':roll<.84?'seer':'split');
 G.spawn=Math.max(.16,.88-t*.01)*rnd(1.12,.7);
 if(t>20&&Math.random()<.28)spawn('drift');
}
function spawnBoss(){G.bossSpawned=true;enemyBullets=[];var e=spawn('boss',P.x,P.y-11);msg('CURATOR','庭園の所有者が現れた',2000);ring(e.x,e.y,'#eee3c7',1,10,1);tone(72,1,'sawtooth',.11,50);buzz([60,50,120]);G.flash=.8}

function nearestEnemy(range,exclude){var best=null,bd=range*range;for(var i=0;i<enemies.length;i++){var e=enemies[i];if(e.dead||e===exclude)continue;var dx=e.x-P.x,dy=e.y-P.y,d=dx*dx+dy*dy;if(d<bd){bd=d;best=e}}return best}
function fire(){var target=nearestEnemy(18);if(!target)return;var a=Math.atan2(target.y-P.y,target.x-P.x),count=P.shots,center=(count-1)/2;for(var i=0;i<count;i++){var aa=a+(i-center)*P.spread;bullets.push({x:P.x+Math.cos(aa)*.55,y:P.y+Math.sin(aa)*.55,vx:Math.cos(aa)*P.bulletSpeed,vy:Math.sin(aa)*P.bulletSpeed,r:.11,life:2,damage:P.damage,pierce:P.pierce,bounces:P.bounces,color:'#e7d9b9'})}P.fireCd=P.fireRate;G.shotCount++;tone(330,.055,'triangle',.022,90);if(P.novaEvery&&G.shotCount%P.novaEvery===0){for(i=0;i<10;i++){aa=i/10*TAU;bullets.push({x:P.x,y:P.y,vx:Math.cos(aa)*P.bulletSpeed*.83,vy:Math.sin(aa)*P.bulletSpeed*.83,r:.09,life:1,damage:P.damage*.55,pierce:0,bounces:0,color:'#7cc9c3'})}ring(P.x,P.y,'#7cc9c3',.2,2.5,.35)}}
function dash(){if(G.state!=='play'||P.dashReady>0)return;var ix=input.x+(input.keys.KeyD||input.keys.ArrowRight?1:0)-(input.keys.KeyA||input.keys.ArrowLeft?1:0),iy=input.y+(input.keys.KeyS||input.keys.ArrowDown?1:0)-(input.keys.KeyW||input.keys.ArrowUp?1:0),m=len(ix,iy);if(m<.18){ix=Math.cos(P.angle);iy=Math.sin(P.angle);m=1}P.vx+=ix/m*16;P.vy+=iy/m*16;P.dashReady=P.dashCd;P.dashTime=.24;P.inv=.38;ring(P.x,P.y,'#7cc9c3',.2,2,.3);burst(P.x,P.y,'#7cc9c3',22,6);G.shake=.25;tone(130,.18,'sawtooth',.06,420);buzz(22)}
function bloom(){if(G.state!=='play'||P.charge<100)return;P.charge=0;G.slow=1.3;ring(P.x,P.y,'#e7b960',.2,8,.75);burst(P.x,P.y,'#e7b960',70,10);for(var i=0;i<enemies.length;i++){var e=enemies[i],dx=e.x-P.x,dy=e.y-P.y,d=len(dx,dy);if(d<8){damageEnemy(e,55+(8-d)*7,true);e.vx+=dx/(d||1)*8;e.vy+=dy/(d||1)*8}}enemyBullets=[];G.shake=.7;G.flash=.65;tone(85,.8,'sine',.11,700);buzz([40,25,90]);msg('BLOOM','庭園を上書きした',900)}

function damageEnemy(e,amount,special){if(e.dead)return;e.hp-=amount;e.hit=.12;floatText(e.x,e.y,Math.floor(amount),special?'#e7b960':'#eee4cc',special?15:11);if(e.hp<=0)killEnemy(e)}
function killEnemy(e){if(e.dead)return;e.dead=true;G.kills++;G.score+=e.type==='boss'?5000:Math.floor(e.max*2);P.charge=clamp(P.charge+(e.type==='boss'?100:e.xp*3+2),0,100);burst(e.x,e.y,e.type==='boss'?'#e7b960':e.color,e.type==='boss'?120:18,e.type==='boss'?12:5);ring(e.x,e.y,e.color,.1,e.type==='boss'?9:1.5,e.type==='boss'?1.1:.3);if(e.type==='split'){for(var j=0;j<2;j++)spawn('mite',e.x+rnd(.5,-.5),e.y+rnd(.5,-.5))}if(e.type==='boss'){G.bossDead=true;setTimeout(function(){finish(true)},800);tone(100,1.2,'sine',.13,900);buzz([80,50,160])}else{for(var i=0;i<e.xp;i++)drops.push({x:e.x+rnd(.3,-.3),y:e.y+rnd(.3,-.3),vx:rnd(2,-2),vy:rnd(2,-2),life:20,r:.12})}}
function hurt(amount,x,y){if(P.inv>0||G.state!=='play')return;if(P.shield>0){P.shield--;P.inv=.6;ring(P.x,P.y,'#7cc9c3',.2,2,.3);msg('SHIELD','衝撃を無効化',550);tone(620,.15,'triangle',.06,-180);return}P.hp-=amount;P.inv=1;var dx=P.x-x,dy=P.y-y,d=len(dx,dy)||1;P.vx+=dx/d*7;P.vy+=dy/d*7;burst(P.x,P.y,'#db6b63',28,7);G.shake=.62;G.flash=.38;tone(92,.3,'square',.075,-25);buzz(65);floatText(P.x,P.y,'-'+amount,'#ff8e84',15);if(P.hp<=0)finish(false)}

var UPGRADES=[
 {id:'rapid',icon:'≋',name:'RAPID CUT',desc:'射撃間隔を18%短縮する。',tag:'FIRE RATE',apply:function(){P.fireRate*=.82}},
 {id:'damage',icon:'◆',name:'HEAVY CORE',desc:'全ての弾の威力が30%上昇する。',tag:'DAMAGE',apply:function(){P.damage*=1.3}},
 {id:'triple',icon:'⋰',name:'TRIPLE LENS',desc:'同時発射数を2つ増やす。',tag:'MULTI SHOT',apply:function(){P.shots+=2;P.spread=Math.min(.24,P.spread+.01)}},
 {id:'pierce',icon:'➝',name:'PHASE NEEDLE',desc:'弾が敵を1体貫通する。',tag:'PIERCE',apply:function(){P.pierce++}},
 {id:'orbital',icon:'◉',name:'ORBITAL PETAL',desc:'周囲を回る刃を1枚追加する。',tag:'ORBIT',apply:function(){P.orbiters++}},
 {id:'vital',icon:'＋',name:'VITAL CERAMIC',desc:'最大COREを25増やし、全回復する。',tag:'SURVIVAL',apply:function(){P.maxHp+=25;P.hp=P.maxHp}},
 {id:'dash',icon:'↯',name:'DASH ENGINE',desc:'ダッシュの再使用時間を20%短縮。',tag:'MOBILITY',apply:function(){P.dashCd=Math.max(.8,P.dashCd*.8)}},
 {id:'magnet',icon:'⌁',name:'MAGNET FIELD',desc:'破片の吸引範囲を大きく広げる。',tag:'UTILITY',apply:function(){P.magnet+=2.3}},
 {id:'shield',icon:'⬡',name:'GLASS SHIELD',desc:'一度だけ被弾を完全に無効化する。',tag:'DEFENSE',apply:function(){P.shield++}},
 {id:'nova',icon:'✺',name:'RESONANT NOVA',desc:'一定回数の射撃ごとに全周弾を放つ。',tag:'NOVA',apply:function(){P.novaEvery=P.novaEvery?Math.max(4,P.novaEvery-2):9}},
 {id:'bounce',icon:'⌁',name:'RICOCHET',desc:'弾が近くの敵へ1回跳ねる。',tag:'BOUNCE',apply:function(){P.bounces++}},
 {id:'regen',icon:'∿',name:'QUIET REPAIR',desc:'毎秒COREを0.8回復する。',tag:'REGEN',apply:function(){P.regen+=.8}}
];
function levelUp(){G.level++;G.xp-=G.nextXp;G.nextXp=Math.floor(G.nextXp*1.32+3);G.state='upgrade';levelPending=false;ui.upgrade.classList.remove('hidden');var pool=UPGRADES.slice(),choices=[];while(choices.length<3&&pool.length){choices.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}ui.upgradeCards.innerHTML='';choices.forEach(function(u){var b=document.createElement('button');b.className='upgrade-card';b.innerHTML='<span class="icon">'+u.icon+'</span><h3>'+u.name+'</h3><p>'+u.desc+'</p><small>'+u.tag+'</small>';b.addEventListener('click',function(){u.apply();ui.upgrade.classList.add('hidden');G.state='play';last=performance.now();msg(u.name,'MUTATION COMPLETE',700);tone(260,.3,'triangle',.065,340);updateUI()});ui.upgradeCards.appendChild(b)});updateUI()}
