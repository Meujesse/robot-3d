/* Cuit une pose de repos dans le squelette : la rotation de repos de certains os
   est modifiée (axes monde), les matrices de liaison inverses restent celles du
   maillage. Le personnage adopte donc cette pose sans animation, et toutes les
   animations composent dessus — comme la première fée, dont le maillage avait
   déjà les jambes serrées.
   Usage : node pose-repos.mjs config.json   (avant graft-bones) */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(cf.in);
const qMul = (a, b) => [a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1], a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0], a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3], a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]];
const qConj = q => [-q[0], -q[1], -q[2], q[3]];
const qAxis = (ax, deg) => { const h = deg * Math.PI / 360, s = Math.sin(h); return [ax[0]*s, ax[1]*s, ax[2]*s, Math.cos(h)]; };
const AX = { X: [1,0,0], Y: [0,1,0], Z: [0,0,1] };
const parentOf = new Map();
for (const n of doc.getRoot().listNodes()) for (const c of n.listChildren()) parentOf.set(c, n);
const worldRot = n => { let q = [0,0,0,1]; for (let m = n; m; m = parentOf.get(m)) q = qMul(m.getRotation(), q); return q; };
const byName = new Map(doc.getRoot().listNodes().map(n => [n.getName(), n]));
for (const p of cf.poses) {
  const node = byName.get(p.bone); if (!node) throw new Error('os inconnu ' + p.bone);
  const par = parentOf.get(node); const qP = par ? worldRot(par) : [0,0,0,1];
  let Q = [0,0,0,1]; p.axes.forEach((ax, i) => { Q = qMul(qAxis(AX[ax], p.a[i]), Q); });
  node.setRotation(qMul(qConj(qP), qMul(Q, qMul(qP, node.getRotation()))));
  console.log('pose de repos', p.bone, p.axes.join('/'), p.a.join('/'));
}
await io.write(cf.out, doc); console.log('écrit', cf.out);
