/* Ajoute un souffle de feu en géométrie dans un GLB déjà riggé.
   La flamme est une primitive à part, avec sa propre matière émissive et
   translucide, pesée à 100 % sur un os dédié : elle suit donc la tête, et il
   suffit d'animer l'échelle de cet os pour la faire apparaître.
   Usage : node flamme.mjs config.json                                        */
import { NodeIO, Accessor } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsEmissiveStrength } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(cfg.in);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const skin = root.listSkins()[0];
const noms = skin.listJoints().map(j => j.getName());
const ji = noms.indexOf(cfg.os);
if (ji < 0) throw new Error('os introuvable : ' + cfg.os);

for (const couche of (cfg.couches || [cfg])) {
const base = (couche.base || cfg.base).map((v, d) => v + ((couche.decalage || [0,0,0])[d]));
const dir0 = (couche.direction || cfg.direction).map((v, d) => v + ((couche.inclinaison || [0,0,0])[d]));
const dl = Math.hypot(...dir0); const D = dir0.map(v => v / dl);
// repère orthonormé autour de l'axe
let up = Math.abs(D[1]) < 0.9 ? [0,1,0] : [1,0,0];
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
let U = cross(D, up); const ul = Math.hypot(...U); U = U.map(v => v/ul);
const V = cross(D, U);

const L = couche.longueur ?? 0.34, R = couche.rayon ?? 0.075;
const AMAX = couche.alphaMax ?? 0.9;
const NA = cfg.anneaux ?? 14, NS = cfg.segments ?? 16;
const POS = [], NOR = [], COL = [], JJ = [], WW = [], IDX = [];
// profil de flamme : fin à la gueule, renflé, effilé au bout
const profil = t => 1.95 * Math.pow(t, 0.40) * Math.pow(1 - t, 0.58);
// couleur : blanc chaud -> jaune -> orange -> rouge transparent
function couleur(t) {
  const a = t < 0.10 ? AMAX * (0.35 + t*6.5) : t < 0.62 ? AMAX : Math.max(0, AMAX * (1 - (t - 0.62) / 0.40));
  // dégradé de flamme : blanc chaud au ras de la gueule, puis jaune, orange, rouge
  const g = [[0, [1, 0.96, 0.72]], [0.16, [1, 0.86, 0.30]], [0.40, [1, 0.60, 0.07]], [0.66, [0.99, 0.34, 0.03]], [1, [0.85, 0.13, 0.02]]];
  let c = g[g.length-1][1];
  for (let i = 0; i < g.length-1; i++) if (t >= g[i][0] && t <= g[i+1][0]) {
    const u = (t - g[i][0]) / (g[i+1][0] - g[i][0]);
    c = [0,1,2].map(d => g[i][1][d] + (g[i+1][1][d] - g[i][1][d]) * u); break; }
  return [c[0], c[1], c[2], a];
}
for (let i = 0; i <= NA; i++) {
  const t = i / NA;
  const r = R * profil(t) * (1 + 0.22 * Math.sin(t * 13) + 0.12 * Math.sin(t * 29)); // langues de feu
  const c = base.map((b, d) => b + D[d] * L * t);
  const col = couleur(t);
  for (let s = 0; s < NS; s++) {
    const a = s / NS * Math.PI * 2;
    const on = 1 + 0.20 * Math.sin(a * 3 + t * 9) + 0.10 * Math.sin(a * 5 - t * 15);
    const p = [0,1,2].map(d => c[d] + (U[d] * Math.cos(a) + V[d] * Math.sin(a)) * r * on);
    POS.push(...p);
    const nrm = [0,1,2].map(d => U[d] * Math.cos(a) + V[d] * Math.sin(a));
    NOR.push(...nrm);
    COL.push(...col);
    JJ.push(ji, 0, 0, 0); WW.push(1, 0, 0, 0);
  }
}
// pointe
const pointe = POS.length / 3;
POS.push(...base.map((b, d) => b + D[d] * L * 1.06));
NOR.push(...D); COL.push(1, 0.3, 0.05, 0); JJ.push(ji, 0, 0, 0); WW.push(1, 0, 0, 0);
for (let i = 0; i < NA; i++) for (let s = 0; s < NS; s++) {
  const a = i*NS + s, b = i*NS + (s+1)%NS, c = (i+1)*NS + s, d = (i+1)*NS + (s+1)%NS;
  IDX.push(a, c, b, b, c, d);
}
for (let s = 0; s < NS; s++) IDX.push(NA*NS + s, pointe, NA*NS + (s+1)%NS);

const mat = doc.createMaterial('flamme_' + (couche.nom || 'x'))
  .setBaseColorFactor([1, 1, 1, 1])
  .setEmissiveFactor(couche.emissif || [1, 0.5, 0.12])
  .setMetallicFactor(0).setRoughnessFactor(1)
  .setAlphaMode('BLEND').setDoubleSided(true);
if (couche.force && couche.force !== 1) {
  const ext = doc.createExtension(KHRMaterialsEmissiveStrength);
  mat.setExtension('KHR_materials_emissive_strength', ext.createEmissiveStrength().setEmissiveStrength(couche.force));
}
const prim = doc.createPrimitive()
  .setMaterial(mat)
  .setAttribute('POSITION', doc.createAccessor().setType(Accessor.Type.VEC3).setArray(new Float32Array(POS)).setBuffer(buffer))
  .setAttribute('NORMAL',   doc.createAccessor().setType(Accessor.Type.VEC3).setArray(new Float32Array(NOR)).setBuffer(buffer))
  .setAttribute('COLOR_0',  doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Float32Array(COL)).setBuffer(buffer))
  .setAttribute('JOINTS_0', doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Uint16Array(JJ)).setBuffer(buffer))
  .setAttribute('WEIGHTS_0',doc.createAccessor().setType(Accessor.Type.VEC4).setArray(new Float32Array(WW)).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType(Accessor.Type.SCALAR).setArray(new Uint32Array(IDX)).setBuffer(buffer));
root.listMeshes()[0].addPrimitive(prim);
console.log('couche', couche.nom || '?', ':', POS.length/3, 'sommets,', IDX.length/3, 'triangles');
}
await io.write(cfg.out, doc);
console.log('flamme écrite dans', cfg.out, 'sur l\'os', cfg.os);
