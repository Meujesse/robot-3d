// Mise à l'échelle de la scène 1200 x 675, paramètres communs, glisser-déposer au doigt comme à la souris
(function(){ const sc = document.getElementById('scene'); function ajuste(){ const k = Math.min(innerWidth/1200, innerHeight/675); sc.style.transform = `translate(-50%,-50%) scale(${k})`; } addEventListener('resize', ajuste); ajuste(); if (window.ResizeObserver) new ResizeObserver(ajuste).observe(document.documentElement); setTimeout(ajuste, 500); setTimeout(ajuste, 2500); })();
const Q = new URLSearchParams(location.search), MUET = Q.has('muet'), VITE = Q.has('vite');
if (Q.has('seul')) document.documentElement.classList.add('seul');
const euro = n => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' €';
const attends = ms => new Promise(r => setTimeout(r, VITE ? 20 : ms));
// compteur animé : fait passer un nombre de sa valeur affichée à la cible
function compte(el, cible, ms = 700, fmt = euro){ const de = +(el.dataset.v || 0), t0 = performance.now(); el.dataset.v = cible; (function pas(t){ const k = Math.min(1, (t - t0) / (VITE ? 1 : ms)), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(de + (cible - de) * e); if (k < 1) requestAnimationFrame(pas); })(t0); }
let piste = null; function dis(fichier){ if (MUET) return; try { if (piste) piste.pause(); piste = new Audio('audio/' + fichier + '.mp3?v=2'); piste.play().catch(() => {}); } catch (e) {} }
// échelle courante de la scène (pour convertir les déplacements du pointeur)
const echelle = () => document.getElementById('scene').getBoundingClientRect().width / 1200;
// rend un élément glissable ; fin(el, x, y) reçoit le centre de l'élément en coordonnées de scène et renvoie true si le dépôt est accepté
function glissable(el, fin){ let d = null; el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => { if (el.classList.contains('pose')) return; el.setPointerCapture(e.pointerId); d = { x: e.clientX, y: e.clientY }; el.classList.add('prise'); el.style.transition = 'none'; });
  el.addEventListener('pointermove', e => { if (!d) return; const k = echelle(); el.style.transform = `translate(${(e.clientX - d.x) / k}px,${(e.clientY - d.y) / k}px) scale(1.06)`; });
  const lache = e => { if (!d) return; const sc = document.getElementById('scene').getBoundingClientRect(), r = el.getBoundingClientRect(), k = echelle(); const ok = fin(el, (r.left + r.width / 2 - sc.left) / k, (r.top + r.height / 2 - sc.top) / k); d = null; el.classList.remove('prise'); el.style.transition = 'transform .35s cubic-bezier(.3,1.4,.5,1)'; if (!ok) el.style.transform = ''; };
  el.addEventListener('pointerup', lache); el.addEventListener('pointercancel', lache); }
