/* Repères d'un modèle riggé : position monde des os, boîte du maillage, os dominant par zone.
   Usage : node analyse-rig.mjs modele.glb */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder } from 'meshoptimizer';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);
const sk=doc.getRoot().listSkins()[0], joints=sk.listJoints();
const mMul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;};
const mTRS=(t,q,s)=>{const[x,y,z,w]=q;return[(1-2*(y*y+z*z))*s[0],(2*(x*y+z*w))*s[0],(2*(x*z-y*w))*s[0],0,(2*(x*y-z*w))*s[1],(1-2*(x*x+z*z))*s[1],(2*(y*z+x*w))*s[1],0,(2*(x*z+y*w))*s[2],(2*(y*z-x*w))*s[2],(1-2*(x*x+y*y))*s[2],0,t[0],t[1],t[2],1];};
const W=new Map();
for(const n of doc.getRoot().listScenes()[0].listChildren())
  (function w(x,m){const mm=mMul(m,mTRS(x.getTranslation(),x.getRotation(),x.getScale()));W.set(x,mm);for(const c of x.listChildren())w(c,mm);})(n,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
for(const j of joints){const m=W.get(j);console.log(j.getName().padEnd(20), m[12].toFixed(4), m[13].toFixed(4), m[14].toFixed(4));}
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P=p.getAttribute('POSITION').getArray(); let bb=[1e9,1e9,1e9,-1e9,-1e9,-1e9];
for(let i=0;i<P.length;i+=3)for(let a=0;a<3;a++){bb[a]=Math.min(bb[a],P[i+a]);bb[3+a]=Math.max(bb[3+a],P[i+a]);}
console.log('--- maillage', P.length/3, 'sommets, bbox', bb.map(v=>v.toFixed(3)).join(' '));
