// bouche.js — moteur 3D « la bouche en 3D » (Meujesse Learning)
// Deux arcades reconstruites à partir de dents générées dans Tripo (une par type),
// numérotation FDI, survol, isolement d'une dent, couches (émail / dentine / pulpe),
// coupe, mode radio, étiquettes 3D. Aucune dépendance au DOM en dehors du conteneur.
//
// Utilisation : new Bouche({ conteneur, base: 'assets/', donnees, ui })
//   ui = { survol(dent|null), selection(dent|null), pret() }  — rappels vers l'interface.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

// Largeurs mésio-distales moyennes (mm) et hauteurs totales (mm), d'après les tables d'anatomie dentaire usuelles.
// [largeur mésio-distale, hauteur totale, épaisseur vestibulo-linguale]
const DIM = {
  sup: { 1: [8.5, 23.5, 7], 2: [6.5, 22, 6], 3: [7.5, 27, 8], 4: [7, 21.5, 9], 5: [6.5, 21.5, 9], 6: [10, 20.5, 11], 7: [9, 20, 11], 8: [8.5, 18, 10.5] },
  inf: { 1: [5, 21, 6], 2: [5.5, 22, 6.5], 3: [7, 26, 7.5], 4: [7, 22, 7.5], 5: [7, 22, 8], 6: [11, 21.5, 10.5], 7: [10.5, 20, 10], 8: [10, 18, 9.5] },
};
// Modèle Tripo à utiliser par arcade et position ; scaleX resserre une dent réutilisée.
const MODELE = {
  sup: { 1: ['incisive-sup', 1], 2: ['incisive-sup', 0.8], 3: ['canine', 1], 4: ['premolaire', 1], 5: ['premolaire', 0.96], 6: ['molaire-sup', 1], 7: ['molaire-sup', 0.94], 8: ['molaire-sup', 0.88] },
  inf: { 1: ['incisive-inf', 1], 2: ['incisive-inf', 1.08], 3: ['canine', 0.92], 4: ['premolaire', 0.95], 5: ['premolaire', 0.98], 6: ['molaire-inf', 1], 7: ['molaire-inf', 0.95], 8: ['molaire-inf', 0.9] },
};
const REPLI = { 'incisive-sup': 'canine', 'incisive-inf': 'incisive-sup', canine: 'premolaire', premolaire: 'molaire-sup', 'molaire-sup': 'molaire-inf', 'molaire-inf': 'molaire-sup' };

// Charte
const C = { rouge: 0xe4003a, violet: 0x522583, noir: 0x230000, rose: 0xe60064, prune: 0x951b81, bleu: 0x4c76ba, ciel: 0xb0d8f4, jaune: 0xf5a04c, blanc: 0xffffff };
const COUL = { email: 0xf4f1ea, cement: 0xdccaa4, dentine: 0xe8c98a, pulpe: 0xd94a6a, gencive: 0xe98a9d };

export class Bouche {
  constructor({ conteneur, base = '', urls = null, donnees, ui = {} }) {
    this.el = conteneur; this.base = base; this.urls = urls; this.donnees = donnees; this.ui = ui;
    this.liste = [];               // toutes les dents, dans l'ordre de pose
    this.dents = new Map();        // fdi -> { fdi, arcade, pos, cote, groupe, couches:{email,dentine,pulpe}, dim, centre, axe }
    this.etat = { survol: null, selection: null, couche: 'email', coupe: false, radio: false, ouvert: false, etiquettes: false };
    this.horloge = new THREE.Clock();
    this.tweens = [];
    this._init();
  }

  _init() {
    const el = this.el;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.localClippingEnabled = true;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 2000);
    this.camera.position.set(0, 30, 190);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, -20);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 25; this.controls.maxDistance = 400;
    this.controls.maxPolarAngle = Math.PI * 0.95;
    this.controls.addEventListener('start', () => { this._drag = true; });
    this.controls.addEventListener('end', () => { setTimeout(() => { this._drag = false; }, 50); });

    // Lumière : hémisphère douce + une clé + un contre, sans ombre dure
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb0d8f4, 1.1));
    const cle = new THREE.DirectionalLight(0xffffff, 1.6); cle.position.set(60, 120, 140); this.scene.add(cle);
    const contre = new THREE.DirectionalLight(0xb0d8f4, 0.6); contre.position.set(-90, -20, -60); this.scene.add(contre);
    const bas = new THREE.DirectionalLight(0xfff1e0, 0.5); bas.position.set(0, -100, 60); this.scene.add(bas);
    this.lumieres = [cle, contre, bas];

    this.monde = new THREE.Group(); this.scene.add(this.monde);
    this.maxillaire = new THREE.Group(); this.mandibule = new THREE.Group();
    this.monde.add(this.maxillaire, this.mandibule);
    // Charnière de la mandibule (condyles) : à l'arrière, sous le plan d'occlusion
    this.charniere = new THREE.Group(); this.charniere.position.set(0, -12, -70); this.monde.add(this.charniere);
    this.charniere.add(this.mandibule); this.mandibule.position.set(0, 12, 70);

    this.raycaster = new THREE.Raycaster(); this.pointeur = new THREE.Vector2(-9, -9);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointermove', e => this._surPointeur(e));
    dom.addEventListener('pointerleave', () => { this.pointeur.set(-9, -9); this._survoler(null); });
    dom.addEventListener('pointerdown', e => { this._pdown = [e.clientX, e.clientY]; });
    dom.addEventListener('pointerup', e => {
      if (!this._pdown) return; const dx = e.clientX - this._pdown[0], dy = e.clientY - this._pdown[1]; this._pdown = null;
      if (dx * dx + dy * dy > 25) return;
      this._surPointeur(e); this._choisir();
    });
    this.ro = new ResizeObserver(() => this._taille()); this.ro.observe(el); this._taille();
    this._plans = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e5)];
    this._anim = this._anim.bind(this); this._vivant = true; requestAnimationFrame(this._anim);
    this._charger();
  }

  _taille() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  // ---------- chargement ----------
  async _charger() {
    const loader = new GLTFLoader(); const draco = new DRACOLoader(); draco.setDecoderPath(DRACO); loader.setDRACOLoader(draco);
    const noms = ['incisive-sup', 'incisive-inf', 'canine', 'premolaire', 'molaire-sup', 'molaire-inf'];
    const modeles = {};
    await Promise.all(noms.map(async n => {
      try { const g = await loader.loadAsync(this.urls && this.urls[n] ? this.urls[n] : this.base + n + '.glb'); modeles[n] = this._preparer(g, n); }
      catch (e) { modeles[n] = null; }
    }));
    for (const n of noms) { let k = n, tours = 0; while (!modeles[k] && tours++ < 6) k = REPLI[k]; if (!modeles[n]) modeles[n] = modeles[k]; }
    this.modeles = modeles;
    this._construire();
    this._cadrer(false);
    this.ui.pret && this.ui.pret();
  }

  // Extrait les trois couches d'un GLB Tripo traité par couches.mjs ; retourne des géométries centrées, hauteur = 1.
  _preparer(gltf, nom) {
    const out = { nom, geo: {}, H: 1, collet: 0.58 };
    const ex = gltf.parser.json.extras || {}; out.collet = ex.collet ?? 0.58;
    gltf.scene.traverse(o => { if (o.isMesh && out.geo[o.name] === undefined && /^(email|dentine|pulpe)$/.test(o.name)) out.geo[o.name] = o.geometry; });
    if (!out.geo.email) { let m = null; gltf.scene.traverse(o => { if (o.isMesh && !m) m = o; }); out.geo.email = m.geometry; }
    const b = new THREE.Box3().setFromBufferAttribute(out.geo.email.getAttribute('position'));
    const H = b.max.y - b.min.y; out.H = H;
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    for (const k in out.geo) {
      const g = out.geo[k]; g.translate(-cx, -b.min.y, -cz); g.scale(1 / H, 1 / H, 1 / H);
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      g.computeBoundingBox(); g.computeBoundingSphere();
    }
    for (const k of ['dentine', 'pulpe']) if (!out.geo[k]) out.geo[k] = out.geo.email.clone().scale(k === 'dentine' ? 0.8 : 0.45, k === 'dentine' ? 0.9 : 0.75, k === 'dentine' ? 0.8 : 0.45);
    out.largeur = (b.max.x - b.min.x) / H; out.profondeur = (b.max.z - b.min.z) / H;
    return out;
  }

  // ---------- construction des arcades ----------
  _construire() {
    // Courbe d'arcade : quart d'ellipse par côté, x = a sin θ, z = b (cos θ − 1), abscisse curviligne = largeurs cumulées
    const arcs = { sup: { a: 31, b: 48, y: 0, signe: -1, groupe: this.maxillaire }, inf: { a: 28, b: 44, y: 0, signe: 1, groupe: this.mandibule } };
    const ECART = 11; // ouverture entre bords incisifs, en mm
    for (const arcade of ['sup', 'inf']) {
      const A = arcs[arcade];
      const courbe = t => new THREE.Vector3(A.a * Math.sin(t), 0, A.b * (Math.cos(t) - 1));
      // table abscisse -> θ
      const N = 400, S = [0]; let prev = courbe(0);
      for (let i = 1; i <= N; i++) { const p = courbe(i / N * 1.85); S.push(S[i - 1] + p.distanceTo(prev)); prev = p; }
      const thetaDe = s => { let i = 0; while (i < N && S[i + 1] < s) i++; const f = (s - S[i]) / (S[i + 1] - S[i] || 1); return (i + Math.min(1, Math.max(0, f))) / N * 1.85; };
      const yBase = -A.signe * ECART / 2; // niveau des bords incisifs : maxillaire au-dessus, mandibule en dessous
      for (const cote of ['droit', 'gauche']) {
        const sx = cote === 'droit' ? -1 : 1; // le côté droit du patient est à gauche de l'écran
        let s = 0;
        for (let pos = 1; pos <= 8; pos++) {
          const [w, h, prof] = DIM[arcade][pos];
          const sc = s + w / 2; s += w;
          const t = thetaDe(sc), t2 = thetaDe(sc + 0.5);
          const p = courbe(t), p2 = courbe(t2);
          p.x *= sx; p2.x *= sx;
          const tangente = p2.clone().sub(p).normalize();               // sens mésial -> distal
          const normale = new THREE.Vector3(tangente.z, 0, -tangente.x); // vers l'extérieur (vestibulaire)
          if (normale.dot(p.clone().setY(0).sub(new THREE.Vector3(0, 0, -A.b * 0.6))) < 0) normale.negate();
          const quadrant = arcade === 'sup' ? (cote === 'droit' ? 1 : 2) : (cote === 'gauche' ? 3 : 4);
          const fdi = quadrant * 10 + pos;
          this._poserDent({ fdi, arcade, pos, cote, quadrant, centre: p, tangente, normale, w, h, prof, yBase, signe: A.signe, groupe: A.groupe });
        }
      }
      this._gencive(arcade, courbe, thetaDe, S[N], yBase, A);
    }
  }

  _poserDent(d) {
    const [nomModele, scaleX] = MODELE[d.arcade][d.pos];
    const M = this.modeles[nomModele];
    const groupe = new THREE.Group();
    // Repère local : X = tangente (mésio-distal), Z = normale (vestibulaire), Y = axe de la dent (vers la couronne)
    // base orthonormée directe : Y = axe de la dent (vers la couronne), Z = vestibulaire, X = Y ∧ Z (un déterminant négatif casserait la rotation)
    const Y = new THREE.Vector3(0, d.signe, 0); // sup : couronne vers le bas
    const Z = d.normale.clone().normalize();
    const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
    const m = new THREE.Matrix4().makeBasis(X, Y, Z);
    groupe.quaternion.setFromRotationMatrix(m);
    // Le bord incisif/occlusal est au niveau yBase ; le modèle a sa couronne en y=1 (haut) et l'apex en y=0
    // Le modèle est normalisé : apex en y=0, bord de la couronne en y=1. On l'étire aux dimensions réelles (mm).
    const echelle = d.h;
    groupe.position.copy(d.centre); groupe.position.y = d.yBase;
    groupe.scale.set(d.w * scaleX / M.largeur, echelle, d.prof / M.profondeur);
    // porteur décalé pour que le bord incisif/occlusal (y=1 local) touche le niveau yBase
    const porteur = new THREE.Group(); porteur.position.set(0, -1, 0); groupe.add(porteur);
    d.modele = M;
    const couches = {};
    for (const k of ['email', 'dentine', 'pulpe']) {
      const mat = this._materiau(k, d);
      const mesh = new THREE.Mesh(M.geo[k], mat); mesh.name = k; mesh.userData.fdi = d.fdi;
      mesh.visible = k === 'email';
      couches[k] = mesh; porteur.add(mesh);
    }
    d.groupe = groupe; d.porteur = porteur; d.couches = couches; d.modele = M; d.echelle = echelle;
    groupe.name = 'dent-' + d.fdi; groupe.userData.fdi = d.fdi; groupe.userData.dent = d;
    groupe.userData.base = groupe.position.clone();
    (d.arcade === 'sup' ? this.maxillaire : this.mandibule).add(groupe);
    this.dents.set(d.fdi, d); this.liste.push(d);
  }

  _materiau(k, d) {
    const couleur = k === 'email' ? COUL.email : k === 'dentine' ? COUL.dentine : COUL.pulpe;
    const mat = new THREE.MeshPhysicalMaterial({ color: couleur, roughness: k === 'email' ? 0.28 : 0.55, metalness: 0, clearcoat: k === 'email' ? 0.6 : 0, clearcoatRoughness: 0.25, transparent: true, opacity: 1, side: THREE.DoubleSide, clippingPlanes: [] });
    if (k === 'email') {
      // émail (couronne) blanc, cément (racine) ivoire : couleur par sommet selon la hauteur au collet
      const g = d.modele.geo.email; const pos = g.getAttribute('position'); const n = pos.count;
      if (!g.getAttribute('color')) {
        const col = new Float32Array(n * 3); const ce = new THREE.Color(COUL.email), cc = new THREE.Color(COUL.cement), tmp = new THREE.Color();
        for (let i = 0; i < n; i++) { const f = THREE.MathUtils.smoothstep(pos.getY(i), d.modele.collet - 0.03, d.modele.collet + 0.03); tmp.copy(cc).lerp(ce, f); col.set([tmp.r, tmp.g, tmp.b], i * 3); }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }
      mat.vertexColors = true; mat.color.set(0xffffff);
    }
    mat.userData.base = { color: mat.color.clone(), emissive: mat.emissive.clone() };
    return mat;
  }

  _gencive(arcade, courbe, thetaDe, L, yBase, A) {
    const signe = A.signe; // -1 : maxillaire (les racines montent), +1 : mandibule (les racines descendent)
    const pts = [];
    for (let i = -60; i <= 60; i++) { const s = Math.abs(i) / 60 * L; const p = courbe(thetaDe(s)); p.x *= Math.sign(i) || 1; pts.push(p); }
    const chemin = new THREE.CatmullRomCurve3(pts);
    const hCouronne = 8.5; // hauteur de couronne visible (mm) avant la gencive
    const R = 4.4, EY = 1.75;   // rayon du bourrelet gingival et son étirement vertical
    const tube = new THREE.TubeGeometry(chemin, 160, R, 18, false);
    const mat = new THREE.MeshPhysicalMaterial({ color: COUL.gencive, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, transparent: true, opacity: 1, sheen: 0.4, sheenColor: 0xffc0cb });
    const gencive = new THREE.Mesh(tube, mat); gencive.name = 'gencive';
    gencive.scale.set(1.15, EY, 1.15);
    gencive.position.y = yBase - signe * (hCouronne + R * EY * 0.9);
    // socle façon modèle d'étude : plaque suivant l'arcade, extrudée vers l'arrière des racines
    const forme = new THREE.Shape(); const ext = pts.map(p => new THREE.Vector2(p.x * 1.32, p.z * 1.22 - 4));
    forme.moveTo(ext[0].x, ext[0].y); ext.forEach(p => forme.lineTo(p.x, p.y)); forme.lineTo(ext[ext.length - 1].x, ext[0].y + 6); forme.lineTo(ext[0].x, ext[0].y + 6); forme.closePath();
    const socleG = new THREE.ExtrudeGeometry(forme, { depth: 6, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, bevelSegments: 4 });
    socleG.rotateX(Math.PI / 2); if (signe < 0) socleG.scale(1, -1, 1); // maxillaire : plaque vers le haut ; mandibule : vers le bas
    const socle = new THREE.Mesh(socleG, new THREE.MeshPhysicalMaterial({ color: 0xf2b8c6, roughness: 0.6, transparent: true, opacity: 1, side: THREE.DoubleSide }));
    socle.position.y = yBase - signe * (hCouronne + 25); socle.name = 'socle';
    const grp = new THREE.Group(); grp.add(gencive, socle); grp.name = 'gencive-' + arcade;
    (arcade === 'sup' ? this.maxillaire : this.mandibule).add(grp);
    this['gencive_' + arcade] = grp;
  }

  // ---------- interaction ----------
  _surPointeur(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointeur.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._souris = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  _picking(force) {
    if (this._drag && !force) return null;
    this.raycaster.setFromCamera(this.pointeur, this.camera);
    const cibles = []; for (const d of this.liste) if (d.groupe.visible) cibles.push(d.couches.email);
    const hits = this.raycaster.intersectObjects(cibles, false);
    return hits.length ? this.dents.get(hits[0].object.userData.fdi) : null;
  }
  _survoler(d) {
    if (this.etat.survol === d) return;
    if (this.etat.survol) this._teinter(this.etat.survol, false);
    this.etat.survol = d;
    if (d && d !== this.etat.selection) this._teinter(d, true);
    this.renderer.domElement.style.cursor = d ? 'pointer' : 'grab';
    this.ui.survol && this.ui.survol(d && d !== this.etat.selection ? this.fiche(d.fdi) : null, this._souris);
  }
  _teinter(d, on) {
    const m = d.couches.email.material;
    m.emissive.set(on ? C.ciel : 0x000000); m.emissiveIntensity = on ? 0.55 : 0;
  }
  _choisir() {
    const d = this._picking(true);
    if (d) this.isoler(d.fdi); else if (this.etat.selection) this.liberer();
  }

  // Fiche d'une dent pour l'interface (nom, quadrant, numéro FDI lu chiffre par chiffre…)
  fiche(fdi) {
    const d = this.dents.get(fdi); if (!d) return null;
    const D = this.donnees; const q = D.quadrants[d.quadrant], p = D.positions[d.pos];
    const chiffres = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];
    return { fdi, nom: p.nom, type: p.type, quadrant: q.nom, arcade: d.arcade, cote: d.cote, fonction: p.fonction, racines: p.racines, note: p.note, lecture: `${chiffres[d.quadrant]}-${chiffres[d.pos]}`, libelle: `${p.nom} ${d.arcade === 'sup' ? 'maxillaire' : 'mandibulaire'} ${d.cote === 'droit' ? 'droite' : 'gauche'}` };
  }

  // ---------- isolement ----------
  isoler(fdi) {
    const d = this.dents.get(fdi); if (!d) return;
    if (this.etat.selection && this.etat.selection !== d) this._reposer(this.etat.selection);
    this.etat.selection = d; this._teinter(d, false); this.ui.survol && this.ui.survol(null);
    // tout le reste s'efface
    for (const x of this.liste) this._opacite(x, x === d ? 1 : 0.05);
    this._opaciteGencive(0.04);
    // la dent sort de son alvéole de 5 mm le long de son axe
    const axe = new THREE.Vector3(0, 1, 0).applyQuaternion(d.groupe.quaternion);
    const cible = d.groupe.userData.base.clone().add(axe.multiplyScalar(-6));
    this._tween(d.groupe.position, cible, 700);
    this._cadrerDent(d);
    this._appliquerCouche();
    this.ui.selection && this.ui.selection(this.fiche(fdi));
  }
  liberer() {
    const d = this.etat.selection; if (!d) return;
    this._reposer(d); this.etat.selection = null;
    for (const x of this.liste) this._opacite(x, 1);
    this._opaciteGencive(1);
    this.etat.couche = 'email'; this.etat.coupe = false; this._appliquerCouche();
    this._cadrer(true);
    this.ui.selection && this.ui.selection(null);
  }
  _reposer(d) { this._coupeCam = false; this._tween(d.groupe.position, d.groupe.userData.base.clone(), 500); for (const k in d.couches) { const m = d.couches[k]; m.visible = k === 'email'; m.material.clippingPlanes = []; } }
  _opacite(d, o) { for (const k in d.couches) this._tween(d.couches[k].material, { opacity: o }, 450); d.couches.email.material.depthWrite = o > 0.5; }
  _opaciteGencive(o) { for (const a of ['sup', 'inf']) this['gencive_' + a].traverse(m => { if (m.isMesh) { this._tween(m.material, { opacity: o }, 450); m.material.depthWrite = o > 0.5; } }); }

  // Couches : 'email' (tout), 'dentine' (sans émail), 'pulpe' (sans émail ni dentine) ; coupe = plan de clipping
  couche(k) { this.etat.couche = k; this._appliquerCouche(); }
  coupe(on) { this.etat.coupe = on; this._appliquerCouche(); }
  _appliquerCouche() {
    const d = this.etat.selection; if (!d) return;
    const ordre = ['email', 'dentine', 'pulpe']; const i = ordre.indexOf(this.etat.couche);
    // couche active + celles qu'elle contient ; en coupe, tout est visible (le plan révèle l'intérieur)
    for (let j = 0; j < 3; j++) { const m = d.couches[ordre[j]]; m.visible = this.etat.coupe ? j >= i : j === i || (j > i && this.etat.radio); m.material.clippingPlanes = this.etat.coupe ? this._plans : []; m.material.needsUpdate = true; }
    if (this.etat.coupe) for (let j = 0; j < 3; j++) d.couches[ordre[j]].visible = j >= i;
    if (this.etat.coupe) {
      // plan vertical passant par le centre de la dent, normale = axe mésio-distal (coupe vestibulo-linguale, comme dans les atlas)
      d.groupe.updateMatrixWorld();
      const q = d.groupe.getWorldQuaternion(new THREE.Quaternion());
      const centre = new THREE.Vector3(0, -0.5, 0).applyMatrix4(d.groupe.matrixWorld);
      const n = new THREE.Vector3(1, 0, 0).applyQuaternion(q).normalize();
      const versCam = this.camera.position.clone().sub(centre); if (n.dot(versCam) < 0) n.negate();
      this._plans[0].setFromNormalAndCoplanarPoint(n.clone().negate(), centre); // on garde la moitié opposée à la caméra
      d.porteur.rotation.y = 0;
      if (!this._coupeCam) {
        // la caméra vient regarder dans la coupe, légèrement en plongée
        this._coupeCam = true;
        const dir = n.clone(); dir.y += 0.15; dir.normalize();
        const dist = d.echelle * 3.2;
        const droite = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize().multiplyScalar(d.echelle * 0.6);
        const cible = centre.clone().add(droite);
        this._tween(this.camera.position, cible.clone().add(dir.multiplyScalar(dist)), 900);
        this._tween(this.controls.target, cible, 900);
      }
    } else if (this._coupeCam) { this._coupeCam = false; this._cadrerDent(d); }
  }

  // Mode radio : matériaux additifs/soustractifs sur fond sombre
  radio(on) {
    this.etat.radio = on;
    for (const d of this.liste) {
      for (const k in d.couches) {
        const mesh = d.couches[k];
        if (on) {
          if (!mesh.userData.matBase) mesh.userData.matBase = mesh.material;
          const sel = this.etat.selection;
          const op = { email: 0.42, dentine: 0.3, pulpe: 0.55 }[k];
          mesh.material = new THREE.MeshBasicMaterial({ color: k === 'pulpe' ? 0x8a8a8a : 0x9fd7ff, transparent: true, opacity: op, blending: k === 'pulpe' ? THREE.SubtractiveBlending : THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: mesh.userData.matBase.clippingPlanes });
          mesh.visible = sel ? (sel === d) : true;
          if (!sel || sel === d) mesh.visible = true;
        } else if (mesh.userData.matBase) { mesh.material = mesh.userData.matBase; mesh.userData.matBase = null; mesh.visible = k === 'email'; }
      }
    }
    for (const a of ['sup', 'inf']) this['gencive_' + a].visible = !on;
    this.lumieres.forEach(l => l.visible = !on);
    if (!on) this._appliquerCouche();
    this.ui.radio && this.ui.radio(on);
  }

  ouvrir(on) { this.etat.ouvert = on; this._tween(this.charniere.rotation, { x: on ? 0.42 : 0 }, 900); }
  tourner(on) { this.etat.tourne = on; }

  // ---------- caméra ----------
  _cadrer(anime) {
    const p = new THREE.Vector3(0, 30, 190), t = new THREE.Vector3(0, 0, -20);
    if (anime) { this._tween(this.camera.position, p, 900); this._tween(this.controls.target, t, 900); } else { this.camera.position.copy(p); this.controls.target.copy(t); }
  }
  _cadrerDent(d) {
    d.groupe.updateMatrixWorld();
    // centre de la dent après sa sortie de l'alvéole (6 mm le long de son axe), vue vestibulaire un peu plongeante
    const q = d.groupe.getWorldQuaternion(new THREE.Quaternion());
    const axe = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const centre = new THREE.Vector3(0, 0.5 - 1, 0).applyMatrix4(d.groupe.matrixWorld).add(axe.clone().multiplyScalar(-6));
    const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q); dir.y += 0.2; dir.normalize();
    const dist = d.echelle * 3.4;
    const droite = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize().multiplyScalar(d.echelle * 0.6); // la dent se place à gauche, la fiche est à droite
    const cible = centre.clone().add(droite);
    this._tween(this.camera.position, cible.clone().add(dir.multiplyScalar(dist)), 900);
    this._tween(this.controls.target, cible, 900);
  }
  vue(nom) {
    const vues = { face: [[0, 10, 190], [0, 0, -20]], dessus: [[0, 170, -30], [0, 0, -30]], dessous: [[0, -170, -30], [0, 0, -30]], cote: [[190, 20, -30], [0, 0, -30]] };
    const v = vues[nom]; if (!v) return;
    this._tween(this.camera.position, new THREE.Vector3(...v[0]), 900); this._tween(this.controls.target, new THREE.Vector3(...v[1]), 900);
  }

  // Points d'ancrage d'étiquettes (en coordonnées écran) pour la dent sélectionnée
  ancres() {
    const d = this.etat.selection; if (!d) return null;
    d.groupe.updateMatrixWorld();
    const M = d.porteur.matrixWorld; const c = d.modele.collet; const L = d.modele.largeur / 2;
    const pts = {
      couronne: new THREE.Vector3(L * 0.55, 0.96, 0.25), collet: new THREE.Vector3(L * 0.9, c, 0.15), racine: new THREE.Vector3(-L * 0.55, c * 0.5, 0.2), apex: new THREE.Vector3(0, 0.02, 0),
      email: new THREE.Vector3(-L * 0.7, 0.85, 0.3), dentine: new THREE.Vector3(L * 0.6, 0.7, 0.2), pulpe: new THREE.Vector3(0, 0.55, 0.0),
    };
    const out = {}; const w = this.el.clientWidth, h = this.el.clientHeight;
    for (const k in pts) { const p = pts[k].applyMatrix4(M); const v = p.clone().project(this.camera); out[k] = { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, devant: v.z < 1 }; }
    return out;
  }
  // Centres de toutes les dents à l'écran (pour les pastilles FDI)
  centres() {
    const w = this.el.clientWidth, h = this.el.clientHeight; const out = [];
    for (const d of this.liste) {
      const p = new THREE.Vector3(0, -0.5, 0).applyMatrix4(d.groupe.matrixWorld); const v = p.project(this.camera);
      const cam = this.camera.position.clone().sub(p).normalize(); const nrm = new THREE.Vector3(0, 0, 1).applyQuaternion(d.groupe.getWorldQuaternion(new THREE.Quaternion()));
      out.push({ fdi: d.fdi, x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h, visible: nrm.dot(cam) > -0.15 });
    }
    return out;
  }
  surligner(fdi, on) { const d = this.dents.get(fdi); if (d && d !== this.etat.selection) this._teinter(d, on); }

  // ---------- boucle ----------
  _tween(obj, vers, duree) {
    const de = {}; for (const k in vers) de[k] = obj[k];
    this.tweens = this.tweens.filter(t => t.obj !== obj);
    this.tweens.push({ obj, de, vers, t0: performance.now(), duree });
  }
  _anim() {
    if (!this._vivant) return;
    requestAnimationFrame(this._anim);
    const now = performance.now();
    for (const t of this.tweens) { const f = Math.min(1, (now - t.t0) / t.duree); const e = 1 - Math.pow(1 - f, 3); for (const k in t.vers) t.obj[k] = t.de[k] + (t.vers[k] - t.de[k]) * e; t.fini = f >= 1; }
    this.tweens = this.tweens.filter(t => !t.fini);
    this.controls.update();
    if (this.dents.size) { const d = this._picking(); if (d !== this.etat.survol) this._survoler(d); }
    if (this.etat.selection && this.etat.tourne !== false && !this.etat.coupe) { const d = this.etat.selection; d.porteur.rotation.y += 0.0025; }
    this.renderer.render(this.scene, this.camera);
    this.ui.image && this.ui.image();
  }
  destroy() { this._vivant = false; this.ro.disconnect(); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
