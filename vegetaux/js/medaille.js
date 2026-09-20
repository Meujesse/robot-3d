// Médaille 3D « Botaniste de terrain » : arrivée en rotation, puis on la fait tourner à la souris.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const hote=document.getElementById('med3d');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
hote.appendChild(renderer.domElement);
const scene=new THREE.Scene();const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
const cam=new THREE.PerspectiveCamera(32,1,.1,50);cam.position.set(0,0,6.4);
const lum=new THREE.DirectionalLight(0xfff0d0,2.2);lum.position.set(2,3,4);scene.add(lum);scene.add(new THREE.AmbientLight(0xffffff,.35));
function taille(){const w=hote.clientWidth,h=hote.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}new ResizeObserver(taille).observe(hote);taille();

// textures des faces
function face(recto){
 const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');const C=512;
 const fond=g.createRadialGradient(C,C*.8,50,C,C,520);fond.addColorStop(0,'#2f6b50');fond.addColorStop(1,'#15392a');g.fillStyle=fond;g.beginPath();g.arc(C,C,512,0,7);g.fill();
 g.strokeStyle='#f2c14e';g.lineWidth=10;g.setLineDash([18,22]);g.beginPath();g.arc(C,C,440,0,7);g.stroke();g.setLineDash([]);
 g.fillStyle='#ffe29a';g.textAlign='center';g.textBaseline='middle';
 function arc(txt,rayon,haut){g.save();g.font='800 64px Nunito, Arial, sans-serif';const lettres=[...txt];const pas=.105;const debut=-(lettres.length-1)*pas/2;
  lettres.forEach((l,i)=>{const a=debut+i*pas;g.save();g.translate(C,C);g.rotate(haut?a:-a);g.translate(0,haut?-rayon:rayon);if(!haut)g.rotate(0);g.fillText(l,0,0);g.restore()});g.restore()}
 if(recto){
  arc('BOTANISTE',360,true);arc('DE TERRAIN',372,false);
  // feuille de ginkgo
  g.save();g.translate(C,C+60);g.scale(2.3,2.3);g.fillStyle='#f2c14e';g.beginPath();g.moveTo(0,-8);g.lineTo(-66,-78);g.bezierCurveTo(-54,-110,-24,-122,-5,-114);g.lineTo(0,-97);g.lineTo(5,-114);g.bezierCurveTo(24,-122,54,-110,66,-78);g.closePath();g.fill();
  g.strokeStyle='#f2c14e';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(0,-8);g.lineTo(0,40);g.stroke();
  g.strokeStyle='rgba(21,57,42,.55)';g.lineWidth=2.2;[[-30,-100],[-52,-80],[-60,-50],[30,-100],[52,-80],[60,-50],[-10,-86],[10,-86]].forEach(([x,y])=>{g.beginPath();g.moveTo(0,-10);g.lineTo(x,y);g.stroke()});g.restore();
 }else{
  arc('MEUJESSE LEARNING',370,true);
  g.font='italic 600 62px Georgia, serif';g.fillStyle='#fbf6ea';
  ['Ginkgo biloba','Narcissus','pseudonarcissus','Lavandula','angustifolia'].forEach((t,i)=>g.fillText(t,C,C-170+i*85));
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
const or=new THREE.MeshStandardMaterial({color:0xf2c14e,metalness:1,roughness:.28});
const orSombre=new THREE.MeshStandardMaterial({color:0xc98e1c,metalness:1,roughness:.35});
const med=new THREE.Group();scene.add(med);
// rosace dentelée
const rosace=new THREE.Shape();const N=24;for(let i=0;i<=N*2;i++){const a=i/(N*2)*Math.PI*2;const r=i%2?1.38:1.22;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?rosace.lineTo(x,y):rosace.moveTo(x,y)}
const rg=new THREE.ExtrudeGeometry(rosace,{depth:.12,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:3,curveSegments:2});rg.center();med.add(new THREE.Mesh(rg,orSombre));
// pièce centrale (tranche + bord relevé)
const prof=[[0,-.11],[1.12,-.11],[1.18,-.08],[1.2,0],[1.18,.08],[1.12,.11],[0,.11]].map(([x,y])=>new THREE.Vector2(x,y));
const piece=new THREE.Mesh(new THREE.LatheGeometry(prof,96),or);piece.rotation.x=Math.PI/2;med.add(piece);
const disque=new THREE.CircleGeometry(1.04,96);
const recto=new THREE.Mesh(disque,new THREE.MeshStandardMaterial({map:face(true),metalness:.35,roughness:.4}));recto.position.z=.112;med.add(recto);
const verso=new THREE.Mesh(disque,new THREE.MeshStandardMaterial({map:face(false),metalness:.35,roughness:.4}));verso.position.z=-.112;verso.rotation.y=Math.PI;med.add(verso);
// étincelles
const etoiles=new THREE.Group();scene.add(etoiles);const eg=new THREE.OctahedronGeometry(.04);const em=new THREE.MeshBasicMaterial({color:0xffe29a});
for(let i=0;i<18;i++){const m=new THREE.Mesh(eg,em);const a=Math.random()*Math.PI*2,r=1.6+Math.random()*.6;m.position.set(Math.cos(a)*r,Math.sin(a)*r,(Math.random()-.5)*.6);m.userData.p=Math.random()*6;etoiles.add(m)}

// interaction
let rotY=0,rotX=0,vitY=0,glisse=false,px=0,py=0,t0=null,visible=false;
hote.addEventListener('pointerdown',e=>{glisse=true;px=e.clientX;py=e.clientY;hote.setPointerCapture(e.pointerId)});
hote.addEventListener('pointermove',e=>{if(!glisse)return;const dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;vitY=dx*.012;rotY+=vitY;rotX=Math.max(-.6,Math.min(.6,rotX+dy*.008))});
addEventListener('pointerup',()=>{glisse=false});
new IntersectionObserver(es=>{for(const e of es){const v=e.isIntersecting&&innerWidth>50;if(v&&!visible)t0=null;visible=v}}).observe(hote);
let prec=performance.now();
function boucle(now){requestAnimationFrame(boucle);const dt=Math.min(.05,(now-prec)/1000);prec=now;if(!visible||document.hidden)return;
 if(t0===null)t0=now;const k=Math.min(1,(now-t0)/1800);const e=1-Math.pow(1-k,3);
 if(k<1){med.scale.setScalar(.2+.8*e);rotY=-Math.PI*4*(1-e);rotX=0}
 else if(!glisse){vitY*=.95;rotY+=vitY;const cible=Math.round(rotY/(Math.PI*2))*Math.PI*2+Math.sin(now/1400)*.35;if(Math.abs(vitY)<.002)rotY+=(cible-rotY)*.02;rotX*=.96}
 med.rotation.set(rotX,rotY,0);med.position.y=Math.sin(now/900)*.05;
 etoiles.children.forEach(m=>{m.scale.setScalar(.5+.5*Math.sin(now/300+m.userData.p));m.rotation.y+=dt*2});
 renderer.render(scene,cam)}
requestAnimationFrame(boucle);
