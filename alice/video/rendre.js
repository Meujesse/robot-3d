// Rendu image par image d'une vidéo motion design : node rendre.js neige|yaourt [apercu]
const puppeteer = require('/Users/jynchereze/Downloads/meujesse-portfolio/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FFMPEG = execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const f = process.argv[2] || 'neige', apercu = process.argv[3] === 'apercu', FPS = 30;
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--mute-audio', '--hide-scrollbars', '--window-size=1280,720'] });
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: apercu ? 0.5 : 1 });
  await p.goto('http://localhost:8120/alice/video/film.html?f=' + f, { waitUntil: 'networkidle0' });
  await p.waitForFunction('window.film && window.film.pret'); await p.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 600));
  const { duree, pistes } = await p.evaluate(() => ({ duree: film.duree, pistes: film.pistes }));
  const dir = path.join(__dirname, 'images-' + f); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  if (apercu) { const n = 15; for (let i = 0; i < n; i++) { const t = duree * (i + .5) / n; await p.evaluate(t => film.at(t), t); await p.screenshot({ path: path.join(dir, `a${String(i).padStart(2, '0')}.png`) }); } await b.close(); console.log('aperçu', duree.toFixed(1), 's'); return; }
  const N = Math.ceil(duree * FPS); for (let i = 0; i < N; i++) { await p.evaluate(t => film.at(t), i / FPS); await p.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 }); }
  await b.close();
  const args = ['-nostdin', '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%05d.jpg')]; pistes.forEach(x => args.push('-i', path.join(__dirname, 'voix', x.f + '.mp3')));
  const filt = pistes.map((x, i) => `[${i + 1}:a]adelay=${Math.round(x.t * 1000)}:all=1[a${i}]`).join(';') + ';' + pistes.map((x, i) => `[a${i}]`).join('') + `amix=inputs=${pistes.length}:normalize=0,apad=whole_dur=${duree.toFixed(2)}[a]`;
  args.push('-filter_complex', filt, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-t', duree.toFixed(2), '-movflags', '+faststart', path.join(__dirname, f + '.mp4'));
  execFileSync(FFMPEG, args); fs.rmSync(dir, { recursive: true, force: true }); console.log(f + '.mp4', N, 'images', duree.toFixed(1), 's');
})();
