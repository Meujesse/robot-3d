import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder } from 'meshoptimizer';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P=p.getAttribute('POSITION').getArray(), J=p.getAttribute('JOINTS_0').getArray(), W=p.getAttribute('WEIGHTS_0').getArray();
const noms=doc.getRoot().listSkins()[0].listJoints().map(j=>j.getName());
const dom=i=>{let b=-1,bw=0;for(let k=0;k<4;k++)if(W[i*4+k]>bw){bw=W[i*4+k];b=J[i*4+k];}return noms[b];};
// bbox par os (côté gauche : bras et aile)
const bb=new Map();
for(let i=0;i<P.length/3;i++){const n=dom(i); const b=bb.get(n)||{n:0,b:[1e9,1e9,1e9,-1e9,-1e9,-1e9]}; b.n++; for(let k=0;k<3;k++){b.b[k]=Math.min(b.b[k],P[i*3+k]);b.b[3+k]=Math.max(b.b[3+k],P[i*3+k]);} bb.set(n,b);}
for(const n of ['L_Clavicle','L_Upperarm','L_UpperarmTwist01','L_UpperarmTwist02','L_Forearm','L_ForearmTwist01','L_ForearmTwist02','L_Hand','Spine02','NeckTwist01','Head','Waist','Hip','Spine01'])
  { const b=bb.get(n); if(b) console.log(n.padEnd(20), String(b.n).padStart(7), b.b.map(v=>v.toFixed(3)).join(' ')); }
// tranche z in [-0.20,-0.07] : carte x/y avec lettre = os dominant (T=Twist01, t=Twist02, U=Upperarm, F=avant-bras, H=main, S=spine/neck/head, .=vide)
console.log('=== tranche gauche z∈[-0.20,-0.07], x colonnes -0.05..0.40, y lignes 0.55..0.15');
const g=Array.from({length:21},()=>Array(46).fill('.'));
const L=n=>/UpperarmTwist01/.test(n)?'T':/UpperarmTwist02/.test(n)?'t':/Upperarm$/.test(n)?'U':/Forearm/.test(n)?'F':/Hand/.test(n)?'H':/Clav/.test(n)?'C':/Spine|Neck|Head/.test(n)?'S':'o';
for(let i=0;i<P.length/3;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2]; if(z<-0.20||z>-0.07) continue; const c=Math.round((x+0.05)/0.45*45), r=Math.round((0.55-y)/0.40*20); if(c<0||c>45||r<0||r>20) continue; g[r][c]=L(dom(i)); }
g.forEach((r,k)=>console.log((0.55-k*0.02).toFixed(2), r.join('')));
