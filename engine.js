(function(root){
const catalog=[
 ['Ion Circuit','#63f5ed','laser','Parallel laser slaloms'],
 ['Solar Forge','#ffc15b','sweep','Heavy sweeping piston beams'],
 ['Violet Rift','#bc8cff','helix','Twin spiraling laser rails'],
 ['Rose Relay','#ff8fc7','switch','Directional half-disc shutters'],
 ['Emerald Rotor','#52e79d','rotor','Rotating cross turbines'],
 ['Glacier Needle','#bceaff','needle','Three sweeping spoke blades'],
 ['Crimson Comb','#ff5266','comb','Offset triple laser combs'],
 ['Cobalt Pendulum','#6794ff','pendulum','Oscillating angled arms'],
 ['Citron Prism','#d9ef58','triangle','Spinning triangular frames'],
 ['Copper Fork','#dd9669','fork','Turning Y-shaped machinery'],
 ['Orchid Scissor','#e174ef','scissor','Counter-swinging laser blades'],
 ['Pearl Crown','#e8e0cd','crown','Orbiting hexagonal laser crowns'],
 ['Tangerine Fan','#ff963e','fan','Five-blade rotating fans'],
 ['Teal Breaker','#a879ed','broken','Broken rails with sliding gaps'],
 ['Ruby Nexus','#f24992','nexus','Nested counter-rotating triangles']
];
const tint=(hex,f)=>'#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*f).toString(16).padStart(2,'0')).join('');
const secondaryColors=['#a0fff5','#ffdc91','#dcc0ff','#ffc0df','#9affc8','#e0f5ff','#ff96a0','#aac5ff','#efffa0','#f4c5a0','#f2b0fa','#ff5266','#ffc183','#88ead7','#ff9bc4'];
const makePalette=(color,secondary)=>({bg:tint(color,.055),wall:tint(color,.38),accent:color,secondary,danger:secondary,metal:tint(secondary,.18)});
const levels=catalog.map(([name,color,type,description],i)=>({name,speed:144,duration:45-i,end:144*(45-i),count:28+i*3,signature:type,palette:makePalette(color,secondaryColors[i]),pattern:[type,type,i%2?'switch':'sweep',type],description}));
const families=['laser','sweep','helix','switch','ring','electric','drones','holo','blocks','portal','scissor','crown','rotor','nexus','core'];
const familyNames=['Laser corridors','Moving beams','Helix rails','Signal shutters','Pulsing energy rings','Alternating electric barriers','Drone swarms','Holographic walls','Falling data blocks','Redirect portals','Scissor blades','Breathing crowns','Rotor turbines','Prism reactors','Computer core'];
levels.forEach((l,i)=>{l.chapter=i;l.duration=i<3?20:Math.min(50,20+4*(i-2));l.end=l.speed*l.duration;l.count=Math.ceil((l.duration-2.6)*l.speed/(110-i*3))+1;l.signature=families[i];l.pattern=families.slice(0,i+1);l.description='NEW: '+familyNames[i]+(i?' · previous hazards remain':'');});
levels.push({...levels[14],name:'System Ascension',palette:makePalette('#79efd5','#b7ffeb'),duration:50,end:7200,count:120,chapter:15,signature:'core',pattern:[...families],description:'All systems converge · spectrum cascade · core escape',finale:true});
function finalePhase(t){return t<28?'assembly':t<40?'spectrum':t<47?'glitch':'escape';}
function finalePalette(t){if(t<28)return levels[15].palette;if(t>=40)return makePalette('#79efd5','#b7ffeb');const pos=(t-28)/12*15,i=Math.min(14,Math.floor(pos)),j=Math.min(14,i+1),f=pos-i;const mix=(a,b)=>'#'+a.slice(1).match(/../g).map((v,k)=>Math.round(parseInt(v,16)*(1-f)+parseInt(b.slice(1+k*2,3+k*2),16)*f).toString(16).padStart(2,'0')).join('');return Object.fromEntries(Object.keys(levels[i].palette).map(k=>[k,mix(levels[i].palette[k],levels[j].palette[k])]));}
function starsFor(l,gates){return [.23,.51,.79].map(f=>{const g=gates[Math.floor((gates.length-1)*f)],pose=gateAt(g,g.arrival);let point={x:0,y:0},score=-Infinity;for(let x=-2.5;x<=2.5;x+=.25)for(let y=-2.5;y<=2.5;y+=.25){if(!fits(x,y,pose,.65))continue;const value=-Math.abs(Math.hypot(x,y)-1.5);if(value>score){score=value;point={x,y};}}return {...point,z:g.z,collected:false};});}
function collectStars(stars,z,next,x,y){for(const s of stars)if(!s.collected&&s.z>z&&s.z<=next&&Math.hypot(x-s.x,y-s.y)<=.65)s.collected=true;}
function gatesFor(l,seed=1){let n=seed>>>0;const rand=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);const gates=Array.from({length:l.count},(_,i)=>({levelIndex:levels.indexOf(l),type:i===0?l.signature:(i%2===0?l.signature:l.pattern[Math.floor(i/2)%l.pattern.length]),z:l.speed*(2+i*(l.duration-2.6)/(l.count-1)),phase:rand()*Math.PI*2,rate:.45+rand()*.45,side:Math.floor(rand()*4),arrival:2+i*(l.duration-2.6)/(l.count-1)}));
if(l.finale){for(let i=0;i<gates.length;i++){const g=gates[i];if(g.arrival<28){const unlocked=Math.min(15,1+Math.floor((g.arrival-2)/1.7));g.type=i%2===0?families[unlocked-1]:families[i%unlocked];}else g.type=families[i%15];if(g.arrival>47)g.type='core';}return gates;}
// Reserve five evenly spaced portal slots after this hazard is introduced.
if(l.pattern.includes('portal')){const others=l.pattern.filter(t=>t!=='portal');for(let i=0;i<gates.length;i++)if(gates[i].type==='portal')gates[i].type=others[i%others.length];for(const f of [.1,.3,.5,.7,.9])gates[Math.round((gates.length-1)*f)].type='portal';}
return gates;}

function gateAt(g,t=0){const p=g.phase+t*g.rate,segments=[];const beam=(angle,offset,width)=>{const c=Math.cos(angle),s=Math.sin(angle),len=Math.sqrt(16-offset*offset);segments.push({ax:-s*offset-c*len,ay:c*offset-s*len,bx:-s*offset+c*len,by:c*offset+s*len,width});};
 if(g.type==='laser'){const variant=g.levelIndex>=3?g.side:0;if(variant===0){beam(g.phase,-1.4,.12);beam(g.phase,1.4,.12);}if(variant===1)for(const off of [-2,0,2])beam(g.phase,off,.14);if(variant===2)for(const off of [-2.5,-.85,.85,2.5])beam(g.phase,off,.12);if(variant===3){beam(g.phase,Math.sin(p)*1.6,.24);beam(g.phase+Math.PI/2,Math.cos(p)*1.6,.18);}}
 if(g.type==='sweep')beam(g.phase,Math.sin(p)*2,.34);
 if(g.type==='rotor'){beam(p,0,.24);beam(p+Math.PI/2,0,.24);}
 if(g.type==='helix'){beam(p,-1.35,.16);beam(p,1.35,.16);}

 const radial=(angle,len=3.8,width=.23)=>segments.push({ax:0,ay:0,bx:Math.cos(angle)*len,by:Math.sin(angle)*len,width});
 const frame=(sides,r,angle,width)=>{for(let i=0;i<sides;i++){const a=angle+i*Math.PI*2/sides,b=angle+(i+1)*Math.PI*2/sides;segments.push({ax:Math.cos(a)*r,ay:Math.sin(a)*r,bx:Math.cos(b)*r,by:Math.sin(b)*r,width});}};
 if(g.type==='needle')for(let i=0;i<3;i++)radial(p+i*Math.PI*2/3,3.8,.13);
 if(g.type==='comb')for(let i=-1;i<=1;i++)beam(g.phase,i*1.6+Math.sin(p)*.3,.13);
 if(g.type==='pendulum')beam(g.phase+Math.sin(p)*.9,1,.3);
 if(g.type==='triangle')frame(3,2.7,p,.22);
 if(g.type==='fork')for(let i=0;i<3;i++)radial(p*.55+i*Math.PI*2/3,3.8,.38);
 if(g.type==='scissor'){beam(Math.sin(p)*.8,0,.18);beam(-Math.sin(p)*.8,0,.18);}
 if(g.type==='crown')frame(6,2.2+Math.sin(p)*.4,-p,.18);
 if(g.type==='fan')for(let i=0;i<5;i++)radial(p+i*Math.PI*2/5,3.8,.16);
 if(g.type==='broken'){const gap=Math.sin(p)*1.9;segments.push({ax:-4,ay:0,bx:gap-.8,by:0,width:.32},{ax:gap+.8,ay:0,bx:4,by:0,width:.32});}
 if(g.type==='nexus'){frame(3,2.8,p,.18);frame(3,1.35,-p,.15);}
 // A switch gate announces its destination from first sight; it locks 1.4s before impact.
 const angle=g.side*Math.PI/2,locked=t>=g.arrival-1.4;
 const bodies=[];
 if(g.type==='drones')for(let i=0;i<5;i++){const a=p+i*Math.PI*2/5;bodies.push({x:Math.cos(a)*2.3,y:Math.sin(a)*2.3,r:.42});}
 if(g.type==='blocks')for(let i=0;i<3;i++)bodies.push({x:Math.sin(g.phase+i*2.1)*2.5,y:Math.cos(p*.5+i*2.1)*2.4,r:.48});
 const fire=Math.max(0,Math.min(1,(t-(g.arrival-1.65))/.65));
 for(const b of segments){b.fullBx=b.bx;b.fullBy=b.by;b.bx=b.ax+(b.bx-b.ax)*fire;b.by=b.ay+(b.by-b.ay)*fire;b.fire=fire;}
 const electricSide=Math.floor(t/2.75+g.side)%2===0?1:-1;
 const ringRadius=1.65+Math.sin(p)*.2,ringX=Math.cos(p*.8)*1.05,ringY=Math.sin(p*.65)*1.05,switchIn=2.75-(t%2.75);
 return {...g,z:g.type==='blocks'?g.z+30*(t-g.arrival):g.z,segments,angle,locked,bodies,electricSide,switchIn,ringRadius,ringX,ringY,real:g.side%2===0,portalX:Math.cos(g.phase)*1.7,portalY:Math.sin(g.phase)*1.7};}
function distance(x,y,s){if(s.fire===0)return Infinity;const dx=s.bx-s.ax,dy=s.by-s.ay,u=Math.max(0,Math.min(1,((x-s.ax)*dx+(y-s.ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-s.ax-u*dx,y-s.ay-u*dy);}
function fits(x,y,g,r=.17){if(Math.hypot(x,y)>3.8-r)return false;if(g.type==='ring'||g.type==='core')return Math.hypot(x-g.ringX,y-g.ringY)<g.ringRadius-r;if(g.type==='electric')return x*g.electricSide>.2+r;if(g.type==='holo')return !g.real||x*Math.cos(g.angle)+y*Math.sin(g.angle)>.2+r;if((g.bodies||[]).some(b=>Math.hypot(x-b.x,y-b.y)<b.r+r))return false;if(g.type==='landing')return Math.hypot(x,y)<1.8-r;if(g.type==='switch')return x*Math.cos(g.angle)+y*Math.sin(g.angle)>.55+r;return !(g.segments||[]).some(s=>distance(x,y,s)<s.width/2+r);}
function redirect(g,x,y){return g.type==='portal'&&Math.hypot(x-g.portalX,y-g.portalY)<1.2?{x:0,y:0,z:Math.max(0,(g.arrival-5)*144),time:Math.max(0,g.arrival-5)}:null;}
function crossed(z,next,gates,x,y,t=0,dt=0){return gates.findIndex(g=>g.z>z&&g.z<=next&&!fits(x,y,gateAt(g,t+dt*(g.z-z)/(next-z))));}
function infiniteStage(t){return Math.min(15,Math.floor(Math.max(0,t)/6));}
function infinitePalette(t,seed){const stage=t<90?Math.floor(Math.max(0,t)/12):8+Math.floor((t-90)/12);let n=(seed^Math.imul(stage+1,2654435761))>>>0;const rand=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);const color=h=>{const f=k=>{const a=(k+h/30)%12;return Math.round(255*(.65-.35*Math.max(-1,Math.min(a-3,9-a,1)))).toString(16).padStart(2,'0');};return '#'+f(0)+f(8)+f(4);};const h=rand()*360;return makePalette(color(h),stage<8?color(h):color((h+65+rand()*230)%360));}
// Infinite has its own mixed hazard pools and fixed pacing curve, independent of campaign courses.
function infiniteGenerator(seed){let n=seed>>>0,arrival=2,id=0,lastType='';const rand=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);return {next(stageForArrival){const stage=stageForArrival?stageForArrival(arrival):infiniteStage(arrival),progress=stage/15;
const pool=['laser','sweep','ring','blocks','holo',...(stage>=3?['helix','switch','drones','broken']:[]),...(stage>=6?['electric','scissor','crown','triangle']:[]),...(stage>=10?['rotor','nexus','core','fan','comb','pendulum','fork','needle']:[])];
const choices=pool.filter(t=>t!==lastType),type=choices[Math.floor(rand()*choices.length)];lastType=type;
const g={id:id++,levelIndex:stage,type,arrival,z:arrival*144,phase:rand()*Math.PI*2,rate:(.3+.3*progress)+rand()*(.15+.15*progress),side:Math.floor(rand()*4)};
// Same spawn times and motion bounds for every seed; maximum matches finale density.
arrival+=.9+((47.4/119)-.9)*progress;return g;}};}
const api={infiniteStage,infinitePalette,infiniteGenerator,levels,gatesFor,gateAt,fits,crossed,distance,starsFor,collectStars,familyNames,redirect,finalePhase,finalePalette};if(typeof module!=='undefined')module.exports=api;else root.FF=api;
})(typeof globalThis!=='undefined'?globalThis:this);
