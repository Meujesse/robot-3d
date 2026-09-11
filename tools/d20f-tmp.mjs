import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder': await draco3d.createDecoderModule()});
const doc = await io.read('../d20/d20.glb');
doc.getRoot().listMeshes().forEach(m=>{
  const p=m.listPrimitives()[0];
  const P=p.getAttribute('POSITION').getArray(), N=p.getAttribute('NORMAL').getArray();
  const n=P.length/3; const c=[0,0,0], nm=[0,0,0]; let b=[1e9,-1e9,1e9,-1e9,1e9,-1e9];
  for(let i=0;i<n;i++){ for(let a=0;a<3;a++){ c[a]+=P[i*3+a]/n; nm[a]+=N[i*3+a]/n;
    if(P[i*3+a]<b[a*2])b[a*2]=P[i*3+a]; if(P[i*3+a]>b[a*2+1])b[a*2+1]=P[i*3+a]; } }
  const ln=Math.hypot(...nm);
  console.log(m.getName().padEnd(11), p.getMaterial().getName().replace('tripo_part_','p').replace('_material',''),
    'n='+String(n).padStart(6),
    'centre', c.map(v=>v.toFixed(3)).join(','),
    '| normale', nm.map(v=>(v/ln).toFixed(2)).join(','), '|N|='+ln.toFixed(2),
    '| taille', [0,1,2].map(a=>(b[a*2+1]-b[a*2]).toFixed(3)).join(','));
});
