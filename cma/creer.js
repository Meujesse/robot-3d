import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { METAUX, PIERRES, NOMBRES, SERTIS, OUTILS, etapesPour, SOURCES } from './creer-donnees.js';

const $ = s => document.querySelector(s);
const MUET = new URLSearchParams(location.search).has('muet');

/* ---------- mise à l'échelle ---------- */
const stage = $('#stage');
function fit(){ const k = Math.min(innerWidth/1600, innerHeight/900); if (k > 0) stage.style.setProperty('--s', k); }
addEventListener('resize', fit); new ResizeObserver(fit).observe(document.documentElement); fit();
$('#sources').textContent = SOURCES;

/* ---------- état ---------- */
const S = { metal: 'orjaune', nombre: 1, pierres: { gauche: 'diamant', centre: 'diamant', droite: 'diamant' }, place: 'centre', serti: 'griffes', etape: 'metal', faits: new Set(), fab: 0, enCours: false, prenom: '' };
const ORDRE = ['metal', 'pierre', 'serti', 'verif', 'fabrication', 'fin'];
const NOM_PLACE = { gauche: 'Gauche', centre: 'Centre', droite: 'Droite' };
const ANGLES = { 1: { centre: [0, 1] }, 2: { gauche: [-0.2, 0.85], droite: [0.2, 0.85] }, 3: { gauche: [-0.34, 0.72], centre: [0, 1], droite: [0.34, 0.72] } };
const places = () => Object.keys(ANGLES[S.nombre]);
const utilisees = () => [...new Set(places().map(k => S.pierres[k]))];
const hex = n => '#' + n.toString(16).padStart(6, '0');
const hexPierre = k => k === 'diamant' ? '#dcefff' : hex(PIERRES[k].couleur);

/* ---------- Julie ---------- */
const sons = {};
function joue(cle){
  if (MUET) return;
  Object.values(sons).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
  const a = sons[cle] || (sons[cle] = new Audio(`audio/fr-${cle}.mp3`));
  a.play().catch(() => {});
}
function parle(html, pose, son){
  const b = $('#bulle'); $('#bulle-texte').innerHTML = html;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  if (pose) $('#julie-img').src = `img/julie-${pose}.png`;
  $('#julie').classList.remove('discret');
  if (son) joue(son);
}

/* ---------- fiche découverte ---------- */
function bloc(t, p){ return `<div class="bloc"><b>${t}</b><p>${p}</p></div>`; }
function jauge(val, max, label){ return `<div class="jauge"><div class="barre"><i style="width:${Math.round(val/max*100)}%"></i></div><span>${label}</span></div>`; }
function fiche(sur, titre, html){
  $('#fiche-sur').textContent = sur; $('#fiche-titre').textContent = titre; $('#fiche-corps').innerHTML = html;
  const f = $('#fiche'); f.classList.remove('pulse'); void f.offsetWidth; f.classList.add('pulse');
}
function ficheMetal(k){
  const m = METAUX[k];
  fiche('Fiche métal', m.nom,
    jauge(m.precieux, 4, m.precieux >= 4 ? 'Très précieux' : m.precieux >= 2 ? 'Précieux' : 'Accessible') +
    bloc('Composition', m.compo) + bloc('Pourquoi ce métal ?', m.pourquoi) + bloc('En bijouterie', m.usage) + bloc('Prix', m.prix) +
    (m.special ? `<div class="savais"><b>Le savais-tu ?</b> ${m.special}</div>` : ''));
}
function fichePierre(k){
  const p = PIERRES[k];
  fiche('Fiche pierre', p.nom,
    jauge(p.durete, 10, `Dureté ${String(p.durete).replace('.', ',')} / 10`) +
    bloc('De quoi est-elle faite ?', `${p.compo} ${p.couleurTxt}`) + bloc('Résistance', p.durTxt) + bloc('Symbole', p.symbole) +
    `<div class="savais"><b>Le savais-tu ?</b> Le prix d'une pierre dépend de son poids en carats, de sa couleur, de sa pureté et de la qualité de sa taille.</div>`);
}
function ficheSerti(){
  const s = SERTIS[S.serti], n = NOMBRES[S.nombre];
  const conseils = utilisees().map(k => `<b>${PIERRES[k].nom} :</b> ${PIERRES[k].conseil}`).join('<br>');
  fiche('Fiche serti', s.nom, bloc('Comment ça tient ?', s.txt) + bloc(`${n.nom} · ${S.nombre} pierre${S.nombre > 1 ? 's' : ''}`, n.txt) +
    `<div class="savais">${conseils}</div>`);
}
function ficheOutil(cle){
  const o = OUTILS[cle];
  fiche('Fiche geste', o.geste, bloc('Outil', o.outil) + bloc('À quoi ça sert ?', o.txt) +
    (cle === 'usiner' ? `<div class="savais"><b>Le savais-tu ?</b> ${METAUX.titane.special}</div>` : ''));
}

/* ---------- navigation ---------- */
function majNav(){
  document.querySelectorAll('#etapes button').forEach(b => {
    const e = b.dataset.e; b.classList.toggle('actif', e === S.etape); b.classList.toggle('fait', S.faits.has(e) && e !== S.etape);
  });
}
document.querySelectorAll('#etapes button').forEach(b => b.addEventListener('click', () => {
  const e = b.dataset.e;
  if (S.enCours || !S.faits.has(e)) return;
  if (S.etape === 'fin' || S.etape === 'fabrication') return; // on ne revient pas en arrière pendant ou après la fabrication
  if (ORDRE.indexOf(e) <= 3) va(e);
}));
function va(e){ S.etape = e; majNav(); rend[e](); plan(); }

/* ---------- panneaux ---------- */
const pan = $('#panneau');
function optMetal(k){ const m = METAUX[k]; return `<button class="opt ${S.metal===k?'on':''}" data-metal="${k}"><span class="pastille" style="background:#${m.couleur.toString(16).padStart(6,'0')}"></span><span>${m.nom}</span></button>`; }
const rend = {
  metal(){
    pan.innerHTML = `<h3>Choisis ton métal</h3><p class="aide">Clique sur un métal : sa fiche s'ouvre à droite et ton plan se colore. Ta vraie bague, tu la découvriras à la fin !</p>
      <div class="sous">Or 18 carats · 3 couleurs</div><div class="choix trois">${['orjaune','orrose','orblanc'].map(optMetal).join('')}</div>
      <div class="sous">Autres matériaux</div><div class="choix trois">${['argent','titane','plaque'].map(optMetal).join('')}</div>
      <button class="suivant" id="ok">Valider le métal</button>`;
    pan.querySelectorAll('[data-metal]').forEach(b => b.addEventListener('click', () => { S.metal = b.dataset.metal; rend.metal(); ficheMetal(S.metal); plan(); }));
    $('#ok').addEventListener('click', () => { S.faits.add('metal'); va('pierre'); fichePierre(S.pierres[S.place]); parle("Maintenant, les pierres ! Tu peux mettre <b>une pierre différente à chaque place</b>.", 'montre'); });
    ficheMetal(S.metal);
  },
  pierre(){
    if (!places().includes(S.place)) S.place = places()[0];
    const nb = n => `<button class="opt nb ${S.nombre===n?'on':''}" data-nombre="${n}"><span class="pts">${'◆'.repeat(n)}</span><span>${NOMBRES[n].nom}</span></button>`;
    const pl = k => `<button class="opt place ${S.place===k?'on':''}" data-place="${k}"><span class="gemme" style="background:${hexPierre(S.pierres[k])}"></span><span>${NOM_PLACE[k]}<small>${PIERRES[S.pierres[k]].nom}</small></span></button>`;
    const opt = k => { const p = PIERRES[k]; return `<button class="opt ${S.pierres[S.place]===k?'on':''}" data-pierre="${k}"><span class="gemme" style="background:${hexPierre(k)}"></span><span>${p.nom}</span></button>`; };
    pan.innerHTML = `<h3>Choisis tes pierres</h3>
      <div class="sous" style="margin-top:6px">1. Combien de pierres ?</div><div class="choix trois">${[1,2,3].map(nb).join('')}</div>
      ${S.nombre > 1 ? `<div class="sous">2. Choisis une place</div><div class="choix ${S.nombre===3?'trois':''}">${places().map(pl).join('')}</div>` : ''}
      <div class="sous">${S.nombre > 1 ? '3. Pose une pierre à la place « ' + NOM_PLACE[S.place].toLowerCase() + ' »' : '2. Choisis ta pierre'}</div><div class="choix trois">${['diamant','rubis','emeraude'].map(opt).join('')}</div>
      ${S.nombre > 1 ? '<button class="btn2 partout" id="partout">Mettre la même pierre partout</button>' : ''}
      <button class="suivant" id="ok">Valider mes pierres</button>`;
    pan.querySelectorAll('[data-nombre]').forEach(b => b.addEventListener('click', () => { S.nombre = +b.dataset.nombre; S.place = places()[0]; rend.pierre(); plan(); fiche('Fiche modèle', NOMBRES[S.nombre].nom, bloc(`${S.nombre} pierre${S.nombre>1?'s':''}`, NOMBRES[S.nombre].txt)); }));
    pan.querySelectorAll('[data-place]').forEach(b => b.addEventListener('click', () => { S.place = b.dataset.place; rend.pierre(); plan(); fichePierre(S.pierres[S.place]); }));
    pan.querySelectorAll('[data-pierre]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.pierre; S.pierres[S.place] = k;
      if (S.nombre === 1) ['gauche','droite'].forEach(c => S.pierres[c] = k);
      fichePierre(k);
      const ps = places(), i = ps.indexOf(S.place); if (S.nombre > 1 && i < ps.length - 1) S.place = ps[i + 1];
      rend.pierre(); plan();
    }));
    $('#partout')?.addEventListener('click', () => { const k = S.pierres[S.place]; Object.keys(S.pierres).forEach(c => S.pierres[c] = k); rend.pierre(); plan(); });
    $('#ok').addEventListener('click', () => { S.faits.add('pierre'); va('serti'); ficheSerti(); parle("Comment tenir tes pierres ? Avec des <b>griffes</b> ou dans un <b>serti clos</b>. Lis bien les conseils !", 'reflechit'); });
  },
  serti(){
    const opt = k => `<button class="opt ${S.serti===k?'on':''}" data-serti="${k}"><span>${SERTIS[k].nom}<small>${k==='griffes'?'la pierre brille au maximum':'la pierre est protégée'}</small></span></button>`;
    pan.innerHTML = `<h3>Choisis ton serti</h3><p class="aide">Le serti, c'est la façon dont le métal tient la pierre.</p>
      <div class="choix">${['griffes','clos'].map(opt).join('')}</div>
      <button class="suivant" id="ok">Vérifier ma bague</button>`;
    pan.querySelectorAll('[data-serti]').forEach(b => b.addEventListener('click', () => { S.serti = b.dataset.serti; rend.serti(); ficheSerti(); plan(); }));
    $('#ok').addEventListener('click', () => { S.faits.add('serti'); va('verif'); ficheVerif(); parle("Regarde bien ton plan. <b>C'est bien la bague que tu veux ?</b> Après, on passe à l'atelier !", 'reflechit'); });
  },
  verif(){
    pan.innerHTML = `<h3>C'est bien ta bague ?</h3><p class="aide">Vérifie chaque élément. Une fois la fabrication lancée, on ne peut plus rien changer.</p>
      ${recap(true)}
      <button class="suivant" id="ok">Oui, je la fabrique !</button>
      <div class="boutons"><button class="btn2" data-retour="metal">Changer le métal</button><button class="btn2" data-retour="pierre">Changer les pierres</button><button class="btn2" data-retour="serti">Changer le serti</button></div>`;
    pan.querySelectorAll('[data-retour]').forEach(b => b.addEventListener('click', () => { const e = b.dataset.retour; va(e); if (e === 'metal') ficheMetal(S.metal); if (e === 'pierre') fichePierre(S.pierres[S.place]); if (e === 'serti') ficheSerti(); }));
    $('#ok').addEventListener('click', () => { S.faits.add('verif'); lanceFabrication(); });
  },
  fabrication(){
    const et = etapesPour(METAUX[S.metal].famille);
    pan.innerHTML = `<h3>Fabrique ta bague</h3><p class="aide">Glisse les bons outils sur l'établi, dans l'ordre. Avec ${METAUX[S.metal].court}, voici les gestes :</p>
      <ol class="liste-gestes">${et.map((c,i) => `<li class="${i<S.fab?'fait':i===S.fab?'actif':''}"><span class="n">${i+1}</span>${OUTILS[c].geste}</li>`).join('')}</ol>
      <div class="sous">Ta création</div>${recap()}`;
  },
  fin(){
    pan.innerHTML = `<h3>${nomBague()}</h3><p class="aide">Fais-la tourner avec la souris. Elle est unique : garde un souvenir de ta création !</p>
      ${recap()}
      <label class="prenom">Ton prénom (pour ta fiche)<input id="prenom" maxlength="24" placeholder="Écris ton prénom" value="${S.prenom}"></label>
      <div class="boutons">
        <button class="suivant" id="dl-fiche" style="margin-top:6px">Télécharger ma fiche (image)</button>
        <button class="btn2" id="dl-glb">Télécharger ma bague en 3D (.glb)</button>
        <button class="btn2" id="refaire">Créer une autre bague</button>
      </div>`;
    $('#prenom').addEventListener('input', e => S.prenom = e.target.value.trim());
    $('#dl-fiche').addEventListener('click', telechargeFiche);
    $('#dl-glb').addEventListener('click', telechargeGLB);
    $('#refaire').addEventListener('click', () => location.reload());
  }
};
function textePierres(){
  const u = utilisees();
  if (u.length === 1) return `${PIERRES[u[0]].nom} × ${S.nombre}`;
  return places().map(k => `${NOM_PLACE[k]} : ${PIERRES[S.pierres[k]].nom}`).join(' · ');
}
function recap(detail){
  const lp = detail && S.nombre > 1 ? places().map(k => `<li><span>Pierre ${NOM_PLACE[k].toLowerCase()}</span><span>${PIERRES[S.pierres[k]].nom}</span></li>`).join('') : `<li><span>Pierre${S.nombre>1?'s':''}</span><span>${textePierres()}</span></li>`;
  return `<ul class="recap"><li><span>Métal</span><span>${METAUX[S.metal].nom}</span></li>${lp}<li><span>Modèle</span><span>${NOMBRES[S.nombre].nom}</span></li><li><span>Serti</span><span>${SERTIS[S.serti].nom}</span></li></ul>`;
}
function nomBague(){
  const u = utilisees();
  if (u.length === 1){
    const art = { diamant: 'au diamant', rubis: 'au rubis', emeraude: "à l'émeraude" }[u[0]];
    const pl = { diamant: 'aux diamants', rubis: 'aux rubis', emeraude: 'aux émeraudes' }[u[0]];
    return `${NOMBRES[S.nombre].nom} ${S.nombre > 1 ? pl : art}, ${METAUX[S.metal].court}`;
  }
  const noms = u.map(k => PIERRES[k].nom.toLowerCase());
  return `${NOMBRES[S.nombre].nom} ${noms.slice(0, -1).join(', ')} et ${noms.slice(-1)}, ${METAUX[S.metal].court}`;
}
function ficheVerif(){
  fiche('Bon de fabrication', nomBague(), bloc('Métal', METAUX[S.metal].nom + '. ' + METAUX[S.metal].compo) +
    utilisees().map(k => bloc(PIERRES[k].nom, `${PIERRES[k].compo} ${PIERRES[k].durTxt}`)).join('') + bloc('Serti', SERTIS[S.serti].nom));
}

/* ---------- plan dessiné (gouaché) ---------- */
function plan(){
  const el = $('#plan'); if (!el) return;
  const visible = ['metal', 'pierre', 'serti', 'verif'].includes(S.etape);
  el.classList.toggle('off', !visible); if (!visible) return;
  const m = METAUX[S.metal], cx = 200, cy = 250, r = 118, c = hex(m.couleur);
  let gem = '';
  for (const [k, [ang0, ech]] of Object.entries(ANGLES[S.nombre])){
    const ang = ang0 * 1.75, d = r + 34 * ech, x = cx + d * Math.sin(ang), y = cy - d * Math.cos(ang), t = 24 * ech, pk = S.pierres[k], col = hexPierre(pk);
    const rot = ang * 180 / Math.PI;
    const forme = PIERRES[pk].taille === 'emeraude'
      ? `<polygon points="${-t*1.15},${-t*0.55} ${-t*0.8},${-t*0.9} ${t*0.8},${-t*0.9} ${t*1.15},${-t*0.55} ${t*1.15},${t*0.55} ${t*0.8},${t*0.9} ${-t*0.8},${t*0.9} ${-t*1.15},${t*0.55}" fill="${col}" stroke="#3d2708" stroke-width="1.6"/><rect x="${-t*0.6}" y="${-t*0.35}" width="${t*1.2}" height="${t*0.7}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>`
      : `<circle r="${t}" fill="${col}" stroke="#3d2708" stroke-width="1.6"/><polygon points="0,${-t*0.55} ${t*0.55},0 0,${t*0.55} ${-t*0.55},0" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.2"/><path d="M0 ${-t} L0 ${-t*0.55} M${t} 0 L${t*0.55} 0 M0 ${t} L0 ${t*0.55} M${-t} 0 L${-t*0.55} 0" stroke="rgba(255,255,255,.5)" stroke-width="1"/>`;
    const serti = S.serti === 'clos'
      ? `<rect x="${-t*1.35}" y="${-t*1.15}" width="${t*2.7}" height="${t*2.3}" rx="${t*0.9}" fill="none" stroke="${c}" stroke-width="${6*ech}"/>`
      : [45, 135, 225, 315].map(a => `<circle cx="${Math.cos(a*Math.PI/180)*t*1.05}" cy="${Math.sin(a*Math.PI/180)*t*1.05}" r="${4.2*ech}" fill="${c}" stroke="#3d2708" stroke-width="1"/>`).join('');
    const choisi = S.etape === 'pierre' && S.nombre > 1 && S.place === k;
    gem += `<g transform="translate(${x} ${y}) rotate(${rot})" class="slot" data-place="${k}">${choisi ? `<circle r="${t*1.9}" fill="none" stroke="#c9762b" stroke-width="2.5" stroke-dasharray="6 5"/>` : ''}${forme}${serti}</g>`;
    if (S.nombre > 1) gem += `<text x="${cx + (d + 58) * Math.sin(ang)}" y="${cy - (d + 58) * Math.cos(ang)}" text-anchor="middle" class="etiq">${NOM_PLACE[k]}</text>`;
  }
  el.innerHTML = `<div class="plan-sur">Ton plan de bague</div><div class="plan-titre">le gouaché du bijoutier</div>
    <svg viewBox="0 0 400 420"><defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="26"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#gm)" stroke-width="26" opacity=".8"/>
    <circle cx="${cx}" cy="${cy}" r="${r+13}" fill="none" stroke="#3d2708" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${r-13}" fill="none" stroke="#3d2708" stroke-width="1.4"/>
    ${gem}</svg>
    <div class="plan-legende">${m.nom} · ${textePierres()} · ${SERTIS[S.serti].nom}</div>`;
  el.querySelectorAll('.slot').forEach(g => g.addEventListener('click', () => { if (S.etape !== 'pierre' || S.nombre === 1) return; S.place = g.dataset.place; rend.pierre(); plan(); fichePierre(S.pierres[S.place]); }));
}

/* ---------- scène 3D ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(1600, 900, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
$('#scene3d').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1600/900, 0.1, 100);
camera.position.set(0, 1.7, 13.5); camera.lookAt(0, 0.35, 0);
const spot = new THREE.SpotLight(0xffe2b0, 60, 30, Math.PI/5, 0.5, 1.2); spot.position.set(3, 6, 5); scene.add(spot);
const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8); rim.position.set(-4, 2, -3); scene.add(rim);
scene.add(new THREE.AmbientLight(0xfff1dd, 0.2));
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; controls.enablePan = false; controls.minDistance = 8; controls.maxDistance = 20; controls.target.set(0, 0.35, 0);
renderer.domElement.style.pointerEvents = 'none';

const R = 0.95, TUBE = 0.15;
const racine = new THREE.Group(); scene.add(racine);
const matMetal = new THREE.MeshStandardMaterial({ color: METAUX.orjaune.couleur, metalness: 1, roughness: 0.16 });
let bague = null;

function geomPierre(taille){
  const pts = taille === 'emeraude'
    ? [[0,-0.30],[0.20,-0.10],[0.36,0],[0.36,0.05],[0.30,0.14],[0.22,0.18],[0,0.18]]
    : [[0,-0.40],[0.38,0],[0.38,0.035],[0.26,0.15],[0.20,0.19],[0,0.19]];
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), taille === 'emeraude' ? 8 : 16);
  if (taille === 'emeraude') g.scale(1.25, 1, 0.9);
  return g.toNonIndexed();
}
function matPierre(k){
  const p = PIERRES[k];
  const m = new THREE.MeshPhysicalMaterial({ color: p.couleur, metalness: 0, roughness: 0.02, transmission: k === 'diamant' ? 1 : 0.35, thickness: 0.6, ior: p.ior, clearcoat: 1, envMapIntensity: k === 'diamant' ? 3 : 2, flatShading: true });
  if ('dispersion' in m && k === 'diamant') m.dispersion = 0.5;
  if (k !== 'diamant') { m.attenuationColor = new THREE.Color(p.couleur); m.attenuationDistance = 0.4; }
  return m;
}
function monture(taille, echelle){
  const g = new THREE.Group();
  const rayon = (taille === 'emeraude' ? 0.42 : 0.38) * echelle;
  if (S.serti === 'clos'){
    const prof = [[rayon*0.92,-0.06],[rayon*1.14,-0.06],[rayon*1.14,0.09],[rayon*0.98,0.1]].map(p => new THREE.Vector2(p[0], p[1]));
    const b = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), matMetal); if (taille === 'emeraude') b.scale.set(1.25/1.0, 1, 0.9); g.add(b);
  } else {
    const n = taille === 'emeraude' ? 4 : 6;
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + Math.PI / n;
      const x = Math.cos(a) * rayon * (taille === 'emeraude' ? 1.2 : 1), z = Math.sin(a) * rayon * (taille === 'emeraude' ? 0.9 : 1);
      const griffe = new THREE.Mesh(new THREE.CylinderGeometry(0.035*echelle, 0.05*echelle, 0.42*echelle, 8), matMetal);
      griffe.position.set(x * 0.9, -0.08*echelle, z * 0.9); griffe.lookAt(x * 1.3, 1, z * 1.3); griffe.rotateX(Math.PI/2);
      const bout = new THREE.Mesh(new THREE.SphereGeometry(0.045*echelle, 10, 8), matMetal); bout.position.set(x * 0.98, 0.12*echelle, z * 0.98);
      g.add(griffe, bout);
    }
    const panier = new THREE.Mesh(new THREE.TorusGeometry(rayon*0.7, 0.03*echelle, 8, 32), matMetal); panier.rotation.x = Math.PI/2; panier.position.y = -0.18*echelle; g.add(panier);
  }
  return g;
}
function construitPierres(){
  const grp = new THREE.Group();
  for (const [place, [ang, ech]] of Object.entries(ANGLES[S.nombre])){
    const cle = S.pierres[place], p = PIERRES[cle];
    const piv = new THREE.Group(); piv.rotation.z = -ang;
    const porte = new THREE.Group(); porte.position.y = R + TUBE + 0.26 * ech; piv.add(porte);
    const gem = new THREE.Mesh(geomPierre(p.taille), matPierre(cle)); gem.scale.setScalar(ech); gem.position.y = 0.02 * ech; porte.add(gem);
    const mont = monture(p.taille, ech); porte.add(mont);
    const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.16*ech, 0.2*ech, 0.24*ech, 16), matMetal); pied.position.y = -0.2*ech; porte.add(pied);
    grp.add(piv);
  }
  return grp;
}
function construitBague(){
  if (bague){ racine.remove(bague); bague.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  bague = new THREE.Group();
  const anneau = new THREE.Mesh(new THREE.TorusGeometry(R, TUBE, 32, 128), matMetal); bague.add(anneau);
  bague.userData.anneau = anneau;
  const pierres = construitPierres(); bague.add(pierres); bague.userData.pierres = pierres;
  racine.add(bague);
}
function couleurMetal(){ const m = METAUX[S.metal]; matMetal.color.setHex(m.couleur); matMetal.roughness = m.rugo; }
function majBague(){ couleurMetal(); construitBague(); }

/* ---------- boucle ---------- */
let rot = true;
function boucle(){
  requestAnimationFrame(boucle);
  if (rot && !controls.enabled) racine.rotation.y += 0.006;
  controls.update(); renderer.render(scene, camera);
}
couleurMetal(); construitBague(); racine.visible = false; boucle();

/* ---------- effets ---------- */
const fx = $('#fx');
function particules(n, x, y, c, portee = 160){
  for (let i = 0; i < n; i++){
    const d = document.createElement('div'); d.className = 'part'; const a = Math.random()*Math.PI*2, r = 40 + Math.random()*portee;
    Object.assign(d.style, { left: x+'px', top: y+'px', background: c, boxShadow: `0 0 8px ${c}`, animationDuration: (.6+Math.random()*.8)+'s' });
    d.style.setProperty('--dx', Math.cos(a)*r+'px'); d.style.setProperty('--dy', Math.sin(a)*r-30+'px'); fx.appendChild(d); setTimeout(() => d.remove(), 1500);
  }
}
function flash(){ const f = document.createElement('div'); f.className = 'flash'; fx.appendChild(f); setTimeout(() => f.remove(), 700); }
const tween = (ms, f) => new Promise(res => { const t0 = performance.now(); (function pas(){ const k = Math.min(1, (performance.now()-t0)/ms); const e = k < .5 ? 2*k*k : -1+(4-2*k)*k; f(e, k); if (k < 1) requestAnimationFrame(pas); else res(); })(); });
const dodo = ms => new Promise(r => setTimeout(r, ms));

/* ---------- fabrication ---------- */
let morph = null, brut = null;
function courbe(t, arc){
  const pts = [], N = 96, L = arc * R * 0.55;
  for (let i = 0; i <= N; i++){
    const u = i / N, th = Math.PI/2 - (u - 0.5) * arc;
    const sx = (u - 0.5) * L, sy = R;
    pts.push(new THREE.Vector3(sx*(1-t) + R*Math.cos(th)*t, sy*(1-t) + R*Math.sin(th)*t, 0));
  }
  return new THREE.CatmullRomCurve3(pts);
}
function metMorph(t, arc){
  const g = new THREE.TubeGeometry(courbe(t, arc), 128, TUBE, 20, false);
  if (!morph){ morph = new THREE.Mesh(g, matMetal); racine.add(morph); } else { morph.geometry.dispose(); morph.geometry = g; }
}
function etatBrut(){
  couleurMetal(); construitBague(); racine.visible = true;
  const fam = METAUX[S.metal].famille;
  bague.visible = false; bague.userData.pierres.visible = false;
  racine.rotation.set(0, 0, 0); rot = false;
  if (fam === 'plaque') matMetal.color.setHex(METAUX.plaque.base);
  matMetal.roughness = 0.55;
  if (fam === 'titane'){
    brut = new THREE.Mesh(new THREE.CylinderGeometry(R + TUBE, R + TUBE, 1.7, 64, 1, true), new THREE.MeshStandardMaterial({ color: METAUX.titane.couleur, metalness: 1, roughness: 0.5, side: THREE.DoubleSide }));
    brut.rotation.x = Math.PI/2; brut.rotation.z = 0; racine.add(brut);
    racine.rotation.y = -0.6;
  } else {
    metMorph(0, Math.PI * 1.86);
  }
}
const anims = {
  async scier(){ particules(26, 800, 440, '#ffd27a', 90); await tween(600, k => { morph.scale.x = 1 - 0.12*k; }); },
  async cintrer(){ morph.scale.x = 1; await tween(1400, k => metMorph(k, Math.PI * 1.86)); },
  async souder(){ particules(40, 800, 330, '#ffa040', 140); flash(); await tween(900, k => metMorph(1, Math.PI*1.86 + Math.PI*0.14*k)); racine.remove(morph); morph = null; bague.visible = true; },
  async usiner(){
    for (let i = 0; i < 6; i++) setTimeout(() => particules(14, 800 + (Math.random()-.5)*160, 450, '#c9ced6', 80), i*180);
    await tween(1600, k => { brut.rotation.y += 0.5; brut.scale.y = 1 - 0.82*k; });
    racine.remove(brut); brut = null; bague.visible = true;
    await tween(700, k => { racine.rotation.y = -0.6 * (1-k); });
  },
  async polir(){
    for (let i = 0; i < 5; i++){ particules(16, 700 + Math.random()*200, 330 + Math.random()*200, '#ffffff', 60); await dodo(140); }
    const cible = METAUX[S.metal].rugo; const r0 = matMetal.roughness;
    await tween(1000, k => { matMetal.roughness = r0 + (cible - r0) * k; });
  },
  async dorer(){
    const c0 = new THREE.Color(METAUX.plaque.base), c1 = new THREE.Color(METAUX.plaque.couleur);
    for (let i = 0; i < 5; i++) setTimeout(() => particules(18, 800, 420, '#ffd35a', 170), i*220);
    await tween(1400, k => { matMetal.color.copy(c0).lerp(c1, k); });
  },
  async sertir(){
    const p = bague.userData.pierres; p.visible = true;
    await tween(800, k => p.scale.setScalar(Math.max(0.001, k)));
    utilisees().forEach(k => particules(20, 800, 290, k === 'rubis' ? '#ff6b7d' : k === 'emeraude' ? '#6bffb0' : '#dff1ff', 110));
  }
};
function lanceFabrication(){
  S.etape = 'fabrication'; S.fab = 0; majNav(); plan();
  etatBrut(); rend.fabrication(); ficheOutil(etapesPour(METAUX[S.metal].famille)[0]);
  const et = etapesPour(METAUX[S.metal].famille);
  const tous = ['scier','cintrer','souder','usiner','polir','dorer','sertir'].filter(c => et.includes(c));
  const melange = [...tous].sort(() => Math.random() - 0.5);
  $('#outils').innerHTML = melange.map(c => `<div class="outil" data-cle="${c}"><img src="${OUTILS[c].img}" alt=""><span>${OUTILS[c].outil}</span></div>`).join('');
  $('#plateau').hidden = false; $('#zone-depot').style.display = 'block';
  if (METAUX[S.metal].famille === 'titane') parle("Avec le titane, pas de soudure ! On taille la bague <b>au tour</b>, directement dans un tube. Glisse le tour sur l'établi.", 'montre', 'creer-titane');
  else parle(`Super choix ! Maintenant, fabrique ta bague. Attention : selon le métal, les outils changent. Commence par : <b>${OUTILS[et[0]].outil.toLowerCase()}</b>.`, 'montre', 'creer-fabrique');
}
async function reussite(o){
  const et = etapesPour(METAUX[S.metal].famille), cle = et[S.fab];
  S.enCours = true; o.classList.add('utilise');
  await anims[cle]();
  S.fab++; rend.fabrication();
  if (S.fab >= et.length){ S.enCours = false; return fin(); }
  ficheOutil(et[S.fab]);
  parle(`Bien joué ! Étape suivante : <b>${OUTILS[et[S.fab]].geste.toLowerCase()}</b> avec ${/^[AÉÈEIOU]/.test(OUTILS[et[S.fab]].outil) ? "l'" : 'le '}${OUTILS[et[S.fab]].outil.toLowerCase()}.`, 'montre');
  S.enCours = false;
}
function echec(o){ o.classList.remove('secoue'); void o.offsetWidth; o.classList.add('secoue'); parle("Pas celui-là ! Regarde l'étape en cours, à gauche.", 'reflechit', 'faux'); }
async function fin(){
  $('#plateau').hidden = true; $('#zone-depot').style.display = 'none';
  S.faits.add('fabrication'); S.faits.add('fin'); S.etape = 'fin'; majNav();
  couleurMetal(); flash(); for (let i = 0; i < 6; i++) setTimeout(() => particules(30, 800, 300, '#ffd27a', 260), i*200);
  const rev = $('#revelation'); rev.hidden = false; rev.classList.remove('on'); void rev.offsetWidth; rev.classList.add('on'); setTimeout(() => rev.hidden = true, 2600);
  const y0 = racine.rotation.y; await tween(1600, k => { racine.rotation.y = y0 + k * Math.PI * 2; racine.scale.setScalar(0.85 + 0.15 * Math.sin(k * Math.PI / 2)); racine.position.y = 0.25 * Math.sin(k * Math.PI); });
  controls.enabled = true; controls.autoRotate = true; controls.autoRotateSpeed = 2.4; renderer.domElement.style.pointerEvents = 'auto';
  rend.fin();
  fiche('Ta création', 'Une bague unique', bloc('Métal', `${METAUX[S.metal].nom}. ${METAUX[S.metal].compo}`) + bloc(S.nombre > 1 ? 'Pierres' : 'Pierre', textePierres()) + bloc('Serti', SERTIS[S.serti].txt));
  parle("Waouh, elle est <b>unique</b> ! Fais-la tourner, puis télécharge ta fiche pour garder ta création.", 'bravo', 'creer-fin');
}

/* ---------- glisser-déposer ---------- */
let fantome = null, drag = null;
function xy(ev){ const r = stage.getBoundingClientRect(); const k = parseFloat(getComputedStyle(stage).getPropertyValue('--s')) || 1; return { x: (ev.clientX - r.left)/k, y: (ev.clientY - r.top)/k }; }
function surCible(ev){ const r = $('#zone-depot').getBoundingClientRect(); return ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom; }
$('#outils').addEventListener('pointerdown', ev => {
  const o = ev.target.closest('.outil'); if (!o || o.classList.contains('utilise') || S.enCours) return;
  ev.preventDefault(); drag = o;
  fantome = document.createElement('div'); fantome.id = 'fantome'; fantome.innerHTML = `<img src="${o.querySelector('img').src}" alt="">`; stage.appendChild(fantome);
  const p = xy(ev); fantome.style.left = p.x+'px'; fantome.style.top = p.y+'px'; stage.classList.add('glisse');
});
addEventListener('pointermove', ev => { if (!drag) return; const p = xy(ev); fantome.style.left = p.x+'px'; fantome.style.top = p.y+'px'; });
addEventListener('pointerup', ev => {
  if (!drag) return; const o = drag; drag = null; stage.classList.remove('glisse'); fantome?.remove(); fantome = null;
  if (!surCible(ev)) return;
  const attendu = etapesPour(METAUX[S.metal].famille)[S.fab];
  if (o.dataset.cle === attendu) reussite(o); else echec(o);
});

/* ---------- téléchargements ---------- */
function declenche(url, nom){
  const a = document.createElement('a'); a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
}
function lignes(ctx, txt, x, y, larg, haut){
  const mots = txt.split(' '); let l = '';
  for (const m of mots){ const t = l ? l + ' ' + m : m; if (ctx.measureText(t).width > larg && l){ ctx.fillText(l, x, y); y += haut; l = m; } else l = t; }
  if (l){ ctx.fillText(l, x, y); y += haut; }
  return y;
}
async function telechargeFiche(){
  await document.fonts.ready;
  const W = 1800, H = 1100, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const fond = g.createLinearGradient(0, 0, 0, H); fond.addColorStop(0, '#fbf3e2'); fond.addColorStop(1, '#efe2c4'); g.fillStyle = fond; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(138,90,22,.45)'; g.lineWidth = 3; g.strokeRect(24, 24, W-48, H-48);
  // image de la bague
  const cadre = g.createRadialGradient(470, 560, 40, 470, 560, 460); cadre.addColorStop(0, '#3d2708'); cadre.addColorStop(1, '#120b05');
  g.fillStyle = cadre; g.beginPath(); g.roundRect(70, 150, 800, 820, 30); g.fill();
  controls.autoRotate = false; renderer.render(scene, camera);
  const src = renderer.domElement, sw = src.width, sh = src.height, cote = Math.min(sw, sh) * 0.56;
  g.drawImage(src, (sw - cote)/2, (sh - cote)/2 - sh*0.03, cote, cote, 90, 170, 760, 760);
  controls.autoRotate = true;
  g.fillStyle = '#e2b45a'; g.font = '800 22px Nunito'; g.fillText('HUB DES MÉTIERS D\'ART · BIJOUTERIE & MÉTAUX', 70, 92);
  g.fillStyle = '#3d2708'; g.font = '700 50px Cinzel'; g.fillText(S.prenom ? `La bague de ${S.prenom}` : 'Ma bague unique', 70, 132);
  g.fillStyle = 'rgba(255,244,220,.85)'; g.font = '700 24px Nunito';
  g.fillText(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), 100, 945);
  // texte
  let x = 930, y = 190; const larg = 800;
  const titre = (t) => { g.fillStyle = '#8a5a16'; g.font = '800 19px Nunito'; g.fillText(t.toUpperCase(), x, y); y += 32; };
  const texte = (t, taille = 23, coul = '#1a1410', poids = 600) => { g.fillStyle = coul; g.font = `${poids} ${taille}px Nunito`; y = lignes(g, t, x, y, larg, taille * 1.38); y += 8; };
  g.fillStyle = '#3d2708'; g.font = '700 36px Cinzel'; y = lignes(g, nomBague(), x, y, larg, 44); y += 16;
  const m = METAUX[S.metal], u = utilisees();
  titre('Métal · ' + m.nom); texte(m.compo, 21); texte(m.prix, 19, '#5a3a0c');
  titre(`${S.nombre > 1 ? 'Pierres' : 'Pierre'} · ${NOMBRES[S.nombre].nom} · ${textePierres()}`);
  const petit = u.length > 1;
  u.forEach(k => { const p = PIERRES[k]; texte(`${p.nom} : ${p.compo} ${p.couleurTxt} Dureté ${String(p.durete).replace('.', ',')} sur 10. ${p.symbole}`, petit ? 18 : 21); });
  titre('Serti · ' + SERTIS[S.serti].nom); texte(SERTIS[S.serti].txt);
  titre('Mes gestes de fabrication'); texte(etapesPour(m.famille).map((k, i) => `${i+1}. ${OUTILS[k].geste} (${OUTILS[k].outil.toLowerCase()})`).join('   '), 20);
  if (m.special){ titre('Le savais-tu ?'); texte(m.special, 20); }
  g.fillStyle = 'rgba(26,20,16,.55)'; g.font = '600 13px Nunito'; lignes(g, SOURCES, 70, H - 70, W - 140, 18);
  const url = c.toDataURL('image/png');
  declenche(url, `ma-bague-${(S.prenom || 'unique').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
  $('#apercu-img').src = url; $('#apercu').hidden = false;
}
$('#apercu-fermer').addEventListener('click', () => $('#apercu').hidden = true);
function telechargeGLB(){
  new GLTFExporter().parse(bague, res => {
    const url = URL.createObjectURL(new Blob([res], { type: 'model/gltf-binary' }));
    declenche(url, `ma-bague-${(S.prenom || 'unique').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.glb`);
  }, err => console.error(err), { binary: true });
}

/* ---------- démarrage ---------- */
majNav(); rend.metal(); plan();
$('#julie').classList.add('discret');
$('#btn-start').addEventListener('click', () => {
  $('#intro').classList.add('off');
  parle("À toi de jouer ! Cette fois, c'est <b>toi le créateur</b>. Choisis ton métal, ta pierre et ton serti : chaque choix a sa fiche.", 'accueil', 'creer-intro');
});
