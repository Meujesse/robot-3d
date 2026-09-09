// Robot "vivant" : œil, gestes, mouvement du corps, états.
// Utilisé par chat.html et voice.html. Expose window.RobotRig.
(function () {
  const AGENT_ID_DEFAULT = 'agent_2201m240z9mmfjxs9dy7abez84ct';

  function create({ mv, rig, glint }) {
    let eyeMat = null;
    let ampSource = () => 0;          // fournit l'amplitude 0..1 de la voix du robot
    let amp = 0, glow = 0, tilt = 0, bob = 0;
    let state = 'idle';               // idle | listening | thinking | speaking
    let t0 = performance.now();
    let idleWanted = true;
    let ready = false;

    function anim(name, loop = false) {
      if (!ready || !mv.availableAnimations || !mv.availableAnimations.includes(name)) return;
      mv.animationName = name; mv.currentTime = 0; mv.play({ repetitions: loop ? Infinity : 1 });
    }
    mv.addEventListener('finished', () => { if (idleWanted) anim('idle', true); });

    function tick() {
      const now = performance.now(), t = (now - t0) / 1000;
      let target = 0;
      if (state === 'speaking') target = Math.max(0, Math.min(1, ampSource()));
      else if (state === 'thinking') target = 0.25 + 0.25 * Math.sin(t * 5.5);
      else if (state === 'listening') target = 0.12 + 0.06 * Math.sin(t * 2.2);
      amp += (target - amp) * (target > amp ? 0.45 : 0.18);

      // Œil : lueur bleue proportionnelle
      glow += (amp - glow) * 0.4;
      if (eyeMat) {
        const g = glow;
        let e = [0.02 * g, 0.09 * g, 0.24 * g];
        if (state === 'thinking') e = [0.02 * g, 0.16 * g, 0.22 * g];
        eyeMat.setEmissiveFactor(e.map(x => Math.min(1, x)));
      }
      // Corps : petit hochement + inclinaison quand il parle, respiration sinon
      const wantBob = state === 'speaking' ? -amp * 2.2 : 0;
      const wantTilt = state === 'speaking' ? Math.sin(t * 3.1) * amp * 2.4 : (state === 'thinking' ? 2.5 * Math.sin(t * 1.3) : 0);
      bob += (wantBob - bob) * 0.25; tilt += (wantTilt - tilt) * 0.12;
      rig.style.transform = `translateY(${bob.toFixed(2)}%) rotate(${tilt.toFixed(2)}deg)`;
      requestAnimationFrame(tick);
    }

    mv.addEventListener('load', () => {
      eyeMat = mv.model.materials.find(m => m.name === 'eye_material') || null;
      ready = true;
      anim('idle', true);
      tick();
    });

    let speakTimer = null;
    const api = {
      setAmpSource(fn) { ampSource = fn || (() => 0); },
      gesture(name) { idleWanted = true; anim(name); },
      setState(next) {
        if (next === state) return;
        const prev = state; state = next;
        if (glint) { glint.classList.toggle('on', next === 'thinking'); }
        if (next === 'thinking') { api.gesture('antenna'); }
        if (next === 'speaking') {
          const g = ['antenna', 'hello', 'hello_left', 'antenna'][Math.floor(Math.random() * 4)];
          api.gesture(g);
        }
        if (next === 'listening' && prev === 'speaking') { /* rien : retour à l'idle en douceur */ }
        mv.parentElement.dataset.state = next;
      },
      getState() { return state; },
      // Mode texte : simule la parole pendant ~60 ms par caractère
      speakText(text) {
        clearTimeout(speakTimer);
        const dur = Math.min(6000, 500 + (text || '').length * 55);
        const start = performance.now();
        api.setAmpSource(() => { const k = (performance.now() - start) / 1000; return 0.35 + 0.35 * Math.abs(Math.sin(k * 9)) * (0.6 + 0.4 * Math.sin(k * 2.3)); });
        api.setState('speaking');
        speakTimer = setTimeout(() => { api.setState('idle'); api.setAmpSource(null); }, dur);
      },
      agentId() { return new URLSearchParams(location.search).get('agent') || AGENT_ID_DEFAULT; },
    };
    return api;
  }

  window.RobotRig = { create };
})();
