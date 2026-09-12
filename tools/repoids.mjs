/* Rend à la taille les morceaux de vêtement que le rig automatique a accrochés
   aux os des jambes. Les pétales de la jupe de la fée descendent sur les
   cuisses ; Tripo les a donc pesés sur les cuisses, et le moindre mouvement de
   jambe faisait décoller un pétale.

   On identifie le vêtement grâce au modèle « généré par parties », où la jupe
   est un maillage séparé : un sommet appartient au vêtement s'il est nettement
   plus près de la jupe que de toute autre partie. Son poids sur les os
   interdits est alors reporté sur un os stable.

   Usage : node repoids.mjs config.json */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';

const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(cf.in);
const parts = await io.read(cf.parties);

const CELL = cf.cellule ?? 0.012;
const grille = pts => {
  const g = new Map();
  for (let i = 0; i < pts.length; i += 3) {
    const k = Math.floor(pts[i] / CELL) + ',' + Math.floor(pts[i + 1] / CELL) + ',' + Math.floor(pts[i + 2] / CELL);
    let a = g.get(k); if (!a) g.set(k, a = []); a.push(i);
  }
  return { g, pts };
};
const dist = (G, x, y, z) => {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL);
  let best = Infinity;
  for (let r = 0; r <= 3; r++) {
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
      if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r) continue;
      const arr = G.g.get((cx + a) + ',' + (cy + b) + ',' + (cz + c)); if (!arr) continue;
      for (const i of arr) { const d = (G.pts[i] - x) ** 2 + (G.pts[i + 1] - y) ** 2 + (G.pts[i + 2] - z) ** 2; if (d < best) best = d; }
    }
    if (best < (r * CELL) ** 2) break;
  }
  return Math.sqrt(best);
};
const partie = nom => {
  const m = parts.getRoot().listMeshes().find(m => m.getName() === nom);
  if (!m) throw new Error('partie introuvable : ' + nom);
  return grille(m.listPrimitives()[0].getAttribute('POSITION').getArray());
};

const vetement = cf.vetement.map(partie);
const corps = cf.corps.map(partie);

const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const noms = doc.getRoot().listSkins()[0].listJoints().map(j => j.getName());
const P = prim.getAttribute('POSITION').getArray();
const J = prim.getAttribute('JOINTS_0').getArray();
const W = prim.getAttribute('WEIGHTS_0').getArray();
const interdits = new Set(cf.interdits.map(n => noms.indexOf(n)));
const cible = noms.indexOf(cf.cible);
if (cible < 0 || [...interdits].some(i => i < 0)) throw new Error('os introuvable');

let touches = 0, poidsRendu = 0;
const n = P.length / 3;
const lisse = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
for (let i = 0; i < n; i++) {
  const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
  if (y < cf.yMin || y > cf.yMax) continue;
  let w = 0; for (let k = 0; k < 4; k++) if (interdits.has(J[i * 4 + k])) w += W[i * 4 + k];
  if (w < 1e-4) continue;
  const dv = Math.min(...vetement.map(G => dist(G, x, y, z)));
  const dc = Math.min(...corps.map(G => dist(G, x, y, z)));
  /* transfert progressif : au ras de la jambe le tissu garde le poids de la
     jambe, sinon l'ourlet se déchire quand elle avance. Plus on s'en éloigne,
     plus il revient à la taille. */
  if (!isFinite(dv)) continue;          // trop loin du vêtement : ce n'en est pas
  const f = isFinite(dc) ? lisse((dc - dv - cf.marge) / cf.transition) : 1;
  if (f <= 0) continue;
  touches++; poidsRendu += w * f;
  let acc = 0, libre = -1;
  for (let k = 0; k < 4; k++) {
    if (interdits.has(J[i * 4 + k])) { const d = W[i * 4 + k] * f; acc += d; W[i * 4 + k] -= d; }
    else if (J[i * 4 + k] === cible) libre = k;
  }
  if (libre < 0) { let pire = 0; for (let k = 1; k < 4; k++) if (W[i * 4 + k] < W[i * 4 + pire]) pire = k;
    if (W[i * 4 + pire] < 1e-4) { J[i * 4 + pire] = cible; libre = pire; W[i * 4 + pire] = 0; } }
  if (libre < 0) { W[i * 4] += acc; continue; }
  W[i * 4 + libre] += acc;
}
console.log('sommets rendus à', cf.cible, ':', touches, '| poids transféré', poidsRendu.toFixed(1));
await io.write(cf.out, doc);
console.log('écrit', cf.out, (fs.statSync(cf.out).size / 1024 / 1024).toFixed(2), 'Mo');
