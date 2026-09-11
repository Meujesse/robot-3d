import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const wanted = process.argv[3].split(',').map(Number);
const out = {};
for (const n of root.listNodes()) {
  const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (!m || !n.getMesh()) continue;
  const num = +m[1]; if (!wanted.includes(num)) continue;
  const prim = n.getMesh().listPrimitives()[0];
  const P = prim.getAttribute('POSITION').getArray(), N = prim.getAttribute('NORMAL').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices().getArray();
  const nv = P.length / 3;
  const c = [0,0,0]; for (let i = 0; i < nv; i++) for (let d = 0; d < 3; d++) c[d] += P[i*3+d]/nv;
  const nAvg = [0,0,0]; for (let i = 0; i < nv; i++) for (let d = 0; d < 3; d++) nAvg[d] += N[i*3+d];
  const ln = Math.hypot(...nAvg); const nn = nAvg.map(v => v/ln);
  const up = Math.abs(nn[1]) > 0.9 ? [1,0,0] : [0,1,0];
  let U = [up[1]*nn[2]-up[2]*nn[1], up[2]*nn[0]-up[0]*nn[2], up[0]*nn[1]-up[1]*nn[0]];
  const lu = Math.hypot(...U); U = U.map(v => v/lu);
  const V = [nn[1]*U[2]-nn[2]*U[1], nn[2]*U[0]-nn[0]*U[2], nn[0]*U[1]-nn[1]*U[0]];
  let r = 0; const proj = [];
  for (let i = 0; i < nv; i++) { const d = [P[i*3]-c[0], P[i*3+1]-c[1], P[i*3+2]-c[2]];
    const s = d[0]*U[0]+d[1]*U[1]+d[2]*U[2], t = d[0]*V[0]+d[1]*V[1]+d[2]*V[2], w = d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2];
    proj.push([s, t, w]); r = Math.max(r, Math.hypot(s, t)); }
  const tris = [];
  for (let t = 0; t < idx.length/3; t++) for (const i of [idx[t*3], idx[t*3+1], idx[t*3+2]])
    tris.push(UV[i*2], UV[i*2+1], proj[i][0]/r, proj[i][1]/r, proj[i][2]);
  const mat = prim.getMaterial();
  const tex = mat.getBaseColorTexture();
  out[num] = { tris, rayon: r, normale: nn, centre: c, image: tex ? tex.getName() : null, materiau: mat.getName() };
  console.error('partie', num, 'sommets', nv, 'rayon', r.toFixed(4), 'normale', nn.map(v=>v.toFixed(2)).join(','), 'image', out[num].image);
}
fs.writeFileSync(process.argv[4], JSON.stringify(out));
