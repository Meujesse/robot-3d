// Composantes connexes du maillage (par arêtes de triangles, sommets fusionnés par position)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION').getArray(); const idx = prim.getIndices().getArray();
const nv = P.length / 3;
// fusion des sommets coïncidents
const key = i => `${Math.round(P[i*3]*4000)},${Math.round(P[i*3+1]*4000)},${Math.round(P[i*3+2]*4000)}`;
const map = new Map(); const rep = new Int32Array(nv);
for (let i = 0; i < nv; i++) { const k = key(i); if (!map.has(k)) map.set(k, i); rep[i] = map.get(k); }
const parent = new Int32Array(nv); for (let i = 0; i < nv; i++) parent[i] = i;
const find = a => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[b] = a; };
for (let i = 0; i < nv; i++) if (rep[i] !== i) uni(rep[i], i);
for (let t = 0; t < idx.length/3; t++) { uni(idx[t*3], idx[t*3+1]); uni(idx[t*3+1], idx[t*3+2]); }
const comp = new Map();
for (let i = 0; i < nv; i++) { const r = find(i); let c = comp.get(r);
  if (!c) { c = { n: 0, mn: [1e9,1e9,1e9], mx: [-1e9,-1e9,-1e9] }; comp.set(r, c); }
  c.n++; for (let d = 0; d < 3; d++) { c.mn[d] = Math.min(c.mn[d], P[i*3+d]); c.mx[d] = Math.max(c.mx[d], P[i*3+d]); } }
const list = [...comp.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12);
console.log('composantes', comp.size);
for (const [r, c] of list) console.log('  racine', String(r).padStart(7), 'sommets', String(c.n).padStart(7),
  'boîte', c.mn.map(v=>v.toFixed(3)).join(','), '->', c.mx.map(v=>v.toFixed(3)).join(','));
