import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder } from 'meshoptimizer';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(process.argv[2]);
const p=doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P=p.getAttribute('POSITION').getArray();
// coupe sagittale z∈[-0.05,0.02] de la tête : x 0.25..0.50 (colonnes), y 0.75..0.40 (lignes)
console.log('=== profil de la tête, z∈[-0.06,0.02]');
const g=Array.from({length:36},()=>Array(51).fill('.'));
for(let i=0;i<P.length/3;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2]; if(z<-0.06||z>0.02||x<0.25) continue; const c=Math.round((x-0.25)/0.25*50), r=Math.round((0.75-y)/0.35*35); if(c<0||c>50||r<0||r>35) continue; g[r][c]='#'; }
g.forEach((r,k)=>console.log((0.75-k*0.01).toFixed(2), r.join('')));
// yeux : sommets les plus latéraux de la tête (|z| max) pour x>0.36, y>0.55
for(const s of [1,-1]){let best=null,bv=-1;for(let i=0;i<P.length/3;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2]; if(x<0.36||x>0.46||y<0.55||y>0.70) continue; if(s*z>bv){bv=s*z;best=[x,y,z];}} console.log('joue/œil côté',s>0?'+z':'-z',best.map(v=>v.toFixed(3)).join(' '));}
