import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2]);
const root = doc.getRoot();
const skin = root.listSkins()[0];
const joints = skin.listJoints();
// positions monde des os (composition des translations/rotations parentes)
function mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
function trs(n) { const t = n.getTranslation(), q = n.getRotation(), s = n.getScale();
  const [x, y, z, w] = q; const m = [
    (1 - 2 * (y * y + z * z)) * s[0], (2 * (x * y + z * w)) * s[0], (2 * (x * z - y * w)) * s[0], 0,
    (2 * (x * y - z * w)) * s[1], (1 - 2 * (x * x + z * z)) * s[1], (2 * (y * z + x * w)) * s[1], 0,
    (2 * (x * z + y * w)) * s[2], (2 * (y * z - x * w)) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
    t[0], t[1], t[2], 1]; return m; }
const world = new Map();
(function walk(n, m) { const w = mul(m, trs(n)); world.set(n, w); for (const c of n.listChildren()) walk(c, w); })(root.listScenes()[0].listChildren().find(n => n.getName() === 'tripo::Root') || root.listNodes()[0], [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const prim = root.listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION').getArray(), J = prim.getAttribute('JOINTS_0').getArray(), W = prim.getAttribute('WEIGHTS_0').getArray();
const n = pos.length / 3;
const acc = joints.map(() => ({ w: 0, c: [0, 0, 0], mn: [1e9, 1e9, 1e9], mx: [-1e9, -1e9, -1e9] }));
for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { const w = W[i * 4 + k]; if (w < 0.35) continue; const a = acc[J[i * 4 + k]];
  a.w += w; for (let d = 0; d < 3; d++) { a.c[d] += pos[i * 3 + d] * w; a.mn[d] = Math.min(a.mn[d], pos[i * 3 + d]); a.mx[d] = Math.max(a.mx[d], pos[i * 3 + d]); } }
joints.forEach((j, i) => {
  const a = acc[i]; const w = world.get(j);
  const wp = w ? [w[12], w[13], w[14]].map(v => v.toFixed(3)).join(',') : '?';
  if (a.w < 1) { console.log(String(i).padStart(2), j.getName().padEnd(24), 'os en', wp, '(peu de sommets)'); return; }
  console.log(String(i).padStart(2), j.getName().padEnd(24), 'os en', wp.padEnd(22), 'chair centrée', a.c.map(v => (v / a.w).toFixed(3)).join(','), 'poids', a.w.toFixed(0));
});
