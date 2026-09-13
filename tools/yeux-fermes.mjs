/* Texture « yeux fermés » : on repeint, dans la texture d'origine, les texels des
   triangles du globe oculaire avec la couleur de peau voisine, et un trait sombre
   à mi-hauteur de l'œil. Pas de dilatation : l'atlas UV de Tripo est éclaté, et
   toute dilatation finissait dans les cheveux. La page échange la texture le
   temps du clignement (PERSO.cils).
   Usage : node yeux-fermes.mjs config.json */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
import fs from 'fs';
const cf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(cf.in);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const P = prim.getAttribute('POSITION').getArray(), UV = prim.getAttribute('TEXCOORD_0').getArray(), I = prim.getIndices().getArray();
const tex = prim.getMaterial().getBaseColorTexture();
const { data, info } = await sharp(Buffer.from(tex.getImage())).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
const out = Buffer.from(data);
const nv = P.length / 3;
let peints = 0;
for (const oeil of cf.yeux) {
  const [cx, cy, cz] = oeil.centre, r = oeil.rayon;
  const dans = v => Math.hypot(P[v*3]-cx, P[v*3+1]-cy, P[v*3+2]-cz) <= r;
  // couleur de peau : médiane des texels d'un anneau autour de l'œil
  const cols = [];
  for (let v = 0; v < nv; v++) { const d = Math.hypot(P[v*3]-cx, P[v*3+1]-cy, P[v*3+2]-cz); if (d < r * 1.15 || d > r * 1.9) continue;
    const px = Math.round(UV[v*2] * (W-1)), py = Math.round(UV[v*2+1] * (H-1)); const o = (py*W+px)*C; cols.push([data[o], data[o+1], data[o+2]]); }
  cols.sort((a, b) => (a[0]+a[1]+a[2]) - (b[0]+b[1]+b[2]));
  const peau = (cf.peauFixe || !cols.length) ? cf.peau : cols[Math.floor(cols.length * 0.55)];
  const trait = peau.map(v => Math.round(v * 0.35));
  const hTrait = oeil.trait ?? r * 0.12;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t+1], c = I[t+2];
    if (!(dans(a) && dans(b) && dans(c))) continue;
    // hauteur moyenne du triangle par rapport au centre : trait de cils autour de cy - decalage
    const ym = (P[a*3+1] + P[b*3+1] + P[c*3+1]) / 3;
    const col = Math.abs(ym - (cy + (oeil.decalageTrait ?? 0))) < hTrait ? trait : peau;
    // rastérisation du triangle en UV
    const u = [UV[a*2], UV[b*2], UV[c*2]].map(x => x * (W-1)), v = [UV[a*2+1], UV[b*2+1], UV[c*2+1]].map(x => x * (H-1));
    const x0 = Math.max(0, Math.floor(Math.min(...u)) - 1), x1 = Math.min(W-1, Math.ceil(Math.max(...u)) + 1);
    const y0 = Math.max(0, Math.floor(Math.min(...v)) - 1), y1 = Math.min(H-1, Math.ceil(Math.max(...v)) + 1);
    const e = (ax, ay, bx, by, px, py) => (bx-ax)*(py-ay) - (by-ay)*(px-ax);
    const aire = e(u[0], v[0], u[1], v[1], u[2], v[2]); if (Math.abs(aire) < 1e-9) continue;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const w0 = e(u[1], v[1], u[2], v[2], x, y) / aire, w1 = e(u[2], v[2], u[0], v[0], x, y) / aire, w2 = 1 - w0 - w1;
      if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
      const o = (y*W+x)*C; out[o] = col[0]; out[o+1] = col[1]; out[o+2] = col[2]; peints++;
    }
  }
  console.log('œil', oeil.centre.join(','), 'peau', peau, 'texels peints (cumul)', peints);
}
await sharp(out, { raw: { width: W, height: H, channels: C } }).resize(cf.taille || 2048).webp({ quality: 88 }).toFile(cf.out);
console.log('écrit', cf.out);
