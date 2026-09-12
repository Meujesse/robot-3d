/* Rend à la taille les pétales de jupe que le rig a accrochés aux jambes ou aux
   bras, sans modèle « par parties » : le tissu se reconnaît à sa couleur dans la
   texture (teinte verte/turquoise), la peau non. Le transfert est total sur le
   tissu et nul sur la peau, la frontière de couleur étant aussi la frontière
   géométrique du pétale qui recouvre la cuisse.
   Usage : node jupe-couleur.mjs config.json */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import fs from 'fs';
const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(cf.in);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const noms = doc.getRoot().listSkins()[0].listJoints().map(j => j.getName());
const P = prim.getAttribute('POSITION').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray();
const J = prim.getAttribute('JOINTS_0').getArray(), W = prim.getAttribute('WEIGHTS_0').getArray();
const tex = prim.getMaterial().getBaseColorTexture();
const { data, info } = await sharp(Buffer.from(tex.getImage())).raw().toBuffer({ resolveWithObject: true });
const interdits = new Set(cf.interdits.map(n => noms.indexOf(n))), cible = noms.indexOf(cf.cible);
if (cible < 0 || [...interdits].some(i => i < 0)) throw new Error('os introuvable');
let n = 0, tot = 0;
for (let i = 0; i < P.length / 3; i++) {
  const y = P[i*3+1]; if (y < cf.yMin || y > cf.yMax) continue;
  let w = 0; for (let k = 0; k < 4; k++) if (interdits.has(J[i*4+k])) w += W[i*4+k];
  if (w < 1e-4) continue;
  const px = Math.round(UV[i*2] * (info.width - 1)), py = Math.round(UV[i*2+1] * (info.height - 1));
  const o = (py * info.width + px) * info.channels, r = data[o], g = data[o+1], b = data[o+2];
  if (!(g > r + cf.ecartVert && (g + b) > 2 * r + cf.ecartVert)) continue;   // tissu turquoise, pas peau
  n++; tot += w;
  let acc = 0, libre = -1;
  for (let k = 0; k < 4; k++) { if (interdits.has(J[i*4+k])) { acc += W[i*4+k]; W[i*4+k] = 0; } else if (J[i*4+k] === cible) libre = k; }
  if (libre < 0) { let pire = 0; for (let k = 1; k < 4; k++) if (W[i*4+k] < W[i*4+pire]) pire = k; J[i*4+pire] = cible; W[i*4+pire] = 0; libre = pire; }
  W[i*4+libre] += acc;
}
console.log('sommets de tissu rendus à', cf.cible, ':', n, '| poids', tot.toFixed(0));
await io.write(cf.out, doc); console.log('écrit', cf.out);
