"""Teaser de Néon Garage : montage pur, sans génération. Plans de la cinématique + prises du module (filmer_module.js)
+ textes (teaser.html), voix d'Inès et musique. Rendu par l'outil maison (rendu.py).

    node outils/filmer_module.js          (une fois, pour filmer les activités)
    python3 outils/fabriquer_teaser.py [sortie.mp4]
"""
import json, os, subprocess, sys, zlib

D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
FF = os.path.expanduser('~/bin/ffmpeg')
RENDU = os.path.expanduser('~/Downloads/meujesse-youtube-accroche/outils/rendu.py')
NODE_PUPPETEER = '/Users/jynchereze/Downloads/meujesse-portfolio/tools/node_modules/puppeteer-core'
c = lambda n: D + 'clips/' + n + '.mp4'


def ff(args, **k):
    r = subprocess.run([FF, '-nostdin', '-y', '-loglevel', 'error'] + args, capture_output=True, **k)
    if r.returncode:
        sys.exit(r.stderr[-1500:])


def fige(f):
    """Nom avec empreinte du contenu : l'outil de rendu garde ses morceaux en cache d'après le nom du fichier."""
    base, ext = os.path.splitext(f)
    g = f"{base}-{zlib.crc32(open(f, 'rb').read()):08x}{ext}"
    os.replace(f, g)
    return g


# 1. textes : une image transparente par texte
script = f"""
const puppeteer=require('{NODE_PUPPETEER}');(async()=>{{const b=await puppeteer.launch({{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--mute-audio','--hide-scrollbars']}});
const p=await b.newPage();await p.setViewport({{width:1920,height:1080}});for(const n of [1,2,3,4,5,6]){{await p.goto('http://localhost:8120/garage/cinematique/teaser.html?n='+n,{{waitUntil:'networkidle0'}});
await p.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,400));await p.screenshot({{path:'{D}images/teaser-'+n+'.png',omitBackground:true}});}}await b.close();}})()"""
subprocess.run(['node', '-e', script], check=True)
for f in os.listdir(D + 'images'):
    if f.startswith('teaser-') and len(f) > len('teaser-1.png'):
        os.remove(D + 'images/' + f)
TXT = {n: fige(D + f'images/teaser-{n}.png') for n in range(1, 7)}

# 2. carton de fin (4 s) : fond qui avance doucement, titre en fondu dès la coupe
D_CARTON = 4.0
for f in os.listdir(D + 'clips'):
    if f.startswith('teaser-carton'):
        os.remove(D + 'clips/' + f)
ff(['-loop', '1', '-framerate', '30', '-t', str(D_CARTON), '-i', D + 'images/carton-fond.png', '-loop', '1', '-framerate', '30', '-t', str(D_CARTON), '-i', D + 'images/carton-titre.png',
    '-f', 'lavfi', '-t', str(D_CARTON), '-i', 'anullsrc=r=48000:cl=stereo',
    '-filter_complex', f"[0:v]scale=w='2*trunc(960*(1+0.04*t/{D_CARTON}))':h='2*trunc(540*(1+0.04*t/{D_CARTON}))':eval=frame,crop=1920:1080,setsar=1[bg];"
    "[1:v]format=rgba,fade=t=in:st=0:d=0.35:alpha=1[ti];[bg][ti]overlay=0:-60:format=auto,format=yuv420p[v]", '-map', '[v]', '-map', '2:a', '-t', str(D_CARTON),
    '-r', '30', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', c('teaser-carton')])
CARTON = fige(c('teaser-carton'))

# 3. plans : (nom, source, début, fin, zoom, texte posé dessus)
plans = [
    ('La ville', c('p0-ville-b'), 0.3, 3.3, 1.01, 1),
    ('Inès se présente', c('p2-accueil-c-sync'), 0.0, 4.7, 1.01, None),
    ('La voiture en 3D', c('prise-voiture'), 0.5, 2.4, 1.0, 2),
    ('Les pannes', c('prise-pannes'), 1.3, 3.2, 1.0, 3),
    ('Le texto du client', c('prise-texto'), 1.0, 2.9, 1.0, 4),
    ('La réparation', c('prise-reparer'), 0.3, 2.2, 1.0, 5),
    ('À toi de trouver la panne', c('p5-mission-b-sync'), 0.0, 4.5, 1.01, None),
    ('Carton de titre', CARTON, 0.0, D_CARTON, 1.0, 6),
]
principale, textes, T, t = [], [], {}, 0.0
for nom, src, a, b, zoom, txt in plans:
    T[nom] = t
    principale.append({'src': src, 'in': a, 'out': b, 'zoom': zoom, 'volume': 0.0, 'nom': nom})
    if txt:
        debut = t + (0.35 if txt in (1, 6) else 0.0)
        textes.append({'src': TXT[txt], 'at': round(debut, 3), 'in': 0, 'out': round(t + (b - a) - debut, 3), 'nom': f'texte {txt}'})
    t += b - a
total = round(t, 3)

# 4. voix : « Ah, te voilà ! Tu tombes bien. Moi, c'est Inès, la cheffe d'atelier. » puis la dernière réplique entière
ff(['-i', D + 'voix/p2-accueil.mp3', '-t', '4.72', '-af', 'afade=t=out:st=4.55:d=0.17', '-c:a', 'libmp3lame', '-b:a', '192k', D + 'voix/teaser-accueil.mp3'])
voix = [('teaser-accueil', T['Inès se présente'], 4.72), ('p5-mission', T['À toi de trouver la panne'], 3.97)]

# 5. musique : la fin du morceau, pour qu'il se termine sur le titre ; forte sur les activités, discrète sous la voix
debut_m = 39.03 - total
(a1, b1), (a2, b2) = [(a - 0.3, a + d + 0.1) for _, a, d in voix]
vol = (f"if(lt(t,{a1}),0.5,if(lt(t,{a1 + 0.5}),0.5-0.39*(t-{a1})/0.5,if(lt(t,{b1}),0.11,if(lt(t,{b1 + 0.5}),0.11+0.47*(t-{b1})/0.5,"
       f"if(lt(t,{a2}),0.58,if(lt(t,{a2 + 0.5}),0.58-0.47*(t-{a2})/0.5,if(lt(t,{b2}),0.11,if(lt(t,{b2 + 0.6}),0.11+0.43*(t-{b2})/0.6,0.54))))))))")
ff(['-ss', f'{debut_m:.3f}', '-i', D + 'musique-39.mp3', '-af', f"aresample=48000,volume='{vol}':eval=frame,afade=t=in:st=0:d=0.5,afade=t=out:st={total - 0.35}:d=0.3", '-c:a', 'pcm_s16le', D + 'musique-teaser.wav'])

m = {'titre': 'Néon Garage : teaser', 'pistes': [principale, textes],
     'audio': [{'src': D + 'voix/' + n + '.mp3', 'in': 0, 'out': d, 'at': round(a, 3), 'volume': 1.0, 'nom': 'Voix d’Inès : ' + n} for n, a, d in voix]
     + [{'src': D + 'musique-teaser.wav', 'in': 0, 'out': total, 'at': 0, 'volume': 1.0, 'nom': 'Musique (fin du morceau, niveaux déjà réglés)'}]}
json.dump(m, open(D + 'montage-teaser.json', 'w'), ensure_ascii=False, indent=1)
print('plans :', ' · '.join(f'{n} {T[n]:.2f}' for n in T), '· fin', total)
sortie = sys.argv[1] if len(sys.argv) > 1 else D + 'neon-garage-teaser.mp4'
subprocess.run([sys.executable, RENDU, D + 'montage-teaser.json', sortie], check=True)
