/* Paupières en géométrie : une calotte de peau posée sur chaque œil, cachée au
   repos (os à l'échelle 0,001) et révélée pendant le clignement. On ne touche
   pas au globe oculaire lui-même : l'écraser laissait un disque blanc et
   déformait la joue, et l'atlas UV de Tripo est trop éclaté pour peindre des
   yeux fermés dans la texture (les texels d'un œil couvrent tout l'atlas).

   Chaque paupière = une sphère légèrement plus grande que l'œil, couleur de
   peau unie, plus un fin trait sombre horizontal (les cils d'un œil fermé),
   les deux pesées à 100 % sur l'os de paupière.

   Usage : node paupieres.mjs config.json   (à lancer après flamme.mjs) */
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(cf.in);
const root = doc.getRoot(), skin = root.listSkins()[0], mesh = root.listMeshes()[0];
const noms = skin.listJoints().map(j => j.getName());
for (const pr of mesh.listPrimitives()) { const m = pr.getMaterial(); if (m && /^(paupiere|cil)$/.test(m.getName())) { mesh.removePrimitive(pr); pr.dispose(); } }
for (const m of root.listMaterials()) if (/^(paupiere|cil)$/.test(m.getName())) m.dispose();
const buffer = root.listBuffers()[0];
const srgb = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
const matPeau = doc.createMaterial('paupiere').setBaseColorFactor([...srgb(cf.peau), 1]).setMetallicFactor(0).setRoughnessFactor(0.75).setDoubleSided(true);
const matCil = doc.createMaterial('cil').setBaseColorFactor([...srgb(cf.cil || [30, 40, 35]), 1]).setMetallicFactor(0).setRoughnessFactor(0.9).setDoubleSided(true);
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function ajoute(nomOs, surface, rayon, normale) {
  const ji = noms.indexOf(nomOs); if (ji < 0) throw new Error('os inconnu ' + nomOs);
  const n = norm(normale), up = [0, 1, 0];
  const ep = rayon * 0.38;                                   // demi-axe le long de la normale : un dôme, pas une boule
  const centre = surface.map((c, k) => c - 0.12 * rayon * n[k]);   // légèrement en retrait, l'arrière est dans la tête
  const e1 = norm(cross(up, n)), e2 = norm(cross(n, e1));     // e1 horizontal, e2 « vertical » sur la face
  const prims = [];
  // sphère (peau)
  { const SEG = 24, RING = 16, pos = [], nrm = [], idx = [];
    for (let i = 0; i <= RING; i++) { const th = Math.PI * i / RING; for (let j = 0; j <= SEG; j++) { const ph = 2 * Math.PI * j / SEG;
      const d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      const w = [0, 1, 2].map(k => d[0] * e1[k] + d[1] * e2[k] + d[2] * n[k]);
      const q = [0, 1, 2].map(k => rayon * d[0] * e1[k] + rayon * d[1] * e2[k] + ep * d[2] * n[k]);
      pos.push(centre[0] + q[0], centre[1] + q[1], centre[2] + q[2]); nrm.push(...w); } }
    for (let i = 0; i < RING; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    prims.push([pos, nrm, idx, matPeau]); }
  // trait de cils : un ruban fin, légèrement devant la sphère, sur l'équateur incliné
  { const SEG = 20, pos = [], nrm = [], idx = [], h = rayon * 0.06, R = rayon * 1.01;
    for (let j = 0; j <= SEG; j++) { const ph = -Math.PI * 0.42 + Math.PI * 0.84 * j / SEG;   // arc devant l'œil
      const d = [Math.sin(ph), 0, Math.cos(ph)];
      const w = [0, 1, 2].map(k => d[0] * e1[k] + d[2] * n[k]);
      const q = [0, 1, 2].map(k => R * d[0] * e1[k] + ep * 1.03 * d[2] * n[k]);
      for (const s of [-1, 1]) { pos.push(centre[0] + q[0] + s * h * e2[0], centre[1] + q[1] + s * h * e2[1], centre[2] + q[2] + s * h * e2[2]); nrm.push(...w); } }
    for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    prims.push([pos, nrm, idx, matCil]); }
  for (const [pos, nrm, idx, mat] of prims) {
    const nv = pos.length / 3;
    const p = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType(Accessor.Type.VEC3).setArray(new Float32Array(pos)).setBuffer(buffer))
      .setAttribute('NORMAL', doc.createAccessor().setType(Accessor.Type.VEC3).setArray(new Float32Array(nrm)).setBuffer(buffer))
      .setAttribute('TEXCOORD_0', doc.createAccessor().setType(Accessor.Type.VEC2).setArray(new Float32Array(nv * 2)).setBuffer(buffer))
      .setAttribute('JOINTS_0', doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Uint16Array(nv * 4).map((_, i) => i % 4 === 0 ? ji : 0)).setBuffer(buffer))
      .setAttribute('WEIGHTS_0', doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Float32Array(nv * 4).map((_, i) => i % 4 === 0 ? 1 : 0)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Uint32Array(idx)).setBuffer(buffer));
    mesh.addPrimitive(p);
  }
  console.log('paupière sur', nomOs, 'centre', centre.join(','), 'rayon', rayon);
}
for (const y of cf.yeux) ajoute(y.os, y.centre, y.rayon, y.normale);
await io.write(cf.out, doc);
console.log('écrit', cf.out);
