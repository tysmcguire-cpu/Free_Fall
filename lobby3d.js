/* Procedural armored operative, rendered locally with Three.js. */
(function(){
'use strict';
const host=document.getElementById('lobby');
if(!window.THREE)return;
const T=THREE;let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){document.getElementById('launchStatus').textContent='3D UNAVAILABLE / PLAY STILL AVAILABLE';return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x030710,1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.domElement.id='lobby3d';renderer.domElement.setAttribute('aria-label','Metallic LED ball on a launch chute');host.prepend(renderer.domElement);host.setAttribute('data-renderer','3d');
const scene=new T.Scene();scene.fog=new T.FogExp2(0x030710,.038);const camera=new T.PerspectiveCamera(36,1,.1,100);
const mat=(color,metalness=.65,roughness=.36)=>new T.MeshStandardMaterial({color,metalness,roughness});
const armor=mat(0x263240,.62,.32),edge=mat(0x425166,.72,.28),black=mat(0x050911,.25,.48),glass=mat(0x020811,.88,.15),cyan=new T.MeshStandardMaterial({color:0x33ffee,emissive:0x00d8ce,emissiveIntensity:.9,toneMapped:false}),pink=new T.MeshStandardMaterial({color:0xff39c9,emissive:0xf000a0,emissiveIntensity:.9,toneMapped:false});
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=m!==cyan&&m!==pink;o.receiveShadow=true;parent.add(o);return o;}
function ell(parent,m,x,y,z,sx,sy,sz){const o=mesh(new T.SphereGeometry(1,40,28),m,parent,x,y,z);o.scale.set(sx,sy,sz);return o;}
function box(parent,m,x,y,z,a,b,c){
const r=Math.min(a,b,c)*.22,shape=new T.Shape();shape.moveTo(-a/2+r,-b/2);shape.lineTo(a/2-r,-b/2);shape.quadraticCurveTo(a/2,-b/2,a/2,-b/2+r);shape.lineTo(a/2,b/2-r);shape.quadraticCurveTo(a/2,b/2,a/2-r,b/2);shape.lineTo(-a/2+r,b/2);shape.quadraticCurveTo(-a/2,b/2,-a/2,b/2-r);shape.lineTo(-a/2,-b/2+r);shape.quadraticCurveTo(-a/2,-b/2,-a/2+r,-b/2);const g=new T.ExtrudeGeometry(shape,{depth:Math.max(.001,c-r),bevelEnabled:true,bevelSize:r*.5,bevelThickness:r*.5,bevelSegments:3,steps:1});g.translate(0,0,-c/2+r/2);return mesh(g,m,parent,x,y,z); }
function tube(parent,pts,m=cyan,r=.012){const curve=new T.CurvePath();for(let i=1;i<pts.length;i++)curve.add(new T.LineCurve3(new T.Vector3(...pts[i-1]),new T.Vector3(...pts[i])));const g=new T.TubeGeometry(curve,Math.max(8,pts.length*4),r,6,false);const o=mesh(g,m,parent);if(parent!==scene){mesh(new T.TubeGeometry(curve,Math.max(8,pts.length*4),r*2.8,6,false),new T.MeshBasicMaterial({color:m===pink?0xff16bc:0x00fff0,transparent:true,opacity:.09,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),parent);}return o;}
function plate(parent,pts,z,depth,m=armor){const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();const o=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:5,steps:1}),m,parent,0,0,z);return o;}
// Fine deterministic finish: brushed ceramic-metal and woven undersuit.
const finish=document.createElement('canvas');finish.width=finish.height=256;const fc=finish.getContext('2d');const pixels=fc.createImageData(256,256);let seed=19;for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=120+(seed%27);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}fc.putImageData(pixels,0,0);fc.strokeStyle='rgba(220,220,220,.2)';fc.lineWidth=.5;for(let i=0;i<75;i++){fc.beginPath();fc.moveTo(i*31%256,i*43%256);fc.lineTo(i*31%256+4+i%12,i*43%256+1);fc.stroke();}const finishTex=new T.CanvasTexture(finish);finishTex.wrapS=finishTex.wrapT=T.RepeatWrapping;finishTex.repeat.set(3,3);armor.bumpMap=finishTex;armor.bumpScale=.002;armor.roughnessMap=finishTex;edge.bumpMap=finishTex;edge.bumpScale=.001;
const fabric=document.createElement('canvas');fabric.width=fabric.height=64;const fctx=fabric.getContext('2d');fctx.fillStyle='#555';fctx.fillRect(0,0,64,64);for(let y=0;y<64;y+=4)for(let x=0;x<64;x+=4){fctx.fillStyle=(x+y)%8?'#777':'#333';fctx.fillRect(x,y,3,2);}const fabricTex=new T.CanvasTexture(fabric);fabricTex.wrapS=fabricTex.wrapT=T.RepeatWrapping;fabricTex.repeat.set(8,8);black.bumpMap=fabricTex;black.bumpScale=.004;black.roughness=.8;
const ball=new T.Group();scene.add(ball);const radius=.38;
ell(ball,armor,0,0,0,radius,radius,radius);
for(const angle of [0,Math.PI/2]){const ring=mesh(new T.TorusGeometry(radius+.002,.009,8,80),cyan,ball);ring.rotation.y=angle;}
const equator=mesh(new T.TorusGeometry(radius+.003,.006,8,80),pink,ball);equator.rotation.x=Math.PI/2;
for(const sign of [-1,1]){const cap=mesh(new T.CylinderGeometry(.11,.11,.025,32),edge,ball,sign*.37,0,0);cap.rotation.z=Math.PI/2;const dot=mesh(new T.TorusGeometry(.067,.006,8,32),cyan,ball,sign*.388,0,0);dot.rotation.y=Math.PI/2;}
// Sloped launch chute ends directly over the mouth of the shaft.
const rampLength=3.5,rampAngle=.16;
const ramp=new T.Group();scene.add(ramp);ramp.position.set(0,.43,-.45);ramp.rotation.x=-rampAngle;
box(ramp,armor,0,-.09,0,1.05,.14,rampLength);
for(const sign of [-1,1]){box(ramp,edge,sign*.52,.045,0,.065,.16,rampLength);tube(ramp,[[sign*.49,.13,-rampLength/2],[sign*.49,.13,rampLength/2]],cyan,.008);}
for(let i=0;i<16;i++)box(ramp,edge,0,-.01,-1.65+i*.22,.84,.012,.025);
for(const zz of [-.9,.9])box(scene,black,0,.08,zz-.45,.48,.45,.3);
// Lighting gives dark armor readable edges and contrasting rim highlights.
scene.add(new T.HemisphereLight(0x9cc6e6,0x07101b,2));
function light(c,i,x,y,z){const l=new T.PointLight(c,i,25,2);l.position.set(x,y,z);scene.add(l);return l;}
light(0x80eaff,65,3,5,4);light(0x08ffff,45,-3,3,-1);light(0xff1caa,55,3,3,-3);
const key=new T.DirectionalLight(0xc9dcff,2.5);key.position.set(-2,6,4);const fill=new T.DirectionalLight(0xb9d7ef,2.1);fill.position.set(2,3,6);scene.add(fill);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=3;scene.add(key);
const pit=new T.Group();pit.position.set(0,-.035,-2.3);scene.add(pit);
const rim=mesh(new T.TorusGeometry(1.3,.12,12,80),edge,pit);rim.rotation.x=Math.PI/2;
for(let i=0;i<7;i++){const r=mesh(new T.TorusGeometry(1.24,.013,6,80),i%2?pink:cyan,pit,0,-.1-i*.27,0);r.rotation.x=Math.PI/2;}
const shaft=mesh(new T.CylinderGeometry(1.24,1.24,3,64,1,true),new T.MeshStandardMaterial({color:0x080d17,side:T.DoubleSide,metalness:.5,roughness:.4}),pit,0,-1.5,0);
const base=mesh(new T.CircleGeometry(1.23,64),black,pit,0,-3,0);base.rotation.x=-Math.PI/2;
const deck=mesh(new T.RingGeometry(1.44,12,96),mat(0x0a1420,.6,.5),pit,0,-.1,0);deck.rotation.x=-Math.PI/2;
for(let i=0;i<48;i++){const a=i*Math.PI/24;const o=box(pit,i%4===0?cyan:edge,Math.sin(a)*1.43,.025,Math.cos(a)*1.43,.025,.016,.12);o.rotation.y=a;}
const grid=new T.GridHelper(24,32,0x153b4d,0x0c202f);grid.position.y=-.15;// The shaft opening remains free of floor grid lines.
for(let i=0;i<16;i++){const a=i*Math.PI/8;const pillar=box(scene,black,Math.sin(a)*8,2,Math.cos(a)*8,.5,5,.5);tube(scene,[[Math.sin(a)*7.72,0,Math.cos(a)*7.72],[Math.sin(a)*7.72,4,Math.cos(a)*7.72]],i%3?cyan:pink,.008);}
const dustG=new T.BufferGeometry(),dustA=new Float32Array(180*3);for(let i=0;i<180;i++){dustA[i*3]=Math.sin(i*127.1)*8;dustA[i*3+1]=(i*.173)%7;dustA[i*3+2]=Math.cos(i*311.7)*8;}dustG.setAttribute('position',new T.BufferAttribute(dustA,3));const dust=new T.Points(dustG,new T.PointsMaterial({color:0x6cffff,size:.018,transparent:true,opacity:.45}));scene.add(dust);
let expansion=0,lastW=0,lastH=0;
function resize(){const small=innerWidth<560,baseLeft=small?0:275;const left=baseLeft*(1-expansion),w=innerWidth-left,h=innerHeight*(small?.48+.52*expansion:1);renderer.domElement.style.left=left+'px';renderer.domElement.style.top='0px';if(Math.abs(w-lastW)>.5||Math.abs(h-lastH)>.5){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();lastW=w;lastH=h;}}
addEventListener('resize',resize);resize();
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
const camStart=new T.Vector3(4,3.7,6.3),lookStart=new T.Vector3(0,.15,-.7);
// Private material copies keep environment themes independent of the ball.
const themed=[];
for(const group of [ramp,pit])group.traverse(o=>{if(!o.isMesh)return;const original=o.material;const role=original===cyan?'primary':original===pink?'secondary':original.blending===T.AdditiveBlending?'glow':original===black?'dark':'metal';o.material=original.clone();themed.push({material:o.material,role});});
function setTheme(p){for(const {material:m,role}of themed){const primary=p.accent,secondary=p.secondary||p.danger||primary;if(role==='primary'||role==='secondary'){const c=role==='primary'?primary:secondary;m.color.set(c);m.emissive.set(c);}else if(role==='glow'){m.color.set(primary);}}}
window.FFLobby={duration:3.05,setTheme,update(t,launch){
 if(host.hidden)return;
 const isLaunching=launch>=0;host.setAttribute('data-flight',String(isLaunching));expansion=isLaunching?smooth(launch/1.1):0;resize();
 const lip=-rampLength/2,clearRadius=radius+.016,top=-.008;
 let localZ=1.45,localY=top+clearRadius,distance=0;
 if(isLaunching){
  if(launch<=1.75){distance=(1.45-lip)*Math.pow(launch/1.75,2);localZ=1.45-distance;}
  else if(launch<=2.1){const theta=(launch-1.75)/.35*Math.PI/2;localZ=lip-clearRadius*Math.sin(theta);localY=top+clearRadius*Math.cos(theta);distance=1.45-lip+clearRadius*theta;}
  else{const fall=launch-2.1;localZ=lip-clearRadius-.12*fall;localY=top-clearRadius*Math.PI/.7*fall-4.5*fall*fall;distance=1.45-lip+clearRadius*Math.PI/2+fall*.7;}
 }
 ramp.updateMatrixWorld();ball.position.copy(ramp.localToWorld(new T.Vector3(0,localY,localZ)));ball.rotation.set(-distance/radius,0,0);
 const follow=isLaunching?smooth((launch-.65)/2.35):0;
 const destination=new T.Vector3(0,Math.max(-2.7,ball.position.y+.65),-2.1);
 camera.position.copy(camStart).lerp(destination,follow);
 const look=new T.Vector3(0,ball.position.y-.4,-2.3);camera.lookAt(lookStart.clone().lerp(look,follow));
 document.getElementById('descentFade').style.opacity=isLaunching?String(smooth((launch-2.75)/.3)): '0';
 dust.rotation.y=t*.015;renderer.render(scene,camera);
},renderer,scene};
})();

