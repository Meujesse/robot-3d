// Filme quelques secondes de chaque activité du module Néon Garage en 1920 x 1080 (Chrome sans fenêtre, son coupé),
// pour le teaser. Une prise par activité : clips/prise-<nom>.mp4 (30 i/s, piste son muette).
// usage : node filmer_module.js [nom ...]     (sans argument : toutes les prises)
const puppeteer = require('/Users/jynchereze/Downloads/meujesse-portfolio/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const FF = path.join(os.homedir(), 'bin/ffmpeg'), BASE = 'http://localhost:8120/garage/', OUT = path.join(__dirname, '..', 'clips');
const S = ms => new Promise(r => setTimeout(r, ms));
const W = 1920, H = 1080;

const centre = (p, sel, i = 0) => p.evaluate((s, i) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel, i);
const attendre = async (p, sel, ms = 15000) => { for (let t = 0; t < ms; t += 250) { if (await p.$(sel)) return true; await S(250); } return false; };
const glisse = async (p, a, b, ms = 700) => { await p.mouse.move(a.x, a.y); await p.mouse.down(); const n = Math.round(ms / 16); for (let i = 1; i <= n; i++) { const k = i / n, e = k * k * (3 - 2 * k); await p.mouse.move(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e); await S(16); } await p.mouse.up(); };

// chaque prise : page, préparation hors caméra, puis jeu filmé
const PRISES = {
  voiture: { url: 'diagnostic3d.html?muet', pret: p => attendre(p, '.hs .dot'), pause: 2500,
    async jeu(p) { const c = await centre(p, '#mv'); await S(500); await glisse(p, { x: c.x - 60, y: c.y - 40 }, { x: c.x + 330, y: c.y - 70 }, 1900); await S(500); const d = await centre(p, '.hs .dot', 0); if (d) await p.mouse.click(d.x, d.y); await S(2200); } },
  pannes: { url: 'pannes.html?muet', pret: p => attendre(p, '.panne'), pause: 1200,
    async jeu(p) { await S(300); const c = await centre(p, '.panne', 2); await p.mouse.click(c.x, c.y); await S(5200); } },
  texto: { url: 'chat.html?c=brief&fond&muet', pret: p => attendre(p, '#reponses.on button', 20000), pause: 400,
    async jeu(p) { await S(900); const c = await centre(p, '#reponses button', 0); await p.mouse.move(c.x, c.y, { steps: 12 }); await S(250); await p.mouse.click(c.x, c.y); await S(4200); } },
  reparer: { url: 'reparer.html?muet', pret: p => attendre(p, '.piece'), pause: 1200,
    async jeu(p) { await S(400); const r = await centre(p, '#roue'); let a = await centre(p, '.piece', 0); await glisse(p, a, r, 800); await S(900); a = await centre(p, '.piece', 1); if (a) { await glisse(p, a, r, 800); await S(1400); } } },
};

(async () => {
  const noms = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PRISES);
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--mute-audio', '--hide-scrollbars', '--use-angle=metal', '--enable-gpu', `--window-size=${W},${H}`] });
  try {
    for (const nom of noms) {
      const pr = PRISES[nom]; const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
      const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 100)));
      await p.goto(BASE + pr.url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
      const ok = await pr.pret(p); await S(pr.pause);
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prise-')); const images = [];
      const cdp = await p.createCDPSession();
      cdp.on('Page.screencastFrame', async f => { const n = path.join(dir, `i${String(images.length).padStart(5, '0')}.jpg`); fs.writeFileSync(n, Buffer.from(f.data, 'base64')); images.push({ n, t: f.metadata.timestamp }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
      await pr.jeu(p); await S(300);
      await cdp.send('Page.stopScreencast'); await S(200);
      // montage des images à leur durée réelle
      let liste = ''; for (let i = 0; i < images.length; i++) { const d = i + 1 < images.length ? images[i + 1].t - images[i].t : 0.05; liste += `file '${images[i].n}'\nduration ${Math.max(0.005, d).toFixed(4)}\n`; }
      liste += `file '${images[images.length - 1].n}'\n`; fs.writeFileSync(path.join(dir, 'liste.txt'), liste);
      const sortie = path.join(OUT, `prise-${nom}.mp4`);
      execFileSync(FF, ['-nostdin', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'liste.txt'), '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-vf', `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', '-c:a', 'aac', '-shortest', sortie]);
      const duree = images.length > 1 ? images[images.length - 1].t - images[0].t : 0;
      console.log(`${nom} : prête ${ok} · ${images.length} images · ${duree.toFixed(1)} s${errs.length ? ' · erreurs : ' + errs.join(' | ') : ''}`);
      fs.rmSync(dir, { recursive: true, force: true }); await p.close();
    }
  } finally { await b.close(); }
})();
