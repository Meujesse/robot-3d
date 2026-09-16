// Moteur 3D procédural : ginkgo (rameau), narcisse (plante + bulbe en coupe), lavande (touffe).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const V = (x,y,z)=>new THREE.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
function mat(color,o={}){return new THREE.MeshStandardMaterial(Object.assign({color,roughness:.75,metalness:0},o))}
function tube(points,r,col,seg=40,rs=10){const c=new THREE.CatmullRomCurve3(points);const m=new THREE.Mesh(new THREE.TubeGeometry(c,seg,r,rs,false),typeof col==='object'?col:mat(col));m.castShadow=true;m.userData.curve=c;return m}
function rng(seed){let s=seed;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}}

// ---------- scène ----------
export function creerScene(conteneur){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.localClippingEnabled=true;
 conteneur.appendChild(renderer.domElement);
 const scene=new THREE.Scene();
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),0.04).texture;scene.environmentIntensity=.55;
 scene.add(new THREE.HemisphereLight(0xeef6ff,0x6b5a3a,.9));
 const soleil=new THREE.DirectionalLight(0xfff1dc,2.1);soleil.position.set(3,6,4);soleil.castShadow=true;soleil.shadow.mapSize.set(1024,1024);
 Object.assign(soleil.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:1,far:20});soleil.shadow.bias=-.0005;scene.add(soleil);
 const contre=new THREE.DirectionalLight(0xdfeaff,.6);contre.position.set(-4,3,-3);scene.add(contre);
 const ombre=new THREE.Mesh(new THREE.CircleGeometry(2.4,64),new THREE.ShadowMaterial({opacity:.18}));ombre.rotation.x=-Math.PI/2;ombre.receiveShadow=true;scene.add(ombre);
 const camera=new THREE.PerspectiveCamera(34,1,.05,100);
 const ctrl=new OrbitControls(camera,renderer.domElement);ctrl.enableDamping=true;ctrl.dampingFactor=.08;ctrl.enablePan=false;ctrl.maxPolarAngle=Math.PI*.62;
 function taille(){const w=conteneur.clientWidth,h=conteneur.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
 new ResizeObserver(taille).observe(conteneur);taille();
 return {renderer,scene,camera,ctrl,ombre,taille};
}

// ---------- ginkgo ----------
function texNervures(){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,512,512);g.strokeStyle='rgba(40,60,20,.34)';g.lineCap='round';
 const r=rng(7);
 function branche(x,y,a,l,w,n){if(n>5||l<8)return;const x2=x+Math.sin(a)*l,y2=y-Math.cos(a)*l;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();
  const d=.13+r()*.05;branche(x2,y2,a-d,l*.93,w*.8,n+1);branche(x2,y2,a+d,l*.93,w*.8,n+1)}
 for(const a of[-.6,-.2,.2,.6])branche(256,500,a,70,2.2,0);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function feuilleGinkgo(texture){
 // pétiole + limbe en éventail construit en grille (angle × rayon), échancrure centrale
 const L=.3,R=.3,A=THREE.MathUtils.degToRad(62),NA=36,NR=8;
 const pos=[],uv=[],idx=[];
 for(let i=0;i<=NA;i++){const a=-A+2*A*i/NA;const enc=Math.max(0,1-Math.abs(a)/.16)*.3;const onde=.01*Math.sin(i*1.9);const Ra=R*(1-enc+onde);
  for(let j=0;j<=NR;j++){const rho=Ra*(j/NR);const x=Math.sin(a)*rho,y=L+Math.cos(a)*rho;const z=.55*x*x+.35*(rho*rho)-.08*rho;
   pos.push(x,y,z);uv.push(.5+Math.sin(a)*(j/NR)*.5*.98,(Math.cos(a)*(j/NR))*.97+.02)}}
 for(let i=0;i<NA;i++)for(let j=0;j<NR;j++){const k=i*(NR+1)+j,k2=k+NR+1;idx.push(k,k2,k+1,k+1,k2,k2+1)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const m=new THREE.MeshStandardMaterial({color:0x6aa84f,map:texture,side:THREE.DoubleSide,roughness:.6});
 const f=new THREE.Mesh(geo,m);f.castShadow=true;
 const pet=new THREE.Mesh(new THREE.CylinderGeometry(.006,.008,L,6),m);pet.position.y=L/2;pet.castShadow=true;f.add(pet);
 return f;
}
export function construireGinkgo(){
 const G=new THREE.Group();G.name='ginkgo';const tex=texNervures();const feuilles=[],graines=[],bourgeons=[];const cible={};
 const bois=mat(0x8a7b6c,{roughness:.95});
 const branche=tube([V(-1.25,.55,0),V(-.5,.72,.05),V(.3,.86,-.02),V(1.0,1.02,0)],.05,bois,60,12);G.add(branche);
 const pousse=tube([V(1.0,1.02,0),V(1.3,1.18,.05),V(1.62,1.42,.02)],.022,mat(0x98905e),30,8);G.add(pousse);
 cible.ecorce=branche;cible.long=pousse;
 // feuilles alternes sur la pousse longue
 [.25,.48,.7,.9].forEach((t,i)=>{const p=pousse.userData.curve.getPointAt(t);const f=feuilleGinkgo(tex);f.scale.setScalar(.8);f.position.copy(p);f.rotation.set(0,i%2?2.6:.5,i%2?.9:-.9);G.add(f);feuilles.push(f)});
 // rameaux courts
 const ts=[.18,.42,.66,.86];
 ts.forEach((t,k)=>{const p=branche.userData.curve.getPointAt(t);
  const up=k%2?V(.15,1,-.35).normalize():V(-.1,1,.3).normalize();
  const court=new THREE.Group();court.position.copy(p);court.quaternion.setFromUnitVectors(V(0,1,0),up);G.add(court);
  const moignon=new THREE.Mesh(new THREE.CylinderGeometry(.03,.042,.13,12),bois);moignon.position.y=.065;moignon.castShadow=true;court.add(moignon);
  for(let j=0;j<3;j++){const a=new THREE.Mesh(new THREE.TorusGeometry(.037-j*.003,.006,6,16),mat(0x6f6356));a.rotation.x=Math.PI/2;a.position.y=.02+j*.035;court.add(a)}
  const b=new THREE.Mesh(new THREE.SphereGeometry(.028,16,10,0,Math.PI*2,0,Math.PI/2),mat(0x8b6546));b.position.y=.13;court.add(b);bourgeons.push(b);
  const n=k===1?5:4;
  for(let j=0;j<n;j++){const f=feuilleGinkgo(tex);const a=(j/n)*Math.PI*2+k;f.position.y=.12;f.rotation.set(0,a,0);f.rotateX(-.55-.1*(j%2));f.scale.setScalar(.85+.1*((j+k)%3)/2);court.add(f);feuilles.push(f)}
  if(k===1){cible.court=court;
   [[-.5,.35],[.6,-.3]].forEach(([ax,az],j)=>{const ped=tube([V(0,.12,0),V(ax*.12,.05,az*.12),V(ax*.22,-.12,az*.22)],.006,mat(0xb5a23c),16,6);court.add(ped);
    const gr=new THREE.Mesh(new THREE.SphereGeometry(.07,24,16),mat(0xc9b04a,{roughness:.45}));gr.position.set(ax*.22,-.18,az*.22);gr.castShadow=true;court.add(gr);graines.push({gr,ped});if(j===0)cible.graine=gr})}
  if(k===2)cible.bourgeon=b;
 });
 cible.feuille=feuilles[2];
 G.userData={feuilles,graines,bourgeons,cible,
  vue:{pos:V(.25,2.3,4.9),cible:V(.2,.95,0),min:1.2,max:7},
  points:{feuille:[cible.feuille,V(0,.5,0)],court:[cible.court,V(0,.1,0)],long:[pousse,null,.75],graine:[cible.graine,V(0,0,0)],bourgeon:[cible.bourgeon,V(0,.02,0)],ecorce:[branche,null,.25]}};
 G.userData.saison=(s,t)=>{ // t : 0..1 progression de la transition
  const cols={printemps:0x9fd46a,ete:0x4f9a3c,automne:0xe8b92a,hiver:0x4f9a3c};const tailles={printemps:.6,ete:1,automne:1,hiver:0};
  feuilles.forEach(f=>{const cible=tailles[s];f.userData.k=lerp(f.userData.k??1,cible,t);f.scale.setScalar(Math.max(.001,f.userData.k*(f.userData.base??(f.userData.base=f.scale.x/(f.userData.k0??(f.userData.k0=1))))));f.visible=f.userData.k>.02;f.material.color.lerp(new THREE.Color(cols[s]),t)});
  const gc={printemps:[0x9fbf5a,.35],ete:[0xb9c25a,.8],automne:[0xe0a13a,1],hiver:[0xe0a13a,0]}[s];
  graines.forEach(({gr,ped})=>{gr.material.color.lerp(new THREE.Color(gc[0]),t);gr.userData.k=lerp(gr.userData.k??1,gc[1],t);gr.scale.setScalar(Math.max(.001,gr.userData.k));gr.visible=ped.visible=gr.userData.k>.02});
  bourgeons.forEach(b=>b.scale.setScalar(s==='hiver'?1.25:.8));
 };
 return G;
}

// ---------- narcisse ----------
function profilBulbe(k){ // k : échelle de la couche (1 = tunique)
 const pts=[];const bas=-.86+.035*(1-k),haut=-.86+.62*(.55+.45*k);
 for(let i=0;i<=28;i++){const t=i/28;const r=.03+.17*(1-t)+.2*Math.sin(Math.PI*Math.pow(t,.9))*Math.pow(1-t,.6);
  pts.push(new THREE.Vector2(Math.max(.006,r*k),lerp(bas,haut,t)))}
 return pts;
}
function coupeCouche(ext,int){ // face de coupe (plan z=0) entre deux profils
 const s=new THREE.Shape();ext.forEach((p,i)=>i?s.lineTo(p.x,p.y):s.moveTo(p.x,p.y));for(let i=ext.length-1;i>=0;i--)s.lineTo(-ext[i].x,ext[i].y);
 if(int){const h=new THREE.Path();int.forEach((p,i)=>i?h.lineTo(p.x,p.y):h.moveTo(p.x,p.y));for(let i=int.length-1;i>=0;i--)h.lineTo(-int[i].x,int[i].y);s.holes.push(h)}
 return new THREE.ShapeGeometry(s,2);
}
export function construireNarcisse(){
 const G=new THREE.Group();G.name='narcisse';const cible={};
 // bloc de sol en coupe (moitié arrière)
 const sol=new THREE.Group();G.add(sol);
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#5a3c26');gr.addColorStop(.25,'#7a5436');gr.addColorStop(1,'#4f3522');g.fillStyle=gr;g.fillRect(0,0,512,256);
 const r=rng(3);for(let i=0;i<900;i++){g.fillStyle=`rgba(${r()<.5?'40,25,15':'170,140,100'},${r()*.35})`;g.beginPath();g.arc(r()*512,r()*256,r()*3+.5,0,7);g.fill()}
 const tf=new THREE.CanvasTexture(c);tf.colorSpace=THREE.SRGBColorSpace;tf.repeat.set(1/2.4,1/1.3);tf.offset.set(.5,1);
 const forme=new THREE.Shape();forme.moveTo(-1.2,-1.3);forme.lineTo(1.2,-1.3);forme.lineTo(1.2,0);forme.lineTo(-1.2,0);forme.lineTo(-1.2,-1.3);
 const trou=new THREE.Path();const pb=profilBulbe(1);pb.forEach((q,i)=>i?trou.lineTo(q.x+.012,q.y):trou.moveTo(q.x+.012,q.y-.012));for(let i=pb.length-1;i>=0;i--)trou.lineTo(-pb[i].x-.012,pb[i].y-(i?0:.012));forme.holes.push(trou);
 const terre=new THREE.Mesh(new THREE.ExtrudeGeometry(forme,{depth:1.1,bevelEnabled:false,curveSegments:4}),[new THREE.MeshStandardMaterial({map:tf,roughness:1}),mat(0x5e412b,{roughness:1})]);
 terre.position.z=-1.1;terre.receiveShadow=true;sol.add(terre);
 const herbe=new THREE.Mesh(new THREE.BoxGeometry(2.42,.05,1.12),mat(0x6f9d4a,{roughness:1}));herbe.position.set(0,.0,-.55);herbe.receiveShadow=true;sol.add(herbe);
 G.userData.herbe=herbe;
 // bulbe : couches emboîtées
 const couches=[],faces=[];const ks=[1,.9,.76,.6,.42];
 const cols=[0xa77b4f,0xf3ead0,0xece0bb,0xf6efd6,0xe9e2b4];
 const entier=new THREE.Group(),coupe=new THREE.Group();G.add(entier,coupe);
 ks.forEach((k,i)=>{const prof=profilBulbe(k);
  const m=mat(cols[i],{roughness:i?.55:.95,side:THREE.DoubleSide});
  const plein=new THREE.Mesh(new THREE.LatheGeometry(prof,48),m);plein.castShadow=true;if(i===0)entier.add(plein);
  const demi=new THREE.Mesh(new THREE.LatheGeometry(prof,32,Math.PI/2,Math.PI),m);coupe.add(demi);couches.push(demi);
  const int=ks[i+1]?profilBulbe(ks[i+1]):null;const fm=new THREE.Mesh(coupeCouche(prof,int),mat([0x8f6641,0xeadcb4,0xf8f1dc,0xe6d6a8,0xf6eed3][i],{roughness:.6}));fm.position.z=.002+i*.0005;coupe.add(fm);faces.push(fm)});
 // bourgeon central
 const bourg=new THREE.Mesh(new THREE.SphereGeometry(.07,24,16),mat(0xf4e98a,{emissive:0x000000}));bourg.scale.set(.8,1.9,.35);bourg.position.set(0,-.5,.01);coupe.add(bourg);
 const jeunes=[];for(let i=0;i<2;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.05,16,10),mat(0xd8e6a0));f.scale.set(.5,3.4,.25);f.position.set((i?1:-1)*.07,-.44,.012);f.rotation.z=(i?-1:1)*.12;coupe.add(f);jeunes.push(f)}
 // plateau et racines
 const plateau=new THREE.Mesh(new THREE.CylinderGeometry(.2,.17,.07,32,1,false,Math.PI/2,Math.PI),mat(0xcdb68a,{side:THREE.DoubleSide}));plateau.position.y=-.87;G.add(plateau);
 const pf=new THREE.Mesh(new THREE.PlaneGeometry(.39,.07),mat(0xbfa475));pf.position.set(0,-.87,.004);G.add(pf);
 const racines=new THREE.Group();racines.position.y=-.9;G.add(racines);
 const rr=rng(11);for(let i=0;i<13;i++){const x=lerp(-.17,.17,i/12);const l=.2+rr()*.14;const dz=.012+rr()*.01;
  racines.add(tube([V(x,0,dz),V(x*1.5+(rr()-.5)*.04,-l*.45,dz),V(x*2.1+(rr()-.5)*.12,-l,dz)],.009,mat(0xf1e8cf),14,6))}
 // feuilles basales
 const feuilles=[];const vf=mat(0x6f9c84,{side:THREE.DoubleSide,roughness:.5});
 [[-.35,.08,1.25],[.4,-.05,1.15],[-.12,-.1,1.35],[.18,.12,1.05]].forEach(([dx,dz,h],i)=>{
  const geo=new THREE.PlaneGeometry(.075,1,1,24);const p=geo.attributes.position;
  for(let j=0;j<p.count;j++){const t=p.getY(j)+.5;const w=p.getX(j)*(1-.7*t*t*t);p.setXYZ(j,w+dx*t*t*.9,-.24+t*(h+.24),dz*t*t+.02*Math.sin(t*3))}
  geo.computeVertexNormals();const m=new THREE.Mesh(geo,vf.clone());m.castShadow=true;m.rotation.y=i*.8;G.add(m);feuilles.push(m)});
 // hampe + fleur
 const hampe=tube([V(0,-.24,0),V(.02,.6,0),V(.05,1.25,.02),V(.14,1.5,.1)],.022,mat(0x7faa62),40,10);hampe.scale.set(1,1,1);G.add(hampe);
 const fleur=new THREE.Group();fleur.position.set(.16,1.52,.12);G.add(fleur);
 const axe=V(.55,-.35,.75).normalize();fleur.quaternion.setFromUnitVectors(V(0,1,0),axe);
 const spathe=new THREE.Mesh(new THREE.ConeGeometry(.045,.16,12,1,true),mat(0xd9ceaa,{side:THREE.DoubleSide,transparent:true,opacity:.85,roughness:.9}));spathe.position.set(-.02,-.1,0);spathe.rotation.z=.5;fleur.add(spathe);
 const ovaire=new THREE.Mesh(new THREE.SphereGeometry(.04,16,12),mat(0x86ad5e));ovaire.scale.set(1,1.5,1);ovaire.position.y=-.04;fleur.add(ovaire);
 const tep=new THREE.Group();tep.position.y=.03;fleur.add(tep);const mt=mat(0xf7e27c,{side:THREE.DoubleSide,roughness:.55});
 for(let i=0;i<6;i++){const geo=new THREE.CircleGeometry(.1,20);const p=geo.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j);p.setXYZ(j,x*.55,y+.1,.12*(y+.1)*(y+.1))}geo.computeVertexNormals();
  const t=new THREE.Mesh(geo,mt);const piv=new THREE.Group();piv.rotation.y=i/6*Math.PI*2;t.rotation.x=-Math.PI/2+.35;piv.add(t);tep.add(piv);t.castShadow=true}
 const cg=new THREE.CylinderGeometry(.075,.042,.22,48,6,true);{const p=cg.attributes.position;for(let j=0;j<p.count;j++){const y=p.getY(j);if(y>.1){const a=Math.atan2(p.getZ(j),p.getX(j));const k=1+.12*Math.sin(a*14);p.setX(j,p.getX(j)*k);p.setZ(j,p.getZ(j)*k);p.setY(j,y+.01*Math.cos(a*14))}}cg.computeVertexNormals()}
 const couronne=new THREE.Mesh(cg,mat(0xf2b300,{side:THREE.DoubleSide,roughness:.45}));couronne.position.y=.14;couronne.castShadow=true;fleur.add(couronne);
 for(let i=0;i<6;i++){const e=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.12,5),mat(0xe8d070));const a=i/6*Math.PI*2;e.position.set(Math.cos(a)*.015,.1,Math.sin(a)*.015);fleur.add(e)}
 Object.assign(cible,{couronne,tepales:tep,spathe,ovaire,hampe,feuilles:feuilles[0],tunique:entier.children[0],ecailles:couches[2],bourgeon:bourg,plateau,racines});
 G.userData={cible,entier,coupe,feuilles,hampe,fleur,racines,bourg,jeunes,faces,
  vue:{pos:V(1.9,1.05,5.4),cible:V(0,.3,0),min:1.3,max:7.5},
  points:{couronne:[couronne,V(0,.12,0)],tepales:[tep,V(.1,0,0)],spathe:[spathe,V(0,0,0)],ovaire:[ovaire,V(0,0,0)],hampe:[hampe,null,.5],feuilles:[feuilles[1],V(.2,.7,0)],tunique:[plateau,V(-.28,.3,.05)],ecailles:[couches[2],V(.15,-.62,.01)],bourgeon:[bourg,V(0,.03,.08)],plateau:[plateau,V(0,0,.05)],racines:[racines,V(-.22,-.2,0)]}};
 let coupeOn=false;
 G.userData.setCoupe=(on)=>{coupeOn=on;entier.visible=!on;coupe.visible=on;};
 G.userData.setCoupe(true);
 G.userData.saison=(s,t)=>{
  const aerien={printemps:1,ete:0,automne:0,hiver:0}[s];
  const cible2={printemps:1,ete:0,automne:.8,hiver:1}[s];
  G.userData.kA=lerp(G.userData.kA??1,aerien,t);G.userData.kR=lerp(G.userData.kR??1,cible2,t);
  const kA=G.userData.kA;
  feuilles.forEach(f=>{f.scale.set(1,Math.max(.001,kA),1);f.visible=kA>.02;f.material.color.lerp(new THREE.Color(s==='ete'?0xc9b35a:0x6f9c84),t)});
  hampe.scale.set(1,Math.max(.001,kA),1);hampe.visible=kA>.03;fleur.visible=kA>.55;fleur.scale.setScalar(Math.max(.001,(kA-.55)/.45));fleur.position.y=-.24+(1.52+.24)*kA;
  racines.scale.set(1,Math.max(.001,G.userData.kR),1);racines.visible=G.userData.kR>.03;
  jeunes.forEach(j=>j.scale.set(.5,lerp(j.scale.y,{printemps:3.4,ete:2.4,automne:3.6,hiver:4.6}[s],t),.25));
  herbe.material.color.lerp(new THREE.Color(s==='hiver'?0xe8eef0:0x6f9d4a),t);
  if(s==='ete'||s==='automne'||s==='hiver')G.userData.setCoupe(true);
  G.userData.lueur=(s==='ete');
 };
 return G;
}

// ---------- lavande ----------
export function construireLavande(){
 const G=new THREE.Group();G.name='lavande';const r=rng(21);const cible={};
 const bois=mat(0x7a6451,{roughness:.95});const vTige=mat(0x93a58c,{roughness:.8});
 const carre=new THREE.Shape();const e=.0065;carre.moveTo(-e,-e);carre.lineTo(e,-e);carre.lineTo(e,e);carre.lineTo(-e,e);carre.lineTo(-e,-e);
 const tiges=[],hampes=[],epis=[];
 const branches=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2+r()*.4;const L=.13+r()*.06;const b=tube([V(0,-.02,0),V(Math.cos(a)*L*.4,.07,Math.sin(a)*L*.4),V(Math.cos(a)*L,.17+r()*.05,Math.sin(a)*L)],.016-i*.001,bois,16,8);G.add(b);branches.push(b)}
 cible.base=branches[0];
 const motte=new THREE.Mesh(new THREE.SphereGeometry(.42,32,12,0,Math.PI*2,0,Math.PI/2),mat(0x6b5b48,{roughness:1}));motte.scale.set(1,.12,1);motte.receiveShadow=true;G.add(motte);
 // feuilles et fleurs en instances
 const nbT=44;const feuGeo=new THREE.PlaneGeometry(.018,.15,1,6);{const p=feuGeo.attributes.position;for(let j=0;j<p.count;j++){const y=p.getY(j)+.075;p.setX(j,p.getX(j)*(1-Math.pow(Math.abs(y/.15-.4)*1.6,2)*.6));p.setY(j,y);p.setZ(j,.02*Math.pow(y/.15,2))}feuGeo.computeVertexNormals()}
 const feuMat=mat(0xa3b59c,{side:THREE.DoubleSide,roughness:.7});
 const feuI=new THREE.InstancedMesh(feuGeo,feuMat,nbT*14);feuI.castShadow=true;G.add(feuI);
 const fleurGeo=new THREE.SphereGeometry(.009,8,6);fleurGeo.scale(1,1.5,1);const fleurMat=mat(0x7d6cc9,{roughness:.5});const fleurI=new THREE.InstancedMesh(fleurGeo,fleurMat,nbT*42);fleurI.castShadow=true;G.add(fleurI);
 const calGeo=new THREE.CylinderGeometry(.006,.004,.02,6);const calMat=mat(0x7b7390);const calI=new THREE.InstancedMesh(calGeo,calMat,nbT*42);G.add(calI);
 let nf=0,nfl=0;const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=V(1,1,1);const tmp=new THREE.Object3D();
 for(let i=0;i<nbT;i++){const b=branches[i%6];const d=b.userData.curve.getPointAt(1);const a=Math.atan2(d.z,d.x)+(r()-.5)*.9;const inc=.25+r()*.45;
  const h=.45+r()*.2;const top=V(d.x+Math.cos(a)*inc*h,d.y+h,d.z+Math.sin(a)*inc*h);const mid=d.clone().lerp(top,.5).add(V(0,0,0));
  const courbe=new THREE.CatmullRomCurve3([d,mid,top]);const tg=new THREE.Mesh(new THREE.ExtrudeGeometry(carre,{steps:20,bevelEnabled:false,extrudePath:courbe}),vTige);tg.userData.curve=courbe;tg.castShadow=true;G.add(tg);tiges.push(tg);
  // paires de feuilles opposées, décussées
  for(let n=0;n<7;n++){const t=.1+n*.12;const p=courbe.getPointAt(t);const dir=courbe.getTangentAt(t);
   for(const cote of[0,1]){tmp.position.copy(p);tmp.quaternion.setFromUnitVectors(V(0,1,0),dir);tmp.rotateY(n*Math.PI/2+cote*Math.PI);tmp.rotateX(.75);tmp.scale.setScalar(.8+r()*.4);tmp.updateMatrix();feuI.setMatrixAt(nf++,tmp.matrix)}}
  // longue tige nue + épi
  const L2=.28+r()*.12;const h2=V(top.x+Math.cos(a)*.05,top.y+L2,top.z+Math.sin(a)*.05);const c2=new THREE.CatmullRomCurve3([top,top.clone().lerp(h2,.5).add(V((r()-.5)*.03,0,(r()-.5)*.03)),h2]);
  const hp=new THREE.Mesh(new THREE.TubeGeometry(c2,12,.0035,5),vTige);hp.userData.curve=c2;G.add(hp);hampes.push(hp);
  const epi={debut:nfl,n:0,centre:h2.clone(),dir:c2.getTangentAt(1)};
  for(let w=0;w<6;w++){const t=w/5;const base=h2.clone().add(epi.dir.clone().multiplyScalar(t*.1)).add(epi.dir.clone().multiplyScalar(w<2?-.03*(2-w):0));const nw=w===5?3:6;
   for(let k=0;k<nw;k++){const aa=k/nw*Math.PI*2+w;const off=V(Math.cos(aa)*.013,.004*Math.sin(aa*3),Math.sin(aa)*.013);tmp.position.copy(base).add(off);tmp.lookAt(base.clone().add(off.clone().multiplyScalar(3)).add(V(0,.02,0)));tmp.rotateX(Math.PI/2);tmp.scale.setScalar(.8+r()*.4);tmp.updateMatrix();fleurI.setMatrixAt(nfl,tmp.matrix);calI.setMatrixAt(nfl,tmp.matrix);nfl++;epi.n++}}
  epis.push(epi);
 }
 feuI.count=nf;fleurI.count=nfl;calI.count=nfl;
 // loupe : section de tige carrée + fleur bilabiée agrandies
 const loupe=new THREE.Group();loupe.position.set(.95,.5,.15);loupe.scale.setScalar(.6);G.add(loupe);
 const sect=new THREE.Mesh(new THREE.ExtrudeGeometry((()=>{const s=new THREE.Shape();const q=.09,c=.025;s.moveTo(-q+c,-q);s.lineTo(q-c,-q);s.quadraticCurveTo(q,-q,q,-q+c);s.lineTo(q,q-c);s.quadraticCurveTo(q,q,q-c,q);s.lineTo(-q+c,q);s.quadraticCurveTo(-q,q,-q,q-c);s.lineTo(-q,-q+c);s.quadraticCurveTo(-q,-q,-q+c,-q);return s})(),{depth:.32,bevelEnabled:false}),mat(0x93a58c));
 sect.rotation.x=-Math.PI/2;sect.position.y=-.16;loupe.add(sect);
 const faceS=new THREE.Mesh(new THREE.PlaneGeometry(.15,.15),mat(0xe4ecd6));faceS.rotation.x=-Math.PI/2;faceS.position.y=.162;loupe.add(faceS);
 [0,1].forEach(k=>{const f=new THREE.Mesh(feuGeo,feuMat);f.scale.setScalar(3.2);f.position.set(k?.09:-.09,0,0);f.rotation.z=k?-1.0:1.0;loupe.add(f)});
 const fl=new THREE.Group();fl.position.set(0,.42,0);loupe.add(fl);
 const tube2=new THREE.Mesh(new THREE.CylinderGeometry(.03,.02,.14,16),mat(0x6f63b8));fl.add(tube2);
 const levre=(w,h,y,z,rx)=>{const g2=new THREE.CircleGeometry(1,24);const m=new THREE.Mesh(g2,mat(0x8a78d8,{side:THREE.DoubleSide}));m.scale.set(w,h,1);m.position.set(0,y,z);m.rotation.x=rx;return m};
 fl.add(levre(.07,.05,.11,-.02,-.4),levre(.09,.06,.07,.05,-1.2));
 loupe.visible=false;
 Object.assign(cible,{epi:null,hampe:hampes[3],tige:tiges[5],feuilles:tiges[8],fleur:fl,sect});
 G.userData={cible,tiges,hampes,epis,fleurI,calI,feuI,loupe,
  vue:{pos:V(1.4,1.35,2.9),cible:V(0,.55,0),min:1,max:5.5},
  points:{epi:[null,epis[3].centre],hampe:[hampes[3],null,.5],tige:[tiges[5],null,.35],feuilles:[tiges[8],null,.25],base:[branches[0],null,.6],fleur:[fl,V(0,.08,.04)]}};
 G.userData.setCoupe=(on)=>{loupe.visible=on};
 const couleurs={printemps:0x7d6cc9,ete:0x7d6cc9,automne:0x8f8579,hiver:0x8f8579};
 G.userData.saison=(s,t)=>{
  const k={printemps:0,ete:1,automne:.85,hiver:.7}[s];G.userData.kE=lerp(G.userData.kE??1,k,t);
  const ke=G.userData.kE;
  hampes.forEach(h=>{h.scale.setScalar(1);h.visible=ke>.05});
  fleurI.visible=calI.visible=ke>.05;fleurI.material.color.lerp(new THREE.Color(couleurs[s]),t);
  fleurI.scale.setScalar(1);
  feuI.material.color.lerp(new THREE.Color(s==='hiver'?0x9fb0a8:0xa3b59c),t);
 };
 return G;
}
