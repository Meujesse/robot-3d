// Cœur procédural : champ de distance signée (SDF) + maillage « surface nets ».
// Repère anatomique : x = gauche du patient (droite de l'écran), y = haut, z = avant (vers le spectateur).

const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const norm = (v) => { const l = len3(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const vec = { len3, norm, sub, add, mul, dot, cross };

export function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/* ---------- Primitives ---------- */
// Cône arrondi (I. Quilez) entre a (rayon r1) et b (rayon r2)
export function roundCone(a, b, r1, r2) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const f = (x, y, z) => {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2];
    const yy = pax * bax + pay * bay + paz * baz;
    const zz = yy - l2;
    const qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yy * yy * l2, z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
  f.a = a; f.b = b; f.r1 = r1; f.r2 = r2;
  return f;
}
// Ellipsoïde orienté : u = axe principal, hint = direction « avant » approximative
export function ellipsoid(c, r, u = [1, 0, 0], hint = [0, 0, 1]) {
  u = norm(u);
  let w = sub(hint, mul(u, dot(hint, u))); w = norm(w);
  const v = cross(w, u);
  const f = (x, y, z) => {
    const px = x - c[0], py = y - c[1], pz = z - c[2];
    const lx = (px * u[0] + py * u[1] + pz * u[2]) / r[0];
    const ly = (px * v[0] + py * v[1] + pz * v[2]) / r[1];
    const lz = (px * w[0] + py * w[1] + pz * w[2]) / r[2];
    const k0 = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const k1 = Math.sqrt((lx / r[0]) ** 2 + (ly / r[1]) ** 2 + (lz / r[2]) ** 2);
    return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : k0 * (k0 - 1) / k1;
  };
  f.c = c;
  return f;
}
// Cylindre plein entre a et b
export function cylinder(a, b, r) {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const baba = bax * bax + bay * bay + baz * baz;
  return (x, y, z) => {
    const pax = x - a[0], pay = y - a[1], paz = z - a[2];
    const paba = pax * bax + pay * bay + paz * baz;
    const qx = pax * baba - bax * paba, qy = pay * baba - bay * paba, qz = paz * baba - baz * paba;
    const X = Math.sqrt(qx * qx + qy * qy + qz * qz) - r * baba;
    const Y = Math.abs(paba - baba * 0.5) - baba * 0.5;
    const x2 = X * X, y2 = Y * Y * baba;
    const d = Math.max(X, Y) < 0 ? -Math.min(x2, y2 / 1) : ((X > 0 ? x2 : 0) + (Y > 0 ? y2 : 0));
    return Math.sign(d) * Math.sqrt(Math.abs(d)) / baba;
  };
}

/* ---------- Outils de projection ---------- */
export function grad(f, x, y, z, e = 0.004) {
  return [
    (f(x + e, y, z) - f(x - e, y, z)) / (2 * e),
    (f(x, y + e, z) - f(x, y - e, z)) / (2 * e),
    (f(x, y, z + e) - f(x, y, z - e)) / (2 * e)
  ];
}
// Ramène p sur la surface f = 0 (et éventuellement sur g = 0 : intersection = sillon)
export function project(p, f, g = null, iters = 30) {
  let [x, y, z] = p;
  for (let i = 0; i < iters; i++) {
    let v = f(x, y, z), d = grad(f, x, y, z), l2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1;
    x -= v * d[0] / l2; y -= v * d[1] / l2; z -= v * d[2] / l2;
    if (g) {
      v = g(x, y, z); d = grad(g, x, y, z); l2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2] || 1;
      const s = Math.min(1, 0.6);
      x -= s * v * d[0] / l2; y -= s * v * d[1] / l2; z -= s * v * d[2] / l2;
    }
  }
  return [x, y, z];
}
// Point de la frontière entre deux régions (fa = fb) sur le segment [p0, p1]
export function bisect(p0, p1, fa, fb) {
  let lo = 0, hi = 1;
  const at = (t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t];
  const s0 = Math.sign(fa(...p0) - fb(...p0));
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2, p = at(m);
    if (Math.sign(fa(...p) - fb(...p)) === s0) lo = m; else hi = m;
  }
  return at((lo + hi) / 2);
}

/* ---------- Surface nets ---------- */
// f : champ (négatif à l'intérieur). Retourne positions (Float32Array) et quads (Uint32Array, 4 index par quad)
export function surfaceNets(f, bmin, bmax, h) {
  const nx = Math.ceil((bmax[0] - bmin[0]) / h) + 1;
  const ny = Math.ceil((bmax[1] - bmin[1]) / h) + 1;
  const nz = Math.ceil((bmax[2] - bmin[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz);
  // échantillonnage avec une grille grossière pour sauter les zones éloignées
  const B = 4, cb = h * B * 2.2;
  const cx = Math.ceil(nx / B), cy = Math.ceil(ny / B), cz = Math.ceil(nz / B);
  for (let K = 0; K < cz; K++) for (let J = 0; J < cy; J++) for (let I = 0; I < cx; I++) {
    const x0 = bmin[0] + (I * B + B / 2) * h, y0 = bmin[1] + (J * B + B / 2) * h, z0 = bmin[2] + (K * B + B / 2) * h;
    const dc = f(x0, y0, z0);
    const far = Math.abs(dc) > cb;
    for (let k = K * B; k < Math.min(nz, K * B + B + 1); k++)
      for (let j = J * B; j < Math.min(ny, J * B + B + 1); j++)
        for (let i = I * B; i < Math.min(nx, I * B + B + 1); i++) {
          const id = i + nx * (j + ny * k);
          F[id] = far ? dc : f(bmin[0] + i * h, bmin[1] + j * h, bmin[2] + k * h);
        }
  }
  const cell = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = F[(i + (c & 1)) + nx * ((j + ((c >> 1) & 1)) + ny * (k + ((c >> 2) & 1)))];
      cv[c] = v; if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += (a & 1) + ((b & 1) - (a & 1)) * t;
      sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
      sz += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
      n++;
    }
    cell[i + nx * (j + ny * k)] = pos.length / 3;
    pos.push(bmin[0] + (i + sx / n) * h, bmin[1] + (j + sy / n) * h, bmin[2] + (k + sz / n) * h);
  }
  const quads = [];
  const C = (i, j, k) => cell[i + nx * (j + ny * k)];
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = F[i + nx * (j + ny * k)] < 0;
    // arête x
    if (i < nx - 1 && (F[i + 1 + nx * (j + ny * k)] < 0) !== v0) {
      const q = [C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k)];
      quads.push(...(v0 ? q : q.reverse()));
    }
    if (j < ny - 1 && (F[i + nx * (j + 1 + ny * k)] < 0) !== v0) {
      const q = [C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1)];
      quads.push(...(v0 ? q : q.reverse()));
    }
    if (k < nz - 1 && (F[i + nx * (j + ny * (k + 1))] < 0) !== v0) {
      const q = [C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k)];
      quads.push(...(v0 ? q : q.reverse()));
    }
  }
  return { pos: new Float32Array(pos), quads: new Uint32Array(quads) };
}
