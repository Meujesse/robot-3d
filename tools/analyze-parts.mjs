import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
console.log('meshes', root.listMeshes().length, 'nodes', root.listNodes().length, 'materials', root.listMaterials().length, 'textures', root.listTextures().length, 'anims', root.listAnimations().length);
let all=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  const t = n.getTranslation(), s=n.getScale();
  let tri=0, mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity], c=[0,0,0], k=0;
  for (const p of m.listPrimitives()) {
    const pos=p.getAttribute('POSITION').getArray(); tri += (p.getIndices()?p.getIndices().getCount():pos.length/3)/3;
    for (let i=0;i<pos.length;i+=3){ for(let j=0;j<3;j++){ const v=pos[i+j]; if(v<mn[j])mn[j]=v; if(v>mx[j])mx[j]=v; c[j]+=v; } k++; }
  }
  c=c.map(v=>v/k); for(let j=0;j<3;j++){ all[j]=Math.min(all[j],mn[j]); all[j+3]=Math.max(all[j+3],mx[j]); }
  const f=v=>v.map(x=>x.toFixed(3)).join(',');
  console.log(n.getName().padEnd(16), 'tri', String(Math.round(tri)).padStart(7), 'centre', f(c), 'min', f(mn), 'max', f(mx), 'T', f(t), 'S', f(s), 'mat', m.listPrimitives().map(p=>p.getMaterial()?.getName()).join('|'));
}
console.log('bbox', all.map(v=>v.toFixed(3)).join(','));
