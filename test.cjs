const assert=require('node:assert/strict');
const {levels:allLevels,gatesFor,gateAt,fits,crossed}=require('./engine.js');const levels=allLevels.slice(0,15);
assert.equal(levels.length,15);assert(levels.every(l=>l.speed===144));assert.equal(new Set(levels.map(l=>l.palette.accent)).size,15);assert.equal(new Set(levels.map(l=>l.signature)).size,15);for(let i=1;i<15;i++)assert((levels[i].duration-2.6)/(levels[i].count-1)<(levels[i-1].duration-2.6)/(levels[i-1].count-1));
for(const l of levels){assert.equal(l.end/l.speed,l.duration);assert(l.duration>=20&&l.duration<=50)};
const beam={type:'laser',segments:[{ax:-4,ay:0,bx:4,by:0,width:.2}]};
assert(!fits(0,0,beam));assert(fits(0,1,beam));assert(!fits(4,0,beam));
for(let side=0;side<4;side++){const g=gateAt({type:'switch',side,arrival:3},3),a=side*Math.PI/2;assert(fits(2*Math.cos(a),2*Math.sin(a),g));assert(!fits(-2*Math.cos(a),-2*Math.sin(a),g));assert(g.locked);}
const raw={type:'sweep',phase:0,rate:1,z:10,arrival:Math.PI/2};
assert.equal(crossed(9,11,[raw],0,2,Math.PI/2-1,2),0);
assert.equal(crossed(9,11,[raw],0,-2,Math.PI/2-1,2),-1);
// Search a feasible sequence of safe positions at every impact, with bounded steering speed.
for(const l of levels)for(let seed=1;seed<=20;seed++){
 let reachable=[{x:0,y:0}],prevT=0;const gates=gatesFor(l,seed);assert.equal(gates.length,l.count);
 for(const raw of [...gates,{type:'landing',arrival:l.duration,z:l.end}]){
  const g=raw.type==='landing'?raw:gateAt(raw,raw.arrival),next=[];
  for(let x=-3.5;x<=3.5;x+=.5)for(let y=-3.5;y<=3.5;y+=.5)if(fits(x,y,g)&&reachable.some(p=>Math.hypot(p.x-x,p.y-y)<6.5*(raw.arrival-prevT)))next.push({x,y});
  assert(next.length,`${l.name} seed ${seed}: no route at ${raw.arrival}`);reachable=next;prevT=raw.arrival;
 }
}
assert.notDeepEqual(gatesFor(levels[0],1),gatesFor(levels[0],2));
console.log('Passed: 15 distinct levels, constant speed and decreasing spacing, 20–50-second durations, beam and directional-shutter collisions, crossing-time sampling, and reachable routes through 300 seeded courses.');

const {starsFor,collectStars}=require('./engine.js');
for(const [i,l] of levels.entries()){
 assert.equal(l.pattern.length,i+1);assert.equal(new Set(gatesFor(l).map(g=>g.type)).size,i+1);
 for(let seed=1;seed<=20;seed++){const gates=gatesFor(l,seed),stars=starsFor(l,gates);assert.equal(stars.length,3);assert.equal(new Set(stars.map(s=>s.z)).size,3);
 for(const s of stars){const g=gates.find(g=>g.z===s.z);assert(fits(s.x,s.y,gateAt(g,g.arrival),.65));collectStars(stars,s.z-1,s.z+1,s.x,s.y);assert(s.collected);}
 }
}
const miss=[{x:2,y:2,z:10,collected:false}];collectStars(miss,9,11,-2,-2);assert(!miss[0].collected);
console.log('Passed: per-level family unlocks, cumulative hazards, three safe stars per course, star hit/miss detection.');

assert.deepEqual(levels.map(l=>l.duration),[20,20,20,24,28,32,36,40,44,48,50,50,50,50,50]);
for(const l of levels){const gs=gatesFor(l);assert(Math.abs((l.end-gs.at(-1).z)/144-.6)<1e-8);}
const rawNew={z:1440,arrival:10,phase:0,rate:1,side:0};
const electric=gateAt({...rawNew,type:'electric'},0),electric2=gateAt({...rawNew,type:'electric'},2.85);assert(fits(2,0,electric));assert(!fits(2,0,electric2));
assert(fits(-2,0,gateAt({...rawNew,type:'holo',side:1},0)));assert(!fits(-2,0,gateAt({...rawNew,type:'holo'},0)));
assert(fits(0,0,gateAt({...rawNew,type:'ring'},0)));assert(!fits(3,0,gateAt({...rawNew,type:'ring'},0)));
const drones=gateAt({...rawNew,type:'drones'},0);assert(!fits(drones.bodies[0].x,drones.bodies[0].y,drones));
const portal=gateAt({...rawNew,type:'portal'},0);assert.deepEqual(require('./engine.js').redirect(portal,portal.portalX,portal.portalY),{x:0,y:0,z:720,time:5});assert.equal(require('./engine.js').redirect(portal,0,3),null);
assert(gateAt({...rawNew,type:'blocks'},11).z>gateAt({...rawNew,type:'blocks'},10).z);
console.log('Passed: requested durations, short landing gap, electric alternation, real/ghost walls, rings, drones, portal destinations, and falling blocks.');

const rg=gateAt({...rawNew,type:'ring'},2);assert(fits(rg.ringX,rg.ringY,rg));assert(!fits(rg.ringX+rg.ringRadius+.2,rg.ringY,rg));assert.notEqual(rg.ringX,gateAt({...rawNew,type:'ring'},3).ringX);
const before=gateAt({...rawNew,type:'electric'},2.749),after=gateAt({...rawNew,type:'electric'},2.75);assert.equal(before.electricSide,-after.electricSide);assert(Math.abs(after.switchIn-2.75)<1e-9);
assert.deepEqual([0,1,2,3].map(side=>gateAt({...rawNew,type:'laser',levelIndex:3,side},0).segments.length),[2,3,4,2]);assert.equal(gateAt({...rawNew,type:'laser',levelIndex:0,side:2},0).segments.length,2);
console.log('Passed: moving ring holes, exact 2.75-second barrier flips, and later-level laser variants.');

const laser={type:'laser',arrival:10,phase:0,rate:1,side:0};
const charge=gateAt(laser,8),shot=gateAt(laser,8.7),full=gateAt(laser,9.1);
assert(charge.segments.every(s=>s.fire===0));assert(shot.segments.every(s=>s.fire>0&&s.fire<1));assert(full.segments.every(s=>s.fire===1));assert(fits(0,1.4,charge));assert(!fits(0,1.4,full));
console.log('Passed: emitter charge, partial beam extension, full beam collision, and five-second portal rewind.');

for(const l of levels)for(let seed=1;seed<=20;seed++){const portals=gatesFor(l,seed).filter(g=>g.type==='portal');assert.equal(portals.length,l.pattern.includes('portal')?5:0);}
assert(require('./engine.js').redirect(portal,portal.portalX+1.1,portal.portalY));assert.equal(require('./engine.js').redirect(portal,portal.portalX+1.3,portal.portalY),null);
console.log('Passed: portal frequency, separation, and enlarged entrance collision.');

const finale=allLevels[15],fg=gatesFor(finale,4);assert.equal(allLevels.length,16);assert.equal(finale.duration,50);assert.equal(new Set(fg.filter(g=>g.arrival<28).map(g=>g.type)).size,15);assert(fg.filter(g=>g.arrival>47).every(g=>g.type==='core'));
const {finalePhase,finalePalette}=require('./engine.js');assert.deepEqual([0,28,40,47].map(finalePhase),['assembly','spectrum','glitch','escape']);for(let i=0;i<15;i++)assert.equal(finalePalette(28+i*.8).accent,levels[i].palette.accent);
console.log('Passed: finale staging, all hazards introduced, full palette tour and core ending.');
