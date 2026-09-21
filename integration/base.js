// Socle commun : mise à l'échelle, voix de la mentor (bouton + mode muet), repérage de l'intégration Genially.
export const MUET = new URLSearchParams(location.search).has('muet');
export const INTEGRE = window.self !== window.top;
if (INTEGRE) document.documentElement.classList.add('integre');

const stage = document.getElementById('stage');
function fit(){ const k = Math.min(innerWidth / 1600, innerHeight / 900); if (k > 0) stage.style.setProperty('--s', k); }
addEventListener('resize', fit); new ResizeObserver(fit).observe(document.documentElement); fit();

// Rejoue les animations d'entrée à chaque fois que la page devient visible (Genially précharge les iframes cachées).
const racine = document.documentElement;
let inter = false, vu = false;
function jouer(){ racine.classList.remove('anim'); void racine.offsetWidth; racine.classList.add('anim'); document.dispatchEvent(new Event('page-visible')); }
function verifier(){
  const ok = inter && document.visibilityState === 'visible';
  if (ok && !vu){ vu = true; jouer(); }
  if (!ok && vu){ vu = false; stopVoix(); }
}
new IntersectionObserver(([e]) => { inter = e.isIntersecting; verifier(); }).observe(stage);
document.addEventListener('visibilitychange', verifier);
export function stopVoix(){ VOIX.forEach(a => { if (!a.paused){ a.pause(); a.currentTime = 0; a.dispatchEvent(new Event('ended')); } }); }
const VOIX = [];

const ICONE = '<span class="ondes"><i></i><i></i><i></i></span>';
export function bulleMentor(el, texte, fichier){
  el.innerHTML = `<div class="nom">Salomé, votre mentor <button class="ecouter" type="button">${ICONE}<span>Écouter</span></button></div><div class="txt">${texte}</div>`;
  const btn = el.querySelector('.ecouter'), audio = new Audio(fichier);
  audio.preload = 'none'; VOIX.push(audio);
  audio.addEventListener('ended', () => { btn.classList.remove('joue'); btn.lastChild.textContent = 'Écouter'; });
  btn.addEventListener('click', () => {
    if (MUET) return;
    if (!audio.paused){ audio.pause(); audio.currentTime = 0; btn.classList.remove('joue'); btn.lastChild.textContent = 'Écouter'; return; }
    audio.currentTime = 0; audio.play().then(() => { btn.classList.add('joue'); btn.lastChild.textContent = 'Arrêter'; }).catch(() => {});
  });
  return audio;
}
export const FLECHE_G = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
export const FLECHE_D = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
