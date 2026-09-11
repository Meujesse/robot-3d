import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); const root = doc.getRoot();
  let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9], n = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const a = p.getAttribute('POSITION').getArray(); n += a.length/3;
    for (let i = 0; i < a.length; i += 3) for (let d = 0; d < 3; d++) { mn[d] = Math.min(mn[d], a[i+d]); mx[d] = Math.max(mx[d], a[i+d]); } }
  console.log(f.split('/').pop(), 'sommets', n, 'min', mn.map(v=>v.toFixed(3)).join(','), 'max', mx.map(v=>v.toFixed(3)).join(','), 'taille', mx.map((v,i)=>(v-mn[i]).toFixed(3)).join(','));
}
