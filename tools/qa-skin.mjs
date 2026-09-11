/* Détecte les déchirures de skinning : arêtes dont la longueur explose pendant
   une animation, et à quels os appartiennent leurs sommets. C'est l'outil qui a
   révélé que les nervures des ailes de la fée étaient restées sur l'os du bras.
   Usage : node qa-skin.mjs modele.glb <animation> [temps] */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const doc = await io.read(process.argv[2]);
const anim = doc.getRoot().listAnimations().find(a=>a.getName()===process.argv[3]);
const T = parseFloat(process.argv[4]||'0.5');
const sk = doc.getRoot().listSkins()[0], joints = sk.listJoints(), names = joints.map(j=>j.getName());
const scene = doc.getRoot().listScenes()[0];
const mMul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;};
const mTRS=(t,q,s)=>{const[x,y,z,w]=q;return[(1-2*(y*y+z*z))*s[0],(2*(x*y+z*w))*s[0],(2*(x*z-y*w))*s[0],0,(2*(x*y-z*w))*s[1],(1-2*(x*x+z*z))*s[1],(2*(y*z+x*w))*s[1],0,(2*(x*z+y*w))*s[2],(2*(y*z-x*w))*s[2],(1-2*(x*x+y*y))*s[2],0,t[0],t[1],t[2],1];};
const over=new Map();
for(const ch of anim.listChannels()){ const s=ch.getSampler(), Ti=s.getInput().getArray(), O=s.getOutput().getArray();
  const p=ch.getTargetPath(), n=ch.getTargetNode(), d=p==='rotation'?4:3;
  let i=0; while(i<Ti.length-1 && Ti[i+1]<T) i++;
  if(!over.has(n)) over.set(n,{}); over.get(n)[p]=[...O.slice(i*d,i*d+d)]; }
const world=new Map();
for(const n of scene.listChildren()) (function walk(x,m){ const o=over.get(x)||{};
  const w=mMul(m,mTRS(o.translation||x.getTranslation(), o.rotation||x.getRotation(), o.scale||x.getScale()));
  world.set(x,w); for(const c of x.listChildren()) walk(c,w);})(n,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const ibm=sk.getInverseBindMatrices().getArray();
const prim=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P=prim.getAttribute('POSITION').getArray(),J=prim.getAttribute('JOINTS_0').getArray(),W=prim.getAttribute('WEIGHTS_0').getArray();
const idx=prim.getIndices().getArray();
const n=P.length/3; const out=new Float32Array(n*3);
const M=joints.map((j,k)=>mMul(world.get(j)||[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],[...ibm.slice(k*16,k*16+16)]));
for(let i=0;i<n;i++){ let o=[0,0,0];
  for(let k=0;k<4;k++){ const w=W[i*4+k]; if(!w)continue; const m=M[J[i*4+k]];
    for(let a=0;a<3;a++) o[a]+=w*(m[a]*P[i*3]+m[4+a]*P[i*3+1]+m[8+a]*P[i*3+2]+m[12+a]); }
  out[i*3]=o[0]; out[i*3+1]=o[1]; out[i*3+2]=o[2]; }
const pires=[];
for(let t=0;t<idx.length;t+=3){
  for(const [a,b] of [[idx[t],idx[t+1]],[idx[t+1],idx[t+2]],[idx[t],idx[t+2]]]){
    const d0=Math.hypot(P[a*3]-P[b*3],P[a*3+1]-P[b*3+1],P[a*3+2]-P[b*3+2]);
    if(d0<1e-6) continue;
    const d1=Math.hypot(out[a*3]-out[b*3],out[a*3+1]-out[b*3+1],out[a*3+2]-out[b*3+2]);
    const r=d1/d0; if(r>6) pires.push([r,a,b]); } }
pires.sort((x,y)=>y[0]-x[0]);
console.log('arêtes étirées >6x :', pires.length);
const compte=new Map();
for(const [r,a,b] of pires.slice(0,4000)){
  for(const v of [a,b]) for(let k=0;k<4;k++){ if(W[v*4+k]>0.2){ const nm=names[J[v*4+k]]; compte.set(nm,(compte.get(nm)||0)+1); } } }
[...compte.entries()].sort((x,y)=>y[1]-x[1]).slice(0,8).forEach(([k,v])=>console.log('   ',k,v));
for(const [r,a,b] of pires.slice(0,4)){
  const os=v=>[0,1,2,3].filter(k=>W[v*4+k]>0.01).map(k=>names[J[v*4+k]]+':'+W[v*4+k].toFixed(2)).join(' ');
  console.log(`   x${r.toFixed(0)}  A(${P[a*3].toFixed(3)},${P[a*3+1].toFixed(3)},${P[a*3+2].toFixed(3)}) [${os(a)}]  B [${os(b)}]`); }
