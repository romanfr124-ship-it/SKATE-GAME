import * as THREE from 'three';
import './style.css';

const mount=document.querySelector('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x191919);scene.fog=new THREE.Fog(0x191919,32,105);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xffffff,0x454545,2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-8,14,7);scene.add(sun);
const mats={ground:new THREE.MeshStandardMaterial({color:0x303030,roughness:1}),concrete:new THREE.MeshStandardMaterial({color:0x414141,roughness:.95}),dark:new THREE.MeshStandardMaterial({color:0x242424,roughness:.9}),edge:new THREE.MeshBasicMaterial({color:0xffffff}),board:new THREE.MeshStandardMaterial({color:0x777777,roughness:.8}),rubber:new THREE.MeshStandardMaterial({color:0x181818,roughness:1}),metal:new THREE.MeshStandardMaterial({color:0x999999,metalness:.35,roughness:.6}),skater:new THREE.MeshStandardMaterial({color:0x777777,roughness:1})};
function box(parent,w,h,d,mat,x=0,y=0,z=0,outline=false){const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);parent.add(m);if(outline){const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),mats.edge);e.position.copy(m.position);parent.add(e)}return m}
function ramp(parent,w,h,d,x,z,angle=0){const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,mats.concrete);m.position.set(x,h/2,z);m.rotation.z=angle;parent.add(m);const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),mats.edge);e.position.copy(m.position);e.rotation.copy(m.rotation);parent.add(e);return m}
const ground=box(scene,100,.5,100,mats.ground,0,-.28,0,true);
for(let i=-4;i<=4;i++){box(scene,100,.025,.025,mats.dark,0,.0,i*5);box(scene,.025,.025,100,mats.dark,i*5,.0,0)}
// Park architecture: low quarter pipes, bank ramps, ledges and rails.
ramp(scene,12,1.2,7,-13,-1.5,.16);ramp(scene,12,1.2,7,13,-1.5,-.16);
box(scene,5,1.05,1.2,mats.concrete,-6,.52,-8,true);box(scene,5,1.05,1.2,mats.concrete,6,.52,8,true);
function rail(x,z,len){const rod=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,len,8),mats.metal);rod.rotation.x=Math.PI/2;rod.position.set(x,.72,z);scene.add(rod);const line=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(.058,.058,len,8)),mats.edge);line.rotation.copy(rod.rotation);line.position.copy(rod.position);scene.add(line);for(const zz of [-len/2+.2,len/2-.2])box(scene,.12,.7,.12,mats.dark,x,.35,z+zz,true)}
rail(0,-5,7);rail(0,5,7);
for(let i=0;i<4;i++){box(scene,2.4,.5,.9,mats.concrete,-20+i*2,.25,10,true)}
// Player root and board assembly.
const skater=new THREE.Group();scene.add(skater);
const board=new THREE.Group();skater.add(board);
const deck=box(board,2.05,.13,.56,mats.board,0,0,0,true);
const nose= new THREE.Mesh(new THREE.SphereGeometry(.29,10,6),mats.board);nose.scale.set(1,.22,1);nose.position.set(.9,0,0);board.add(nose);
const tail=nose.clone();tail.position.x=-.9;board.add(tail);
const wheelMeshes=[];
for(const x of [-.68,.68]){const axle=box(board,.12,.12,.72,mats.metal,x,-.15,0,true);for(const z of [-.37,.37]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.12,10),mats.rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(x,-.22,z);board.add(wheel);wheelMeshes.push(wheel)}}
const torso= new THREE.Group();skater.add(torso);
const body= new THREE.Mesh(new THREE.CapsuleGeometry(.25,.68,3,7),mats.skater);body.position.y=1.05;torso.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),mats.skater);head.position.y=1.62;torso.add(head);
const limbs=[];function limb(a,b,r=.085){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,6),mats.skater);scene.add(mesh);limbs.push({mesh,a,b});return mesh}
const legs=[limb(new THREE.Vector3(-.15,.72,0),new THREE.Vector3(-.2,.15,0)),limb(new THREE.Vector3(.15,.72,0),new THREE.Vector3(.2,.15,0))];
let pos=new THREE.Vector3(0,.3,2),vel=new THREE.Vector3(),yaw=0,boardPitch=0,boardRoll=0,popVel=0,air=0,spin=0,spinVel=0,score=0,stance='REGULAR';
const keys=new Set();let trickTimer=0;
function setKey(k,on){k=k.toLowerCase();if(on)keys.add(k);else keys.delete(k)}
addEventListener('keydown',e=>{if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();setKey(e.key,true);if(e.key.toLowerCase()==='r')reset();if(e.code==='Space'&&!e.repeat)pop()});
addEventListener('keyup',e=>setKey(e.key,false));
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();setKey(k,true);if(k===' ')pop()});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>setKey(k,false)))});
function pop(){if(air<.06){popVel=5.2+Math.min(vel.length()*.09,1.1);air=.07;trickTimer=1.1;document.querySelector('#trickLabel').textContent='OLLIE'}} 
function reset(){pos.set(0,.3,2);vel.set(0,0,0);yaw=0;boardPitch=boardRoll=spin=spinVel=popVel=air=0;skater.position.copy(pos)}
document.querySelector('#resetBtn').onclick=reset;
document.querySelector('#customBtn').onclick=()=>document.querySelector('#customizer').classList.remove('hidden');
document.querySelector('#closeCustom').onclick=()=>document.querySelector('#customizer').classList.add('hidden');
function updateCustom(){const l=+deckLength.value,w=+deckWidth.value,wh=+wheelSize.value,tw=+truckWidth.value;deck.scale.set(l/2.05,1,w/.56);nose.position.x=l/2.28;tail.position.x=-l/2.28;document.querySelector('#lengthOut').value=l.toFixed(2)+'"';document.querySelector('#widthOut').value=w.toFixed(2)+'"';document.querySelector('#wheelOut').value=wh+' MM';document.querySelector('#truckOut').value=tw.toFixed(2)+'"';wheelMeshes.forEach(q=>q.scale.setScalar(wh/54));}
['deckLength','deckWidth','wheelSize','truckWidth'].forEach(id=>document.getElementById(id).addEventListener('input',updateCustom));
const clock=new THREE.Clock();
function update(dt){
 const forward=(keys.has('w')||keys.has('arrowup'))?1:0,back=(keys.has('s')||keys.has('arrowdown'))?1:0,left=keys.has('a')||keys.has('arrowleft'),right=keys.has('d')||keys.has('arrowright');
 const dir=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
 if(forward)vel.addScaledVector(dir,5.5*dt);if(back)vel.addScaledVector(dir,-7*dt);
 yaw+=(right?1:0)-(left?1:0);yaw*=1; // steering input
 yaw += ((right?1:0)-(left?1:0))*Math.min(vel.length()*.12,1.4)*dt;
 vel.multiplyScalar(Math.pow(.986,dt*60));if(vel.length()>15)vel.setLength(15);
 if(keys.has('j')&&air>.06){spinVel+=18*dt;trickTimer=1;document.querySelector('#trickLabel').textContent='KICKFLIP'}
 if(keys.has('k')&&air>.06){spinVel-=18*dt;trickTimer=1;document.querySelector('#trickLabel').textContent='HEELFLIP'}
 pos.addScaledVector(vel,dt);pos.y+=popVel*dt;popVel-=13.5*dt;
 if(pos.y<=.3){pos.y=.3;if(popVel<0){popVel=0;if(air>.12){document.querySelector('#trickLabel').textContent='CLEAN LANDING';setTimeout(()=>{if(document.querySelector('#trickLabel').textContent==='CLEAN LANDING')document.querySelector('#trickLabel').textContent='PUSH TO ROLL'},700)}air=0;spin*=.15;boardPitch=0;boardRoll=0}}
 else air+=dt;
 spin+=spinVel*dt;spinVel*=Math.pow(.02,dt);if(air<.1)spin*=Math.pow(.001,dt);
 board.rotation.set(boardPitch+Math.sin(spin)*Math.min(air*2,1)*.5,spin,boardRoll);
 skater.position.copy(pos);skater.rotation.y=yaw;
 torso.position.y=Math.max(0,pos.y-.3);torso.rotation.z=THREE.MathUtils.lerp(torso.rotation.z,(left?-.13:right?.13:0),dt*5);
 board.position.set(0,.13+Math.max(0,pos.y-.3),0);
 const speed=vel.length()*3.6;document.querySelector('#speed').textContent=Math.round(speed);
 if(trickTimer>0)trickTimer-=dt;
 const target=new THREE.Vector3(pos.x-Math.sin(yaw)*6,pos.y+4.2,pos.z-Math.cos(yaw)*6);
 camera.position.lerp(target,1-Math.exp(-dt*5));camera.lookAt(pos.x,pos.y+.5,pos.z+1);
 for(let i=0;i<legs.length;i++){const a=new THREE.Vector3((i? .15:-.15),.75,0).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(pos);const b=new THREE.Vector3((i?.2:-.2),.15,0).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(pos);const mid=a.clone().add(b).multiplyScalar(.5);const obj=legs[i].mesh;obj.position.copy(mid);obj.scale.y=a.distanceTo(b);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize())}
}
camera.position.set(0,5,-5);camera.lookAt(0,0,2);
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.033);update(dt);renderer.render(scene,camera)}
loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.25))});
updateCustom();
