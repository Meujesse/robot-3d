import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const skin = root.listSkins()[0];
const names = skin.listJoints().map(j => j.getName());
const want = process.argv.slice(3);
const wi = want.map(n => names.indexOf(n));
console.log('os', want.join(','), '->', wi.join(','));
const prim = root.listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray(), J = prim.getAttribute('JOINTS_0').getArray(), W = prim.getAttribute('WEIGHTS_0').getArray();
const bands = [[0,0.1],[0.1,0.2],[0.2,0.3],[0.3,0.36],[0.36,0.42],[0.42,1]];
const stat = bands.map(() => ({ n: 0, w: 0, zero: 0 }));
for (let v = 0; v < pos.length/3; v++) {
  const x = Math.abs(pos[v*3]), y = pos[v*3+1];
  if (y < 0.45) continue;                       // zone haute (ailes/bras)
  let w = 0; for (let k = 0; k < 4; k++) if (wi.includes(J[v*4+k])) w += W[v*4+k];
  const b = bands.findIndex(([a, c]) => x >= a && x < c); if (b < 0) continue;
  stat[b].n++; stat[b].w += w; if (w < 0.05) stat[b].zero++;
}
bands.forEach(([a, c], i) => { const s = stat[i]; if (!s.n) return;
  console.log(`|x| ${a}-${c}  sommets ${String(s.n).padStart(7)}  poids aile moyen ${(s.w/s.n).toFixed(3)}  sans aile ${(100*s.zero/s.n).toFixed(1)}%`); });
