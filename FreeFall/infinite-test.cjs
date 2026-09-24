const assert=require('node:assert/strict');const FF=require('./engine.js');
assert.equal(FF.infiniteStage(5.999),0);assert.equal(FF.infiniteStage(6),1);assert.equal(FF.infiniteStage(90),15);assert.equal(FF.infiniteStage(99999),15);
for(let i=0;i<40;i++){const start=i<8?i*12:90+(i-8)*12,end=i===7?89.999:start+11.999;const p=FF.infinitePalette(start,77);assert.deepEqual(p,FF.infinitePalette(end,77));if(i<8)assert.equal(p.accent,p.secondary);else assert.notEqual(p.accent,p.secondary);}
assert.notEqual(FF.infinitePalette(90,77).accent,FF.infinitePalette(90,77).secondary);
assert.deepEqual(FF.infinitePalette(90,77),FF.infinitePalette(101.999,77));
assert.notDeepEqual(FF.infinitePalette(90,77),FF.infinitePalette(102,77));
assert.notDeepEqual(FF.infinitePalette(0,77),FF.infinitePalette(0,456));
const a=FF.infiniteGenerator(77),b=FF.infiniteGenerator(456);let previous=null,different=0;const early=new Set();for(let i=0;i<5000;i++){const g=a.next(),h=b.next();assert.equal(g.arrival,h.arrival);assert.equal(g.levelIndex,h.levelIndex);if(g.type!==h.type)different++;if(g.arrival<8)early.add(g.type);assert.equal(g.levelIndex,FF.infiniteStage(g.arrival));if(previous){assert(g.z>previous.z);assert.notEqual(g.type,previous.type);if(previous.levelIndex===15)assert(Math.abs(g.arrival-previous.arrival-47.4/119)<1e-9);}previous=g;}assert(different>1000);assert(early.size>=3);
console.log('Passed: 6-second difficulty, 12-second palettes, cap at 90s, random starting colors, varied hazards and seed-independent difficulty timing across 5,000 obstacles.');
