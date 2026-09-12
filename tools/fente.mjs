/* Sépare deux membres que la génération 3D a soudés (les jambes de la fée).

   La frontière entre les deux jambes n'est pas un plan : elles se croisent,
   les genoux sont écartés en x et les chevilles en z. On découpe donc le long
   d'une grandeur qui suit la vraie frontière, la peau : phi = (poids des os de
   la jambe gauche) - (poids de ceux de la droite). phi vaut +1 sur une jambe,
   -1 sur l'autre, et change de signe exactement à la soudure.

   On retire la mince coquille |phi| < eps, ce qui coupe le solide en deux, puis
   on referme les deux parois par triangulation en oreilles de leurs contours.
   Aucun sommet n'est inventé : chaque sommet de paroi naît d'une arête coupée
   et porte déjà ses UV et ses poids.

   Un fondu en hauteur éteint la découpe au-dessus de l'entrejambe, sinon le
   bassin serait coupé en deux lui aussi.

   Usage : node fente.mjs config.json */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
import earcut from 'earcut';

const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});
const doc = await io.read(cf.in);
const noms = doc.getRoot().listSkins()[0].listJoints().map(j => j.getName());
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const SEM = prim.listSemantics();
const src = {}; for (const s of SEM) src[s] = prim.getAttribute(s).getArray();
const NC = {}; for (const s of SEM) NC[s] = prim.getAttribute(s).getElementSize();
const IDX = prim.getIndices().getArray();
const n0 = src.POSITION.length / 3;

/* la fente : un plan vertical x = xc, de demi-largeur w(y) en fuseau, nulle
   aux deux bouts de la bande — le solide retiré est donc fermé. */
const { xc, y1, y2, W, exposant = 0.35 } = cf;
/* La fente n'est pas une lame plate : elle est plus épaisse devant et derrière
   qu'en son milieu, si bien que la paroi laissée sur chaque jambe bombe vers
   l'autre — un intérieur de cuisse, et non une tranche. L'axe du bombé suit la
   profondeur des jambes, qui recule vers les chevilles. */
const { courbure = 0, zMax = 0 } = cf;
const zAxe = y => (cf.zAxe ? cf.zAxe[0] + cf.zAxe[1] * y : 0);
const demiLargeur = (y, z) => {
  if (y <= y1 || y >= y2) return 0;
  const base = W * Math.pow(Math.sin(Math.PI * (y - y1) / (y2 - y1)), exposant);
  if (!courbure) return base;
  const d = z - zAxe(y);
  return Math.min(zMax, base + courbure * d * d);
};
const garde = cf.garde ?? 0.015;
const attenue = y => (y > y1 && y < y2 ? 1 : 0);

/* --- sommets extensibles -------------------------------------------------- */
const V = {}; for (const s of SEM) V[s] = Array.from(src[s]);
let nV = n0;
const lerpVert = (a, b, t) => {
  const i = nV++;
  for (const s of SEM) {
    const c = NC[s];
    if (s === 'JOINTS_0' || s === 'WEIGHTS_0') { const k = t < 0.5 ? a : b; for (let j = 0; j < c; j++) V[s].push(V[s][k * c + j]); continue; }
    for (let j = 0; j < c; j++) V[s].push(V[s][a * c + j] + t * (V[s][b * c + j] - V[s][a * c + j]));
  }
  return i;
};

/* g >= 0 : matière conservée. côté +1 : x >= xc + w.  côté -1 : x <= xc - w */
const gDe = cote => i => {
  const w = demiLargeur(V.POSITION[i * 3 + 1], V.POSITION[i * 3 + 2]);
  return cote > 0 ? V.POSITION[i * 3] - (xc + w) : (xc - w) - V.POSITION[i * 3];
};

const cache = new Map();
const surArete = (a, b, cote, g) => {
  const k = (a < b ? a + ':' + b : b + ':' + a) + ':' + cote;
  if (cache.has(k)) return cache.get(k);
  const ga = g(a), gb = g(b);
  const i = lerpVert(a, b, ga / (ga - gb));
  cache.set(k, i); return i;
};
const coupe = (poly, cote) => {
  const g = gDe(cote), out = [], neuf = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const na = g(a) >= 0, nb = g(b) >= 0;
    if (na) { out.push(a); neuf.push(false); }
    if (na !== nb) { out.push(surArete(a, b, cote, g)); neuf.push(true); }
  }
  return { out, neuf };
};

/* --- découpe -------------------------------------------------------------- */
const tris = [], bords = { 1: [], '-1': [] };
let touches = 0;
for (let t = 0; t < IDX.length; t += 3) {
  const tri = [IDX[t], IDX[t + 1], IDX[t + 2]];
  /* rien à faire si aucun sommet ne tombe dans la fente */
  if (!tri.some(i => gDe(1)(i) < 0 && gDe(-1)(i) < 0)) { tris.push(tri); continue; }
  touches++;
  for (const cote of [1, -1]) {
    const { out, neuf } = coupe(tri, cote);
    if (out.length < 3) continue;
    for (let k = 1; k + 1 < out.length; k++) tris.push([out[0], out[k], out[k + 1]]);
    for (let k = 0; k < out.length; k++) {
      const a = out[k], b = out[(k + 1) % out.length];
      if (neuf[k] && neuf[(k + 1) % out.length] && a !== b) bords[cote].push([a, b]);
    }
  }
}
console.log('triangles coupés', touches, '| arêtes de paroi', bords[1].length, bords[-1].length);


/* --- refermeture ---------------------------------------------------------- */
const cle = i => Math.round(V.POSITION[i * 3] / 1e-7) + ',' + Math.round(V.POSITION[i * 3 + 1] / 1e-7) + ',' + Math.round(V.POSITION[i * 3 + 2] / 1e-7);
function boucles(bord) {
  /* Le contour d'une paroi est fermé partout sauf aux pincements, là où la
     fente se referme et où les deux parois se rejoignent. On parcourt donc les
     arêtes de proche en proche et on referme chaque chaîne sur elle-même ; aux
     pincements la fente est d'épaisseur nulle, la facette ajoutée l'est aussi. */
  const rep = new Map(), suiv = new Map();
  for (const [a, b] of bord) {
    const ka = cle(a), kb = cle(b); if (ka === kb) continue;
    if (!rep.has(ka)) rep.set(ka, a); if (!rep.has(kb)) rep.set(kb, b);
    if (!suiv.has(ka)) suiv.set(ka, []); suiv.get(ka).push(kb);
  }
  const vus = new Set(), res = [];
  for (const dep of suiv.keys()) {
    if (vus.has(dep)) continue;
    const ch = []; let k = dep;
    while (k && !vus.has(k)) {
      vus.add(k); ch.push(k);
      const l = suiv.get(k); k = l && l.find(x => !vus.has(x));
    }
    if (ch.length >= 3) res.push(ch.map(x => rep.get(x)));
  }
  return res;
}

/* les parois ne doivent pas piocher la texture au hasard : on duplique leurs
   sommets et on leur donne tous la même UV, prise sur un morceau de peau */
let uvChair = null;
const dupChair = new Map();
const versChair = i => {
  if (dupChair.has(i)) return dupChair.get(i);
  const j = nV++;
  for (const s of SEM) {
    const c = NC[s];
    for (let k = 0; k < c; k++) V[s].push(V[s][i * c + k]);
    if (s === 'TEXCOORD_0') { V[s][j * c] = uvChair[0]; V[s][j * c + 1] = uvChair[1]; }
  }
  dupChair.set(i, j); return j;
};

/* base orthonormée du plan moyen d'une boucle */
function base(idx) {
  const c = [0, 0, 0]; for (const i of idx) for (let k = 0; k < 3; k++) c[k] += V.POSITION[i * 3 + k] / idx.length;
  let nrm = [0, 0, 0];
  for (let i = 0; i < idx.length; i++) {
    const a = idx[i], b = idx[(i + 1) % idx.length];
    const u = [V.POSITION[a * 3] - c[0], V.POSITION[a * 3 + 1] - c[1], V.POSITION[a * 3 + 2] - c[2]];
    const v = [V.POSITION[b * 3] - c[0], V.POSITION[b * 3 + 1] - c[1], V.POSITION[b * 3 + 2] - c[2]];
    nrm[0] += u[1] * v[2] - u[2] * v[1]; nrm[1] += u[2] * v[0] - u[0] * v[2]; nrm[2] += u[0] * v[1] - u[1] * v[0];
  }
  const L = Math.hypot(...nrm) || 1; nrm = nrm.map(v => v / L);
  let t = Math.abs(nrm[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let e1 = [t[1] * nrm[2] - t[2] * nrm[1], t[2] * nrm[0] - t[0] * nrm[2], t[0] * nrm[1] - t[1] * nrm[0]];
  const L1 = Math.hypot(...e1) || 1; e1 = e1.map(v => v / L1);
  const e2 = [nrm[1] * e1[2] - nrm[2] * e1[1], nrm[2] * e1[0] - nrm[0] * e1[2], nrm[0] * e1[1] - nrm[1] * e1[0]];
  return { c, nrm, e1, e2 };
}
function oreilles(p) {
  const plat = new Float64Array(p.length * 2);
  for (let i = 0; i < p.length; i++) { plat[i * 2] = p[i][0]; plat[i * 2 + 1] = p[i][1]; }
  const t = earcut(plat);
  const res = [];
  for (let i = 0; i < t.length; i += 3) res.push([t[i], t[i + 1], t[i + 2]]);
  return res;
}
{ const c = cf.pointChair; let best = -1, bd = 1e9;
  for (let i = 0; i < n0; i++) {
    const d = Math.hypot(V.POSITION[i*3]-c[0], V.POSITION[i*3+1]-c[1], V.POSITION[i*3+2]-c[2]);
    if (d < bd) { bd = d; best = i; } }
  uvChair = [V.TEXCOORD_0[best*2], V.TEXCOORD_0[best*2+1]];
  console.log('teinte de paroi prise au sommet', best, 'à', bd.toFixed(4), 'm — uv', uvChair.map(v=>v.toFixed(4)).join(',')); }
for (const cote of [1, -1]) {
  const bs = boucles(bords[cote]); let nt = 0;
  for (const idx of bs) {
    if (process.env.MAXB && idx.length > +process.env.MAXB) continue;
    if (process.env.BBOX) { const b=[1e9,1e9,1e9,-1e9,-1e9,-1e9];
      for (const i of idx) for (let k=0;k<3;k++){b[k]=Math.min(b[k],V.POSITION[i*3+k]);b[3+k]=Math.max(b[3+k],V.POSITION[i*3+k]);}
      if (idx.length>8) console.log('     boucle', String(idx.length).padStart(4), 'bbox', b.map(v=>v.toFixed(3)).join(' ')); }
    const { c, nrm, e1, e2 } = base(idx);
    const p2 = idx.map(i => { const d = [V.POSITION[i * 3] - c[0], V.POSITION[i * 3 + 1] - c[1], V.POSITION[i * 3 + 2] - c[2]];
      return [d[0] * e1[0] + d[1] * e1[1] + d[2] * e1[2], d[0] * e2[0] + d[1] * e2[1] + d[2] * e2[2]]; });
    let aire = 0; for (let i = 0; i < p2.length; i++) { const j = (i + 1) % p2.length; aire += p2[i][0] * p2[j][1] - p2[j][0] * p2[i][1]; }
    const ord = aire > 0 ? idx : idx.slice().reverse();
    const pp = aire > 0 ? p2 : p2.slice().reverse();
    for (const t of oreilles(pp)) { tris.push([versChair(ord[t[0]]), versChair(ord[t[2]]), versChair(ord[t[1]])]); nt++; }
  }
  console.log('  côté', cote, ':', bs.length, 'boucles', bs.map(b => b.length).join(','), '→', nt, 'triangles');
}

/* --- normales des sommets neufs ------------------------------------------- */
const acc = new Float64Array((nV - n0) * 3);
const estParoi = new Set([...dupChair.values()]);
for (const [a, b, c] of tris) {
  if (!estParoi.has(a) && !estParoi.has(b) && !estParoi.has(c)) continue;
  const u = [V.POSITION[b * 3] - V.POSITION[a * 3], V.POSITION[b * 3 + 1] - V.POSITION[a * 3 + 1], V.POSITION[b * 3 + 2] - V.POSITION[a * 3 + 2]];
  const v = [V.POSITION[c * 3] - V.POSITION[a * 3], V.POSITION[c * 3 + 1] - V.POSITION[a * 3 + 1], V.POSITION[c * 3 + 2] - V.POSITION[a * 3 + 2]];
  const nm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  for (const i of [a, b, c]) if (estParoi.has(i)) for (let k = 0; k < 3; k++) acc[(i - n0) * 3 + k] += nm[k];
}
for (let i = n0; i < nV; i++) { if (!estParoi.has(i)) continue;
  const o = (i - n0) * 3, L = Math.hypot(acc[o], acc[o + 1], acc[o + 2]);
  if (L > 1e-12) for (let k = 0; k < 3; k++) V.NORMAL[i * 3 + k] = acc[o + k] / L;
}

/* --- filet de sécurité : on bouche les trous qui restent ------------------- */
{
  const util = new Map(), repr = new Map();
  for (const t of tris) {
    for (let k = 0; k < 3; k++) {
      const a = t[k], b = t[(k + 1) % 3]; const ka = cle(a), kb = cle(b);
      if (ka === kb) continue;
      repr.set(ka, a); repr.set(kb, b);
      const key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      const g = util.get(key) || { n: 0, dir: null }; g.n++; if (!g.dir) g.dir = [ka, kb]; util.set(key, g);
    }
  }
  const orphelines = [];
  for (const [key, g] of util) if (g.n === 1) orphelines.push(g.dir);
  if (orphelines.length) {
    const sortantes = new Map();
    for (const [ka, kb] of orphelines) { if (!sortantes.has(ka)) sortantes.set(ka, []); sortantes.get(ka).push(kb); }
    let nb = 0, nt = 0;
    for (const [dep, lst] of sortantes) {
      while (lst.length) {
        const ch = [dep]; let k = lst.shift(), garde = 0;
        while (k !== dep && garde++ < 10000) { ch.push(k); const l = sortantes.get(k); if (!l || !l.length) { k = null; break; } k = l.shift(); }
        if (k !== dep || ch.length < 3) continue;
        if (ch.length > 16) { console.log('   grand trou laissé ouvert :', ch.length, 'arêtes'); continue; }
        const idx = ch.map(x => versChair(repr.get(x)));
        for (let j = 1; j + 1 < idx.length; j++) tris.push([idx[0], idx[j], idx[j + 1]]);
        nb++; nt += idx.length - 2;
      }
    }
    console.log('trous rebouchés', nb, '→', nt, 'triangles (', orphelines.length, 'arêtes orphelines )');
  }
}

/* --- écartement des deux jambes ------------------------------------------- */
/* Une fois la soudure tranchée, on peut écarter franchement les deux jambes.
   Le côté se lit sur la peau, pas sur x : plus bas les jambes se croisent.
   L'écart s'éteint en montant vers le bassin, qui ne doit pas s'élargir. */
if (cf.ecart) {
  const iG = new Set((cf.gauche || []).map(x => noms.indexOf(x)));
  const iD = new Set((cf.droite || []).map(x => noms.indexOf(x)));
  const haut = cf.ecartHaut ?? y2, fondu = cf.ecartFondu ?? 0.07;
  let n = 0;
  for (let i = 0; i < nV; i++) {
    const y = V.POSITION[i * 3];
    const yy = V.POSITION[i * 3 + 1];
    if (yy >= haut) continue;
    const a = yy <= haut - fondu ? 1 : (() => { const t = (haut - yy) / fondu; return t * t * (3 - 2 * t); })();
    let p = 0;
    for (let k = 0; k < 4; k++) {
      const j = V.JOINTS_0[i * 4 + k], w = V.WEIGHTS_0[i * 4 + k];
      if (iG.has(j)) p += w; else if (iD.has(j)) p -= w;
    }
    if (Math.abs(p) < 0.25) continue;
    V.POSITION[i * 3] += Math.sign(p) * cf.ecart * a * Math.min(1, Math.abs(p));
    n++;
  }
  console.log('jambes écartées :', n, 'sommets, ±', (cf.ecart * 1000).toFixed(1), 'mm');
}

/* --- réécriture ------------------------------------------------------------ */
for (const s of SEM) prim.getAttribute(s).setArray((s === 'JOINTS_0' ? Uint16Array : Float32Array).from(V[s]));
const propres = tris.filter(([a, b, c]) => {
  if (a === b || b === c || a === c) return false;
  const u = [V.POSITION[b*3]-V.POSITION[a*3], V.POSITION[b*3+1]-V.POSITION[a*3+1], V.POSITION[b*3+2]-V.POSITION[a*3+2]];
  const v = [V.POSITION[c*3]-V.POSITION[a*3], V.POSITION[c*3+1]-V.POSITION[a*3+1], V.POSITION[c*3+2]-V.POSITION[a*3+2]];
  const n = Math.hypot(u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]);
  return n > 1e-12;
});
if (propres.length !== tris.length) console.log('triangles dégénérés retirés', tris.length - propres.length);
tris.length = 0; for (const t of propres) tris.push(t);
const plat = new Uint32Array(tris.length * 3);
for (let i = 0; i < tris.length; i++) { plat[i * 3] = tris[i][0]; plat[i * 3 + 1] = tris[i][1]; plat[i * 3 + 2] = tris[i][2]; }
prim.getIndices().setArray(plat);
console.log('sommets', n0, '→', nV, '| triangles', IDX.length / 3, '→', tris.length);
await io.write(cf.out, doc);
console.log('écrit', cf.out, (fs.statSync(cf.out).size / 1024 / 1024).toFixed(2), 'Mo');
