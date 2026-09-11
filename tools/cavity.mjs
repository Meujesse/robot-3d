// Exporte, pour chaque partie, les triangles avec un « creux » par sommet (profondeur sous la face plane).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const skip = process.argv[3].split(',').map(Number);
const out = {};
for (const n of root.listNodes()) {
  const m = /^tripo_part_(\d+)$/.exec(n.getName()); if (!m || !n.getMesh()) continue;
  const num = +m[1]; if (skip.includes(num)) continue;
  const prim = n.getMesh().listPrimitives()[0];
  const P = prim.getAttribute('POSITION').getArray(), N = prim.getAttribute('NORMAL').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices().getArray(); const nv = P.length / 3;
  // normales dominantes : on groupe les normales sur une grille grossière
  const bins = new Map();
  for (let i = 0; i < nv; i++) {
    const k = [0,1,2].map(d => Math.round(N[i*3+d] * 6)).join(',');
    const b = bins.get(k) || { n: 0, s: [0,0,0] }; b.n++; for (let d = 0; d < 3; d++) b.s[d] += N[i*3+d]; bins.set(k, b);
  }
  const dom = [...bins.values()].filter(b => b.n > nv * 0.02).map(b => { const l = Math.hypot(...b.s); return b.s.map(v => v/l); });
  if (!dom.length) continue;
  // pour chaque normale dominante : plan extérieur = projection maximale
  const dmax = dom.map(() => -1e9);
  const best = new Int32Array(nv);
  for (let i = 0; i < nv; i++) {
    let bi = 0, bd = -2;
    for (let k = 0; k < dom.length; k++) { const d = N[i*3]*dom[k][0] + N[i*3+1]*dom[k][1] + N[i*3+2]*dom[k][2]; if (d > bd) { bd = d; bi = k; } }
    best[i] = bi;
    const proj = P[i*3]*dom[bi][0] + P[i*3+1]*dom[bi][1] + P[i*3+2]*dom[bi][2];
    if (proj > dmax[bi]) dmax[bi] = proj;
  }
  const cav = new Float32Array(nv);
  for (let i = 0; i < nv; i++) {
    const k = best[i]; const proj = P[i*3]*dom[k][0] + P[i*3+1]*dom[k][1] + P[i*3+2]*dom[k][2];
    cav[i] = Math.max(0, Math.min(1, (dmax[k] - proj) / 0.008));
  }
  let mean = 0; for (let i = 0; i < nv; i++) mean += cav[i] / nv;
  const tris = [];
  for (let t = 0; t < idx.length/3; t++) for (const i of [idx[t*3], idx[t*3+1], idx[t*3+2]]) tris.push(UV[i*2], UV[i*2+1], cav[i]);
  out[num] = { tris, materiau: prim.getMaterial().getName(), faces: dom.length, creuxMoyen: +mean.toFixed(3) };
}
fs.writeFileSync(process.argv[4], JSON.stringify(out));
console.error('parties', Object.keys(out).length, Object.entries(out).slice(0,6).map(([k,v]) => k+':'+v.faces+'f/'+v.creuxMoyen).join(' '));
