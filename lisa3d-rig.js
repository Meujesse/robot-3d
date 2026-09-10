// Lisa 3D « vivante » (three.js) : squelette Tripo, animations, bouche et paupières projetées sur le visage,
// caméra qui suit la souris, plans de caméra, états de conversation. Expose window.Lisa3D.
// Dépend de : three (module, importé par la page), LisaBouche (lisa-bouche.js).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

const AGENT_ID_DEFAULT = 'agent_2701m25dand9fq5rb32gndx037je';
const BASE = 'lisa3d/';
// Rendu ortho de face : 2000 px pour 0,20 m, centré sur (0, 0.79) → 10 000 px/m
const PXM = 10000, CX = 1000, CY = 1000, ZC = 0.79;
// Posture (outil lisa_attitude) → animation Tripo
// (noms Tripo : greet_01, greet_02, wave_goodbye_01, agree, clap, heart_pose, laugh_01, scratch, look_around, fold_arms, depressed, dance_01, idle, wait)
const ATTITUDES = {
  salut: 'greet_01', presentation: 'wait', accueil: 'idle', index: 'agree', decompte: 'wait', question: 'scratch',
  curiosite: 'look_around', reflexion: 'scratch', haussement: 'scratch', pouce: 'agree', enthousiasme: 'clap',
  emerveillement: 'heart_pose', perplexite: 'look_around', deception: 'depressed', reveuse: 'wait', hanches: 'fold_arms',
  designe: 'wait', invitation: 'greet_02', neutre: 'idle', rire: 'laugh_01', au_revoir: 'wave_goodbye_01', danse: 'dance_01', applaudir: 'clap',
};
const BOUCLES = ['idle', 'wait'];      // animations d'attente (en boucle)
const PLANS = { pied: { y: 0.50, d: 2.6, ty: 0.50 }, americain: { y: 0.62, d: 1.6, ty: 0.64 }, buste: { y: 0.74, d: 0.95, ty: 0.75 }, gros: { y: 0.79, d: 0.55, ty: 0.79 } };

export function create({ stage, onPose }) {
  const W = () => stage.clientWidth, H = () => stage.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio)); renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.05, 20);
  camera.position.set(0, 0.74, 0.95);
  // lumières : ambiance douce + clé chaude + contre-jour froid
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2); key.position.set(0.8, 1.8, 1.2); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 0.5; key.shadow.camera.far = 6;
  key.shadow.camera.left = key.shadow.camera.bottom = -0.8; key.shadow.camera.right = key.shadow.camera.top = 0.8; key.shadow.bias = -0.0005; key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe3ff, 1.0); rim.position.set(-1.2, 1.2, -1.0); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-1, 0.6, 1.4); scene.add(fill);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.28 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  const rig = new THREE.Group(); scene.add(rig);           // racine du personnage (déplacements)
  let mixer = null, clips = {}, current = null, idleName = 'inactif', head = null, model = null;
  let state = 'idle', ready = false;
  const clock = new THREE.Clock();
  // regard : la caméra suit un peu la souris
  let mouse = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2; mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2; });
  stage.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; });
  // caméra
  let plan = 'buste', camTarget = { pos: new THREE.Vector3(0, 0.74, 0.95), look: new THREE.Vector3(0, 0.75, 0) }, angle = 0, pushK = 1;
  function cadre(nom, anim) {
    const P = PLANS[nom] || PLANS.buste; plan = nom;
    const a = angle + (Math.random() - 0.5) * 0.0;
    camTarget.pos.set(Math.sin(a) * P.d, P.y + 0.02, Math.cos(a) * P.d);
    camTarget.look.set(0, P.ty, 0);
    if (!anim) { camera.position.copy(camTarget.pos); camera.lookAt(camTarget.look); }
  }

  // ---- bouche et paupières projetées ----
  const bouche = new LisaBouche.Moteur({ hoche: k => hoche(k), clignote: () => clignote() });
  let decalBouche = null, decalYeux = null, texBouche = null, FACE = null;
  function px2m(px, py) { return { x: (px - CX) / PXM, y: ZC - (py - CY) / PXM }; }
  async function prepareVisage() {
    FACE = (await (await fetch(BASE + 'face.json?v=2')).json()).face3d;
    const b = FACE.b, s = 2.0;
    const cv = document.createElement('canvas'); cv.width = Math.round(b.w * s); cv.height = Math.round(b.h * s);
    const src = new Image(); src.src = BASE + 'face3d-bouche.png';
    await new Promise(r => { src.onload = r; src.onerror = r; });
    bouche.setToile({ src, cv, ctx: cv.getContext('2d'), b, s });
    texBouche = new THREE.CanvasTexture(cv); texBouche.colorSpace = THREE.SRGBColorSpace; texBouche.anisotropy = 4;
    const mesh = model.getObjectByProperty('isSkinnedMesh', true) || model.getObjectByProperty('isMesh', true);
    const face = mesh.material;
    function decal(box, tex, opacity) {
      const c = px2m(box[0] + box[2] / 2, box[1] + box[3] / 2);
      const pos = new THREE.Vector3(c.x, c.y, 0.09), size = new THREE.Vector3(box[2] / PXM, box[3] / PXM, 0.16);
      const g = new DecalGeometry(mesh, pos, new THREE.Euler(0, 0, 0), size);
      const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity, depthTest: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -4, roughness: 0.36, metalness: 0.03, side: THREE.FrontSide });
      const d = new THREE.Mesh(g, m); d.renderOrder = 2; d.frustumCulled = false;
      scene.add(d); if (head) head.attach(d);
      return d;
    }
    decalBouche = decal([b.x, b.y, b.w, b.h], texBouche, 0); decalBouche.visible = false;
    if (FACE.clos) {
      const tex = new THREE.TextureLoader().load(BASE + 'face3d-clos.png'); tex.colorSpace = THREE.SRGBColorSpace;
      decalYeux = decal(FACE.clos, tex, 0);
    }
  }
  // bords du patch fondus, pour que la boîte ne se voie pas sur la peau
  let masque = null;
  function adoucitBords() {
    const T = bouche.T; if (!T) return;
    const cv = T.cv, ctx = T.ctx;
    if (!masque || masque.width !== cv.width) {
      masque = document.createElement('canvas'); masque.width = cv.width; masque.height = cv.height;
      const m = masque.getContext('2d'); const fx = cv.width * 0.10, fy = cv.height * 0.10;
      m.fillStyle = '#000'; m.fillRect(0, 0, cv.width, cv.height);
      for (const [g, x0, y0, x1, y1] of [[m.createLinearGradient(0, 0, fx, 0), 0, 0, fx, cv.height], [m.createLinearGradient(cv.width, 0, cv.width - fx, 0), cv.width - fx, 0, fx, cv.height],
        [m.createLinearGradient(0, 0, 0, fy), 0, 0, cv.width, fy], [m.createLinearGradient(0, cv.height, 0, cv.height - fy), 0, cv.height - fy, cv.width, fy]]) {
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); m.globalCompositeOperation = 'destination-out'; m.fillStyle = g; m.fillRect(x0, y0, x1, y1);
      }
    }
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(masque, 0, 0); ctx.globalCompositeOperation = 'source-over';
  }
  // clignement
  let blinkTimer = null, blinkAnim = null;
  function clignote() {
    if (!decalYeux) return;
    const t0 = performance.now(), dur = 195 + Math.random() * 45;
    blinkAnim = () => { const k = (performance.now() - t0) / dur; if (k >= 1) { decalYeux.material.opacity = 0; blinkAnim = null; return; }
      decalYeux.material.opacity = k < .19 ? Math.pow(k / .19, 1.6) : k < .55 ? 1 : 1 - Math.pow((k - .55) / .45, 0.7); };
  }
  function planifieClignement() { clearTimeout(blinkTimer); blinkTimer = setTimeout(() => { clignote(); if (Math.random() < 0.2) setTimeout(clignote, 320); planifieClignement(); }, 1900 + Math.random() * 4600); }
  // hochement : petite rotation de la tête
  let nod = 0, nodT = 0;
  function hoche(k = 0.3) { nod = k; nodT = performance.now(); }

  // ---- animations ----
  function play(name, { loop = false, fade = 0.35 } = {}) {
    const clip = clips[name]; if (!clip || !mixer) return false;
    const action = mixer.clipAction(clip);
    action.reset(); action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); action.clampWhenFinished = true; action.enabled = true;
    if (current && current !== action) { current.crossFadeTo(action, fade, false); }
    action.play(); current = action;
    return true;
  }
  function idle() { play(idleName, { loop: true, fade: 0.5 }); }
  if (typeof THREE.AnimationMixer !== 'undefined') { /* noop */ }

  let nTicks = 0;
  function tick() {
    nTicks++;
    const dt = Math.min(0.05, clock.getDelta());
    if (mixer) mixer.update(dt);
    // retour à l'attente quand un geste se termine
    if (current && !current.loop === false) { /* géré par l'événement finished */ }
    // regard / caméra
    look.x += (mouse.x - look.x) * 0.04; look.y += (mouse.y - look.y) * 0.04;
    const want = state === 'speaking' ? 1.0 : 1.0;
    pushK += ((state === 'speaking' ? 0.94 : 1.0) - pushK) * 0.004;
    const P = PLANS[plan] || PLANS.buste;
    const a = angle + look.x * 0.22;
    const d = P.d * pushK;
    const px = Math.sin(a) * d, pz = Math.cos(a) * d, py = P.y + 0.02 - look.y * 0.05;
    camera.position.lerp(new THREE.Vector3(px, py, pz), 0.06);
    const lk = camTarget.look.clone(); lk.y -= look.y * 0.02;
    camera.lookAt(lk);
    // hochement
    if (head && nod) { const k = (performance.now() - nodT) / 900; if (k >= 1) nod = 0; else head.rotation.x += Math.sin(k * Math.PI) * nod * 0.25 * (k < .5 ? 1 : 1) * 0.06; }
    // bouche
    const montre = bouche.tick();
    if (decalBouche) { decalBouche.visible = montre; if (montre) { adoucitBords(); decalBouche.material.opacity = 1; texBouche.needsUpdate = true; } }
    if (blinkAnim) blinkAnim();
    renderer.render(scene, camera);
    if (document.hidden) setTimeout(tick, 50); else requestAnimationFrame(tick);   // onglet caché : rAF s'arrête
  }
  window.addEventListener('resize', () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });

  const api = {
    async init(file = 'lisa.glb') {
      const loader = new GLTFLoader();
      const draco = new DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/'); loader.setDRACOLoader(draco);
      const gltf = await loader.loadAsync(BASE + file);
      model = gltf.scene; rig.add(model);
      model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; if (o.material) { o.material.side = THREE.FrontSide; } } if (o.isBone && !head && /head/i.test(o.name)) head = o; });
      if (!head) model.traverse(o => { if (o.isBone && !head && /neck|tete|t.te/i.test(o.name)) head = o; });
      mixer = new THREE.AnimationMixer(model);
      for (const c of gltf.animations) clips[c.name.split(':').pop().replace(/[^a-z0-9_]/gi, '').toLowerCase()] = c;
      idleName = BOUCLES.find(n => clips[n]) || Object.keys(clips)[0];
      mixer.addEventListener('finished', () => { if (state !== 'sleeping') idle(); });
      await prepareVisage();           // décalcomanies calculées sur la pose de repos, avant toute animation
      idle();
      cadre('buste', false);
      ready = true; planifieClignement(); tick();
      return api;
    },
    animations() { return Object.keys(clips); },
    hasHead() { return !!head; },
    play, idle,
    setPlan(p) { cadre(p, true); },
    // ---- conversation ----
    setAmpSource(fn) { bouche.setAmpSource(fn); },
    nourrit(t) { bouche.nourrit(t); },
    async speakText(t) { state = 'speaking'; stage.dataset.state = state; hoche(0.35); await bouche.parleTexte(t); if (state === 'speaking') api.setState('idle'); },
    setState(next) {
      if (next === state) return;
      state = next; stage.dataset.state = next;
      bouche.setSpeaking(next === 'speaking');
      if (next === 'speaking') { hoche(0.35); }
      if (next === 'thinking') play('look_around') || play('scratch');
    },
    getState() { return state; },
    attitude(nom) {
      const a = ATTITUDES[String(nom || '').toLowerCase()]; if (!a) return false;
      const ok = BOUCLES.includes(a) ? (idleName = a, idle(), true) : play(a);
      // changement de plan à chaque posture, comme en 2D
      const plans = ['buste', 'americain', 'buste', 'gros']; angle = (Math.random() - 0.5) * 0.5;
      cadre(plans[Math.floor(Math.random() * plans.length)], true);
      if (onPose) onPose(nom, plan);
      return ok;
    },
    agentId() { return new URLSearchParams(location.search).get('agent') || AGENT_ID_DEFAULT; },
    clientTools() { return { lisa_attitude: async ({ attitude }) => api.attitude(attitude) ? 'posture : ' + attitude : 'posture inconnue : ' + attitude }; },
    _bouche(o, l, b) { bouche.speaking = true; bouche.scriptEnCours = true; bouche.cible.ouv = o; bouche.cible.larg = l || 0; bouche.cible.biais = b || 0; },
    _moteur: bouche, _debug() { return { nTicks, plan, pushK, angle, state, head: head && head.name, cam: camera.position.toArray() }; }, _clignote: clignote, _yeux(op) { if (decalYeux) decalYeux.material.opacity = op; }, scene, camera, renderer,
  };
  return api;
}
window.Lisa3D = { create };
