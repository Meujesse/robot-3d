// Lisa 3D dans model-viewer (rendu Tripo) : animations du squelette, états de conversation, plans de caméra,
// petits mouvements de corps pendant la parole. Même rôle que robot-rig.js pour Noki. Expose window.LisaMV.
(function () {
  const AGENT_ID_DEFAULT = 'agent_2701m25dand9fq5rb32gndx037je';
  // Posture (outil lisa_attitude) → animation Tripo (noms preset:biped:*)
  const ATTITUDES = {
    salut: 'greet_01', presentation: 'wait', accueil: 'idle', index: 'agree', decompte: 'wait', question: 'scratch',
    curiosite: 'look_around', reflexion: 'scratch', haussement: 'scratch', pouce: 'agree', enthousiasme: 'clap',
    emerveillement: 'heart_pose', perplexite: 'look_around', deception: 'depressed', reveuse: 'wait', hanches: 'fold_arms',
    designe: 'wait', invitation: 'greet_02', neutre: 'idle', rire: 'laugh_01', au_revoir: 'wave_goodbye_01', danse: 'dance_01', danser: 'dance_01', applaudir: 'clap',
    marcher: 'walk', courir: 'run', sauter: 'jump', tourner: 'turn', asseoir: 'sit', coup_de_pied: 'kick_01',
  };
  const BOUCLES = ['idle', 'wait', 'walk', 'run'];
  const PARLE = ['agree', 'wait', 'idle', 'greet_02', 'scratch'];
  // plans : orbite + cible (le modèle fait ~0,98 m de haut)
  const PLANS = { pied: { r: 2.4, y: 0.50 }, americain: { r: 1.7, y: 0.60 }, buste: { r: 0.95, y: 0.75 }, gros: { r: 0.6, y: 0.80 } };
  const DEFAUT = { salut: 'americain', presentation: 'americain', accueil: 'buste', index: 'buste', decompte: 'buste', question: 'buste', curiosite: 'gros',
    reflexion: 'buste', haussement: 'americain', pouce: 'buste', enthousiasme: 'americain', emerveillement: 'buste', perplexite: 'gros', deception: 'buste',
    reveuse: 'gros', hanches: 'americain', designe: 'americain', invitation: 'americain', neutre: 'buste', rire: 'buste', au_revoir: 'americain', danse: 'pied', danser: 'pied',
    marcher: 'pied', courir: 'pied', sauter: 'pied', tourner: 'pied', asseoir: 'pied', coup_de_pied: 'pied' };

  function create({ mv, rig }) {
    let clips = {}, ready = false, current = null, idleName = 'idle', state = 'idle';
    let ampSource = () => 0, amp = 0, bob = 0, tilt = 0, t0 = performance.now();
    let plan = 'buste', theta = 0;
    const short = n => n.split(':').pop();
    function anim(name, loop = false) {
      const full = clips[name]; if (!full || !ready) return false;
      mv.animationName = full; mv.currentTime = 0; mv.play({ repetitions: loop ? Infinity : 1 }); current = name; return true;
    }
    function idle() { anim(idleName, true); }
    mv.addEventListener('finished', () => { if (!BOUCLES.includes(current)) idle(); });
    mv.addEventListener('load', () => {
      for (const n of mv.availableAnimations) clips[short(n)] = n;
      idleName = BOUCLES.find(n => clips[n]) || Object.keys(clips)[0];
      ready = true; idle(); cadre('buste', true); tick();
    });
    function cadre(nom, immediate) {
      const P = PLANS[nom] || PLANS.buste; plan = nom;
      mv.cameraTarget = `0m ${P.y}m 0m`;
      mv.cameraOrbit = `${theta}deg 86deg ${P.r}m`;
      if (immediate) mv.jumpCameraToGoal();
    }
    // corps pendant la parole : léger balancement du rig (CSS), comme Noki
    function tick() {
      const t = (performance.now() - t0) / 1000;
      let target = 0;
      if (state === 'speaking') target = Math.max(0, Math.min(1, ampSource()));
      else if (state === 'thinking') target = 0.2 + 0.2 * Math.sin(t * 4);
      amp += (target - amp) * (target > amp ? 0.4 : 0.15);
      const wantBob = state === 'speaking' ? -amp * 0.8 : 0;
      const wantTilt = state === 'speaking' ? Math.sin(t * 2.7) * amp * 0.9 : (state === 'thinking' ? 0.6 * Math.sin(t * 1.3) : 0);
      bob += (wantBob - bob) * 0.2; tilt += (wantTilt - tilt) * 0.1;
      if (rig) rig.style.transform = `translateY(${bob.toFixed(2)}%) rotate(${tilt.toFixed(2)}deg)`;
      if (document.hidden) setTimeout(tick, 50); else requestAnimationFrame(tick);
    }
    let speakTimer = null;
    const api = {
      setAmpSource(fn) { ampSource = fn || (() => 0); },
      gesture(name) { return anim(name); },
      setPlan(p) { cadre(p, false); },
      attitude(nom) {
        const key = String(nom || '').toLowerCase(); const a = ATTITUDES[key]; if (!a || !clips[a]) return false;
        if (BOUCLES.includes(a)) { idleName = a; idle(); } else anim(a);
        theta = (Math.random() - 0.5) * 30;
        cadre(DEFAUT[key] || 'buste', false);
        return true;
      },
      setState(next) {
        if (next === state) return;
        state = next; mv.parentElement.dataset.state = next;
        if (next === 'speaking' && (current === 'idle' || current === 'wait' || current === 'look_around')) { const g = PARLE[Math.floor(Math.random() * PARLE.length)]; if (BOUCLES.includes(g)) { idleName = g; idle(); } else anim(g); }
        if (next === 'thinking') anim('look_around') || anim('scratch');
        if (next === 'listening' && !BOUCLES.includes(current)) { /* le geste finit puis retour idle */ }
      },
      getState() { return state; },
      speakText(text) {
        clearTimeout(speakTimer);
        const dur = Math.min(8000, 600 + (text || '').length * 60), start = performance.now();
        api.setAmpSource(() => { const k = (performance.now() - start) / 1000; return 0.35 + 0.35 * Math.abs(Math.sin(k * 9)) * (0.6 + 0.4 * Math.sin(k * 2.3)); });
        api.setState('speaking');
        speakTimer = setTimeout(() => { api.setState('idle'); api.setAmpSource(null); }, dur);
      },
      agentId() { return new URLSearchParams(location.search).get('agent') || AGENT_ID_DEFAULT; },
      clientTools() { return { lisa_attitude: async ({ attitude }) => api.attitude(attitude) ? 'posture : ' + attitude : 'posture inconnue : ' + attitude }; },
      animations() { return Object.keys(clips); },
    };
    return api;
  }
  window.LisaMV = { create };
})();
