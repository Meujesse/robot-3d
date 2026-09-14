// villa.js — moteur 3D « visite de villa » (Meujesse Learning, démo Filioform)
// Modes : maquette (villa ouverte vue de dessus en 3D), plan (ortho de dessus), holo (plan transparent futuriste),
// piece (on entre dans une pièce Tripo), photo (viseur : hauteur, focale, verticales, cadrage, déclencheur).
// Alice (agente immobilière) peut être posée dans la pièce ; son texte et sa voix sont gérés par l'interface.
// Unités : mètres. Les modèles Tripo sont normalisés (~1 unité) et mis à l'échelle réelle par `taille`.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Petit studio d'éclairage pour l'environnement (reflets et lumière indirecte), sans dépendre de RoomEnvironment
export function studio() {
  const s = new THREE.Scene(); const g = new THREE.BoxGeometry();
  const boite = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x8a9099, side: THREE.BackSide, roughness: 1 })); boite.scale.setScalar(20); s.add(boite);
  const lampe = (x, y, z, sx, sy, sz, c, i) => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c })); m.material.color.multiplyScalar(i); m.position.set(x, y, z); m.scale.set(sx, sy, sz); s.add(m); };
  lampe(0, 9.5, 0, 8, 0.2, 8, 0xffffff, 6); lampe(-9.5, 4, 0, 0.2, 5, 6, 0xfff1dc, 3); lampe(9.5, 4, 0, 0.2, 5, 6, 0xdde9f7, 2.5); lampe(0, 4, -9.5, 6, 5, 0.2, 0xffffff, 2);
  return s;
}
const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
const C = { rouge: 0xe4003a, violet: 0x522583, bleu: 0x4c76ba, ciel: 0xb0d8f4, jaune: 0xf5a04c, noir: 0x230000 };

export class Villa {
  constructor({ conteneur, donnees, ui = {} }) {
    this.el = conteneur; this.D = donnees; this.ui = ui;
    this.etat = { mode: 'maquette', piece: null, alice: false, photo: false, focale: 20, hauteur: 1.3, tourne: true };
    this.tweens = []; this.pieces = {}; this.charges = {};
    this._init();
  }

  _init() {
    const el = this.el;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.localClippingEnabled = true;
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 500);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    this.cam = this.camera;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08; this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.addEventListener('start', () => { this._drag = true; });
    this.controls.addEventListener('end', () => { setTimeout(() => { this._drag = false; }, 60); });
    // lumière douce, ambiance méditerranéenne
    // éclairage : environnement neutre (reflets, lumière indirecte), soleil chaud avec ombres douces, ciel bleuté
    const pm = new THREE.PMREMGenerator(this.renderer); this.scene.environment = pm.fromScene(studio(), 0.04).texture; this.scene.environmentIntensity = 0.55; pm.dispose();
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xcfd8e3, 0.55); this.scene.add(this.hemi);
    this.soleil = new THREE.DirectionalLight(0xfff1dc, 2.2); this.soleil.position.set(18, 40, 26); this.scene.add(this.soleil);
    this.soleil.castShadow = true; this.soleil.shadow.mapSize.set(2048, 2048); this.soleil.shadow.bias = -0.0004; this.soleil.shadow.normalBias = 0.02; this.soleil.shadow.radius = 4;
    const sc = this.soleil.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 120;
    this.contre = new THREE.DirectionalLight(0xb0d8f4, 0.5); this.contre.position.set(-40, 20, -30); this.scene.add(this.contre);
    this.gVilla = new THREE.Group(); this.gPiece = new THREE.Group(); this.gAlice = new THREE.Group();
    this.scene.add(this.gVilla, this.gPiece, this.gAlice);
    this.loader = new GLTFLoader(); const dr = new DRACOLoader(); dr.setDecoderPath(DRACO); this.loader.setDRACOLoader(dr);
    this.ray = new THREE.Raycaster(); this.pointeur = new THREE.Vector2(-9, -9);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', e => { const r = dom.getBoundingClientRect(); this.pointeur.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); if (this._look && this._lookDown) { this._yaw -= (e.clientX - this._lookDown[0]) * 0.004; this._pitch = Math.max(-0.9, Math.min(0.9, this._pitch + (e.clientY - this._lookDown[1]) * 0.003)); this._lookDown = [e.clientX, e.clientY]; } });
    dom.addEventListener('pointerdown', e => { this._pdown = [e.clientX, e.clientY]; if (this._look) this._lookDown = [e.clientX, e.clientY]; });
    dom.addEventListener('pointerup', e => { this._lookDown = null; if (!this._pdown) return; const d = Math.hypot(e.clientX - this._pdown[0], e.clientY - this._pdown[1]); this._pdown = null; if (d < 5) { const r = dom.getBoundingClientRect(); this.pointeur.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this._clic(); } });
    dom.addEventListener('pointerleave', () => { this._lookDown = null; this.pointeur.set(-9, -9); });
    dom.addEventListener('wheel', e => { if (this._look) { e.preventDefault(); this.focale(this.etat.focale * (e.deltaY > 0 ? 0.95 : 1.05)); } }, { passive: false });
    this.ro = new ResizeObserver(() => this._taille()); this.ro.observe(el); this._taille();
    this._anim = this._anim.bind(this); this._vivant = true; requestAnimationFrame(this._anim);
    this._chargerVilla();
  }

  _taille() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const a = w / h, s = this.D.villa.taille * 0.62; this.ortho.left = -s * a; this.ortho.right = s * a; this.ortho.top = s; this.ortho.bottom = -s; this.ortho.updateProjectionMatrix();
  }

  async _charger(url) {
    if (!this.charges[url]) this.charges[url] = this.loader.loadAsync(url).then(g => { g.scene.traverse(o => { if (o.isMesh) { o.material.side = THREE.DoubleSide; o.castShadow = true; o.receiveShadow = true; if (o.material.roughness !== undefined) o.material.roughness = Math.max(0.55, o.material.roughness); } }); return g; });
    return this.charges[url];
  }

  // Normalise un modèle Tripo : centré en x/z, posé sur y=0, largeur max = taille (m)
  _poser(scene, taille) {
    const b = new THREE.Box3().setFromObject(scene); const dim = b.getSize(new THREE.Vector3()); const c = b.getCenter(new THREE.Vector3());
    const s = taille / Math.max(dim.x, dim.z);
    const g = new THREE.Group(); g.add(scene); scene.position.set(-c.x, -b.min.y, -c.z); g.scale.setScalar(s);
    g.userData.dim = dim.multiplyScalar(s);
    return g;
  }

  async _chargerVilla() {
    const V = this.D.villa;
    const g = await this._charger(V.url);
    this.villa = this._poser(g.scene, V.taille); this.villa.rotation.y = V.rotation || 0; this.gVilla.add(this.villa);
    this._matVilla = []; this.villa.traverse(o => { if (o.isMesh) this._matVilla.push([o, o.material]); });
    // socle : un disque clair sous la maquette
    const sol = new THREE.Mesh(new THREE.CircleGeometry(V.taille * 0.9, 64), new THREE.MeshStandardMaterial({ color: 0xeaf1f8, roughness: 1 }));
    sol.rotation.x = -Math.PI / 2; sol.position.y = -0.02; sol.name = 'sol'; sol.receiveShadow = true; this.gVilla.add(sol); this.sol = sol;
    this.mode('maquette', false);
    this.ui.pret && this.ui.pret();
    // Alice en arrière-plan
    if (this.D.alice && this.D.alice.url) this._charger(this.D.alice.url).then(ga => {
      this.alice = this._poser(ga.scene, 0.5); const b = new THREE.Box3().setFromObject(this.alice); const h = b.max.y - b.min.y; this.alice.scale.multiplyScalar((this.D.alice.taille || 1.68) / h); this.alice.visible = false; this.gAlice.add(this.alice);
      // animations Tripo (inactif, approuver, regarder_autour, debout_relax, marcher, …)
      this.clips = {}; (ga.animations || []).forEach(c => { this.clips[c.name.replace(/^.*[:/]/, '')] = c; });
      if (Object.keys(this.clips).length) { this.mixer = new THREE.AnimationMixer(ga.scene); this.horloge = new THREE.Clock(); this._jouer('inactif', true); }
    });
  }

  // ---------- modes ----------
  mode(m, anime = true) {
    const V = this.D.villa;
    if (m === 'piece' || m === 'photo') return;
    if (this.etat.piece) this.sortir(false);
    this.etat.mode = m; this.etat.photo = false; this._look = false;
    this.gVilla.visible = true; this.gPiece.visible = false; if (this.alice) this.alice.visible = false;
    this._holo(m === 'holo');
    const T = V.taille;
    if (m === 'plan' || m === 'holo') {
      this.cam = this.ortho; this.ortho.position.set(0, T * 2, 0.0001); this.ortho.lookAt(0, 0, 0); this.controls.enabled = false;
    } else {
      this.cam = this.camera; this.controls.enabled = true; this.controls.object = this.camera; this.controls.target.set(0, T * 0.05, 0);
      this.controls.minDistance = T * 0.5; this.controls.maxDistance = T * 3; this.controls.maxPolarAngle = Math.PI * 0.49; this.controls.minPolarAngle = 0;
      const p = new THREE.Vector3(T * 0.55, T * 0.75, T * 0.85);
      if (anime) this._tween(this.camera.position, p, 900); else this.camera.position.copy(p);
    }
    this.ui.mode && this.ui.mode(m);
  }

  _holo(on) {
    if (!this.villa) return;
    if (on && !this._matHolo) this._matHolo = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, wireframe: true, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const [o, m] of this._matVilla) o.material = on ? this._matHolo : m;
    this.sol.visible = !on;
    if (on && !this.grille) { this.grille = new THREE.GridHelper(this.D.villa.taille * 2, 40, 0x4c76ba, 0x2a3f6b); this.grille.position.y = -0.01; this.gVilla.add(this.grille); }
    if (this.grille) this.grille.visible = on;
    this.hemi.intensity = on ? 0.3 : 0.55;
    this.ui.holo && this.ui.holo(on);
  }

  // ---------- pièces ----------
  async entrer(cle) {
    const P = this.D.pieces.find(p => p.cle === cle); if (!P) return;
    this.ui.chargement && this.ui.chargement(true);
    const g = await this._charger(P.url);
    if (!this.pieces[cle]) {
      const grp = this._poser(g.scene, P.taille); grp.visible = false; this.gPiece.add(grp); this.pieces[cle] = grp;
      if (P.plafond) { const plan = new THREE.Plane(new THREE.Vector3(0, -1, 0), P.plafond * grp.userData.dim.y); grp.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [plan]; } }); }
    }
    for (const k in this.pieces) this.pieces[k].visible = k === cle;
    this.etat.piece = cle; this.etat.mode = 'piece';
    this.gVilla.visible = false; this.gPiece.visible = true; this._holo(false);
    this.cam = this.camera; this.controls.enabled = true; this._look = false;
    const T = P.taille, [cx, cz] = P.coin; // coin ouvert (signes x, z)
    this.controls.target.set(0, T * 0.22, 0); this.controls.minDistance = T * 0.4; this.controls.maxDistance = T * 2.2;
    this.camera.position.set(cx * T * 0.95, T * 0.75, cz * T * 0.95);
    this._placerAlice(P);
    this.ui.chargement && this.ui.chargement(false);
    this.ui.piece && this.ui.piece(P);
  }
  sortir(anime = true) { this.etat.piece = null; this.etat.photo = false; this._look = false; this.gPiece.visible = false; if (this.alice) this.alice.visible = false; this.mode('maquette', anime); }

  _placerAlice(P) {
    if (!this.alice) return;
    const [cx, cz] = P.coin; const T = P.taille;
    const a = P.alice || [cx * 0.28, 0, cz * 0.32];
    this.alice.position.set(a[0] * T, 0, a[2] * T); this.alice.visible = this.etat.alice;
  }
  guide(on) { this.etat.alice = on; if (this.alice && this.etat.piece) { this.alice.visible = on; if (on) this._jouer('debout_relax', true); } }
  // Joue un clip par nom (les noms Tripo sont normalisés) ; sans clip connu, on retombe sur le premier
  _jouer(nom, boucle) {
    if (!this.mixer) return; const alias = { inactif: 'idle', debout_relax: 'standing_relax', approuver: 'agree', marcher: 'walk', regarder_autour: 'standing_relax' };
    const c = this.clips[nom] || this.clips[alias[nom]] || this.clips[Object.keys(this.clips)[0]]; if (!c) return;
    const a = this.mixer.clipAction(c); if (this._action === a) return;
    a.reset(); a.setLoop(boucle ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); a.clampWhenFinished = !boucle;
    if (this._action) this._action.crossFadeTo(a, 0.35, false); a.play(); this._action = a;
    if (!boucle) { const fin = () => { this.mixer.removeEventListener('finished', fin); this._jouer(this.etat.parle ? 'approuver' : 'debout_relax', true); }; this.mixer.addEventListener('finished', fin); }
  }
  // Alice parle : gestes vivants (approuver / regarder autour) tant que l'audio joue, puis retour au repos
  parler(on) { this.etat.parle = on; this._jouer(on ? 'approuver' : 'debout_relax', true); if (on) { clearInterval(this._tic); this._tic = setInterval(() => { if (!this.etat.parle) return clearInterval(this._tic); this._jouer(Math.random() < 0.5 ? 'regarder_autour' : 'approuver', true); }, 4000); } }
  saluer() { this._jouer('marcher', false); }

  // ---------- mode photo (viseur) ----------
  photo(on) {
    const P = this.D.pieces.find(p => p.cle === this.etat.piece); if (!P) return;
    this.etat.photo = on; this._look = on; this.controls.enabled = !on;
    if (this.alice) this.alice.visible = on ? false : this.etat.alice; // Alice sort du cadre pendant la prise de vue
    if (on) {
      const [cx, cz] = P.coin; const T = P.taille;
      // le photographe se place dans l'angle ouvert, à l'intérieur de la pièce
      this._pos = new THREE.Vector3(cx * T * 0.38, this.etat.hauteur, cz * T * 0.42);
      this._yaw = Math.atan2(-cx, -cz); this._pitch = 0; this.focale(this.etat.focale);
      this.renderer.domElement.style.cursor = 'crosshair';
    } else { this.renderer.domElement.style.cursor = 'grab'; this.camera.fov = 40; this.camera.updateProjectionMatrix(); this.camera.position.set(P.coin[0] * P.taille * 0.95, P.taille * 0.75, P.coin[1] * P.taille * 0.95); }
    this.ui.photo && this.ui.photo(on);
  }
  focale(f) { this.etat.focale = Math.max(12, Math.min(50, f)); this.camera.fov = 2 * Math.atan(12 / this.etat.focale) * 180 / Math.PI; this.camera.updateProjectionMatrix(); this.ui.reglage && this.ui.reglage(this.etat); }
  hauteur(h) { this.etat.hauteur = Math.max(0.4, Math.min(2.2, h)); if (this._pos) this._pos.y = this.etat.hauteur; this.ui.reglage && this.ui.reglage(this.etat); }
  niveler() { this._pitch = 0; }

  // Déclencheur : rend l'image, note la prise de vue, renvoie l'image et les retours
  declencher() {
    const P = this.D.pieces.find(p => p.cle === this.etat.piece); if (!P || !this.etat.photo) return null;
    const v = this.ui.masquer && this.ui.masquer(); // l'interface peut cacher Alice/étiquettes avant la capture
    this.renderer.render(this.scene, this.cam);
    const image = this.renderer.domElement.toDataURL('image/jpeg', 0.9);
    const retours = []; let score = 0;
    const h = this.etat.hauteur, f = this.etat.focale, pitch = Math.abs(this._pitch) * 180 / Math.PI;
    // hauteur : l'immobilier se photographie entre 1,10 et 1,50 m (hauteur de poitrine), jamais à hauteur d'œil debout
    if (h >= 1.1 && h <= 1.5) { score += 30; retours.push({ ok: true, t: 'Hauteur juste : l’appareil est à hauteur de poitrine, la pièce est lisible.' }); }
    else if (h > 1.5) { score += 12; retours.push({ ok: false, t: 'Trop haut : à hauteur d’œil debout, le sol écrase la pièce. Descends entre 1,10 et 1,50 m.' }); }
    else { score += 10; retours.push({ ok: false, t: 'Trop bas : les meubles cachent la profondeur. Remonte vers 1,20 m.' }); }
    // verticales : un pitch nul garde les murs droits
    if (pitch < 2.5) { score += 30; retours.push({ ok: true, t: 'Verticales droites : appareil parfaitement de niveau.' }); }
    else if (pitch < 8) { score += 15; retours.push({ ok: false, t: 'Léger basculement : les murs penchent. Remets l’appareil de niveau.' }); }
    else { score += 0; retours.push({ ok: false, t: 'Appareil incliné : les verticales fuient, ça se redresse mal en retouche.' }); }
    // focale : grand-angle maîtrisé, 16 à 24 mm
    if (f >= 16 && f <= 24) { score += 25; retours.push({ ok: true, t: `Focale ${Math.round(f)} mm : grand-angle sans déformation excessive.` }); }
    else if (f < 16) { score += 8; retours.push({ ok: false, t: `${Math.round(f)} mm, c’est trop large : les proportions mentent, la pièce paraît fausse.` }); }
    else { score += 10; retours.push({ ok: false, t: `${Math.round(f)} mm, c’est trop serré : on ne comprend plus le volume de la pièce.` }); }
    // cadrage : le sujet principal doit être dans le cadre, plutôt centré
    const suj = this.pieces[P.cle].localToWorld(new THREE.Vector3(P.sujet[0], P.sujet[1], P.sujet[2])).project(this.camera);
    const dedans = Math.abs(suj.x) < 1 && Math.abs(suj.y) < 1 && suj.z < 1;
    if (dedans && Math.abs(suj.x) < 0.55) { score += 15; retours.push({ ok: true, t: `${P.sujetNom} bien placé dans le cadre.` }); }
    else if (dedans) { score += 8; retours.push({ ok: false, t: `${P.sujetNom} est au bord du cadre : recentre-le un peu.` }); }
    else { retours.push({ ok: false, t: `${P.sujetNom} n’est pas dans le cadre : c’est lui qui vend la pièce.` }); }
    v && this.ui.remontrer && this.ui.remontrer(v);
    return { image, score, retours, piece: P.cle, reglages: { hauteur: h, focale: Math.round(f), inclinaison: Math.round(pitch) } };
  }

  // ---------- interaction ----------
  _clic() {
    if (this._look) return;
    const P = this.D.pieces.find(p => p.cle === this.etat.piece);
    // en maquette : clic sur une pièce → on y entre ; le choix se fait par la pièce dont le centre est le plus proche du point cliqué
    if (!this.etat.piece && this.villa) {
      this.ray.setFromCamera(this.pointeur, this.cam);
      const hit = this.ray.intersectObject(this.villa, true)[0]; if (!hit) return;
      const local = this.villa.worldToLocal(hit.point.clone());
      let best = null, bd = 1e9;
      for (const p of this.D.pieces) { const d = Math.hypot(local.x - p.position[0], local.z - p.position[2]); if (d < bd) { bd = d; best = p; } }
      if (best && bd < 0.2) this.ui.clicPiece && this.ui.clicPiece(best);
    } else if (P) {
      this.ray.setFromCamera(this.pointeur, this.cam);
      const grp = this.pieces[P.cle]; const hit = this.ray.intersectObject(grp, true)[0]; if (!hit) return;
      const local = grp.worldToLocal(hit.point.clone()); // unités normalisées du modèle (~1 = largeur de la pièce)
      let best = null, bd = 1e9;
      for (const pt of P.points) { const d = Math.hypot(local.x - pt.pos[0], local.y - pt.pos[1], local.z - pt.pos[2]); if (d < bd) { bd = d; best = pt; } }
      this.ui.clicPoint && this.ui.clicPoint(best && bd < 0.16 ? best : null, local.toArray().map(v => +v.toFixed(3)));
    }
  }

  // Ancres à l'écran : pièces (maquette/plan/holo) ou points d'intérêt (pièce)
  ancres() {
    const w = this.el.clientWidth, h = this.el.clientHeight; const out = [];
    const proj = (v) => { const p = v.clone().project(this.cam); return { x: (p.x + 1) / 2 * w, y: (1 - p.y) / 2 * h, devant: p.z < 1 }; };
    if (this.etat.piece) {
      const P = this.D.pieces.find(p => p.cle === this.etat.piece); const grp = this.pieces[P.cle]; if (!grp) return out;
      for (const pt of P.points) { const v = grp.localToWorld(new THREE.Vector3(pt.pos[0], pt.pos[1], pt.pos[2])); out.push({ cle: pt.cle, ...proj(v) }); }
      if (this.alice && this.alice.visible) { const v = this.alice.localToWorld(new THREE.Vector3(0, (this.D.alice.taille || 1.68) / this.alice.scale.y * 1.05, 0)); out.push({ cle: 'alice', ...proj(v) }); }
    } else if (this.villa) {
      for (const p of this.D.pieces) { const v = this.villa.localToWorld(new THREE.Vector3(p.position[0], p.position[1] + 0.02, p.position[2])); out.push({ cle: p.cle, ...proj(v) }); }
    }
    return out;
  }

  // ---------- boucle ----------
  _tween(obj, vers, duree) { const de = {}; for (const k in vers) de[k] = obj[k]; this.tweens = this.tweens.filter(t => t.obj !== obj); this.tweens.push({ obj, de, vers, t0: performance.now(), duree }); }
  _anim() {
    if (!this._vivant) return; requestAnimationFrame(this._anim);
    const now = performance.now();
    for (const t of this.tweens) { const f = Math.min(1, (now - t.t0) / t.duree); const e = 1 - Math.pow(1 - f, 3); for (const k in t.vers) t.obj[k] = t.de[k] + (t.vers[k] - t.de[k]) * e; t.fini = f >= 1; }
    this.tweens = this.tweens.filter(t => !t.fini);
    if (this._look && this._pos) {
      this.camera.position.copy(this._pos);
      const d = new THREE.Vector3(Math.sin(this._yaw) * Math.cos(this._pitch), -Math.sin(this._pitch), Math.cos(this._yaw) * Math.cos(this._pitch));
      this.camera.lookAt(this._pos.clone().add(d));
    } else this.controls.update();
    if (this.etat.mode === 'maquette' && !this.etat.piece && this.etat.tourne && !this._drag && this.villa) this.villa.rotation.y += 0.0012;
    if (this.mixer && this.alice && this.alice.visible) this.mixer.update(this.horloge.getDelta()); else if (this.horloge) this.horloge.getDelta();
    if (this.alice && this.alice.visible) { const p = this.camera.position; this.alice.lookAt(p.x, this.alice.position.y, p.z); }
    if (this.etat.mode === 'holo' && this.villa) this.villa.rotation.y += 0.002;
    this.renderer.render(this.scene, this.cam);
    this.ui.image && this.ui.image();
  }
  destroy() { this._vivant = false; this.ro.disconnect(); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
