import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('../robot-full.glb');
const mesh = doc.getRoot().listMeshes()[0];
const prim = mesh.listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray();
const n = pos.length / 3;
const bb = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
  const v = pos[i * 3 + k]; if (v < bb.min[k]) bb.min[k] = v; if (v > bb.max[k]) bb.max[k] = v;
}
console.log('vertices', n, 'bbox', bb);

// cross sections along X: extent in y and z, and count
function section(axis, from, to, step, filter) {
  const rows = [];
  for (let a = from; a < to; a += step) {
    let cnt = 0, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < n; i++) {
      const p = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
      if (p[axis] < a || p[axis] >= a + step) continue;
      if (filter && !filter(p)) continue;
      cnt++;
      for (let k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; }
    }
    rows.push({ at: a.toFixed(3), cnt, y: cnt ? [mn[1].toFixed(2), mx[1].toFixed(2)] : null, z: cnt ? [mn[2].toFixed(2), mx[2].toFixed(2)] : null, x: cnt ? [mn[0].toFixed(2), mx[0].toFixed(2)] : null });
  }
  return rows;
}
console.log('--- X sections (right side x>0)');
console.table(section(0, 0.20, 0.51, 0.02).map(r => ({ x: r.at, cnt: r.cnt, y: r.y?.join('..'), z: r.z?.join('..') })));
console.log('--- X sections (left side x<0)');
console.table(section(0, -0.50, -0.19, 0.02).map(r => ({ x: r.at, cnt: r.cnt, y: r.y?.join('..'), z: r.z?.join('..') })));
console.log('--- Y sections top (antenna)');
console.table(section(1, 0.60, 0.88, 0.02).map(r => ({ y: r.at, cnt: r.cnt, x: r.x?.join('..'), z: r.z?.join('..') })));
console.log('--- Y sections bottom (thruster)');
console.table(section(1, 0.0, 0.25, 0.02).map(r => ({ y: r.at, cnt: r.cnt, x: r.x?.join('..'), z: r.z?.join('..') })));
console.log('--- Z sections (front/back) for the head band |x|<0.25, 0.3<y<0.6');
console.table(section(2, -0.35, 0.35, 0.05, p => Math.abs(p[0]) < 0.25 && p[1] > 0.3 && p[1] < 0.6).map(r => ({ z: r.at, cnt: r.cnt, x: r.x?.join('..'), y: r.y?.join('..') })));
