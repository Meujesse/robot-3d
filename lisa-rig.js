// Lisa « vivante » : postures, caméra, respiration, clignement, bouche synchronisée.
// Utilisé par lisa-chat.html et lisa-voice.html. Expose window.LisaRig.
// Le moteur de bouche vient du parcours Parcoursup'easy (redessin continu du bas du visage).
(function () {
  const AGENT_ID_DEFAULT = 'agent_2701m25dand9fq5rb32gndx037je';
  const BASE = 'lisa/';

  /* ---------- formes de bouche et découpage syllabique ---------- */
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

  /* ---------- le dessin de la bouche (bas du visage redessiné) ---------- */
  function dessineBouche(T, ouv, larg, biais) {
    if (!T || !T.src.complete || !T.src.naturalWidth) return;
    const ctx = T.ctx, cv = T.cv, b = T.b, s = T.s;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (ouv <= 0.002 && Math.abs(larg) < 0.002) { cv.style.visibility = 'hidden'; return; }
    cv.style.visibility = 'visible';
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const HP = b.h, W = b.w, N = cv.width, sw = 1 / s;
    const cx = b.cx + biais * b.mw, demi = b.mw * 0.62, demiJ = b.mw * 1.05;
    const Gmin = b.mw * 0.076;
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
    if (!ouvert) return;
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
  }

  /* ---------- plans de caméra ---------- */
  // Distance entre les yeux à l'écran (fraction de la hauteur de scène) et hauteur des yeux.
  const PLANS = { gros: { D: 0.30, y: 0.44 }, buste: { D: 0.165, y: 0.31 }, americain: { D: 0.105, y: 0.22 }, pied: null };
  const PLANS_PAR_TYPE = { pied: ['pied', 'americain', 'buste'], americain: ['americain', 'buste', 'gros'], buste: ['buste', 'gros'] };
  // Postures où il faut voir les mains : pas de plan trop serré.
  const LARGE = { salut: ['pied', 'americain'], designe: ['pied', 'americain'], pouce: ['pied', 'americain'], haussement: ['pied', 'americain'],
    decompte: ['americain'], invitation: ['americain'], enthousiasme: ['americain', 'buste'], question: ['americain', 'buste'],
    reflexion: ['buste'], reveuse: ['buste'], emerveillement: ['buste', 'gros'], curiosite: ['buste', 'gros'], deception: ['buste', 'gros'], neutre: ['buste', 'gros'] };
  const ECOUTE = ['neutre', 'curiosite', 'neutre'], REFLEXION = ['reflexion', 'reveuse'], PARLE = ['accueil', 'presentation', 'index', 'question', 'invitation', 'decompte', 'hanches'];

  function create({ stage, onPose }) {
    stage.classList.add('lisa-stage');
    stage.innerHTML = '<div class="lisa-cam"><div class="lisa-sway"><div class="lisa-nod"><div class="lisa-body">' +
      '<canvas class="lisa-corps"></canvas><img class="lisa-clos" alt=""><canvas class="lisa-bouche"></canvas></div></div></div></div>';
    const cam = stage.querySelector('.lisa-cam'), body = stage.querySelector('.lisa-body'), nod = stage.querySelector('.lisa-nod');
    const corps = stage.querySelector('.lisa-corps'), clos = stage.querySelector('.lisa-clos'), bouche = stage.querySelector('.lisa-bouche');
    const cctx = corps.getContext('2d'), bctx = bouche.getContext('2d');

    let CFG = null, pose = null, T = null, ready = false;
    const IMG = {}, HD = {}, CLOS = {};
    let state = 'idle', ampSource = () => 0;
    let plan = 'buste', pushK = 1, pushStart = 0, angle = 0;
    let respK = 0, t0 = performance.now();

    function charge(nom) {
      const c = CFG[nom];
      if (!IMG[nom]) {
        IMG[nom] = new Image(); IMG[nom].src = BASE + nom + '.webp';
        HD[nom] = new Image(); HD[nom].src = BASE + nom + '-bouche.png';
        if (c.clos) { CLOS[nom] = new Image(); CLOS[nom].src = BASE + nom + '-clos.png'; }
      }
      return Promise.all([IMG[nom], HD[nom], CLOS[nom]].filter(Boolean).map(im => im.complete && im.naturalWidth ? null : new Promise(r => { im.onload = r; im.onerror = r; })));
    }

    /* ---- respiration : champ de déplacement vertical, éteint au-dessus du menton ---- */
    function dessineCorps() {
      const c = CFG[pose], im = IMG[pose]; if (!im || !im.naturalWidth) return;
      const h = c.h, w = c.w, cy = c.taille || h, menton = c.menton;
      const y0 = Math.max(0, Math.floor(menton - h * 0.10));
      const t = (performance.now() - t0) / 1000;
      const ph = (t % 4.8) / 4.8;                        // 38 % inspiration, 62 % expiration
      const k = ph < 0.38 ? 0.5 - 0.5 * Math.cos(Math.PI * ph / 0.38) : 0.5 + 0.5 * Math.cos(Math.PI * (ph - 0.38) / 0.62);
      respK = k;
      if (!corps.dataset.tete || corps.dataset.tete !== pose) { corps.width = w; corps.height = h; cctx.drawImage(im, 0, 0); corps.dataset.tete = pose; }
      cctx.clearRect(0, y0, w, h - y0);
      const amp = 0.0058 * k, y1 = Math.min(h, cy);
      for (let y = y0; y < y1; y += 2) {
        let poids = Math.min(1, Math.max(0, (cy - y) / (h * 0.13)));
        poids *= Math.min(1, Math.max(0, (y - menton) / (h * 0.10) + 1));
        const dy = (cy - y) * amp * poids;
        cctx.drawImage(im, 0, y + dy, w, 2, 0, y, w, 2);
      }
      if (y1 < h) cctx.drawImage(im, 0, y1, w, h - y1, 0, y1, w, h - y1);
    }

    /* ---- clignement ---- */
    let blinkTimer = null;
    function clignote() {
      if (!clos.src || !CFG[pose].clos) return;
      clos.animate([
        { opacity: 0, offset: 0, easing: 'cubic-bezier(.45,0,.85,1)' }, { opacity: 1, offset: .19, easing: 'linear' },
        { opacity: 1, offset: .55, easing: 'cubic-bezier(.1,0,.35,1)' }, { opacity: 0, offset: 1 }], { duration: 195 + Math.random() * 45 });
    }
    function planifieClignement() {
      clearTimeout(blinkTimer);
      blinkTimer = setTimeout(() => { clignote(); if (Math.random() < 0.2) setTimeout(clignote, 320); planifieClignement(); }, 1900 + Math.random() * 4600);
    }
    function hoche(k = 0.32) {
      nod.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${(k * 1.2).toFixed(2)}%)`, offset: .3 },
        { transform: `translateY(${(-k * 0.25).toFixed(2)}%)`, offset: .7 }, { transform: 'translateY(0)' }], { duration: 900, easing: 'ease-out' });
    }

    /* ---- bouche : moteur ---- */
    const etat = { ouv: 0, larg: 0, biais: 0 }, cible = { ouv: 0, larg: 0, biais: 0 };
    let file = [];                       // syllabes à venir (du texte de l'agent)
    let ampL = 0, ampPrev = 0, gate = 0, lastSyl = 0;
    function vise(nom, force) { const f = FORMES[nom] || FORMES.rep; cible.ouv = f[0] * (force == null ? 1 : force); cible.larg = f[1]; cible.biais = f[2]; }
    function nourrit(texte) { file.push(...syllabes(texte)); if (file.length > 400) file = file.slice(-400); }
    function videFile() { file = []; }
    let scriptEnCours = false;
    let scripte = 0;                     // jeton de la parole scriptée (mode texte)
    const attente = ms => new Promise(r => setTimeout(r, ms));
    async function parleTexte(texte) {
      const mien = ++scripte;
      const suite = syllabes(texte);
      if (!suite.length) return;
      for (const sy of suite) {
        if (mien !== scripte) return;
        let ms = (sy.court ? 100 : 172) * (0.84 + Math.random() * 0.32);
        if (sy.fin) ms *= 1.4;
        if (sy.ferme) { vise(sy.ferme); await attente(sy.ferme === 'MBP' ? 74 : 56); if (mien !== scripte) return; }
        vise(sy.v, 0.55 + Math.random() * 0.45);
        if (sy.fin && ms > 210 && Math.random() < .30) hoche(0.25);
        await attente(ms);
        if (sy.fin && Math.random() < .34) { vise(Math.random() < .6 ? 'MBP' : 'pet'); await attente(80 + Math.random() * 90); }
      }
      if (mien === scripte) { vise('rep'); if (Math.random() < .45) setTimeout(clignote, 180); }
    }
    function tickBouche() {
      const now = performance.now();
      if (state === 'speaking' && scripte && scriptEnCours) { /* la bouche est pilotée par parleTexte */ }
      else if (state === 'speaking') {
        const a = Math.max(0, Math.min(1, ampSource()));
        ampL += (a - ampL) * (a > ampL ? 0.55 : 0.22);
        // nouvelle syllabe : quand l'énergie remonte franchement ou toutes les ~170 ms tant qu'on parle
        const monte = ampL > ampPrev + 0.06 && ampL > 0.18;
        if ((monte && now - lastSyl > 90) || (ampL > 0.22 && now - lastSyl > 175)) {
          lastSyl = now;
          const sy = file.shift();
          const v = sy ? sy.v : ['A', 'E', 'O', 'pet', 'U'][Math.floor(Math.random() * 5)];
          const force = 0.35 + 0.75 * Math.min(1, ampL * 1.4);
          vise(v, force);
          if (sy && sy.fin && Math.random() < 0.18) hoche(0.25);
        } else if (ampL < 0.10 && now - lastSyl > 140) vise(Math.random() < 0.7 ? 'MBP' : 'rep');
        ampPrev = ampL;
      } else if (cible.ouv !== 0 || cible.larg !== 0) vise('rep');
      let bouge = false;
      for (const p of ['ouv', 'larg', 'biais']) {
        const e = cible[p] - etat[p];
        if (Math.abs(e) > 0.0008) { etat[p] += e * 0.30; bouge = true; } else etat[p] = cible[p];
      }
      if (T && (bouge || etat.ouv > 0.002 || Math.abs(etat.larg) > 0.002)) dessineBouche(T, etat.ouv, etat.larg, etat.biais);
    }

    /* ---- caméra ---- */
    function taille() { return { W: stage.clientWidth, H: stage.clientHeight }; }
    function cadre(nomPlan, c, off) {
      const { W, H } = taille(); const [ex, ey, D] = c.oeil;
      let k, tx, ty;
      if (nomPlan === 'pied') { k = 0.96 * H / c.h; tx = W / 2 - (c.w / 2) * k + off * W; ty = 0.02 * H; }
      else { const P = PLANS[nomPlan]; k = P.D * H / D; tx = W / 2 - ex * k + off * W; ty = P.y * H - ey * k; }
      return { k, tx, ty };
    }
    function appliqueCam(anim) {
      const c = CFG[pose]; if (!c) return;
      const f = cadre(plan, c, angle);
      const k = f.k * pushK;
      const { W, H } = taille(); const [ex, ey] = c.oeil;
      // le push-in garde les yeux au même endroit
      const tx = f.tx - ex * (k - f.k), ty = f.ty - ey * (k - f.k);
      cam.style.transition = anim ? 'transform 1.1s cubic-bezier(.25,.8,.25,1)' : 'none';
      cam.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})`;
    }
    function choisitPlan(nom, force) {
      const c = CFG[nom]; const dispo = LARGE[nom] || PLANS_PAR_TYPE[c.plan];
      if (force && dispo.includes(force)) return force;
      const r = Math.random();
      return dispo[r < 0.62 ? 0 : Math.min(dispo.length - 1, 1 + Math.floor(Math.random() * (dispo.length - 1)))];
    }

    /* ---- changement de posture ---- */
    let poseTimer = null;
    async function setPose(nom, opts = {}) {
      if (!CFG || !CFG[nom]) return false;
      if (nom === pose && !opts.force) { return true; }
      await charge(nom);
      const c = CFG[nom];
      const cut = () => {
        pose = nom;
        body.style.width = c.w + 'px'; body.style.height = c.h + 'px';
        corps.dataset.tete = ''; dessineCorps();
        if (c.clos && CLOS[nom]) { clos.src = CLOS[nom].src; clos.style.left = c.clos[0] + 'px'; clos.style.top = c.clos[1] + 'px'; clos.style.width = c.clos[2] + 'px'; clos.style.height = c.clos[3] + 'px'; clos.style.display = ''; }
        else clos.style.display = 'none';
        const b = c.b, s = c.kb * (window.devicePixelRatio > 1.5 ? 1.35 : 1);
        bouche.width = Math.round(b.w * s); bouche.height = Math.round(b.h * s);
        bouche.style.left = b.x + 'px'; bouche.style.top = b.y + 'px'; bouche.style.width = b.w + 'px'; bouche.style.height = b.h + 'px';
        T = { src: HD[nom], cv: bouche, ctx: bctx, b, s };
        bouche.style.visibility = 'hidden';
        plan = choisitPlan(nom, opts.plan); angle = (Math.random() - 0.5) * 0.10; pushK = 1; pushStart = performance.now();
        appliqueCam(false);
        if (onPose) onPose(nom, plan);
      };
      // coupe franche, comme un changement de plan dans une vidéo : fondu très court pour éviter le flash
      stage.classList.add('cut');
      await new Promise(r => setTimeout(r, 90));
      cut();
      setTimeout(() => stage.classList.remove('cut'), 40);
      return true;
    }

    /* ---- boucle ---- */
    function tick() {
      if (pose && IMG[pose] && IMG[pose].naturalWidth) {
        dessineCorps();
        tickBouche();
        // lent rapprochement pendant qu'elle parle, retour doux sinon
        const want = state === 'speaking' ? 1.06 : 1.0;
        const nk = pushK + (want - pushK) * 0.004;
        if (Math.abs(nk - pushK) > 0.00005) { pushK = nk; appliqueCam(false); }
      }
      requestAnimationFrame(tick);
    }

    const api = {
      async init() {
        CFG = await (await fetch(BASE + 'poses.json?v=1')).json();
        await setPose('neutre', { plan: 'buste' });
        ready = true; planifieClignement(); tick();
        window.addEventListener('resize', () => appliqueCam(false));
        return api;
      },
      poses() { return CFG ? Object.keys(CFG) : []; },
      setPose, getPose() { return pose; },
      setPlan(p) { plan = p; appliqueCam(true); },
      setAmpSource(fn) { ampSource = fn || (() => 0); },
      nourrit, videFile, hoche, clignote,
      // Mode texte : elle « dit » la réplique sans audio, la bouche suit les syllabes.
      async speakText(texte) {
        scriptEnCours = true; api.setState('speaking');
        await parleTexte(texte);
        scriptEnCours = false; if (state === 'speaking') api.setState('idle');
      },
      stopText() { scripte++; scriptEnCours = false; },
      setState(next) {
        if (next === state) return;
        const avant = state; state = next;
        stage.dataset.state = next;
        if (next === 'speaking') { hoche(0.35); if (ECOUTE.includes(pose) || REFLEXION.includes(pose)) setPose(PARLE[Math.floor(Math.random() * PARLE.length)]); }
        if (next === 'listening' && avant !== 'idle') { setTimeout(() => { if (state === 'listening') setPose(ECOUTE[Math.floor(Math.random() * ECOUTE.length)]); }, 900); }
        if (next === 'thinking') setPose(REFLEXION[Math.floor(Math.random() * REFLEXION.length)]);
        if (next !== 'speaking') { videFile(); vise('rep'); scripte++; scriptEnCours = false; }
      },
      getState() { return state; },
      agentId() { return new URLSearchParams(location.search).get('agent') || AGENT_ID_DEFAULT; },
      clientTools() {
        return { lisa_attitude: async ({ attitude }) => { const ok = await setPose(String(attitude || '').toLowerCase()); return ok ? 'posture : ' + attitude : 'posture inconnue : ' + attitude; } };
      },
      // pour les tests
      _bouche(ouv, larg, biais) { if (T) dessineBouche(T, ouv, larg || 0, biais || 0); },
    };
    return api;
  }

  const CSS = `
  .lisa-stage { position: relative; overflow: hidden; }
  .lisa-cam { position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform; }
  .lisa-sway { animation: lisa-balance 13s ease-in-out infinite alternate; transform-origin: 50% 100%; }
  .lisa-body { position: relative; transition: opacity .16s; }
  .lisa-stage.cut .lisa-body { opacity: 0; transition: opacity .08s; }
  .lisa-corps { position: absolute; left: 0; top: 0; display: block; }
  .lisa-clos { position: absolute; opacity: 0; pointer-events: none; }
  .lisa-bouche { position: absolute; visibility: hidden; pointer-events: none; }
  @keyframes lisa-balance { from { transform: rotate(-.26deg); } to { transform: rotate(.28deg); } }`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  window.LisaRig = { create, syllabes };
})();
