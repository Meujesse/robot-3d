import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]); const root = doc.getRoot();
const skin = root.listSkins()[0]; const names = skin.listJoints().map(j => j.getName());
const prim = root.listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray(), J = prim.getAttribute('JOINTS_0').getArray(), W = prim.getAttribute('WEIGHTS_0').getArray();
// pour chaque os cible : combien de sommets dominés, et leur étendue
for (const want of process.argv.slice(3)) {
  const wi = names.indexOf(want); let n = 0, mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  for (let v = 0; v < pos.length/3; v++) { let best = 0, bi = -1;
    for (let k = 0; k < 4; k++) if (W[v*4+k] > best) { best = W[v*4+k]; bi = J[v*4+k]; }
    if (bi !== wi) continue; n++;
    for (let d = 0; d < 3; d++) { mn[d] = Math.min(mn[d], pos[v*3+d]); mx[d] = Math.max(mx[d], pos[v*3+d]); } }
  console.log(want.padEnd(22), 'dominant sur', String(n).padStart(7), 'sommets, étendue', mn.map(v=>v.toFixed(3)).join(','), '->', mx.map(v=>v.toFixed(3)).join(','));
}
