import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- textes ---------- */
const T = {
  fr: {
    petit: 'Bijouterie & Métaux', grand: 'Ta première bague', plateau: 'Tes outils',
    sur: 'Ta mission', h1: 'Fabrique ta première bague',
    p: "Bienvenue dans l'atelier. Glisse les bons outils sur l'établi, dans le bon ordre, et regarde ta bague prendre forme.",
    start: "Entrer dans l'atelier", badgeTitre: 'Badge débloqué', badgeNom: 'Bijouterie & Métaux',
    aide: 'Fais tourner ta bague avec la souris · Clique sur la flèche de la page pour continuer',
    faux: ["Pas celui-là ! Regarde l'étape en cours, à gauche.", "Presque… mais ce n'est pas le bon outil pour cette étape.", "Hmm, non. Chaque geste a son outil !"],
    intro: "Salut, moi c'est Julie ! Ici, c'est l'établi d'un bijoutier. On va fabriquer une bague en or, étape par étape. Commence par glisser la <b>scie bocfil</b> sur l'établi.",
    etapes: [
      { cle:'scier',  nom:'Scier',           outil:'Scie bocfil',  img:'img/outil-scie.png',
        avant:"D'abord, on coupe le fil d'or à la bonne longueur avec la <b>scie bocfil</b>. Glisse-la sur l'établi !",
        apres:"Bien coupé ! La scie bocfil, c'est la scie toute fine du bijoutier." },
      { cle:'cintrer', nom:'Mettre en forme', outil:'Triboulet',    img:'img/outil-triboulet.png',
        avant:"Maintenant, on enroule le fil autour du <b>triboulet</b>, le cône en acier qui donne la taille de la bague.",
        apres:"Et voilà un anneau ! Le triboulet sert aussi à mesurer la taille du doigt." },
      { cle:'souder',  nom:'Souder',          outil:'Chalumeau',    img:'img/outil-chalumeau.png',
        avant:"Il reste une fente. On la referme avec le <b>chalumeau</b>. Attention, ça chauffe !",
        apres:"Soudé ! L'anneau est fermé. Ensuite, un bain d'acide nettoie le métal." },
      { cle:'sertir',  nom:'Sertir la pierre', outil:'Échoppe',     img:'img/outil-echoppe.png',
        avant:"La pierre ! Avec l'<b>échoppe</b>, le sertisseur creuse une petite place dans le métal, puis le rabat sur la pierre pour la tenir.",
        apres:"Sertie ! Sans colle : c'est le métal qui tient la pierre." },
      { cle:'polir',   nom:'Polir',           outil:'Polissoir',    img:'img/outil-polissoir.png',
        avant:"Dernière étape : on fait briller avec le <b>polissoir</b>. Glisse-le sur la bague.",
        apres:"Regarde-la briller ! Ta première bague est terminée. Fais-la tourner !" },
    ]
  },
  it: {
    petit: 'Gioielleria & Metalli', grand: 'Il tuo primo anello', plateau: 'I tuoi attrezzi',
    sur: 'La tua missione', h1: 'Crea il tuo primo anello',
    p: "Benvenuto in laboratorio. Trascina gli attrezzi giusti sul banco, nell'ordine giusto, e guarda il tuo anello prendere forma.",
    start: 'Entra in laboratorio', badgeTitre: 'Badge sbloccato', badgeNom: 'Gioielleria & Metalli',
    aide: "Fai girare l'anello con il mouse · Clicca sulla freccia della pagina per continuare",
    faux: ["Non quello! Guarda la tappa in corso, a sinistra.", "Quasi… ma non è l'attrezzo giusto per questa tappa.", "Mmm, no. Ogni gesto ha il suo attrezzo!"],
    intro: "Ciao, sono Julie! Questo è il banco di un orafo. Creeremo un anello d'oro, passo dopo passo. Inizia trascinando il <b>seghetto da traforo</b> sul banco.",
    etapes: [
      { cle:'scier',  nom:'Segare', outil:'Seghetto', img:'img/outil-scie.png',
        avant:"Prima si taglia il filo d'oro alla lunghezza giusta con il <b>seghetto</b>. Trascinalo sul banco!",
        apres:"Ben tagliato! Il seghetto da traforo è la sega sottilissima dell'orafo." },
      { cle:'cintrer', nom:'Dare forma', outil:'Triboletto', img:'img/outil-triboulet.png',
        avant:"Ora si avvolge il filo intorno al <b>triboletto</b>, il cono d'acciaio che dà la misura dell'anello.",
        apres:"Ecco un anello! Il triboletto serve anche a misurare la taglia del dito." },
      { cle:'souder',  nom:'Saldare', outil:'Cannello', img:'img/outil-chalumeau.png',
        avant:"Resta una fessura. La chiudiamo con il <b>cannello</b>. Attenzione, scotta!",
        apres:"Saldato! L'anello è chiuso. Poi un bagno d'acido pulisce il metallo." },
      { cle:'sertir',  nom:'Incastonare', outil:'Bulino', img:'img/outil-echoppe.png',
        avant:"La pietra! Con il <b>bulino</b>, l'incastonatore scava un piccolo posto nel metallo, poi lo ripiega sulla pietra per tenerla.",
        apres:"Incastonata! Senza colla: è il metallo che tiene la pietra." },
      { cle:'polir',   nom:'Lucidare', outil:'Lucidatrice', img:'img/outil-polissoir.png',
        avant:"Ultima tappa: si fa brillare con la <b>lucidatrice</b>. Trascinala sull'anello.",
        apres:"Guardalo brillare! Il tuo primo anello è finito. Fallo girare!" },
    ]
  }
};
let lang = (new URLSearchParams(location.search).get('lang') === 'it') ? 'it' : 'fr';
const L = () => T[lang];

/* ---------- mise à l'échelle ---------- */
const stage = document.getElementById('stage');
function fit(){ const s = Math.min(innerWidth/1600, innerHeight/900); if (s>0) stage.style.setProperty('--s', s); }
addEventListener('resize', fit); new ResizeObserver(fit).observe(document.documentElement); fit();

/* ---------- état ---------- */
let etape = 0, enCours = false, fini = false;
const $ = s => document.querySelector(s);
const bulle = $('#bulle'), bulleTexte = $('#bulle-texte'), julieImg = $('#julie-img');
const sons = {};
function parle(html, pose, audioKey){
  bulleTexte.innerHTML = html; bulle.classList.remove('on'); void bulle.offsetWidth; bulle.classList.add('on');
  if (pose) julieImg.src = 'img/julie-' + pose + '.png';
  if (audioKey) joue(audioKey);
}
function joue(key){
  Object.values(sons).forEach(a => { try{ a.pause(); a.currentTime = 0; }catch(e){} });
  const a = sons[key] || (sons[key] = new Audio(`audio/${lang}-${key}.mp3`));
  a.play().catch(()=>{});
}

/* ---------- rendu des textes ---------- */
function rendTextes(){
  const t = L();
  $('#titre .petit').textContent = t.petit; $('#titre .grand').textContent = t.grand;
  $('.plateau-titre').textContent = t.plateau; $('.carte-sur').textContent = t.sur; $('.carte h1').textContent = t.h1;
  $('.carte p').textContent = t.p; $('#btn-start').textContent = t.start;
  $('.badge-titre').textContent = t.badgeTitre; $('.badge-nom').textContent = t.badgeNom; $('.final-aide').textContent = t.aide;
  const ol = $('#etapes'); ol.innerHTML = '';
  t.etapes.forEach((e,i) => { const li = document.createElement('li'); li.dataset.cle = e.cle; li.innerHTML = `<span class="n">${i+1}</span><span>${e.nom}</span>`; ol.appendChild(li); });
  const outils = $('#outils'); outils.innerHTML = '';
  ordreOutils.forEach(i => { const e = t.etapes[i]; const d = document.createElement('div'); d.className = 'outil'; d.dataset.cle = e.cle; d.innerHTML = `<img src="${e.img}" alt=""><span>${e.outil}</span>`; outils.appendChild(d); });
  majEtapes();
  document.querySelectorAll('#langue button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
}
const ordreOutils = [3,0,4,1,2]; // ordre volontairement mélangé sur le plateau
function majEtapes(){
  document.querySelectorAll('#etapes li').forEach((li,i) => { li.classList.toggle('fait', i < etape); li.classList.toggle('actif', i === etape); });
  document.querySelectorAll('.outil').forEach(o => { const i = L().etapes.findIndex(e => e.cle === o.dataset.cle); o.classList.toggle('utilise', i < etape); });
}
document.querySelectorAll('#langue button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; rendTextes(); if (!fini && $('#intro').classList.contains('off')) parle(etape ? L().etapes[etape].avant : L().intro, 'montre'); }));

/* ---------- glisser-déposer (souris + tactile) ---------- */
let fantome = null, drag = null;
function stageXY(ev){ const r = stage.getBoundingClientRect(); const s = parseFloat(getComputedStyle(stage).getPropertyValue('--s')) || 1; return { x:(ev.clientX - r.left)/s, y:(ev.clientY - r.top)/s }; }
function surCible(ev){ const r = $('#zone-depot').getBoundingClientRect(); return ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom; }
$('#outils').addEventListener('pointerdown', ev => {
  const o = ev.target.closest('.outil'); if (!o || o.classList.contains('utilise') || enCours || fini) return;
  ev.preventDefault(); drag = o; o.setPointerCapture?.(ev.pointerId);
  fantome = document.createElement('div'); fantome.id = 'fantome'; fantome.innerHTML = `<img src="${o.querySelector('img').src}" alt="">`; stage.appendChild(fantome);
  const p = stageXY(ev); fantome.style.left = p.x + 'px'; fantome.style.top = p.y + 'px'; stage.classList.add('glisse');
});
addEventListener('pointermove', ev => { if (!drag) return; const p = stageXY(ev); fantome.style.left = p.x + 'px'; fantome.style.top = p.y + 'px'; stage.classList.toggle('dessus', surCible(ev)); });
addEventListener('pointerup', ev => {
  if (!drag) return; const o = drag; drag = null; stage.classList.remove('glisse','dessus'); fantome?.remove(); fantome = null;
  if (!surCible(ev)) return;
  const attendu = L().etapes[etape];
  if (o.dataset.cle === attendu.cle) reussite(o); else echec(o);
});
function echec(o){ o.classList.remove('secoue'); void o.offsetWidth; o.classList.add('secoue'); const f = L().faux; parle(f[Math.floor(Math.random()*f.length)], 'montre', 'faux'); }
async function reussite(o){
  enCours = true; const e = L().etapes[etape]; o.classList.add('utilise');
  await anims[e.cle]();
  etape++; majEtapes();
  if (etape >= L().etapes.length){ fini = true; parle(e.apres, 'bravo', e.cle + '-apres'); setTimeout(finale, 1600); }
  else { parle(e.apres + ' ' + L().etapes[etape].avant, 'montre', e.cle + '-apres'); }
  enCours = false;
}

/* ---------- effets DOM ---------- */
const fx = $('#fx');
function particules(n, x, y, couleur, spread=160){
  for (let i=0;i<n;i++){ const p = document.createElement('div'); p.className = 'part'; const a = Math.random()*Math.PI*2, d = 40+Math.random()*spread;
    p.style.left = x+'px'; p.style.top = y+'px'; p.style.background = couleur; p.style.boxShadow = `0 0 8px ${couleur}`; p.style.setProperty('--dx', Math.cos(a)*d+'px'); p.style.setProperty('--dy', Math.sin(a)*d-30+'px'); p.style.animationDuration = (.6+Math.random()*.8)+'s'; fx.appendChild(p); setTimeout(()=>p.remove(), 1500); }
}
function flash(){ const f = document.createElement('div'); f.className = 'flash'; fx.appendChild(f); setTimeout(()=>f.remove(), 700); }

/* ---------- scène three.js ---------- */
const conteneur = $('#scene3d');
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(1600, 900, false); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
conteneur.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1600/900, 0.1, 100); camera.position.set(0, 3.6, 9.4); camera.lookAt(0, 0.1, 0);
const spot = new THREE.SpotLight(0xffd9a0, 40, 20, Math.PI/5, 0.5, 1.5); spot.position.set(2.5, 5, 2.5); scene.add(spot);
scene.add(new THREE.AmbientLight(0xfff1dd, 0.25));
const controls = new OrbitControls(camera, renderer.domElement); controls.enabled = false; controls.enablePan = false; controls.enableZoom = false; controls.autoRotate = false; controls.autoRotateSpeed = 2.2; controls.target.set(0, 0.1, 0);

const or = new THREE.MeshStandardMaterial({ color: 0xf2c46a, metalness: 1, roughness: 0.48 });
const groupe = new THREE.Group(); groupe.position.set(0, 0.1, 0); scene.add(groupe);

// ombre douce sous la bague
const ombre = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.35 }));
ombre.rotation.x = -Math.PI/2; ombre.position.y = -0.62; scene.add(ombre);
const ombreTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64,64,10,64,64,64); r.addColorStop(0,'rgba(0,0,0,.6)'); r.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
ombre.material = new THREE.MeshBasicMaterial({ map: ombreTex, transparent:true, depthWrite:false });

// fil d'or (étape 0)
const fil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 24), or); fil.rotation.z = Math.PI/2; groupe.add(fil);
const chute = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 24), or); chute.rotation.z = Math.PI/2; chute.visible = false; groupe.add(chute);
let anneau = null, tube = 0.15;
function courbe(t, arc){ // t=0 droit → t=1 arc de cercle d'angle `arc`
  const pts = []; const N = 64; const R = 1.0; const Lg = arc * R;
  for (let i=0;i<=N;i++){ const u = i/N; const x = (u-0.5)*Lg; const th = (u-0.5)*arc; const ax = Math.sin(th)*R, ay = (1-Math.cos(th))*R - R*(1-Math.cos(arc/2))*0.5;
    pts.push(new THREE.Vector3(x*(1-t) + ax*t, 0, (0)*(1-t) + ay*t)); }
  return new THREE.CatmullRomCurve3(pts);
}
function majAnneau(t, arc){ const g = new THREE.TubeGeometry(courbe(t, arc), 96, tube, 20, false); if (!anneau){ anneau = new THREE.Mesh(g, or); groupe.add(anneau); } else { anneau.geometry.dispose(); anneau.geometry = g; } }
const tween = (dur, f) => new Promise(res => { const t0 = performance.now(); (function pas(){ const k = Math.min(1, (performance.now()-t0)/dur); f(k < .5 ? 2*k*k : -1+(4-2*k)*k, k); if (k<1) requestAnimationFrame(pas); else res(); })(); });
const dodo = ms => new Promise(r => setTimeout(r, ms));

const anims = {
  async scier(){ // le fil se coupe, la chute s'éloigne
    chute.visible = true; chute.position.x = 2.2 - 0.6;
    await tween(500, k => { fil.scale.y = 1 - 0.27*k; fil.position.x = -0.6*k; });
    particules(26, 800, 470, '#ffd27a', 90);
    await tween(700, k => { chute.position.x = 1.6 + 1.4*k; chute.position.y = -0.9*k*k; chute.rotation.z = Math.PI/2 + 0.8*k; chute.material = or; });
    chute.visible = false;
  },
  async cintrer(){ // le fil s'enroule autour du triboulet (invisible) en anneau ouvert
    fil.visible = false; majAnneau(0, Math.PI*1.86);
    await tween(1400, k => { majAnneau(k, Math.PI*1.86); groupe.rotation.y = k*0.4; });
  },
  async souder(){ // fermeture de la fente + point de chauffe
    const chaud = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color:0xffb050, transparent:true, opacity:0 }));
    anneau.add(chaud); const c = courbe(1, Math.PI*1.86); const pFin = c.getPoint(1); chaud.position.copy(pFin);
    await tween(500, k => { chaud.material.opacity = k*0.9; chaud.scale.setScalar(1+k*0.6); });
    particules(40, 800, 440, '#ffa040', 140); flash();
    await tween(900, k => { majAnneau(1, Math.PI*1.86 + (Math.PI*2 - Math.PI*1.86)*k); chaud.material.opacity = 0.9*(1-k); });
    anneau.remove(chaud);
    // anneau propre fermé
    anneau.geometry.dispose(); anneau.geometry = new THREE.TorusGeometry(1.0, tube, 24, 96); anneau.rotation.x = Math.PI/2;
    // repositionner : TorusGeometry est dans le plan XY → on la couche sur XZ comme la courbe (qui était en XZ)
  },
  async sertir(){ // chaton + griffes + pierre
    const chaton = new THREE.Group(); chaton.position.set(0, 0.06, 1.0); // sur l'anneau (plan XZ, rayon 1) côté caméra une fois tourné
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.32, 32), or); cyl.position.y = 0.16; chaton.add(cyl);
    for (let i=0;i<4;i++){ const g = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.42,10), or); const a = i*Math.PI/2+Math.PI/4; g.position.set(Math.cos(a)*0.27, 0.42, Math.sin(a)*0.27); g.rotation.z = -Math.cos(a)*0.35; g.rotation.x = Math.sin(a)*0.35; chaton.add(g); }
    const pierreMat = new THREE.MeshPhysicalMaterial({ color:0x2457c5, metalness:0, roughness:0.02, transmission:0.55, thickness:0.6, ior:1.77, clearcoat:1, envMapIntensity:1.6 });
    const pierre = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), pierreMat); pierre.scale.set(1, 0.7, 1); pierre.position.y = 0.46; chaton.add(pierre);
    chaton.scale.setScalar(0.001); groupe.add(chaton); groupe.userData.chaton = chaton; groupe.userData.pierre = pierre;
    await tween(700, k => { groupe.rotation.y = 0.4*(1-k); chaton.scale.setScalar(k); });
    particules(30, 800, 420, '#9cc4ff', 110);
    await tween(500, k => { pierre.position.y = 0.46 + Math.sin(k*Math.PI)*0.25; });
  },
  async polir(){
    const pierre = groupe.userData.pierre;
    for (let i=0;i<5;i++){ particules(18, 700+Math.random()*200, 400+Math.random()*120, '#ffffff', 60); await dodo(160); }
    await tween(1200, k => { or.roughness = 0.48 - 0.42*k; or.color.setHex(0xf2c46a).lerp(new THREE.Color(0xffd982), k*0.5); renderer.toneMappingExposure = 1.05 + 0.25*k; });
    flash(); particules(60, 800, 430, '#fff6d0', 220);
    await tween(1200, k => { groupe.rotation.x = -1.6*k; groupe.position.y = 0.1 + 1.0*k; camera.position.lerp(new THREE.Vector3(0, 1.6, 15), 0.08); camera.lookAt(0, 1.1, 0); }); controls.target.set(0, 1.1, 0); controls.enabled = true; controls.autoRotate = true;
    
  }
};

/* ---------- boucle ---------- */
let t0 = performance.now();
function boucle(){ requestAnimationFrame(boucle); const t = (performance.now()-t0)/1000; if (!controls.enabled && !fini){ groupe.position.y = 0.1 + Math.sin(t*1.3)*0.03; } controls.update(); renderer.render(scene, camera); }
boucle();

/* ---------- final ---------- */
function finale(){ $('#final').classList.add('on'); $('#plateau').style.opacity = '0'; $('#plateau').style.pointerEvents = 'none'; for (let i=0;i<6;i++) setTimeout(()=>particules(30, 800, 200, '#ffd27a', 260), i*220); }

/* ---------- démarrage ---------- */
rendTextes();
$('#btn-start').addEventListener('click', () => { $('#intro').classList.add('off'); parle(L().intro, 'montre', 'intro'); });
