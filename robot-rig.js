// Robot "vivant" : œil, gestes, mouvement du corps, états, et actions commandées par l'agent.
// Utilisé par chat.html et voice.html. Expose window.RobotRig.
(function () {
  const AGENT_ID_DEFAULT = 'agent_2201m240z9mmfjxs9dy7abez84ct';
  const COLORS = {
    bleu: [0.02, 0.10, 0.30], vert: [0.02, 0.28, 0.08], rouge: [0.32, 0.03, 0.03], jaune: [0.30, 0.22, 0.02],
    orange: [0.34, 0.12, 0.01], violet: [0.22, 0.04, 0.32], rose: [0.34, 0.06, 0.18], blanc: [0.24, 0.24, 0.24], eteint: [0, 0, 0],
  };
  const GLINT_RGB = {
    bleu: '150,230,255', vert: '120,255,170', rouge: '255,120,110', jaune: '255,225,110', orange: '255,180,90',
    violet: '210,150,255', rose: '255,150,200', blanc: '255,255,255', eteint: '150,230,255',
  };

  function create({ mv, rig, glint }) {
    let eyeMat = null;
    let ampSource = () => 0;          // amplitude 0..1 de la voix du robot
    let amp = 0, glow = 0, tilt = 0, bob = 0;
    let state = 'idle';               // idle | listening | thinking | speaking | sleeping
    let t0 = performance.now();
    let idleWanted = true;
    let ready = false;
    // Couleur d'œil demandée (persistante) + clignotement
    let eyeColor = 'bleu', eyeBlink = false, eyeSet = null; // eyeSet = couleur choisie explicitement (null = pas de teinte au repos)
    // Déplacements commandés
    let offsetX = 0, targetX = 0, lookTheta = null;

    function anim(name, loop = false) {
      if (!ready || !mv.availableAnimations || !mv.availableAnimations.includes(name)) return false;
      mv.animationName = name; mv.currentTime = 0; mv.play({ repetitions: loop ? Infinity : 1 }); return true;
    }
    // Pose de repos : on fige l'animation en cours à son image 0 (toutes commencent bras ballants), sans fondu ni changement d'animation.
    function restPose() { if (!ready) return; mv.pause(); mv.currentTime = 0; }
    function afterGesture() {
      if (!idleWanted || state === 'sleeping') return;
      if (state === 'speaking') anim('talk', true); else restPose();
    }
    mv.addEventListener('finished', afterGesture);

    function tick() {
      const now = performance.now(), t = (now - t0) / 1000;
      let target = 0;
      if (state === 'speaking') target = Math.max(0, Math.min(1, ampSource()));
      else if (state === 'thinking') target = 0.25 + 0.25 * Math.sin(t * 5.5);
      else if (state === 'listening') target = 0.12 + 0.06 * Math.sin(t * 2.2);
      amp += (target - amp) * (target > amp ? 0.45 : 0.18);
      glow += (amp - glow) * 0.4;

      if (eyeMat) {
        const g = glow;
        // pulsation de parole dans la couleur courante
        const c = COLORS[eyeColor] || COLORS.bleu;
        let e = [c[0] * g, c[1] * g, c[2] * g];
        if (state === 'thinking' && !eyeSet) e = [0.02 * g, 0.16 * g, 0.22 * g];
        // teinte persistante si une couleur a été demandée explicitement
        if (eyeSet && eyeSet !== 'eteint') {
          const cs = COLORS[eyeSet]; const k = eyeBlink ? (0.5 + 0.5 * Math.sin(t * 8)) : 1;
          const base = 0.5 * k;
          e = [Math.max(e[0], cs[0] * base), Math.max(e[1], cs[1] * base), Math.max(e[2], cs[2] * base)];
        }
        if (state === 'sleeping') e = [0, 0, 0];
        eyeMat.setEmissiveFactor(e.map(x => Math.min(1, x)));
      }
      const wantBob = state === 'speaking' ? -amp * 2.2 : (state === 'sleeping' ? 1.5 : 0);
      const wantTilt = state === 'speaking' ? Math.sin(t * 3.1) * amp * 2.4 : (state === 'thinking' ? 2.5 * Math.sin(t * 1.3) : (state === 'sleeping' ? -4 : 0));
      bob += (wantBob - bob) * 0.25; tilt += (wantTilt - tilt) * 0.12; offsetX += (targetX - offsetX) * 0.06;
      rig.style.transform = `translate(${offsetX.toFixed(2)}%, ${bob.toFixed(2)}%) rotate(${tilt.toFixed(2)}deg)`;
      requestAnimationFrame(tick);
    }

    mv.addEventListener('load', () => {
      eyeMat = mv.model.materials.find(m => m.name === 'eye_material') || null;
      ready = true;
      restPose();
      tick();
    });

    // ---- utilitaires d'animation ----
    function orbit(theta, ms = 700) { mv.cameraOrbit = `${theta}deg 82deg 118%`; }
    function css(cls, ms) { mv.classList.remove(cls); void mv.offsetWidth; mv.classList.add(cls); setTimeout(() => mv.classList.remove(cls), ms); }
    function spin() {
      const start = performance.now(), from = -22;
      (function step() { const k = Math.min(1, (performance.now() - start) / 1100); const e = 1 - Math.pow(1 - k, 3);
        mv.cameraOrbit = `${from - 360 * e}deg 82deg 118%`; if (k < 1) requestAnimationFrame(step); else mv.cameraOrbit = `${from}deg 82deg 118%`; })();
    }
    function glintColor(name) { if (glint) glint.style.setProperty('--c', GLINT_RGB[name] || GLINT_RGB.bleu); }

    let speakTimer = null, eyeTimer = null;
    const api = {
      setAmpSource(fn) { ampSource = fn || (() => 0); },
      gesture(name) { idleWanted = true; return anim(name); },
      setState(next) {
        if (next === state) return;
        if (state === 'sleeping' && next !== 'idle') { /* réveil implicite */ }
        state = next;
        if (glint) { glint.classList.toggle('on', next === 'thinking' || (!!eyeSet && eyeSet !== 'eteint')); }
        if (next === 'thinking') api.gesture('antenna');
        if (next === 'speaking') { const g = ['antenna', 'talk', 'hello', 'talk'][Math.floor(Math.random() * 4)]; if (g === 'talk') anim('talk', true); else api.gesture(g); }
        if (next === 'sleeping') { idleWanted = false; restPose(); }
        else if (!idleWanted) { idleWanted = true; restPose(); }
        if (next === 'idle' || next === 'listening') { if (mv.animationName === 'talk') restPose(); }
        mv.parentElement.dataset.state = next;
      },
      getState() { return state; },
      speakText(text) {
        clearTimeout(speakTimer);
        const dur = Math.min(6000, 500 + (text || '').length * 55);
        const start = performance.now();
        api.setAmpSource(() => { const k = (performance.now() - start) / 1000; return 0.35 + 0.35 * Math.abs(Math.sin(k * 9)) * (0.6 + 0.4 * Math.sin(k * 2.3)); });
        api.setState('speaking');
        speakTimer = setTimeout(() => { api.setState('idle'); api.setAmpSource(null); }, dur);
      },
      // ---- actions commandées par l'agent (outil robot_action) ----
      act(action) {
        const a = String(action || '').toLowerCase();
        if (state === 'sleeping' && a !== 'dormir') api.setState('idle');
        switch (a) {
          case 'saluer_droite': return api.gesture('hello');
          case 'saluer_gauche': return api.gesture('hello_left');
          case 'lever_les_deux_bras': case 'bravo': css('jump', 900); return api.gesture('cheer');
          case 'hausser_les_bras': return api.gesture('shrug');
          case 'bouger_antenne': return api.gesture('antenna');
          case 'sauter': css('jump', 900); return true;
          case 'trembler': css('shake', 600); api.gesture('shrug'); return true;
          case 'tourner_sur_lui_meme': spin(); return true;
          case 'danser': {
            css('jump', 900); api.gesture('cheer'); setTimeout(spin, 500); setTimeout(() => css('jump', 900), 1300);
            setTimeout(() => api.gesture('hello_left'), 1400); setTimeout(() => api.gesture('cheer'), 2600); return true;
          }
          case 'regarder_a_gauche': lookTheta = 45; orbit(45); return true;
          case 'regarder_a_droite': lookTheta = -70; orbit(-70); return true;
          case 'regarder_en_face': lookTheta = null; orbit(-22); return true;
          case 'voler_a_gauche': targetX = -22; api.gesture('antenna'); return true;
          case 'voler_a_droite': targetX = 22; api.gesture('antenna'); return true;
          case 'revenir_au_centre': targetX = 0; return true;
          case 'dormir': api.setState('sleeping'); return true;
          case 'se_reveiller': api.setState('idle'); api.gesture('antenna'); return true;
          default: return false;
        }
      },
      // ---- couleur de l'œil (outil robot_eye) ----
      eye(couleur, mode) {
        const c = String(couleur || 'bleu').toLowerCase();
        if (!(c in COLORS)) return false;
        clearTimeout(eyeTimer);
        eyeBlink = mode === 'clignote';
        if (mode === 'bref' && c !== 'bleu' && c !== 'eteint') eyeTimer = setTimeout(() => api.eye('bleu', 'fixe'), 6000);
        if (c === 'eteint' || c === 'bleu') { eyeSet = c === 'eteint' ? 'eteint' : null; eyeColor = 'bleu'; }
        else { eyeSet = c; eyeColor = c; }
        glintColor(c);
        if (glint) glint.classList.toggle('on', !!eyeSet && eyeSet !== 'eteint');
        return true;
      },
      agentId() { return new URLSearchParams(location.search).get('agent') || AGENT_ID_DEFAULT; },
      // Outils à passer au SDK ElevenLabs (clientTools)
      clientTools() {
        return {
          robot_action: async ({ action }) => { const ok = api.act(action); return ok ? 'fait : ' + action : 'geste inconnu : ' + action; },
          robot_eye: async ({ couleur, mode }) => { const ok = api.eye(couleur, mode); return ok ? 'œil ' + couleur : 'couleur inconnue : ' + couleur; },
        };
      },
    };
    return api;
  }

  window.RobotRig = { create };
})();
