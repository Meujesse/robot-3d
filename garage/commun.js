// Met la scène 1200 x 675 à l'échelle de la fenêtre (plein cadre dans l'iframe Genially)
(function(){
  const sc = document.getElementById('scene');
  function ajuste(){
    const k = Math.min(innerWidth/1200, innerHeight/675);
    sc.style.transform = `translate(-50%,-50%) scale(${k})`;
  }
  addEventListener('resize', ajuste); ajuste();
  if (window.ResizeObserver) new ResizeObserver(ajuste).observe(document.documentElement);
  setTimeout(ajuste, 500); setTimeout(ajuste, 2500); setTimeout(ajuste, 5000);
})();
// Paramètre ?muet : aucun son (les pages n'en jouent de toute façon pas sans geste)
const MUET = new URLSearchParams(location.search).has('muet');
// Voiture citadine vue de côté, en SVG : carrosserie dégradée, roues qui tournent, phares
function voitureSVG(id, opts){
  const o = Object.assign({ teinte1:'#FF2D8A', teinte2:'#B14CFF', w:420 }, opts||{});
  return `<svg id="${id}" class="voiture" viewBox="0 0 420 170" width="${o.w}" height="${o.w*170/420}" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-car" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.teinte1}"/><stop offset="1" stop-color="${o.teinte2}"/></linearGradient>
    <linearGradient id="${id}-vitre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD9FF" stop-opacity=".9"/><stop offset="1" stop-color="#2A1A5E" stop-opacity=".95"/></linearGradient>
    <radialGradient id="${id}-phare"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".5" stop-color="#FFE9B0"/><stop offset="1" stop-color="#FFE9B0" stop-opacity="0"/></radialGradient>
  </defs>
  <g class="ombre"><ellipse cx="210" cy="156" rx="190" ry="10" fill="rgba(0,0,0,.45)"/></g>
  <g class="caisse">
    <path d="M28 118 L36 86 Q44 70 70 66 L120 60 Q160 24 215 22 L300 22 Q336 24 360 54 L392 70 Q410 78 410 98 L410 120 Q410 132 396 132 L40 132 Q28 132 28 120 Z" fill="url(#${id}-car)" stroke="#1A0A33" stroke-width="3" stroke-linejoin="round"/>
    <path d="M130 62 Q165 32 214 30 L232 30 L232 64 Z" fill="url(#${id}-vitre)" stroke="#1A0A33" stroke-width="2.5"/>
    <path d="M246 30 L298 30 Q328 32 348 60 L246 62 Z" fill="url(#${id}-vitre)" stroke="#1A0A33" stroke-width="2.5"/>
    <rect x="236" y="76" width="34" height="5" rx="2.5" fill="#1A0A33" opacity=".7"/>
    <path d="M60 80 Q200 72 352 78" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M392 94 L408 94 L408 108 L392 108 Z" fill="#FFE9B0" stroke="#1A0A33" stroke-width="2"/>
    <circle class="phare" cx="404" cy="101" r="18" fill="url(#${id}-phare)" opacity=".9"/>
    <rect x="30" y="94" width="14" height="12" rx="3" fill="#FF4D6D" stroke="#1A0A33" stroke-width="2"/>
    <rect x="66" y="112" width="300" height="6" rx="3" fill="rgba(26,10,51,.35)"/>
  </g>
  <g class="roue r1" transform="translate(108 128)"><circle r="30" fill="#1A0A33"/><circle r="19" fill="#9A94B8" stroke="#1A0A33" stroke-width="2"/><g class="jante" fill="#1A0A33"><rect x="-3" y="-17" width="6" height="34" rx="3"/><rect x="-3" y="-17" width="6" height="34" rx="3" transform="rotate(60)"/><rect x="-3" y="-17" width="6" height="34" rx="3" transform="rotate(120)"/></g><circle r="5" fill="#E7E2FF"/></g>
  <g class="roue r2" transform="translate(326 128)"><circle r="30" fill="#1A0A33"/><circle r="19" fill="#9A94B8" stroke="#1A0A33" stroke-width="2"/><g class="jante" fill="#1A0A33"><rect x="-3" y="-17" width="6" height="34" rx="3"/><rect x="-3" y="-17" width="6" height="34" rx="3" transform="rotate(60)"/><rect x="-3" y="-17" width="6" height="34" rx="3" transform="rotate(120)"/></g><circle r="5" fill="#E7E2FF"/></g>
</svg>`;
}

// Bouton « Écouter Inès » : la voix ne part que sur un clic (aucune lecture automatique)
function boutonVoix(fichier, style){
  const b = document.createElement('button'); b.className = 'voix'; b.setAttribute('aria-label', 'Écouter Inès'); b.title = 'Écouter Inès'; b.style.cssText = style;
  b.innerHTML = '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 11h5l6-5v16l-6-5H4z" fill="#fff"/><path d="M18.5 10a5.5 5.5 0 0 1 0 8M21 6.5a10 10 0 0 1 0 15" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
  let a = null;
  b.onclick = () => { if (!a) { a = new Audio('audio/' + fichier + '.mp3?v=1'); a.onended = a.onpause = () => b.classList.remove('joue'); a.onplay = () => b.classList.add('joue'); } if (a.paused) { a.currentTime = 0; a.play().catch(() => {}); } else a.pause(); };
  document.getElementById('scene').appendChild(b); return b;
}
