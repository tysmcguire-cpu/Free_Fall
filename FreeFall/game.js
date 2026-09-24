const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
let W,H,DPR,selected=0,state='menu',x=0,y=0,z=0,time=0,passed=0,last=0,drag=null,keys={},gates=[],best={};
let practice=false,speedFactor=1,checkpoint=null,stars=[],starRecords={},menuTab="play",pickupAt=-10,portalAt=-10;
let visualTime=0,launchElapsed=0;
let starCharge=0,godUntil=0,totalStars=0,nextStarDepth=1000,nextBonusDepth=0;
let infinite=false,infiniteSeed=0,infiniteSource=null,infiniteBest=0,infiniteBestStars=null;try{infiniteBest=Number(localStorage.getItem("freefall-infinite-best"))||0;const saved=JSON.parse(localStorage.getItem('freefall-infinite-record')||'null');if(saved&&Number.isFinite(saved.depth)&&Number.isFinite(saved.stars)){infiniteBest=saved.depth;infiniteBestStars=saved.stars;}}catch{}
function activeLevel(){return infinite?{name:"Infinite",speed:144,end:Infinity,duration:Infinity,palette:infiniteVisualPalette()}:FF.levels[selected];}
try{starRecords=JSON.parse(localStorage.getItem("freefall-stars-v8")||"{}");selected=Math.max(0,Math.min(15,Number(localStorage.getItem("freefall-current"))||0))}catch{}
try{best=JSON.parse(localStorage.getItem('freefall-best-v9')||'{}')}catch{}
function isUnlocked(i){return i<=unlockedLevel();}
function unlockedLevel(){let i=0;while(i<15&&Number.isFinite(best[i]))i++;return i;}
if(!isUnlocked(selected))selected=unlockedLevel();
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
function levelButtons(){ $('levels').innerHTML='';FF.levels.forEach((l,i)=>{const group={0:'Beginner',3:'Easy',7:'Medium',12:'Hard',15:'Extreme'}[i];if(group){const heading=document.createElement('h2');heading.className='difficulty-heading';heading.textContent=group;$('levels').appendChild(heading);}const b=document.createElement('button');b.style.borderLeft='3px solid '+l.palette.accent;b.style.borderRight='3px solid '+l.palette.secondary;b.disabled=!isUnlocked(i);b.setAttribute('aria-label',l.name+(b.disabled?' — locked; complete the previous level':''));b.className='level'+(selected===i?' active':'');b.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b>${l.name}<small>${'★'.repeat(starRecords[i]||0)+'☆'.repeat(3-(starRecords[i]||0))} · ${l.duration}s</small>`;if(b.disabled)b.innerHTML='<b>'+String(i+1).padStart(2,'0')+'</b>'+l.name+'<small>LOCKED</small>';b.onclick=()=>{if(!isUnlocked(i))return;selected=i;gates=FF.gatesFor(l);applyTheme();levelButtons();showTab(practice?'training':'play');$('start').textContent='DESCEND ↘'};$('levels').appendChild(b)})}levelButtons();gates=FF.gatesFor(FF.levels[selected]);
function applyTheme(){const l=FF.levels[selected];$('heroTitle').textContent=l.name;$('chapterLabel').textContent='SECTOR '+(l.chapter+1)+' / LEVEL '+String(selected+1).padStart(2,'0');$('heroStars').textContent='★ '.repeat(starRecords[selected]||0)+'☆ '.repeat(3-(starRecords[selected]||0));$('durationInfo').textContent=l.duration+' SECONDS';try{localStorage.setItem('freefall-current',String(selected))}catch{} $('levelInfo').textContent=FF.levels[selected].description+' · '+Math.round(144*(FF.levels[selected].duration-2.6)/(FF.levels[selected].count-1))+' m spacing · 144 m/s';document.documentElement.style.setProperty('--accent',FF.levels[selected].palette.accent);globalThis.FFLobby?.setTheme?.(l.finale?{...l.palette,bg:'#010101',wall:'#353535',accent:'#ffffff',secondary:'#ff384b'}:l.palette)}
function start(){if(menuTab==='infinite'){startInfinite();return;}infinite=false;if(state==='launching'){$('descentFade').style.animation='enterDrop .35s ease-out forwards';}$('lobby').hidden=true;$('pause').hidden=false;$('nextLevel').hidden=true;applyTheme();checkpoint=null;$('checkpointStatus').textContent='Checkpoint: start of drop';$('practiceControls').hidden=!practice;state='playing';pickupAt=portalAt=-10;x=y=z=time=passed=0;keys={};drag=null;gates=FF.gatesFor(FF.levels[selected],Math.floor(Math.random()*4294967296));stars=FF.starsFor(FF.levels[selected],gates);$('starHud').textContent='☆ ☆ ☆';$('menu').hidden=true;$('result').hidden=true;$('hud').hidden=false;$('levelName').textContent=FF.levels[selected].name.toUpperCase();$('hint').textContent='DRAG TO STEER · WASD / ARROWS · ESC TO PAUSE';}
$('start').onclick=beginDive;
function beginDive(){if(state==='launching')return;if(menuTab!=='infinite'&&!isUnlocked(selected))return;state='launching';$('descentFade').style.animation='none';launchElapsed=0;keys={};drag=null;$('menu').setAttribute('data-launching','true');$('menu').style.pointerEvents='none';$('lobby').hidden=false;$('lobby').setAttribute('data-launching','true');$('launchStatus').textContent='DEPLOYING / '+(menuTab==='infinite'?'INFINITE':FF.levels[selected].name.toUpperCase());}

function finish(win){if(infinite){finishInfinite();return;}$('nextLevel').hidden=!win||selected>=FF.levels.length-1||(practice&&!isUnlocked(selected+1));state=win?'won':'lost';drag=null;if(win&&!practice){starRecords[selected]=Math.max(starRecords[selected]||0,stars.filter(s=>s.collected).length);try{localStorage.setItem('freefall-stars-v8',JSON.stringify(starRecords))}catch{}best[selected]=Math.min(best[selected]||Infinity,time);try{localStorage.setItem('freefall-best-v9',JSON.stringify(best))}catch{}levelButtons()}$('result').hidden=false;$('resultLabel').textContent=practice?'PRACTICE / NO RECORDS':win?'LANDING CONFIRMED':'LINE LOST';$('resultTitle').textContent=win?(FF.levels[selected].finale?'You broke through.':'Beautiful drop.'):'One more fall.';$('resultText').textContent=win&&FF.levels[selected].finale?'CORE RESTORED. Signal clear. All sixteen sectors behind you. '+stars.filter(s=>s.collected).length+'/3 stars recovered.':win?`${FF.levels[selected].name} completed in ${time.toFixed(1)} seconds. ${passed} gates cleared. ${stars.filter(s=>s.collected).length}/3 stars.`:`${Math.floor(z)} meters down. ${passed} gates cleared. Follow the direction signals and steer clear of the beams.`;$('retry').textContent=practice?'RESTART CHECKPOINT ↘':'RETRY DROP ↘';$('hint').textContent=win?'MAKE THE NEXT DROP COUNT':'EVERY FALL TEACHES YOU THE LINE';}
function pause(){$('nextLevel').hidden=true;if(state==='playing'){state='paused';keys={};drag=null;$('result').hidden=false;$('resultLabel').textContent='TAKE A BREATH';$('resultTitle').textContent='Fall paused.';$('resultText').textContent='Your drop will resume from this exact spot.';$('retry').textContent='RESUME ↘'}else if(state==='paused'){state='playing';$('result').hidden=true}}
$('pause').onclick=pause;$('retry').onclick=()=>state==='paused'?pause():practice?restoreCheckpoint():start();$('back').onclick=()=>{state='menu';$('menu').setAttribute('data-launching','false');$('menu').style.pointerEvents='';$('lobby').hidden=false;$('lobby').setAttribute('data-launching','false');$('launchStatus').textContent='SELECT A SECTOR TO DEPLOY';$('pause').hidden=true;checkpoint=null;$('practiceControls').hidden=true;z=x=y=0;$('menu').hidden=false;$('result').hidden=true;$('hud').hidden=true;applyTheme();levelButtons();};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key==='Escape')pause()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{if(state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY}});canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const scale=9/Math.min(W,H);x+=(e.clientX-drag.x)*scale;y+=(e.clientY-drag.y)*scale;x=Math.max(-3.75,Math.min(3.75,x));y=Math.max(-3.75,Math.min(3.75,y));clampPlayer();drag.x=e.clientX;drag.y=e.clientY});for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>drag=null);
function project(a,b,d){const s=Math.min(W,H)*1.15/(Math.max(d,.1)*.23+3);return [W/2+(a-x)*s,H/2+(b-y)*s,s]}
function line(a,b,color,width=1){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function circle(a,b,r,d,color,width=1,fill){const p=project(a,b,d);ctx.beginPath();ctx.arc(p[0],p[1],r*p[2],0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
function baseObstacle(g,d,p,mini=false){
 const proj=mini?(a,b)=>[W-83+a*12,H-115+b*12,12]:(a,b)=>project(a,b,d);
 const disc=(x,y,r,color,fill)=>{const q=proj(x,y);ctx.beginPath();ctx.arc(q[0],q[1],r*q[2],0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}ctx.strokeStyle=color;ctx.lineWidth=mini?1:3;ctx.stroke();};
 if(g.type==='ring'||g.type==='core'){
 // Fill the solid disc outside the moving circular hole, using the same center as collision.
 const outer=proj(0,0),hole=proj(g.ringX,g.ringY);ctx.beginPath();ctx.arc(outer[0],outer[1],4*outer[2],0,Math.PI*2);ctx.moveTo(hole[0]+g.ringRadius*hole[2],hole[1]);ctx.arc(hole[0],hole[1],g.ringRadius*hole[2],0,Math.PI*2);ctx.fillStyle=p.accent+'99';ctx.fill('evenodd');disc(g.ringX,g.ringY,g.ringRadius,p.accent);disc(g.ringX,g.ringY,g.ringRadius+.09,'#ffffff');return;}
 if(g.type==='portal'){disc(g.portalX,g.portalY,1.2,'#ff465c','#ff465c22');const a=proj(g.portalX,g.portalY),b=proj(-g.portalX,-g.portalY);if(!mini){ctx.fillStyle='#ffffff';ctx.font='11px monospace';ctx.textAlign='center';ctx.font='800 '+Math.max(14,Math.min(64,a[2]*.8))+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff2f2';ctx.fillText('5',a[0],a[1]);ctx.textBaseline='alphabetic';const arrowRadius=Math.max(12,a[2]*.76),endAngle=Math.PI*1.65;arc(a,arrowRadius,-.25,endAngle,'#fff2f2',Math.max(1.5,Math.min(3,a[2]*.05)));const tip=[a[0]+Math.cos(endAngle)*arrowRadius,a[1]+Math.sin(endAngle)*arrowRadius],size=Math.max(4,Math.min(9,a[2]*.17)),tx=-Math.sin(endAngle),ty=Math.cos(endAngle);polygon([tip,[tip[0]-tx*size-Math.cos(endAngle)*size*.6,tip[1]-ty*size-Math.sin(endAngle)*size*.6],[tip[0]-tx*size+Math.cos(endAngle)*size*.6,tip[1]-ty*size+Math.sin(endAngle)*size*.6]],'#fff2f2','#fff2f2');}return;}
 if(g.type==='electric'||g.type==='holo'){const angle=g.type==='electric'?(g.electricSide===1?0:Math.PI):g.angle,real=g.type==='electric'||g.real,pts=[],theta=Math.acos(.2/4);for(let a=theta;a<Math.PI*2-theta;a+=.05)pts.push(proj(4*Math.cos(a+angle),4*Math.sin(a+angle)));pts.push(proj(4*Math.cos(-theta+angle),4*Math.sin(-theta+angle)));polygon(pts,g.type==='holo'?(real?p.metal+'f5':p.accent+'08'):p.accent+'88',real?p.accent:p.accent+'22');if(g.type==='electric'){
 // Recessed charge module: only the energized wall carries an indicator.
 const side=-g.electricSide,charge=g.switchIn/2.75;
 polygon([proj(side*1.48,1.87),proj(side*2.23,1.87),proj(side*2.23,-1.87),proj(side*1.48,-1.87)],'#091321',p.accent+'bb');
 for(let i=0;i<16;i++){const low=1.58-i*.20,high=low-.13,amount=Math.max(0,Math.min(1,charge*16-i));
 polygon([proj(side*1.64,low),proj(side*2.07,low),proj(side*2.07,high),proj(side*1.64,high)],p.metal,p.accent+'33');
 if(amount>0)polygon([proj(side*1.64,low),proj(side*(1.64+.43*amount),low),proj(side*(1.64+.43*amount),high),proj(side*1.64,high)],charge<.2?'#ffbb72':'#d2fffb','#ffffff99');}
 for(const yy of [-1.72,1.72]){const q=proj(side*1.855,yy);ctx.beginPath();ctx.arc(q[0],q[1],Math.max(1,q[2]*.055),0,Math.PI*2);ctx.fillStyle=p.accent;ctx.fill();}
 }if(!mini){const q=proj(0,0);ctx.font='bold 12px monospace';ctx.fillStyle='#ffffff';ctx.textAlign='center';}return;}
 if(g.type==='drones'||g.type==='blocks'){for(const b of g.bodies){if(g.type==='drones'){disc(b.x,b.y,b.r+.05,p.wall,p.metal);disc(b.x,b.y,b.r,p.accent,p.metal);disc(b.x-.07,b.y-.07,b.r*.55,p.accent+'55');for(const dx of [-.4,.4]){disc(b.x+dx,b.y-.3,.17,p.accent);disc(b.x+dx,b.y+.3,.17,p.accent);}}else{const pts=[];for(let i=0;i<6;i++)pts.push(proj(b.x+Math.cos(i*Math.PI/3)*b.r,b.y+Math.sin(i*Math.PI/3)*b.r));polygon(pts,p.metal,p.accent);polygon([proj(b.x,b.y),pts[0],pts[1],pts[2]],p.accent+'55',p.accent+'88');polygon([proj(b.x,b.y),pts[3],pts[4],pts[5]],'#030916aa',p.wall);line(proj(b.x-b.r,b.y),proj(b.x+b.r,b.y),p.accent);}}return;}
 if(g.type==='switch'){
  // Circular shutter with a chord cutout: the indicated half is safe.
  const pts=[],theta=Math.acos(.55/4);for(let a=theta;a<=Math.PI*2-theta+.001;a+=.04)pts.push(proj(4*Math.cos(a+g.angle),4*Math.sin(a+g.angle)));pts.push(proj(4*Math.cos(-theta+g.angle),4*Math.sin(-theta+g.angle)));
  polygon(pts,p.metal,g.locked?p.danger:p.accent);for(let j=0;j<5;j++){const angle=g.angle+Math.PI/2+.4+j*.5;line(proj(Math.cos(angle)*3.1,Math.sin(angle)*3.1),proj(Math.cos(angle)*3.8,Math.sin(angle)*3.8),p.accent+'55',2);}
  const c=Math.cos(g.angle),s=Math.sin(g.angle),q=proj(c*2.2,s*2.2),scale=mini?9:Math.min(22,q[2]*.45);
  line([q[0]-c*scale,q[1]-s*scale],[q[0]+c*scale,q[1]+s*scale],p.accent,3);
  line([q[0]+c*scale,q[1]+s*scale],[q[0]+s*scale*.65,q[1]-c*scale*.65],p.accent,3);
  line([q[0]+c*scale,q[1]+s*scale],[q[0]-s*scale*.65,q[1]+c*scale*.65],p.accent,3);
 }else for(const beam of g.segments){const a=proj(beam.ax,beam.ay),b=proj(beam.bx,beam.by),w=Math.max(1,beam.width*a[2]);const end=proj(beam.fullBx??beam.bx,beam.fullBy??beam.by);line(a,end,p.accent+'18',1);if(beam.fire<1&&!mini){glow(a,Math.min(45,a[2]*.6),p.accent);glow(b,Math.min(30,b[2]*.45),'#ffffff');}line(a,b,p.danger+'12',w+15);line(a,b,p.danger+'35',w+7);line(a,b,p.danger,w);line(a,b,'#fff0df',Math.max(.7,w*.25));if(!mini){circle(beam.ax,beam.ay,.16,d,p.accent,2,p.metal);circle(beam.fullBx??beam.bx,beam.fullBy??beam.by,.16,d,p.accent,2,p.metal);}}
}
function draw(){if(state==='menu'||state==='launching'){globalThis.FFLobby?.update(visualTime,state==='launching'?launchElapsed:-1);return;}const l=activeLevel(),p={...(l.finale?FF.finalePalette(time):l.palette)};if(!infinite&&selected===14){const pulse=(1-Math.cos(visualTime*Math.PI*2*.65))/2;p.bg='#010103';p.wall='#'+[Math.round(25+95*pulse),Math.round(3+9*pulse),Math.round(15+49*pulse)].map(v=>v.toString(16).padStart(2,'0')).join('');p.metal='#080309';p.accent='#ff4fa3';}if(l.finale&&time<28){const pulse=(1-Math.cos(visualTime*Math.PI*2*.65))/2,shade=Math.round(22+125*pulse).toString(16).padStart(2,'0');p.bg='#010101';p.wall='#'+shade.repeat(3);p.metal='#080808';p.accent='#'+Math.round(65+190*pulse).toString(16).padStart(2,'0').repeat(3);p.secondary=p.danger='#ff384b';}ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);const atmosphere=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);atmosphere.addColorStop(0,p.wall);atmosphere.addColorStop(.55,p.bg);atmosphere.addColorStop(1,'#020509');ctx.fillStyle=atmosphere;ctx.fillRect(0,0,W,H);
 // Cylindrical ribs, longitudinal power rails and helical conduits; no square gates.
 for(let world=Math.ceil((z+.5)/18)*18+280;world>z+.5;world-=18){const d=world-z;circle(0,0,4,d,p.wall,2);circle(0,0,4.08,d,p.wall);circle(0,0,4,d+1.8,p.metal,3);for(let j=0;j<12;j++){const a=j*Math.PI/6+(selected%3===2?world*.006:0),b=a+(selected%3===2?.1:0);line(project(Math.cos(a)*4,Math.sin(a)*4,d),project(Math.cos(b)*4,Math.sin(b)*4,d+15),j%3===0?p.accent+'88':p.wall,j%3===0?2:1);if(selected%3===1&&j%2===0)circle(Math.cos(a)*3.95,Math.sin(a)*3.95,.12,d,p.danger,2);}}
 if(!infinite){drawSectorWalls(p);drawFinaleWalls(p);}else drawInfiniteWalls(p);
 if(state==='playing')for(let i=0;i<35;i++){const d=((i*9.37-z)%270+270)%270;if(d<.5)continue;const a=i*2.4;line(project(Math.cos(a)*3.8,Math.sin(a)*3.8,d),project(Math.cos(a)*3.8,Math.sin(a)*3.8,d+8),p.accent+'55');}
 if(selected>=14&&l.end-z>0&&l.end-z<650){for(let i=0;i<7;i++)circle(0,0,1.8+i*.27,l.end-z+i*5,p.accent,3);}
 if(l.end-z>0&&l.end-z<340)drawLanding(l.end-z,p);
 for(const item of [...gates.map(g=>({depth:FF.gateAt(g,infinite?z/144:time).z,g})),...stars.filter(s=>!s.collected).map(s=>({depth:s.z-.08,s}))].sort((a,b)=>b.depth-a.depth)){const d=item.depth-z;if(d<.1||d>260)continue;if(item.g){const g=FF.gateAt(item.g,infinite?z/144:time);circle(0,0,4,d+2.4,p.metal,5);circle(0,0,4,d,p.wall,4);circle(0,0,3.97,d,p.accent+'55',1);obstacle(g,d,p);}else drawStar(item.s,d);}
 if(l.finale)drawFinale(p);drawFeedback();const raw=gates.find(g=>g.z>z),target=raw?FF.gateAt(raw,infinite?z/144:time):{type:'landing'},safe=FF.fits(x,y,target);
 ctx.strokeStyle=safe?p.accent:p.danger;ctx.lineWidth=2;ctx.beginPath();ctx.arc(W/2,H/2,6,0,Math.PI*2);ctx.stroke();line([W/2-16,H/2],[W/2-10,H/2],p.accent);line([W/2+10,H/2],[W/2+16,H/2],p.accent);
 if(infinite&&time<godUntil){
  const remaining=Math.max(0,Math.min(1,(godUntil-time)/6));
  const bx=W/2+27,by=H/2-25;
  ctx.save();ctx.fillStyle='#02060feb';ctx.fillRect(bx-3,by-3,16,56);
  ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(bx-1,by-1,12,52);
  ctx.fillStyle='#38ffe2';ctx.shadowColor='#38ffe2';ctx.shadowBlur=8;
  ctx.fillRect(bx+1,by+50-50*remaining,8,50*remaining);
  ctx.shadowBlur=0;ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.font='bold 11px monospace';
  ctx.fillText((godUntil-time).toFixed(1)+'s',bx+18,H/2+4);ctx.restore();
 }
 if(infinite){
  const difficulty=FF.infiniteStage(time)+1;
  ctx.save();ctx.textAlign='right';ctx.shadowColor='#000';ctx.shadowBlur=8;
  ctx.fillStyle='#ffffff';ctx.font='bold '+Math.min(48,Math.max(32,W*.045))+'px system-ui';
  ctx.fillText(String(difficulty).padStart(2,'0')+' / 16',W-25,112);
  ctx.font='bold 11px monospace';ctx.fillStyle=difficulty===16?'#ffbd70':'#d8e8ef';
  ctx.fillText(difficulty===16?'MAX DIFFICULTY':'DIFFICULTY',W-25,132);ctx.restore();
 }
 if(state==='playing'){const mx=W-83,my=H-115;ctx.beginPath();ctx.arc(mx,my,49,0,Math.PI*2);ctx.fillStyle=p.bg;ctx.fill();ctx.strokeStyle=p.wall;ctx.stroke();ctx.strokeStyle=p.accent+'55';ctx.lineWidth=1;for(let i=0;i<24;i++){const a=i*Math.PI/12;line([mx+51*Math.cos(a),my+51*Math.sin(a)],[mx+(i%3?53:56)*Math.cos(a),my+(i%3?53:56)*Math.sin(a)],p.accent+'88');}if(raw)obstacle(target,0,p,true);ctx.beginPath();ctx.arc(mx+x*12,my+y*12,3,0,Math.PI*2);ctx.fillStyle='#ffffff';ctx.fill();ctx.fillStyle=p.accent;ctx.textAlign='center';ctx.font='10px monospace';ctx.fillText(Math.round(l.speed*(practice?speedFactor:1))+' M/S',mx,my+69);ctx.fillText(raw?target.type.toUpperCase():'LANDING',mx,my-62);
 const dir=['RIGHT','DOWN','LEFT','UP'][target.side];ctx.font='bold 13px monospace';ctx.fillText(target.type==='switch'?dir+' OPEN'+(target.locked?' / LOCKED':' / INCOMING'):({ring:'ALIGN WITH THE MOVING APERTURE',core:'ENTER THE CORE',electric:'WATCH THE ACTIVE WALL CHARGE',portal:'↶',drones:'AVOID THE DRONE BODIES',blocks:'WEAVE THROUGH THE DATA',holo:'READ THE WALL SURFACE'}[target.type]||'AVOID THE BEAMS'),W/2,H-55);ctx.font='10px monospace';ctx.fillText(raw?'CONTACT IN '+Math.max(0,(raw.z-z)/(l.speed*(practice?speedFactor:1))).toFixed(1)+'s':'AIM FOR THE CORE',W/2,H-36);}
}
function clampPlayer(){const r=Math.hypot(x,y);if(r>3.6){x*=3.6/r;y*=3.6/r}}
function frame(now){visualTime=now/1000;if(infinite&&state==='playing'){frameInfinite(now);requestAnimationFrame(frame);return;}const realDt=Math.min((now-last)/1000||0,.033),dt=realDt*(practice?speedFactor:1);last=now;if(state==='launching'){launchElapsed+=realDt;if(launchElapsed>=(globalThis.FFLobby?.duration||1.6))start();}if(state==='playing'){const vx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),vy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),norm=Math.hypot(vx,vy)||1;x=Math.max(-3.75,Math.min(3.75,x+vx/norm*6.5*realDt));y=Math.max(-3.75,Math.min(3.75,y+vy/norm*6.5*realDt));clampPlayer();const l=FF.levels[selected],next=z+l.speed*dt;let rewind=null;const hit=FF.crossed(z,next,gates,x,y,time,dt);if(hit<0){const beforeStars=stars.filter(s=>s.collected).length;FF.collectStars(stars,z,next,x,y);if(stars.filter(s=>s.collected).length>beforeStars)pickupAt=time;for(const raw of gates.filter(g=>g.z>z&&g.z<=next)){const dest=FF.redirect(FF.gateAt(raw,time+dt*(raw.z-z)/(next-z)),x,y);if(dest){rewind=dest;}}}$('starHud').textContent=stars.map(s=>s.collected?'★':'☆').join(' ');time+=dt;if(hit>=0){z=gates[hit].z;finish(false)}else{z=next;if(rewind){({x,y,z,time}=rewind);const upcoming=gates.find(g=>g.z>z);if(upcoming){const pose=FF.gateAt(upcoming,upcoming.arrival);let found=false;for(let xx=-2.5;xx<=2.5&&!found;xx+=.25)for(let yy=-2.5;yy<=2.5;yy+=.25)if(FF.fits(xx,yy,pose,.5)){x=xx;y=yy;found=true;break;}}pickupAt=-10;portalAt=time;keys={};drag=null;}passed=gates.filter(g=>g.z<=z).length;if(z>=l.end){z=l.end;finish(FF.fits(x,y,{type:'landing'}))}}$('depth').textContent=Math.floor(z)+' m';$('progress').style.width=(z/l.end*100)+'%';$('gates').textContent=passed+' / '+gates.length+' HAZARDS';$('clock').textContent=Math.max(0,l.duration-time).toFixed(1)+' s LEFT';}draw();requestAnimationFrame(frame)}requestAnimationFrame(frame);

function setMode(value){if(state!=='menu')return;practice=value;speedFactor=1;$('speed').value='1';$('speedValue').textContent='1.00× · 144 m/s';$('normalMode').setAttribute('aria-pressed',String(!practice));$('practiceMode').setAttribute('aria-pressed',String(practice));$('start').textContent=practice?'PRACTICE DROP ↘':'TAKE THE FALL ↘';}
$('normalMode').onclick=()=>setMode(false);$('practiceMode').onclick=()=>setMode(true);
$('speed').oninput=()=>{if(!practice)return;speedFactor=Math.max(.25,Math.min(1.5,Number($('speed').value)||1));$('speedValue').textContent=speedFactor.toFixed(2)+'× · '+Math.round(144*speedFactor)+' m/s';};
function saveCheckpoint(){if(!practice||state!=='playing')return;checkpoint={x,y,z,time,passed,starFlags:stars.map(s=>s.collected)};$('checkpointStatus').textContent='Checkpoint saved: '+Math.floor(z)+' m';}
function restoreCheckpoint(){if(!practice)return;if(!checkpoint){const savedGates=gates;start();gates=savedGates;stars=FF.starsFor(FF.levels[selected],gates);return;}({x,y,z,time,passed}=checkpoint);pickupAt=portalAt=-10;stars.forEach((s,i)=>s.collected=checkpoint.starFlags[i]);state='playing';keys={};drag=null;$('result').hidden=true;last=0;}
$('checkpoint').onclick=saveCheckpoint;$('restore').onclick=()=>{if(practice&&state!=='menu')restoreCheckpoint()};applyTheme();

function drawStar(s,d){const p=project(s.x,s.y,d),pts=[],rotation=Math.sin(time*1.8+s.z)*.12;glow(p,.85*p[2],'#ffdb73');for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5+rotation,r=(i%2?.23:.52)*p[2];pts.push([p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r]);}polygon(pts,'#ffd16d','#fff7d4');for(let i=0;i<10;i+=2)polygon([p,pts[i],pts[(i+1)%10]],i%4?'#e6a83f':'#fff0bd','#fff0bd44');arc(p,.7*p[2],time*.8,time*.8+Math.PI*1.3,'#ffdf8e88',1);}
function showTab(tab){menuTab=tab;if(state==='menu'){infinite=tab==='infinite';if(infinite){infiniteSeed=Math.floor(Math.random()*4294967296);const palette=FF.infinitePalette(0,infiniteSeed);document.documentElement.style.setProperty('--accent',palette.accent);globalThis.FFLobby?.setTheme?.(palette);}else applyTheme();}for(const [id,value]of [['playTab','play'],['levelsTab','levels'],['trainingTab','training'],['infiniteTab','infinite']])$(id).setAttribute('aria-pressed',String(tab===value));$('hero').hidden=tab==='levels'||tab==='infinite';$('infinitePanel').hidden=tab!=='infinite';$('start').hidden=tab==='levels';$('levelPanel').hidden=tab!=='levels';$('trainingInfo').hidden=tab!=='training';setMode(tab==='training');$('start').textContent=tab==='infinite'?'DESCEND ↘':practice?'PRACTICE '+FF.levels[selected].name.toUpperCase()+' ↘':'PLAY '+FF.levels[selected].name.toUpperCase()+' ↘';}
$('infiniteTab').onclick=()=>showTab('infinite');$('playTab').onclick=()=>showTab('play');$('levelsTab').onclick=()=>showTab('levels');$('trainingTab').onclick=()=>showTab('training');showTab('play');

function arc(q,r,a,b,color,width=1){ctx.beginPath();ctx.arc(q[0],q[1],Math.max(.1,r),a,b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function glow(q,r,color){if(r<1)return;const g=ctx.createRadialGradient(q[0],q[1],0,q[0],q[1],r);g.addColorStop(0,color+'55');g.addColorStop(.4,color+'19');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(q[0]-r,q[1]-r,r*2,r*2);}
function renderObstacle(g,d,p,mini=false){p={...p,accent:p.secondary};baseObstacle(g,d,p,mini);if(mini||d>160)return;
 if(!infinite&&FF.levels[selected].finale&&FF.finalePhase(time)==='glitch'){const q=project(0,0,d),r=q[2]*3.9;for(let i=0;i<3;i++){const a=time*.6+i*2.1;arc([q[0]+Math.sin(time*3+i)*3,q[1]],r,a,a+.35,i%2?'#ff7ed555':'#8bffe655',2);}}

 const at=(a,b)=>project(a,b,d),motion=time;
 if(g.type==='electric'||g.type==='holo'){
  // Fine circuit veins stay on the solid half. The open side remains uncluttered.
  const angle=g.type==='electric'?(g.electricSide===1?0:Math.PI):g.angle,c=Math.cos(angle),sn=Math.sin(angle);
  const wall=(u,v)=>at(u*c-v*sn,u*sn+v*c);
  if(g.type==='holo'){
   if(g.real){
    // Continuous reinforced surface: ribs, rivets, and a bright uninterrupted edge.
    for(let i=0;i<5;i++){const u=-.65-i*.58,v=Math.sqrt(16-u*u)-.25;line(wall(u,-v),wall(u,v),'#020813aa',7);line(wall(u-.04,-v),wall(u-.04,v),p.accent+'99',2);for(const yv of [-v+.18,v-.18])arc(wall(u,yv),Math.max(1,at(0,0)[2]*.055),0,Math.PI*2,'#daefff',1);}
   }else{
    // Broken scan ribbons and drifting fragments reveal the shaft through the projection.
    for(let row=0;row<11;row++){const v=-2.7+row*.52,uMin=-Math.sqrt(Math.max(0,16-v*v))+.15;for(let col=0;col<3;col++){const u=uMin+col*.9+Math.sin(time*.7+row)*.12;if(u<-.45)line(wall(u,v),wall(Math.min(-.25,u+.48),v),p.accent+'55',1);}}
    for(let j=0;j<9;j++){const u=-.7-(j%3)*.9,v=((j*.63+time*.25)%4.8)-2.4;line(wall(u,v),wall(u+.14,v+.12),p.accent+'88',1);}
   }
  }

  for(let i=0;i<6;i++){const u=-.55-i*.45,v=Math.sqrt(16-u*u)-.2;line(wall(u,-v),wall(u,v),p.accent+(g.type==='holo'&&!g.real?'19':'35'));const scan=Math.sin(time*.65+i)*v;line(wall(u,scan-.13),wall(u,scan+.13),p.accent+'aa',2);}
  if(g.type==='electric'){const side=-g.electricSide;const q=at(side*1.85,0);glow(q,Math.min(65,q[2]*1.7),p.accent);}
 }
 if(g.type==='ring'||g.type==='core'){
  const q=at(g.ringX,g.ringY),r=g.ringRadius*q[2];
  arc(q,r+3,0,Math.PI*2,p.accent+'44',7);
  for(let i=0;i<8;i++){const a=i*Math.PI/4+motion*.2;arc(q,r+Math.min(10,q[2]*.2),a,a+.35,p.accent,2);}
 }
 if(g.type==='portal'){
  for(const [px,py,r,color,dir]of [[g.portalX,g.portalY,1.2,'#ff465c',1]]){const q=at(px,py);glow(q,r*q[2]*1.5,color);for(let j=0;j<3;j++)arc(q,r*q[2]*(.72+j*.15),motion*dir*(1+j*.3)+j*2,motion*dir*(1+j*.3)+j*2+1.8,color+(j===2?'ff':'88'),2);}
  const a=at(g.portalX,g.portalY),b=at(g.portalX,g.portalY-1.6);for(let i=0;i<5;i++){const t=(motion*.4+i/5)%1,q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];arc(q,2,0,Math.PI*2,'#ff9ba7',2);}
 }
 if(g.type==='drones')for(const b of g.bodies){const q=at(b.x,b.y);arc(q,b.r*q[2]*.7,0,Math.PI*2,p.wall,3);glow(q,b.r*q[2],p.accent);line(at(b.x-.16,b.y),at(b.x+.16,b.y),'#ffffff',2);for(const dx of [-.4,.4])for(const dy of [-.3,.3]){const r=at(b.x+dx,b.y+dy);arc(r,.14*r[2],motion*9,motion*9+Math.PI*1.5,p.accent+'aa',2);}}
 if(g.type==='blocks')for(const b of g.bodies){const q=at(b.x,b.y);for(let i=0;i<3;i++)line(at(b.x-.2,b.y-.17+i*.14),at(b.x+.1+(i%2)*.13,b.y-.17+i*.14),p.accent+'aa',1);line(at(b.x,b.y-b.r),q,p.accent+'88');}
 if(g.type==='switch'){
  const c=Math.cos(g.angle),sn=Math.sin(g.angle),q=at(c*2.2,sn*2.2);arc(q,Math.min(30,q[2]*.7),0,Math.PI*2,p.accent+'44');
  for(let i=0;i<3;i++){const distance=1.1+i*.43,alpha=Math.round(80+130*(.5+.5*Math.sin(time*3-i))).toString(16).padStart(2,'0');line(at(c*distance-sn*.2,sn*distance+c*.2),at(c*(distance+.2),sn*(distance+.2)),p.accent+alpha,2);line(at(c*distance+sn*.2,sn*distance-c*.2),at(c*(distance+.2),sn*(distance+.2)),p.accent+alpha,2);}
 }
 for(const beam of g.segments||[]){const a=at(beam.ax,beam.ay),b=at(beam.bx,beam.by);for(const q of [a,b]){arc(q,Math.max(2,q[2]*.2),0,Math.PI*2,p.wall,3);arc(q,Math.max(1,q[2]*.11),0,Math.PI*2,'#eaffff',1);}const f=(time*.5+g.phase)%1;line([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],[a[0]+(b[0]-a[0])*Math.min(1,f+.08),a[1]+(b[1]-a[1])*Math.min(1,f+.08)],'#ffffffaa',2);}
}
function drawFeedback(){const age=time-pickupAt;if(age>=0&&age<.65){const t=age/.65;ctx.globalAlpha=1-t;arc([W/2,H/2],20+t*55,0,Math.PI*2,'#ffe4a2',2);ctx.fillStyle='#ffe4a2';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('STAR COLLECTED',W/2,H/2-40-t*25);ctx.globalAlpha=1;}const warp=time-portalAt;if(warp>=0&&warp<.4){ctx.globalAlpha=(1-warp/.4)*.2;ctx.fillStyle='#80dcff';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.fillStyle='#bfefff';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText('↶',W/2,H/2-35);for(let i=0;i<3;i++)arc([W/2,H/2],40+warp*350+i*25,0,Math.PI*2,'#9deaff88',2);}}

$('nextLevel').onclick=()=>{if(state!=='won'||selected>=FF.levels.length-1||!isUnlocked(selected+1))return;selected++;levelButtons();start();};

function drawFinale(p){const phase=FF.finalePhase(time);
 if(state==='won'){
  const cx=W/2,cy=H/2;glow([cx,cy],Math.min(W,H)*.7,'#a3ffdc');
  for(let i=0;i<65;i++){const a=i*2.399,r=30+((visualTime*32+i*19)%Math.max(W,H));const q=[cx+Math.cos(a)*r,cy+Math.sin(a)*r];line(q,[q[0]+Math.cos(a)*9,q[1]+Math.sin(a)*9],i%3?'#b2ffdc88':'#ffe0a9',2);}
  for(let i=0;i<4;i++)arc([cx,cy],90+((visualTime*15+i*65)%280),0,Math.PI*2,'#adffdb22',1);return;
 }
 if(state!=='playing')return;
 ctx.textAlign='center';ctx.font='bold 11px monospace';ctx.fillStyle=p.accent;
 const label=phase==='assembly'?'SYSTEMS ONLINE / '+Math.min(15,1+Math.floor(Math.max(0,time-2)/1.7))+' OF 15':phase==='spectrum'?'SPECTRUM CASCADE':phase==='glitch'?'SIGNAL FRACTURE / KEEP FALLING':'CORE BREACH / FOLLOW THE LIGHT';
 ctx.fillText(label,W/2,85);
 if(phase==='glitch'){
  // Peripheral signal tears: the central aiming area stays readable.
  const pulse=.5+.5*Math.sin(time*4);ctx.fillStyle='#75ffe91a';for(let i=0;i<7;i++){const yy=((i*113+time*34)%H),ww=W*(.06+.05*Math.sin(i+time));ctx.fillRect(i%2?W-ww:0,yy,ww,2+i%3);}
  ctx.strokeStyle='#e980d055';ctx.lineWidth=1;ctx.strokeRect(8+pulse*8,8,W-16-pulse*16,H-16);ctx.fillStyle='#b2ffdd';ctx.font='9px monospace';ctx.fillText('RECOVERING SIGNAL '+Math.floor((time-40)/7*100)+'%',W/2,105);
 }
 if(phase==='escape'){
  const t=(time-47)/3,cx=W/2,cy=H/2;for(let i=0;i<32;i++){const a=i*Math.PI/16,r=80+(1-t)*Math.min(W,H)*.55;line([cx+Math.cos(a)*r,cy+Math.sin(a)*r],[cx+Math.cos(a)*(r+40),cy+Math.sin(a)*(r+40)],'#caffef66',2);}
  glow([cx,cy],Math.min(W,H)*(.25+t*.35),'#b6ffe2');ctx.font='bold 16px monospace';ctx.fillStyle='#effff9';ctx.fillText('ASCEND',cx,125);
 }
}

// Decorative patterns live on the cylindrical wall, behind gameplay objects.
function drawSectorWalls(p,design=selected){
 if(design<7||design>13)return;
 const t=state==='menu'?visualTime:time;
 const point=(a,d)=>project(Math.cos(a)*4.035,Math.sin(a)*4.035,d);
 const stroke=(a,d,b,e,color,width=1.5)=>line(point(a,d),point(b,e),color,width);
 const band=(a,b,d,color,width=2)=>{for(let k=0;k<10;k++)stroke(a+(b-a)*k/10,d,a+(b-a)*(k+1)/10,d,color,width);};
 for(let world=Math.ceil((z+1)/24)*24+240;world>z+1;world-=24){
  const d=world-z,row=Math.floor(world/24),fade=Math.max(.12,1-d/290);
  const ink=(strength)=>p.accent+Math.round(255*strength*fade).toString(16).padStart(2,'0');
  if(design===7){ // Cobalt: slow pendulum waves along opposite walls.
   for(let j=0;j<6;j++){const a=j*Math.PI/3+Math.sin(t*1.4+row*.45)*.2,b=j*Math.PI/3+Math.sin(t*1.4+(row+1)*.45)*.2;stroke(a,d,b,d+24,ink(.75),2);band(a-.06,a+.06,d,ink(.45));}
  }else if(design===8){ // Citron: illuminated diamond lattice.
   for(let j=0;j<8;j++){const a=j*Math.PI/4,bright=.25+.5*(.5+.5*Math.sin(row*.7-t*2));stroke(a,d,a+.18,d+12,ink(bright));stroke(a+.18,d+12,a,d+24,ink(bright));stroke(a,d,a-.18,d+12,ink(bright));stroke(a-.18,d+12,a,d+24,ink(bright));}
  }else if(design===9){ // Copper: circuit tracks carrying moving signals.
   for(let j=0;j<6;j++){const a=j*Math.PI/3,b=a+(row%2?.16:-.16);stroke(a,d,a,d+8,ink(.35));stroke(a,d+8,b,d+12,ink(.35));stroke(b,d+12,b,d+24,ink(.35));const u=((t*18+row*5)%24+24)%24;band(u<10?a-.035:b-.035,u<10?a+.035:b+.035,d+u,ink(.9),3);}
  }else if(design===10){ // Orchid: paired counter-winding ribbons.
   for(let j=0;j<4;j++)for(const dir of [-1,1]){const a=j*Math.PI/2+dir*(world*.018+t*.3);stroke(a,d,a+dir*.432,d+24,ink(dir===1?.6:.3),2);}
  }else if(design===11){ // Pearl: luminous crown scallops with a gentle shimmer.
   for(let j=0;j<12;j++){const a=j*Math.PI/6,bright=.3+.45*(.5+.5*Math.sin(t*1.5+row*.6+j*.5));stroke(a,d+9,a+Math.PI/12,d,ink(bright),2);stroke(a+Math.PI/12,d,a+Math.PI/6,d+9,ink(bright),2);band(a+.06,a+.12,d+13,ink(.35),2);}
  }else if(design===12){ // Tangerine: rotating segmented turbine bands.
   for(let j=0;j<8;j++){const a=j*Math.PI/4+t*.45+row*.12;band(a,a+.3,d,ink(.65),3);stroke(a+.3,d,a+.38,d+7,ink(.4),2);}
  }else{ // Teal: broken conduits with pulses moving through the gaps.
   for(let j=0;j<8;j++){const a=j*Math.PI/4;stroke(a,d,a,d+7,ink(.4),2);stroke(a,d+15,a,d+24,ink(.4),2);const charge=.5+.5*Math.sin(t*2.2-row*.65-j*.5);band(a-.08,a+.08,d+11,ink(.15+.7*charge),2);}
  }
 }
}

// Finale architecture stays on the shaft surface and renders behind obstacles.
function drawFinaleWalls(p,force=false){
 if(!force&&!FF.levels[selected].finale)return;
 const t=state==='menu'?visualTime:time,phase=force?'spectrum':FF.finalePhase(time);
 const assembly=phase==='assembly',spectrum=phase==='spectrum',glitch=phase==='glitch',escape=phase==='escape';
 const progress=assembly?Math.min(1,time/28):1;
 const point=(a,d)=>project(Math.cos(a)*4.04,Math.sin(a)*4.04,d);
 const stroke=(a,d,b,e,c,w=1.5)=>line(point(a,d),point(b,e),c,w);
 const band=(a,b,d,c,w=2)=>{for(let k=0;k<8;k++)stroke(a+(b-a)*k/8,d,a+(b-a)*(k+1)/8,d,c,w);};
 for(let world=Math.ceil((z+1)/28)*28+252;world>z+1;world-=28){
  const d=world-z,row=Math.floor(world/28),fade=Math.max(.08,1-d/310);
  const color=assembly?'#ffffff':p.accent;
  const ink=(v,c=color)=>c+Math.round(Math.min(1,v)*fade*255).toString(16).padStart(2,'0');
  const pulse=.45+.55*(.5+.5*Math.sin(t*2-row*.55));
  // Layer one: plated ribs with fine engraved edges and traveling charge.
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6,offset=glitch?Math.sin(row*7+j*13+Math.floor(t*5))*.025:0;
   band(a+.025+offset,a+.46+offset,d,ink(.3*pulse),2);
   band(a+.06,a+.43,d+2,ink(.14),1);
   stroke(a+.025,d,a+.025,d+24,ink(.16));
   const travel=((t*(escape?42:12)+j*3+row*5)%24+24)%24;
   stroke(a+.025,d+travel,a+.025,d+Math.min(24,travel+3),ink(.7*pulse),2);
   // Layer two: inset diamond circuit panels fill in as systems assemble.
   if(j%3===0||progress>.28){
    stroke(a+.12,d+14,a+.25,d+5,ink(.26));stroke(a+.25,d+5,a+.38,d+14,ink(.26));
    stroke(a+.38,d+14,a+.25,d+23,ink(.26));stroke(a+.25,d+23,a+.12,d+14,ink(.26));
    band(a+.21,a+.29,d+14,ink(.65*pulse),2);
   }
   // Layer three: tiny sequential capacitor marks around every rib.
   if(progress>.55)for(let k=0;k<3;k++){
    const active=(Math.floor(t*3)+row+j)%3===k;
    stroke(a+.18+k*.055,d+25,a+.18+k*.055,d+27,ink(active?.65:.12),active?2:1);
   }
  }
  // Opposing helical conduits wrap the cylinder, never crossing its interior.
  if(progress>.12)for(let j=0;j<6;j++)for(const dir of [-1,1]){
   const a=j*Math.PI/3+dir*(world*.012+t*(escape?.75:.16));
   const c=ink(dir===1?.34:.18,spectrum&&dir<0?p.secondary:color);
   stroke(a,d,a+dir*.336,d+28,c,2);
  }
  // The spectrum opens rotating segmented halos along the walls.
  if(spectrum||escape)for(let j=0;j<8;j++){
   const a=j*Math.PI/4+t*(escape?.9:.35)+row*.18;
   band(a,a+.34,d+9,ink(.6),3);band(a+.08,a+.27,d+12,ink(.3,p.secondary),1);
  }
  // Deterministic broken signals provide a glitch without a full-screen flash.
  if(glitch)for(let j=0;j<7;j++){
   const seed=Math.sin(row*17+j*31+Math.floor(t*6)*3),a=j*Math.PI*2/7+seed*.12;
   band(a,a+.06+Math.abs(seed)*.2,d+7+j*2,ink(.4,j%2?'#ff557f':'#d9fff7'),2);
   if(seed>.2)stroke(a,d+8,a+.025,d+17,ink(.3,'#ff557f'),2);
  }
  // Escape: long luminous wall lanes accelerate toward the restored core.
  if(escape)for(let j=0;j<12;j++){
   const a=j*Math.PI/6+t*.08;
   stroke(a,d,a,d+26,ink(.5,'#e5fff5'),2);
   stroke(a-.05,d+8,a,d+2,ink(.5));stroke(a+.05,d+8,a,d+2,ink(.5));
  }
 }
}

$('pause').hidden=true;

function fillInfinite(){while(!gates.length||gates[gates.length-1].z<z+650)gates.push(infiniteSource.next(arrival=>{const distance=Math.max(0,arrival*144-z),boost=Math.max(0,godUntil-time),boostDistance=boost*216;return FF.infiniteStage(time+(distance<=boostDistance?distance/216:boost+(distance-boostDistance)/144));}));gates=gates.filter(g=>g.z>z-160);}
function startInfinite(){infinite=true;practice=false;speedFactor=1;if(state!=='launching')infiniteSeed=Math.floor(Math.random()*4294967296);infiniteSource=FF.infiniteGenerator(infiniteSeed);time=z=x=y=passed=0;starCharge=godUntil=totalStars=0;nextStarDepth=1000;nextBonusDepth=0;last=0;keys={};drag=null;stars=[];gates=[];fillInfinite();pickupAt=portalAt=-10;checkpoint=null;if(state==='launching')$('descentFade').style.animation='enterDrop .35s ease-out forwards';state='playing';$('lobby').hidden=true;$('menu').hidden=true;$('result').hidden=true;$('practiceControls').hidden=true;$('nextLevel').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('hint').textContent='INFINITE / HOW FAR CAN YOU FALL?';updateInfiniteHud();}
function updateInfiniteHud(){const stage=FF.infiniteStage(time),god=time<godUntil;$('levelName').textContent=god?'GOD MODE / '+Math.max(0,godUntil-time).toFixed(1)+'s':'INFINITE / '+(stage===15?'MAX DIFFICULTY':('DIFFICULTY '+(stage+1)+'/16'));$('depth').textContent=Math.floor(z)+' m · '+totalStars+' stars';$('gates').textContent=passed+' CLEARED';$('starHud').textContent=god?'★ ★ ★ / INVINCIBLE':'★'.repeat(starCharge)+'☆'.repeat(3-starCharge);$('clock').textContent=time.toFixed(1)+' s';$('progress').style.width=(god?100:starCharge/3*100)+'%';}
function placeInfiniteStar(depth){const g=gates.find(g=>g.z>=depth),pose=g?FF.gateAt(g,g.arrival):null;let sx=0,sy=0;for(let i=0;i<64;i++){const angle=(depth*.731+i*2.399),r=.5+(i%7)*.3;const xx=Math.cos(angle)*r,yy=Math.sin(angle)*r;if(!pose||FF.fits(xx,yy,pose,.55)){sx=xx;sy=yy;break;}}stars.push({x:sx,y:sy,z:depth,collected:false});}
function fillInfiniteStars(){while(nextStarDepth<z+650){placeInfiniteStar(nextStarDepth);nextStarDepth+=2400;}if(time<godUntil){nextBonusDepth=Math.max(nextBonusDepth,z+45);while(nextBonusDepth<z+650){placeInfiniteStar(nextBonusDepth);nextBonusDepth+=700;}}stars=stars.filter(s=>s.z>z-10);}
function takeInfiniteStar(s){s.collected=true;totalStars++;pickupAt=time;if(time>=godUntil){starCharge++;if(starCharge===3){starCharge=0;godUntil=time+6;nextBonusDepth=z+65;}}}
function frameInfinite(now){let remaining=Math.min((now-last)/1000||0,.033);last=now;const vx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),vy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0),norm=Math.hypot(vx,vy)||1;
while(remaining>1e-8&&state==='playing'){const god=time<godUntil,dt=Math.min(remaining,.008,god?godUntil-time:Infinity),speed=god?216:144;x+=vx/norm*6.5*dt;y+=vy/norm*6.5*dt;clampPlayer();fillInfinite();fillInfiniteStars();const next=z+speed*dt,hit=god?-1:FF.crossed(z,next,gates,x,y,z/144,speed*dt/144),hitDepth=hit<0?Infinity:gates[hit].z;
for(const s of stars.filter(s=>!s.collected&&s.z>z&&s.z<=next&&s.z<=hitDepth).sort((a,b)=>a.z-b.z)){if(Math.hypot(x-s.x,y-s.y)<=.65)takeInfiniteStar(s);}
if(hit>=0&&time>=godUntil){const travelled=hitDepth-z;time+=travelled/speed;z=hitDepth;finishInfinite();}else{passed+=gates.filter(g=>g.z>z&&g.z<=next).length;z=next;time+=dt;}remaining-=dt;}
updateInfiniteHud();draw();}
function infiniteVisualPalette(){const boundary=time<90?Math.floor(time/12)*12:90+Math.floor((time-90)/12)*12,current=FF.infinitePalette(time,infiniteSeed),previous=FF.infinitePalette(Math.max(0,boundary-.001),infiniteSeed);const mix=(a,b,f)=>'#'+a.slice(1).match(/../g).map((v,i)=>Math.round(parseInt(v,16)*(1-f)+parseInt(b.slice(1+i*2,3+i*2),16)*f).toString(16).padStart(2,'0')).join('');const blend=Math.min(1,(time-boundary)/1.4);const p=Object.fromEntries(Object.keys(current).map(k=>[k,mix(previous[k],current[k],blend)]));if(time<godUntil){const pos=time*1.4,i=Math.floor(pos),a=FF.infinitePalette((15+i)*12,infiniteSeed),b=FF.infinitePalette((16+i)*12,infiniteSeed);const weight=Math.min(1,(6-(godUntil-time))/.3,(godUntil-time)/.35);for(const k of Object.keys(p))p[k]=mix(p[k],mix(a[k],b[k],pos-i),Math.max(0,weight));}return p;}
function drawInfiniteWalls(p){const stage=Math.floor(time/12),blend=Math.min(1,time%12/1.4);const choose=index=>{let n=(infiniteSeed^Math.imul(index+1,2654435761))>>>0;n=Math.imul(n^(n>>>16),2246822507)>>>0;return (n^(n>>>13))>>>0;};const layer=(index,opacity)=>{if(opacity<=0)return;const design=choose(index)%8;ctx.save();ctx.globalAlpha=opacity;if(design===7)drawFinaleWalls(p,true);else drawSectorWalls(p,7+design);ctx.restore();};layer(Math.max(0,stage-1),1-blend);layer(stage,blend);}

function finishInfinite(){state='lost';drag=null;keys={};if(z>infiniteBest||(z===infiniteBest&&(infiniteBestStars===null||totalStars>infiniteBestStars))){infiniteBest=z;infiniteBestStars=totalStars;try{localStorage.setItem('freefall-infinite-record',JSON.stringify({depth:z,stars:totalStars}));localStorage.setItem('freefall-infinite-best',String(z));}catch{}}$('nextLevel').hidden=true;$('result').hidden=false;$('resultLabel').textContent='INFINITE / RUN COMPLETE';$('resultTitle').textContent='One more descent.';$('resultText').textContent=Math.floor(z)+' meters · '+time.toFixed(1)+' seconds · '+passed+' hazards cleared · '+totalStars+' stars. Best: '+Math.floor(infiniteBest)+' m · '+(infiniteBestStars===null?'stars not recorded':infiniteBestStars+' stars')+'.';$('retry').textContent='RETRY INFINITE ↘';}

// Entrance effects finish well before contact; radar and collision geometry stay stable.
function obstacle(g,d,p,mini=false){
 if(mini||(g.segments&&g.segments.length)||d<=160){renderObstacle(g,d,p,mini);return;}
 const u=Math.max(0,Math.min(1,(260-d)/100)),ease=1-Math.pow(1-u,3),q=project(0,0,d),r=4.2*q[2];
 ctx.save();ctx.globalAlpha*=ease;
 if(g.type==='ring'||g.type==='core'){
  // One actuator stroke closes the iris, followed by a small locking settle.
  const travel=Math.max(0,Math.min(1,(u-.05)/.7));
  const closure=travel*travel*(3-2*travel);
  const lock=u>.75&&u<.9?Math.sin((u-.75)/.15*Math.PI)*.045:0;
  const opening=g.ringRadius+(6-g.ringRadius)*(1-closure)-lock;
  renderObstacle({...g,ringRadius:opening},d,p,false);
  const hub=project(g.ringX,g.ringY,d),radius=opening*hub[2];
  for(let i=0;i<8;i++){const angle=i*Math.PI/4;
   line([hub[0]+Math.cos(angle)*(radius+2),hub[1]+Math.sin(angle)*(radius+2)],
        [hub[0]+Math.cos(angle)*(radius+Math.max(4,hub[2]*.18)),hub[1]+Math.sin(angle)*(radius+Math.max(4,hub[2]*.18))],p.secondary+'aa',2);
  }
  ctx.restore();return;
 }else if(g.type==='switch'||g.type==='electric'){
  // Panels slide inward from their own side of the shaft and settle into place.
  const angle=g.type==='electric'?(g.electricSide===1?0:Math.PI):g.angle;
  const travel=(1-ease)*r*1.4;
  ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.clip();
  ctx.translate(-Math.cos(angle)*travel,-Math.sin(angle)*travel);
 }else if(g.type==='holo'){
  // Staggered horizontal pieces lock together into the holographic panel.
  for(let i=0;i<8;i++){
   const progress=Math.max(0,Math.min(1,(u-i*.035)/.755)),settle=1-Math.pow(1-progress,3);
   ctx.save();ctx.beginPath();ctx.rect(q[0]-r,q[1]-r+i*r/4,2*r,r/4+.5);ctx.clip();
   ctx.translate((i%2?1:-1)*(1-settle)*r*1.6,0);
   renderObstacle(g,d,p,false);ctx.restore();
  }
  ctx.restore();return;
 }else if(g.type==='drones'||g.type==='blocks'){
  g={...g,bodies:g.bodies.map((b,i)=>({...b,x:b.x+(i%2?1:-1)*(1-ease)*2,y:b.y-(1-ease),r:b.r*(.25+.75*ease)}))};
 }else{
  // Apertures unfold from a thin ring; portals spiral into their full size.
  ctx.translate(q[0],q[1]);if(g.type==='portal')ctx.rotate((1-ease)*1.5);ctx.scale(.3+.7*ease,.08+.92*ease);ctx.translate(-q[0],-q[1]);
 }
 renderObstacle(g,d,p,false);ctx.restore();
}

function drawLanding(d,p){
 circle(0,0,3.96,d+3,p.wall,5,p.metal);circle(0,0,3.94,d,p.accent+'88',2,p.metal);
 // Radial armor plates surrounding the safe landing pad.
 for(let i=0;i<16;i++){const a=i*Math.PI/8,b=a+Math.PI/8-.025;
  polygon([project(Math.cos(a)*2.02,Math.sin(a)*2.02,d-.1),project(Math.cos(a)*3.8,Math.sin(a)*3.8,d-.1),project(Math.cos(b)*3.8,Math.sin(b)*3.8,d-.1),project(Math.cos(b)*2.02,Math.sin(b)*2.02,d-.1)],i%2?p.wall:p.metal,p.accent+'44');
  const angle=a+.08;line(project(Math.cos(angle)*2.45,Math.sin(angle)*2.45,d-.2),project(Math.cos(angle)*2.95,Math.sin(angle)*2.95,d-.2),p.accent+'99',2);
 }
 circle(0,0,1.8,d-.3,p.accent,4,'#06131b');circle(0,0,1.65,d-.35,p.secondary,2);circle(0,0,1.35,d-.4,p.accent+'66',1,p.accent+'18');
 const q=project(0,0,d-.5);glow(q,q[2]*1.45,p.accent);
 for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.12;arc(q,q[2]*1.5,a,a+.35,p.accent,2);}
 ctx.save();ctx.textAlign='center';ctx.fillStyle='#efffff';ctx.font='bold '+Math.max(9,Math.min(30,q[2]*.23))+'px monospace';ctx.fillText('LAND HERE',q[0],q[1]);ctx.restore();
}

