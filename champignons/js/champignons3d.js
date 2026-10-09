// Moteur 3D procédural : cèpe de Bordeaux, girolle, amanite phalloïde. Sol en coupe avec mycélium.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
const lisse=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const plage=(m,a,b,c,d)=>m<a||m>d?0:m<b?lisse(a,b,m):m<=c?1:1-lisse(c,d,m);
function rng(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}
function mat(color,o={}){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:.8,metalness:0},o))}
function canvasTex(w,h,dessin){const c=document.createElement('canvas');c.width=w;c.height=h;dessin(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function lathe(profil,seg=64,m){const g=new THREE.LatheGeometry(profil.map(([r,y])=>new THREE.Vector2(r,y)),seg);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;return o}
function tube(points,r,m,seg=24,rs=8){const c=new THREE.CatmullRomCurve3(points);const o=new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,rs,false),m);o.castShadow=true;o.userData.curve=c;return o}

// ---------- scène ----------
export function creerScene(conteneur){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;
 conteneur.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.5;
 scene.add(new THREE.HemisphereLight(0xdfeeff,0x4a3a26,.9));
 const soleil=new THREE.DirectionalLight(0xfff0d8,2.0);soleil.position.set(2.5,6,3.5);soleil.castShadow=true;soleil.shadow.mapSize.set(1024,1024);
 Object.assign(soleil.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:1,far:20});soleil.shadow.bias=-.0005;scene.add(soleil);
 const contre=new THREE.DirectionalLight(0xcfe3ff,.5);contre.position.set(-4,3,-3);scene.add(contre);
 const ombre=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.ShadowMaterial({opacity:.2}));ombre.rotation.x=-Math.PI/2;ombre.receiveShadow=true;scene.add(ombre);
 const camera=new THREE.PerspectiveCamera(34,1,.05,100);
 const ctrl=new OrbitControls(camera,renderer.domElement);ctrl.enableDamping=true;ctrl.dampingFactor=.08;ctrl.enablePan=false;ctrl.maxPolarAngle=Math.PI*.7;
 function taille(){const w=conteneur.clientWidth,h=conteneur.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 new ResizeObserver(taille).observe(conteneur);taille();
 return {renderer,scene,camera,ctrl,ombre,taille};
}

// ---------- sol en coupe (commun) : litière, terre, racines, mycélium ----------
const PLAN_AVANT=new THREE.Plane(V(0,0,-1),0); // garde z<=0 : on voit la coupe
function texTerre(mycel){
 return canvasTex(1024,512,(g,w,h)=>{const r=rng(31);
  const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#5a3f2a');grad.addColorStop(.18,'#4a3322');grad.addColorStop(1,'#3a2a1c');g.fillStyle=grad;g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${20+r()*60|0},${15+r()*35|0},${10+r()*20|0},${.25+r()*.5})`;const s=1+r()*5;g.fillRect(r()*w,r()*h,s,s)}
  for(let i=0;i<40;i++){g.fillStyle='rgba(120,95,70,.35)';g.beginPath();g.ellipse(r()*w,40+r()*(h-40),4+r()*14,3+r()*7,r()*3,0,7);g.fill()}
  g.fillStyle='#6b4c2c';g.fillRect(0,0,w,14);
  if(mycel){g.strokeStyle='rgba(255,255,250,.85)';g.lineCap='round';
   const fil=(x,y,a,l,n)=>{if(n>7||l<6)return;const x2=x+Math.cos(a)*l,y2=y+Math.sin(a)*l;g.lineWidth=Math.max(.6,2.4-n*.3);g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();fil(x2,y2,a-.35-r()*.4,l*.85,n+1);fil(x2,y2,a+.35+r()*.4,l*.85,n+1)};
   for(let i=0;i<9;i++)fil(w*.5+(r()-.5)*160,60,Math.PI/2+(r()-.5)*2.4,60+r()*40,0);
  }
 });
}
function construireSol(G,opts={}){
 const R=opts.r||1.25,P=opts.prof||.75;
 const terre=new THREE.Mesh(new THREE.CylinderGeometry(R,R*.9,P,48,1,false),mat(0x4a3322,{roughness:1,clippingPlanes:[PLAN_AVANT]}));terre.position.y=-P/2;terre.receiveShadow=true;G.add(terre);
 const litiere=new THREE.Mesh(new THREE.CylinderGeometry(R,R,.04,48),mat(0x7a5a33,{roughness:1,clippingPlanes:[PLAN_AVANT]}));litiere.position.y=-.02;litiere.receiveShadow=true;G.add(litiere);
 // feuilles mortes
 const r=rng(opts.seed||5);const fm=mat(0xa4642e,{roughness:.9,side:THREE.DoubleSide});
 for(let i=0;i<26;i++){const f=new THREE.Mesh(new THREE.CircleGeometry(.07+r()*.06,7),fm);const a=r()*Math.PI,d=.35+r()*(R-.4);f.position.set(Math.cos(a)*d,.002+r()*.01,-Math.sin(a)*d*.9-.05);f.rotation.set(-Math.PI/2+(r()-.5)*.3,0,r()*6);f.scale.set(1,.6+r()*.5,1);f.material=fm.clone();f.material.color.offsetHSL(0,0,(r()-.5)*.18);f.receiveShadow=true;G.add(f)}
 // face de coupe avec mycélium
 const face=new THREE.Mesh(new THREE.PlaneGeometry(R*2,P),new THREE.MeshStandardMaterial({map:texTerre(true),roughness:1}));face.position.set(0,-P/2,0);face.receiveShadow=true;G.add(face);
 // racine d'arbre partenaire (mycorhize)
 const rac=tube([V(-R,-.25,-.1),V(-.6,-.33,-.15),V(-.1,-.42,-.1),V(.5,-.4,-.2)],.045,mat(0x6e4a2a,{roughness:.95}),30,8);G.add(rac);
 const rad=tube([V(-.1,-.42,-.1),V(.05,-.52,-.3),V(.3,-.6,-.45)],.02,mat(0x8a6238),16,6);G.add(rad);
 // brins de mycélium 3D vers le pied
 const myc=new THREE.Group();const mm=mat(0xf4f1e6,{roughness:.6,emissive:0xfff6d0,emissiveIntensity:0});
 for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2;const d=.5+r()*.5;const p=[V(0,-.08,0),V(Math.cos(a)*d*.4,-.18-r()*.15,Math.sin(a)*d*.4),V(Math.cos(a)*d,-.3-r()*.3,Math.sin(a)*d)];const t=tube(p,.006,mm,14,5);t.material=mm;t.castShadow=false;myc.add(t)}
 G.add(myc);
 return {terre,litiere,face,rac,myc,mm};
}

// ---------- CÈPE DE BORDEAUX ----------
function texChapeauCepe(){return canvasTex(512,512,(g,w,h)=>{const c=g.createRadialGradient(256,256,20,256,256,256);c.addColorStop(0,'#6b4322');c.addColorStop(.75,'#8a5a30');c.addColorStop(1,'#c8a16a');g.fillStyle=c;g.fillRect(0,0,w,h);const r=rng(9);for(let i=0;i<1600;i++){g.fillStyle=`rgba(${60+r()*40|0},${35+r()*25|0},${15+r()*15|0},${r()*.25})`;g.fillRect(r()*w,r()*h,2,2)}})}
function texPores(){return canvasTex(512,512,(g,w,h)=>{g.fillStyle='#cfc06a';g.fillRect(0,0,w,h);const r=rng(4);for(let y=0;y<h;y+=5)for(let x=0;x<w;x+=5){g.fillStyle=`rgba(90,85,40,${.35+r()*.35})`;g.beginPath();g.arc(x+2.5+(r()-.5),y+2.5+(r()-.5),1.6,0,7);g.fill()}})}
function texPiedCepe(){return canvasTex(512,512,(g,w,h)=>{const c=g.createLinearGradient(0,0,0,h);c.addColorStop(0,'#e9dcc0');c.addColorStop(1,'#cdb98f');g.fillStyle=c;g.fillRect(0,0,w,h);
 // réticulum blanc fin, plus net vers le haut
 g.strokeStyle='rgba(255,255,255,.9)';const r=rng(12);for(let y=0;y<h*.75;y+=14){for(let x=0;x<w;x+=18){const a=1-y/(h*.75);g.lineWidth=.9+a*.9;g.globalAlpha=.25+a*.7;g.beginPath();g.moveTo(x,y);g.lineTo(x+9+(r()-.5)*6,y+14);g.lineTo(x+18,y);g.stroke()}}g.globalAlpha=1})}
function sectionCepe(){ // texture de la face de coupe : chair blanche, peau brune fine, bande de tubes olive
 return canvasTex(512,512,(g,w,h)=>{g.fillStyle='#f7f2e4';g.fillRect(0,0,w,h);g.fillStyle='#b9ad5e';g.fillRect(0,h*.335,w,h*.075);g.fillStyle='#7a4a24';g.fillRect(0,0,w,h*.025);g.fillStyle='#efe6cf';g.fillRect(0,h*.41,w,h*.59)})}
export function construireCepe(){
 const G=new THREE.Group();G.name='cepe';const sol=construireSol(G,{seed:3});
 const corps=new THREE.Group();G.add(corps);
 const H=.8; // hauteur du pied
 const profPied=[[.0,0],[.33,0],[.36,.1],[.34,.3],[.3,.5],[.25,.65],[.21,.78],[.2,H]];
 const profChap=[[0,H+.42],[.22,H+.4],[.4,H+.33],[.52,H+.2],[.58,H+.05],[.57,H-.04],[.5,H-.07],[.3,H-.08],[.21,H-.07],[.2,H-.02]];
 const mPied=new THREE.MeshStandardMaterial({map:texPiedCepe(),roughness:.85}),mChap=new THREE.MeshStandardMaterial({map:texChapeauCepe(),roughness:.55}),mPores=new THREE.MeshStandardMaterial({map:texPores(),roughness:.9,side:THREE.DoubleSide});
 const moities=[];
 // face de coupe : silhouette complète (chapeau + pied) dans le plan YZ, texture peinte d'après le profil
 const PROFIL=[...profPied,[.2,H-.02],[.21,H-.07],[.3,H-.08],[.5,H-.07],[.57,H-.04],[.58,H+.05],[.52,H+.2],[.4,H+.33],[.22,H+.4],[0,H+.42]];
 const texSection=canvasTex(512,512,(g,w,h)=>{const X=x=>(x+.62)/1.24*w, Y=y=>h-(y/1.25)*h;
  g.fillStyle='#f6f1e3';g.fillRect(0,0,w,h);
  const r=rng(77);g.strokeStyle='rgba(205,195,170,.35)';g.lineWidth=1;for(let i=0;i<90;i++){const x=X(-.33+r()*.66);g.beginPath();g.moveTo(x+(r()-.5)*4,Y(.02));g.lineTo(x+(r()-.5)*6,Y(H-.1));g.stroke()}
  // chair du chapeau un peu plus crème, couche de tubes olive
  g.fillStyle='#efe6cf';g.beginPath();g.moveTo(X(-.58),Y(H-.08));g.lineTo(X(.58),Y(H-.08));g.lineTo(X(.58),Y(H+.45));g.lineTo(X(-.58),Y(H+.45));g.closePath();g.fill();
  g.fillStyle='#b4a95a';g.beginPath();g.moveTo(X(-.56),Y(H-.075));g.lineTo(X(.56),Y(H-.075));g.lineTo(X(.5),Y(H+.03));g.lineTo(X(-.5),Y(H+.03));g.closePath();g.fill();
  g.strokeStyle='rgba(120,110,50,.5)';g.lineWidth=1;for(let i=0;i<110;i++){const x=X(-.55+i*.01);g.beginPath();g.moveTo(x,Y(H-.07));g.lineTo(x,Y(H+.02));g.stroke()}
  // peau brune fine le long du chapeau
  g.strokeStyle='#6f4420';g.lineWidth=7;g.lineJoin='round';g.beginPath();const cap=PROFIL.slice(10);cap.forEach(([rr,y],i)=>{i?g.lineTo(X(rr),Y(y)):g.moveTo(X(rr),Y(y))});g.stroke();g.beginPath();cap.forEach(([rr,y],i)=>{i?g.lineTo(X(-rr),Y(y)):g.moveTo(X(-rr),Y(y))});g.stroke();
 });
 const faceCoupe=()=>{const sh=new THREE.Shape();sh.moveTo(0,0);PROFIL.forEach(([r,y])=>sh.lineTo(r,y));[...PROFIL].reverse().forEach(([r,y])=>sh.lineTo(-r,y));sh.closePath();
  const g=new THREE.ShapeGeometry(sh,24);const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<uv.count;i++){uv.setXY(i,(pos.getX(i)+.62)/1.24,pos.getY(i)/1.25)}
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:texSection,roughness:.95,side:THREE.DoubleSide}));m.rotation.y=Math.PI/2;return m};
 for(const s of [-1,1]){const h=new THREE.Group();const plan=new THREE.Plane(V(s,0,0),0);
  const pied=lathe(profPied,56,mPied.clone());pied.material.clippingPlanes=[plan];
  const chap=lathe(profChap,64,mChap.clone());chap.material.clippingPlanes=[plan];
  const pores=new THREE.Mesh(new THREE.RingGeometry(.21,.5,64,1),mPores.clone());pores.material.clippingPlanes=[plan];pores.rotation.x=Math.PI/2;pores.position.y=H-.075;
  const face=faceCoupe();face.visible=false;
  h.add(pied,chap,pores,face);h.userData={pied,chap,pores,face,s};corps.add(h);moities.push(h)}
 const base=new THREE.Mesh(new THREE.SphereGeometry(.34,24,12,0,7,Math.PI/2,Math.PI/2),mat(0xd9c9a6));base.scale.y=.4;base.position.y=.0;corps.add(base);
 const anim={o:0,cible:0,sosie:0,sosieCible:0};
 const texReseauBrun=canvasTex(512,512,(g,w,h)=>{const c=g.createLinearGradient(0,0,0,h);c.addColorStop(0,'#d9c9a4');c.addColorStop(1,'#bfa77a');g.fillStyle=c;g.fillRect(0,0,w,h);g.strokeStyle='rgba(90,55,25,.95)';const r=rng(5);for(let y=0;y<h*.9;y+=16){for(let x=0;x<w;x+=20){g.lineWidth=2.2;g.globalAlpha=.6+.4*(1-y/h);g.beginPath();g.moveTo(x,y);g.lineTo(x+10+(r()-.5)*6,y+16);g.lineTo(x+20,y);g.stroke()}}g.globalAlpha=1});
 const texPoresRoses=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#e8c9c4';g.fillRect(0,0,w,h);const r=rng(4);for(let y=0;y<h;y+=5)for(let x=0;x<w;x+=5){g.fillStyle=`rgba(150,80,90,${.35+r()*.35})`;g.beginPath();g.arc(x+2.5+(r()-.5),y+2.5+(r()-.5),1.6,0,7);g.fill()}});
 const texPiedN=mPied.map, texPoresN=mPores.map;
 G.userData={sol,corps,moities,anim,
  vue:{pos:V(.4,1.3,3.3),cible:V(0,.55,0),min:1,max:6},
  points:{chapeau:[moities[1].userData.chap,V(.25,H+.35,.2)],pores:[moities[1].userData.pores,V(.4,0,.2)],reticulum:[moities[1].userData.pied,V(.19,H-.12,.1)],pied:[moities[0].userData.pied,V(-.33,.25,.1)],chair:[moities[0].userData.face,V(-.15,H-.3,0)],tubes:[moities[0].userData.face,V(-.3,H-.04,0)],mycelium:[sol.face,V(.1,-.25,0)]},
  setCoupe:(on,instant)=>{anim.cible=on?1:0;if(instant)anim.o=anim.cible},
  setSosie:(on)=>{anim.sosieCible=on?1:0;moities.forEach(h=>{h.userData.pied.material.map=on?texReseauBrun:texPiedN;h.userData.pied.material.needsUpdate=true;h.userData.pores.material.map=on?texPoresRoses:texPoresN;h.userData.pores.material.needsUpdate=true})},
  maj:(dt)=>{anim.o+=(anim.cible-anim.o)*Math.min(1,dt*4);const o=anim.o;moities.forEach(h=>{const s=h.userData.s;h.position.set(-s*.42*o,0,.1*o);h.rotation.y=-s*.95*o;h.userData.face.visible=o>.02})},
  jours:(j)=>{ // j : jours après la pluie, 0 à 15
   const k=plage(j,2.5,6,10,14);corps.visible=k>.02;const e=.1+.9*k;corps.scale.set(e,e,e);
   const vieux=lisse(10,14,j);
   moities.forEach(h=>{h.userData.chap.scale.set(.5+.5*lisse(2.5,7,j),.75+.25*k,.5+.5*lisse(2.5,7,j));h.userData.chap.position.y=-(1-k)*.08;h.userData.pores.visible=j>4;const c=new THREE.Color(0xffffff).lerp(new THREE.Color(0x6a5a40),vieux);h.userData.chap.material.color.copy(c);h.userData.pied.material.color.copy(c);h.userData.pores.material.color.copy(new THREE.Color(0xffffff).lerp(new THREE.Color(0x7a7a30),lisse(6,12,j)))});
   sol.mm.emissiveIntensity=plage(j,0,1.5,6,9)*.7;}
 };
 return G;
}

// ---------- GIROLLE ----------
function texGirolle(){return canvasTex(512,512,(g,w,h)=>{const c=g.createRadialGradient(256,256,30,256,256,256);c.addColorStop(0,'#e9a526');c.addColorStop(1,'#f5c34a');g.fillStyle=c;g.fillRect(0,0,w,h);const r=rng(21);for(let i=0;i<900;i++){g.fillStyle=`rgba(200,130,20,${r()*.2})`;g.fillRect(r()*w,r()*h,3,3)}})}
export function construireGirolle(){
 const G=new THREE.Group();G.name='girolle';const sol=construireSol(G,{seed:8});
 const corps=new THREE.Group();G.add(corps);const pivot=new THREE.Group();corps.add(pivot);
 const mJ=new THREE.MeshStandardMaterial({map:texGirolle(),roughness:.7,side:THREE.DoubleSide}),mPlis=mat(0xf0b63a,{roughness:.75}),mChair=mat(0xfbf4dc,{roughness:.95});
 // pied court qui s'évase, puis chapeau en entonnoir ; marge ondulée
 const H=.42;const prof=[[0,0],[.1,0],[.12,.12],[.13,.25],[.16,H],[.26,H+.08],[.38,H+.13],[.48,H+.16],[.55,H+.17],[.56,H+.165],[.5,H+.14],[.4,H+.1],[.3,H+.06],[.2,H+.03],[.12,H+.02],[.06,H+.0]];
 const ch=lathe(prof,72,mJ);
 {const p=ch.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i);const d=Math.hypot(x,z);if(d>.3){const a=Math.atan2(z,x);const w=(d-.3)/.26;p.setY(i,y+Math.sin(a*5+.4)*.035*w+Math.sin(a*11)*.012*w)}}ch.geometry.computeVertexNormals()}
 pivot.add(ch);
 // plis décurrents : crêtes qui descendent du dessous du chapeau sur le pied
 const plis=new THREE.Group();pivot.add(plis);const r=rng(2);
 for(let i=0;i<28;i++){const a=(i/28)*Math.PI*2;const dir=V(Math.cos(a),0,Math.sin(a));const pts=[V(0,.18,0).add(dir.clone().multiplyScalar(.12)),dir.clone().multiplyScalar(.2).setY(H+.02),dir.clone().multiplyScalar(.36).setY(H+.075),dir.clone().multiplyScalar(.52).setY(H+.125)];const t=tube(pts,.012,mPlis,16,6);t.position.y=-.012;plis.add(t);
  if(i%2===0){const a2=a+.07;const d2=V(Math.cos(a2),0,Math.sin(a2));const f=tube([d2.clone().multiplyScalar(.3).setY(H+.05),d2.clone().multiplyScalar(.52).setY(H+.12)],.01,mPlis,10,6);f.position.y=-.012;plis.add(f)}}
 const chair=new THREE.Mesh(new THREE.SphereGeometry(.13,24,16,0,7,0,Math.PI/2),mChair);chair.position.y=.02;chair.visible=false;pivot.add(chair);
 // sosie : fausse girolle, vraies lames fines, serrées, orange
 const lamesF=new THREE.Group();lamesF.visible=false;pivot.add(lamesF);const mLF=mat(0xe07a2a,{roughness:.8,side:THREE.DoubleSide});
 for(let i=0;i<72;i++){const a=i/72*Math.PI*2;const l=new THREE.Mesh(new THREE.PlaneGeometry(.36,.05),mLF);l.position.set(Math.cos(a)*.3,H+.06,Math.sin(a)*.3);l.rotation.y=-a;l.rotation.z=.2;lamesF.add(l)}
 const mJsosie=new THREE.MeshStandardMaterial({color:0xf0862a,roughness:.7,side:THREE.DoubleSide});
 // deuxième girolle plus petite, derrière
 const petite=lathe(prof,48,mJ);petite.scale.setScalar(.55);petite.position.set(-.55,0,-.35);petite.rotation.z=.15;corps.add(petite);
 const anim={o:0,cible:0};
 G.userData={sol,corps,pivot,anim,plis,ch,
  vue:{pos:V(.3,1.1,2.9),cible:V(0,.35,0),min:.8,max:6},
  points:{entonnoir:[ch,V(0,H+.17,.3)],marge:[ch,V(.5,H+.15,.25)],plis:[plis,V(.3,H+.04,.25)],pied:[ch,V(.14,.2,.05)],couleur:[ch,V(-.3,H+.1,-.3)],mycelium:[sol.face,V(-.2,-.3,0)]},
  setCoupe:(on,instant)=>{anim.cible=on?1:0;if(instant)anim.o=anim.cible},
  setSosie:(on)=>{plis.visible=!on;lamesF.visible=on;ch.material=on?mJsosie:mJ;petite.material=ch.material},
  maj:(dt)=>{anim.o+=(anim.cible-anim.o)*Math.min(1,dt*3.5);const o=anim.o;pivot.rotation.x=Math.PI*o;pivot.position.y=o*.62;pivot.position.z=o*.3},
  jours:(j)=>{const k=plage(j,3,8,12,15.5);corps.visible=k>.02;const e=.1+.9*k;corps.scale.set(e,e,e);const c=new THREE.Color(0xffffff).lerp(new THREE.Color(0x8a6a30),lisse(12,15,j));ch.material.color.copy(c);
   sol.mm.emissiveIntensity=plage(j,0,1.5,7,10)*.7;}
 };
 return G;
}

// ---------- AMANITE PHALLOÏDE ----------
function texAmanite(){return canvasTex(512,512,(g,w,h)=>{const c=g.createRadialGradient(256,256,10,256,256,256);c.addColorStop(0,'#5a6a2a');c.addColorStop(.6,'#7f8d3c');c.addColorStop(1,'#b7bd7a');g.fillStyle=c;g.fillRect(0,0,w,h);
 // fibrilles radiales innées
 g.strokeStyle='rgba(50,60,20,.35)';g.lineWidth=1.2;for(let i=0;i<160;i++){const a=i/160*Math.PI*2;g.beginPath();g.moveTo(256+Math.cos(a)*40,256+Math.sin(a)*40);g.lineTo(256+Math.cos(a+.05)*256,256+Math.sin(a+.05)*256);g.stroke()}})}
export function construireAmanite(){
 const G=new THREE.Group();G.name='amanite';const sol=construireSol(G,{seed:17});
 const corps=new THREE.Group();G.add(corps);const pied=new THREE.Group();corps.add(pied);
 const mBlanc=mat(0xf3f0e4,{roughness:.8}),mLame=mat(0xfbfaf2,{roughness:.9,side:THREE.DoubleSide}),mVolve=mat(0xe8e6d6,{roughness:.9,side:THREE.DoubleSide}),mChap=new THREE.MeshStandardMaterial({map:texAmanite(),roughness:.45});
 const H=.95,Y0=-.22; // base du pied sous la litière
 const st=lathe([[.11,Y0],[.13,Y0+.15],[.1,Y0+.4],[.085,Y0+.7],[.08,Y0+H]],32,mBlanc);pied.add(st);
 // chapeau vert olive, convexe puis étalé
 const chap=lathe([[0,Y0+H+.2],[.2,Y0+H+.18],[.36,Y0+H+.12],[.47,Y0+H+.03],[.5,Y0+H-.03],[.47,Y0+H-.05],[.1,Y0+H-.04],[.085,Y0+H-.02]],72,mChap);pied.add(chap);
 // lames blanches, libres : elles n'atteignent pas le pied
 const lames=new THREE.Group();pied.add(lames);
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2;const l=new THREE.Mesh(new THREE.PlaneGeometry(.33,.05),mLame);l.position.set(Math.cos(a)*.3,Y0+H-.065,Math.sin(a)*.3);l.rotation.y=-a;l.rotation.z=.12;lames.add(l)}
 // anneau en jupe
 const anneau=new THREE.Mesh(new THREE.CylinderGeometry(.085,.19,.13,32,1,true),mat(0xf7f5ea,{roughness:.9,side:THREE.DoubleSide}));anneau.position.y=Y0+H-.26;pied.add(anneau);
 // volve en sac, membraneuse, à la base
 const volve=lathe([[.0,Y0-.02],[.2,Y0],[.26,Y0+.1],[.27,Y0+.22],[.24,Y0+.3],[.2,Y0+.33],[.17,Y0+.3]],40,mVolve);pied.add(volve);
 // œuf (stade jeune) : voile général fermé
 const oeuf=new THREE.Mesh(new THREE.SphereGeometry(.22,32,20),mVolve.clone());oeuf.scale.set(1,1.25,1);oeuf.position.y=Y0+.2;oeuf.visible=false;corps.add(oeuf);
 const anim={o:0,cible:0,couteau:false};
 // base qui reste en terre quand on coupe au couteau : volve + bout de pied
 const reste=new THREE.Group();reste.visible=false;corps.add(reste);
 const stB=lathe([[.11,Y0],[.13,Y0+.15],[.1,Y0+.3],[.0,Y0+.3]],32,mBlanc);reste.add(stB);
 const volveB=lathe([[.0,Y0-.02],[.2,Y0],[.26,Y0+.1],[.27,Y0+.22],[.24,Y0+.3],[.2,Y0+.33],[.17,Y0+.3]],40,mVolve);reste.add(volveB);
 const coupeDisque=new THREE.Mesh(new THREE.CircleGeometry(.1,24),mat(0xf7f2e6));coupeDisque.rotation.x=-Math.PI/2;coupeDisque.position.y=Y0+.3;reste.add(coupeDisque);
 G.userData={sol,corps,pied,anim,chap,lames,anneau,volve,oeuf,reste,
  vue:{pos:V(.5,1.2,3.4),cible:V(0,.5,0),min:.9,max:6},
  points:{chapeau:[chap,V(.25,Y0+H+.14,.25)],lames:[lames,V(.25,Y0+H-.07,.25)],anneau:[anneau,V(.15,0,.12)],pied:[st,V(.08,Y0+.5,.06)],volve:[volve,V(.22,Y0+.2,.14)],base:[sol.face,V(.0,-.12,0)],mycelium:[sol.face,V(-.3,-.35,0)]},
  setCoupe:(on,instant)=>{anim.cible=on?1:0;if(instant)anim.o=anim.cible},
  setSosie:(on)=>{anim.couteau=on;reste.visible=on;volve.visible=!on;st.visible=true;
   // coupé au couteau : le pied du champignon cueilli est tronqué au ras du sol, la volve reste en terre
   st.geometry.dispose();st.geometry=on?new THREE.LatheGeometry([[.1,Y0+.3],[.085,Y0+.7],[.08,Y0+H]].map(([r,y])=>new THREE.Vector2(r,y)),32):new THREE.LatheGeometry([[.11,Y0],[.13,Y0+.15],[.1,Y0+.4],[.085,Y0+.7],[.08,Y0+H]].map(([r,y])=>new THREE.Vector2(r,y)),32);
   if(on){const d=new THREE.Mesh(new THREE.CircleGeometry(.1,24),mat(0xf7f2e6));d.rotation.x=Math.PI/2;d.position.y=Y0+.3;d.name='disqueCoupe';pied.add(d)}else{const d=pied.getObjectByName('disqueCoupe');if(d)pied.remove(d)}},
  maj:(dt)=>{anim.o+=(anim.cible-anim.o)*Math.min(1,dt*3.5);const o=anim.o;pied.position.set(.55*o,.5*o,.35*o);pied.rotation.z=-.35*o;pied.rotation.x=.25*o},
  jours:(j)=>{const k=plage(j,1.5,7,10,13.5);corps.visible=k>.02;
   const egg=j<3.6&&k>.02;oeuf.visible=egg;const ke=lisse(1.5,3.6,j);oeuf.scale.set(.3+.7*ke,(.3+.7*ke)*1.25,.3+.7*ke);pied.visible=!egg;
   const kk=lisse(3.6,7.5,j);pied.scale.set(.4+.6*kk,.4+.6*kk,.4+.6*kk);pied.position.y=0;
   chap.scale.set(1,1.5-.5*kk,1);const c=new THREE.Color(0xffffff).lerp(new THREE.Color(0x5a5a40),lisse(10,13.5,j));chap.material.color.copy(c);
   sol.mm.emissiveIntensity=plage(j,0,1.5,6,9)*.7;G.userData.oeufVisible=egg;}
 };
 return G;
}
