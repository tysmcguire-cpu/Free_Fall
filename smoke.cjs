const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const els={},ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
const el=()=>({style:{},hidden:false,appendChild(){},setAttribute(){},addEventListener(){},getContext:()=>ctx});
const sandbox={console,innerWidth:390,innerHeight:844,devicePixelRatio:2,localStorage:{getItem:()=>null,setItem(){}},document:{documentElement:{style:{setProperty(){}}},getElementById:id=>els[id]||(els[id]=el()),createElement:el,addEventListener(){}},addEventListener(){},requestAnimationFrame(){}};
vm.createContext(sandbox);
for(const f of ['engine.js','game.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,f),'utf8'),sandbox);
vm.runInContext(`for(selected=0;selected<16;selected++){start(); for(time=0;time<FF.levels[selected].duration;time+=.5){z=time*FF.levels[selected].speed;draw();}} selected=0; start(); frame(16); pause(); if(state!=='paused')throw Error('pause'); pause(); if(state!=='playing')throw Error('resume'); finish(false); if(state!=='lost')throw Error('loss'); start(); finish(true); if(state!=='won')throw Error('win');`,sandbox);
console.log('Passed: mocked canvas render, start, pause, resume, loss, retry, win. Device rendering and touch feel require manual testing.');

vm.runInContext(`
state='menu';setMode(true);start();x=.4;y=.7;z=700;time=700/144;passed=2;saveCheckpoint();const savedTime=time;const savedGates=gates;z=900;time=9;finish(false);restoreCheckpoint();if(z!==700||time!==savedTime||x!==.4||gates!==savedGates)throw Error('checkpoint restore');
$('speed').value='.5';$('speed').oninput();if(speedFactor!==.5)throw Error('practice slider');
best={};finish(true);if(Object.keys(best).length)throw Error('practice wrote record');
state='menu';setMode(false);start();if(speedFactor!==1||!$('practiceControls').hidden)throw Error('normal isolation');checkpoint=null;saveCheckpoint();if(checkpoint!==null)throw Error('normal checkpoint');$('speed').value='.25';$('speed').oninput();if(speedFactor!==1)throw Error('normal speed changed');time=FF.levels[selected].duration;finish(true);if(!best[selected])throw Error('normal record missing');
`,sandbox);
console.log('Passed: practice checkpoint restores position/time/course, speed control, practice record exclusion, and normal-mode isolation.');

vm.runInContext(`
state='menu';showTab('levels');if(!$('hero').hidden||$('levelPanel').hidden)throw Error('levels tab');showTab('training');if(!practice||$('trainingInfo').hidden)throw Error('practice tab');showTab('play');if(practice||$('hero').hidden)throw Error('play tab');
setMode(true);start();stars[0].collected=true;saveCheckpoint();stars[1].collected=true;restoreCheckpoint();if(!stars[0].collected||stars[1].collected)throw Error('checkpoint stars');
starRecords={};finish(true);if(Object.keys(starRecords).length)throw Error('practice star record');state='menu';setMode(false);start();stars[0].collected=true;stars[1].collected=true;finish(true);if(starRecords[selected]!==2)throw Error('normal star record');
`,sandbox);
console.log('Passed: menu tabs, practice star isolation, checkpoint star restoration, and normal star records.');

vm.runInContext(`state='menu';setMode(false);start();gates=[{type:'portal',arrival:10,z:1440,phase:0,rate:1,side:0}];stars=[{x:1.7,y:0,z:1440,collected:true}];x=1.7;y=0;z=1439;time=z/144;last=1000;frame(1016);if(time!==5||z!==720||!stars[0].collected)throw Error('portal rewind failed');`,sandbox);
console.log('Passed: in-game rewind restores earlier depth/time and preserves collected stars.');

vm.runInContext(`selected=0;start();finish(false);if(!$('nextLevel').hidden)throw Error('next shown on loss');finish(true);if($('nextLevel').hidden)throw Error('next missing');$('nextLevel').onclick();if(selected!==1||state!=='playing'||z!==0)throw Error('next did not start');selected=15;start();finish(true);if(!$('nextLevel').hidden)throw Error('next shown on finale');`,sandbox);
console.log('Passed: next level on success, immediate advance, hidden on loss and final level.');

vm.runInContext(`
$('back').onclick();selected=0;time=z=0;beginDive();
if(state!=='launching'||$('menu').hidden||$('lobby').hidden)throw Error('launch staging');
for(let i=0;i<30;i++)frame(last+16);
if(state!=='launching'||time!==0||z!==0)throw Error('simulation started before dive');
for(let i=0;i<80;i++)frame(last+16);
if(state!=='playing'||!$('lobby').hidden||$('hud').hidden)throw Error('dive did not enter gameplay');
$('back').onclick();if(state!=='menu'||$('lobby').hidden||$('menu').hidden)throw Error('lobby return');
beginDive();if(launchElapsed!==0)throw Error('dive not reset');
`,sandbox);
console.log('Passed: dive staging, delayed simulation, gameplay handoff, lobby return and repeat launch.');

vm.runInContext(`
state='menu';showTab('infinite');start();if(!infinite||practice||stars.length)throw Error('infinite setup');
const originalCrossed=FF.crossed;FF.crossed=()=>-1;
for(let stage=0;stage<50;stage++){time=stage*15;z=time*144;fillInfinite();frameInfinite(last+16);if(gates.length>60)throw Error('unbounded stream');draw();}
pause();const frozen=time;frame(last+16);if(time!==frozen)throw Error('pause advanced');pause();
FF.crossed=originalCrossed;finish(false);if(!$('nextLevel').hidden)throw Error('infinite next level');$('retry').onclick();if(time!==0||!infinite)throw Error('infinite retry');
$('back').onclick();showTab('play');start();if(infinite)throw Error('campaign mode leaked');
`,sandbox);
console.log('Passed: infinite stream, 50 palette stages, bounded memory, pause, retry and campaign isolation.');

vm.runInContext(`
state='menu';showTab('infinite');start();takeInfiniteStar({});takeInfiniteStar({});if(starCharge!==2||totalStars!==2)throw Error('star charge');takeInfiniteStar({});if(godUntil!==6||starCharge!==0)throw Error('god activation');
const initialZ=z;const savedCrossed=FF.crossed;FF.crossed=()=>{throw Error('collision called during invincibility')};frameInfinite(last+20);if(Math.abs(z-initialZ-216*.02)>.001)throw Error('god speed');
const starsBefore=totalStars;takeInfiniteStar({});if(totalStars-starsBefore!==1||godUntil!==6)throw Error('god bonus or extension');
pause();const frozenGod=godUntil-time;frame(last+16);if(godUntil-time!==frozenGod)throw Error('pause consumed god mode');pause();
FF.crossed=()=>-1;time=5.99;frameInfinite(last+20);if(time<6||time<godUntil)throw Error('god expiry');
const zBefore=z;frameInfinite(last+20);if(Math.abs(z-zBefore-144*.02)>.001)throw Error('normal speed restoration');
FF.crossed=savedCrossed;finish(false);start();if(starCharge||godUntil||totalStars)throw Error('restart reset');
`,sandbox);
console.log('Passed: three-star activation, invincibility, 1.5x speed, bonuses, pause, six-second expiry and reset.');


vm.runInContext(`
state='menu';showTab('play');best={};selected=1;beginDive();if(state!=='menu')throw Error('locked launch');selected=0;start();finish(true);if(unlockedLevel()!==1)throw Error('first unlock');state='menu';setMode(true);selected=1;start();finish(true);if(unlockedLevel()!==1)throw Error('practice unlocked');state='menu';setMode(false);start();finish(true);if(unlockedLevel()!==2)throw Error('second unlock');
`,sandbox);
console.log('Passed: sequential campaign unlocking and practice isolation.');
