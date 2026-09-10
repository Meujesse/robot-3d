// Moteur de bouche partagé (2D et 3D) : redessin continu du bas du visage sur un canvas.
// Méthode Parcoursup'easy : l'ouverture multiplie celle du dessin, les vraies dents sont reprises quand il y en a.
// Expose window.LisaBouche = { syllabes, dessineBouche, Moteur }.
(function () {
  const FORMES = { MBP: [0.00, -0.030, 0.00], pet: [0.32, +0.010, +0.05], E: [0.60, +0.048, -0.04],
    A: [1.00, +0.014, +0.03], O: [0.70, -0.058, -0.05], U: [0.36, -0.072, +0.04], rep: [0.00, 0.000, 0.00] };
  const GROUPES = [['eau', 'O'], ['ain', 'E'], ['ein', 'E'], ['oin', 'U'], ['au', 'O'], ['ou', 'U'], ['oi', 'WA'], ['oy', 'WA'],
    ['ui', 'U'], ['eu', 'U'], ['ey', 'E'], ['ay', 'E'], ['ai', 'E'], ['ei', 'E'], ['an', 'A'], ['am', 'A'], ['en', 'A'], ['em', 'A'],
    ['in', 'E'], ['im', 'E'], ['on', 'O'], ['om', 'O'], ['un', 'U'], ['um', 'U'], ['a', 'A'], ['e', 'E'], ['i', 'E'], ['y', 'E'], ['o', 'O'], ['u', 'U']];
  function syllabes(texte) {
    const t = String(texte).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z' ]+/g, ' ');
    const suite = [];
    for (const mot of t.split(/\s+/).filter(Boolean)) {
      const debut = suite.length; let i = 0;
      while (i < mot.length) {
        let tr = null;
        for (const [g, v] of GROUPES) if (mot.startsWith(g, i)) { tr = [g, v]; break; }
        if (!tr) { i++; continue; }
        const [g, v] = tr, reste = mot.slice(i + g.length);
        if (v === 'E' && g === 'e' && mot.length > 1 && (reste === '' || reste === 's' || reste === 'nt')) { i += g.length; continue; }
        const avant = i > 0 ? mot[i - 1] : '';
        const ferme = !avant ? null : 'mbp'.includes(avant) ? 'MBP' : 'fv'.includes(avant) ? 'pet' : null;
        if (v === 'WA') { suite.push({ v: 'U', ferme, court: true }); suite.push({ v: 'A' }); } else suite.push({ v, ferme });
        i += g.length;
      }
      if (suite.length > debut) suite[suite.length - 1].fin = true;
    }
    return suite;
  }
  const teinte = (c, f) => 'rgb(' + Math.round(c[0] * f) + ',' + Math.round(c[1] * f) + ',' + Math.round(c[2] * f) + ')';

  // T = { src (image HD de la boîte), cv, ctx, b (mesures), s (px de toile par px source) }
  function dessineBouche(T, ouv, larg, biais) {
    if (!T || !T.src.complete || !T.src.naturalWidth) return false;
    const ctx = T.ctx, cv = T.cv, b = T.b, s = T.s;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (ouv <= 0.002 && Math.abs(larg) < 0.002) return false;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const HP = b.h, W = b.w, N = cv.width, sw = 1 / s;
    const cx = b.cx + biais * b.mw, demi = b.mw * 0.62, demiJ = b.mw * 1.05;
    const Gmin = b.mw * (b.gmin || 0.076);
    const haut = new Float32Array(N), basI = new Float32Array(N);
    let ymin = 1e9, ymax = -1e9, ouvert = false;
    for (let xd = 0; xd < N; xd++) {
      const xr = (xd + 0.5) / s;
      const i = Math.min(W - 1, Math.max(0, Math.round(xr)));
      const u = b.U[i], b0 = b.B[i];
      const cl = Math.cos(Math.min(1, Math.abs(xr - cx) / demi) * Math.PI / 2) ** 2;
      const cj = Math.cos(Math.min(1, Math.abs(xr - cx) / demiJ) * Math.PI / 2) ** 2;
      const g = ouv * Math.max(b0 - u, Gmin * Math.pow(cl, 1.25));
      const detente = 0.12 * ouv * b.ep * (1 - cl) * cj;
      const ut = u - 0.18 * g + detente, bc = ut + g;
      haut[xd] = ut * s; basI[xd] = bc * s;
      if (g > 0.25) { ouvert = true; if (ut * s < ymin) ymin = ut * s; if (bc * s > ymax) ymax = bc * s; }
      const ex = (xr - cx) / (1 + larg * cj);
      const xh = cx + ex * 0.30 + (xr - cx) * 0.70, xb = cx + ex;
      if (ut > 0.05) ctx.drawImage(T.src, xh, 0, sw, u, xd, 0, 1, ut * s);
      if (bc < HP - 0.05) ctx.drawImage(T.src, xb, b0, sw, HP - b0, xd, bc * s, 1, (HP - bc) * s);
    }
    if (!ouvert) return true;
    const ouverte = new Uint8Array(N);
    for (let x = 0; x < N; x++) ouverte[x] = (basI[x] - haut[x]) > 0.35 ? 1 : 0;
    function bande(dessus, dessous) {
      ctx.beginPath(); let x = 0;
      while (x < N) {
        while (x < N && !ouverte[x]) x++;
        const a = x; while (x < N && ouverte[x]) x++;
        if (x - a < 2) continue;
        for (let i = a; i < x; i++) ctx.lineTo(i + .5, dessus(i));
        for (let i = x - 1; i >= a; i--) ctx.lineTo(i + .5, dessous(i));
        ctx.closePath();
      }
      ctx.fill();
    }
    const cav = b.cav, dentsMini = 0.100 * b.mw * s;
    const ecart = x => Math.max(0, basI[x] - haut[x]);
    const L = b.langue || [0.70, 0.70, 0.78, 0.92, 0.30];
    const gr = ctx.createLinearGradient(0, ymin, 0, ymax);
    gr.addColorStop(0, teinte(cav, L[0])); gr.addColorStop(L[1], teinte(cav, L[2])); gr.addColorStop(1, teinte(cav, L[3] + L[4] * ouv));
    ctx.fillStyle = gr; bande(x => haut[x], x => basI[x]);
    let vraiesDents = false;
    if (b.T) {
      for (let xd = 0; xd < N; xd++) {
        const i = Math.min(W - 1, Math.max(0, Math.round((xd + 0.5) / s)));
        const th = b.T[i], u = b.U[i];
        if (th < 0.4) continue;
        const vis = Math.min(th, ecart(xd) / s);
        if (vis < 0.25) continue;
        vraiesDents = true;
        ctx.drawImage(T.src, (xd + 0.5) / s, u, sw, vis, xd, haut[xd], 1, vis * s);
      }
    }
    if (!vraiesDents) {
      const finD = x => haut[x] + Math.min(ecart(x) * 0.62, dentsMini);
      const gd = ctx.createLinearGradient(0, ymin, 0, ymin + dentsMini);
      gd.addColorStop(0, teinte(b.dents, 1.00)); gd.addColorStop(1, teinte(b.dents, 0.86));
      ctx.fillStyle = gd; bande(x => haut[x], finD);
      const so = ctx.createLinearGradient(0, ymin, 0, ymin + dentsMini * 1.25);
      so.addColorStop(0, 'rgba(' + cav[0] + ',' + cav[1] + ',' + cav[2] + ',0)'); so.addColorStop(1, 'rgba(' + cav[0] + ',' + cav[1] + ',' + cav[2] + ',.42)');
      ctx.fillStyle = so; bande(x => finD(x) - dentsMini * 0.30, finD);
    }
    const om = ctx.createLinearGradient(0, ymin, 0, ymin + (ymax - ymin) * 0.5);
    om.addColorStop(0, 'rgba(' + cav[0] + ',' + cav[1] + ',' + cav[2] + ',.30)'); om.addColorStop(1, 'rgba(' + cav[0] + ',' + cav[1] + ',' + cav[2] + ',0)');
    ctx.fillStyle = om; bande(x => haut[x], x => haut[x] + ecart(x) * 0.38);
    return true;
  }

  /* Moteur : état continu (ouv, larg, biais), piloté soit par l'énergie audio + file de syllabes,
     soit par un texte seul (rythme syllabique). onDraw(visible) est appelé après chaque dessin. */
  class Moteur {
    constructor({ hoche, clignote } = {}) {
      this.etat = { ouv: 0, larg: 0, biais: 0 }; this.cible = { ouv: 0, larg: 0, biais: 0 };
      this.file = []; this.ampL = 0; this.ampPrev = 0; this.lastSyl = 0; this.speaking = false;
      this.ampSource = () => 0; this.scripte = 0; this.scriptEnCours = false; this.T = null;
      this.hoche = hoche || (() => {}); this.clignote = clignote || (() => {});
    }
    setToile(T) { this.T = T; }
    setAmpSource(fn) { this.ampSource = fn || (() => 0); }
    nourrit(texte) { this.file.push(...syllabes(texte)); if (this.file.length > 400) this.file = this.file.slice(-400); }
    videFile() { this.file = []; }
    vise(nom, force) { const f = FORMES[nom] || FORMES.rep; this.cible.ouv = f[0] * (force == null ? 1 : force); this.cible.larg = f[1]; this.cible.biais = f[2]; }
    setSpeaking(on) { this.speaking = on; if (!on) { this.videFile(); this.vise('rep'); this.scripte++; this.scriptEnCours = false; } }
    async parleTexte(texte) {
      const attente = ms => new Promise(r => setTimeout(r, ms));
      const mien = ++this.scripte; this.scriptEnCours = true; this.speaking = true;
      const suite = syllabes(texte);
      for (const sy of suite) {
        if (mien !== this.scripte) return;
        let ms = (sy.court ? 100 : 172) * (0.84 + Math.random() * 0.32);
        if (sy.fin) ms *= 1.4;
        if (sy.ferme) { this.vise(sy.ferme); await attente(sy.ferme === 'MBP' ? 74 : 56); if (mien !== this.scripte) return; }
        this.vise(sy.v, 0.55 + Math.random() * 0.45);
        if (sy.fin && ms > 210 && Math.random() < .30) this.hoche(0.25);
        await attente(ms);
        if (sy.fin && Math.random() < .34) { this.vise(Math.random() < .6 ? 'MBP' : 'pet'); await attente(80 + Math.random() * 90); }
      }
      if (mien === this.scripte) { this.vise('rep'); this.scriptEnCours = false; if (Math.random() < .45) setTimeout(() => this.clignote(), 180); }
    }
    // à appeler à chaque image ; renvoie true si la toile montre quelque chose
    tick() {
      const now = performance.now();
      if (this.speaking && !this.scriptEnCours) {
        const a = Math.max(0, Math.min(1, this.ampSource()));
        this.ampL += (a - this.ampL) * (a > this.ampL ? 0.55 : 0.22);
        const monte = this.ampL > this.ampPrev + 0.06 && this.ampL > 0.18;
        if ((monte && now - this.lastSyl > 90) || (this.ampL > 0.22 && now - this.lastSyl > 175)) {
          this.lastSyl = now;
          const sy = this.file.shift();
          const v = sy ? sy.v : ['A', 'E', 'O', 'pet', 'U'][Math.floor(Math.random() * 5)];
          this.vise(v, 0.35 + 0.75 * Math.min(1, this.ampL * 1.4));
          if (sy && sy.fin && Math.random() < 0.18) this.hoche(0.25);
        } else if (this.ampL < 0.10 && now - this.lastSyl > 140) this.vise(Math.random() < 0.7 ? 'MBP' : 'rep');
        this.ampPrev = this.ampL;
      } else if (!this.speaking && (this.cible.ouv !== 0 || this.cible.larg !== 0)) this.vise('rep');
      let bouge = false;
      for (const p of ['ouv', 'larg', 'biais']) {
        const e = this.cible[p] - this.etat[p];
        if (Math.abs(e) > 0.0008) { this.etat[p] += e * 0.30; bouge = true; } else this.etat[p] = this.cible[p];
      }
      if (!this.T) return false;
      if (bouge || this.etat.ouv > 0.002 || Math.abs(this.etat.larg) > 0.002) return dessineBouche(this.T, this.etat.ouv, this.etat.larg, this.etat.biais);
      return false;
    }
  }
  window.LisaBouche = { syllabes, dessineBouche, Moteur, FORMES };
})();
