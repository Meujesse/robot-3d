import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const box = JSON.parse(process.argv[3]);   // [[xmin,ymin,zmin],[xmax,ymax,zmax]] par œil
const out = [];
for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
  const P = prim.getAttribute('POSITION').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray();
  const idx = prim.getIndices().getArray();
  for (const b of box) {
    const inb = v => P[v*3] >= b[0][0] && P[v*3] <= b[1][0] && P[v*3+1] >= b[0][1] && P[v*3+1] <= b[1][1] && P[v*3+2] >= b[0][2] && P[v*3+2] <= b[1][2];
    const cx = (b[0][0]+b[1][0])/2, cy = (b[0][1]+b[1][1])/2, hw = (b[1][0]-b[0][0])/2, hh = (b[1][1]-b[0][1])/2;
    let n = 0;
    for (let t = 0; t < idx.length/3; t++) {
      const v = [idx[t*3], idx[t*3+1], idx[t*3+2]];
      if (!v.every(inb)) continue; n++;
      out.push(v.flatMap(i => [UV[i*2], UV[i*2+1], (P[i*3]-cx)/hw, (P[i*3+1]-cy)/hh]));
    }
    console.error('œil', b[0].map(v=>v.toFixed(2)).join(','), 'triangles', n);
  }
}
fs.writeFileSync(process.argv[4], JSON.stringify(out));
console.error('triangles total', out.length);
