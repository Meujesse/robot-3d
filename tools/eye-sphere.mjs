import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const spheres = JSON.parse(process.argv[3]);   // [[cx,cy,cz,r], ...]
const out = [];
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const P = prim.getAttribute('POSITION').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices().getArray();
  for (const [cx, cy, cz, r] of spheres) {
    let n = 0;
    for (let t = 0; t < idx.length/3; t++) {
      const v = [idx[t*3], idx[t*3+1], idx[t*3+2]];
      if (!v.every(i => Math.hypot(P[i*3]-cx, P[i*3+1]-cy, P[i*3+2]-cz) <= r)) continue;
      n++;
      // s = vertical (monde Y), t = horizontal (dans le plan, perpendiculaire à Y et au rayon)
      for (const i of v) {
        const d = [P[i*3]-cx, P[i*3+1]-cy, P[i*3+2]-cz];
        const s = d[1] / r;
        const h = Math.hypot(d[0], d[2]) / r * Math.sign(d[0] * -cz + d[2] * cx || 1);
        out.push(UV[i*2], UV[i*2+1], h, s);
      }
    }
    console.error('œil', cx.toFixed(3), cz.toFixed(3), 'r', r, 'triangles', n);
  }
}
fs.writeFileSync(process.argv[4], JSON.stringify(out));
