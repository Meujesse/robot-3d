"""Version 3 de la cinématique : prépare les plans retouchés, la musique et le fichier de montage, puis lance le rendu maison.

    python3 fabriquer_v3.py [sortie.mp4]

Ce qui change par rapport à la version 2 (retours de Jyn du 28 nov. 2026) :
- accueil coupé avant qu'Inès ne parte sur le côté ; on entre ensuite dans l'atelier (avancée sur la vue de l'atelier) ;
- la voix de chaque plan démarre un peu avant qu'on voie Inès, parce que sa bouche ne s'ouvre que 0,2 à 0,4 s après le
  début de la voix dans les clips générés ;
- repères « l'établi et les outils » puis « les deux ponts » sur le plan de visite, calés sur les mots ;
- badge MJL remis sur la calandre (outils/badge.py) ;
- le titre apparaît dès la coupe sur le carton.
Les clips d'origine ne sont jamais modifiés : tout est refabriqué dans clips/v3-*.mp4. Si un clip est remplacé (par exemple
après un passage dans un modèle de synchronisation des lèvres), changer son nom dans SOURCES et relancer.
"""
import json, os, subprocess, sys

D = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
FF = os.path.expanduser('~/bin/ffmpeg')
RENDU = os.path.expanduser('~/Downloads/meujesse-youtube-accroche/outils/rendu.py')
SOURCES = {'ville': 'p0-ville-b', 'entree': 'p1-entree-c', 'accueil': 'p2-accueil-c-sync', 'visite': 'p3-visite-c', 'voiture': 'p4-voiture-b-sync', 'mission': 'p5-mission-b-sync'}
# « -sync » = clip repassé dans Sync Lipsync 3 (Lipsync Studio du site Higgsfield) : mêmes images, bouche recalée sur la voix.
# La visite (p3) n'a pas pu l'être le 28 nov. 2026, faute de crédits : mettre 'p3-visite-c-sync' ici quand ce sera fait.
c = lambda n: D + 'clips/' + n + '.mp4'


def ff(args):
    r = subprocess.run([FF, '-nostdin', '-y', '-loglevel', 'error'] + args, capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr[-1500:])


X264 = ['-an', '-r', '30', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p']


def silence(f):
    """L'outil de rendu attend une piste son dans chaque plan de la piste principale : on en ajoute une, muette."""
    tmp = f + '.tmp.mp4'
    ff(['-i', f, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest', '-c:v', 'copy', '-c:a', 'aac', tmp])
    os.replace(tmp, f)


def etire_fin(src, dst, debut, fin, queue, queue_voulue, avant=''):
    """Garde src de debut à fin ; les « queue » dernières secondes sont ralenties pour durer « queue_voulue »."""
    b, k = fin - queue, queue_voulue / queue
    ff(['-i', src] + (['-filter_complex', avant + f'[v0]split[s1][s2];[s1]trim=start={debut}:end={b},setpts=PTS-STARTPTS[a];'
                       f'[s2]trim=start={b}:end={fin},setpts=(PTS-STARTPTS)*{k}[b];[a][b]concat=n=2:v=1,fps=30[v]', '-map', '[v]']) + X264 + [dst])
    return (b - debut) + queue_voulue


# 1. badge MJL sur la calandre (le disque gris est repéré image par image)
if not os.path.exists(c(SOURCES['voiture'] + '-badge')):
    subprocess.run([sys.executable, D + 'outils/badge.py', c(SOURCES['voiture']), c(SOURCES['voiture'] + '-badge'), '564', '618'], check=True)

# 2. entrée dans l'atelier : avancée de 1,2 s sur la vue de l'atelier (image du plan d'accueil, Inès hors champ)
ff(['-ss', '6.85', '-i', c('p2-accueil-c'), '-frames:v', '1', '-vf', 'crop=1400:788:512:160,scale=3828:2164:flags=lanczos,unsharp=7:7:0.7', D + 'images/atelier-entree.png'])
D_ENTREE = 1.62
ff(['-loop', '1', '-framerate', '30', '-t', str(D_ENTREE), '-i', D + 'images/atelier-entree.png', '-vf',
    f"scale=w='2*trunc(1914*(1+0.12*(0.6*t/{D_ENTREE}+0.4*(t/{D_ENTREE})*(2-t/{D_ENTREE}))))':h='2*trunc(1082*(1+0.12*(0.6*t/{D_ENTREE}+0.4*(t/{D_ENTREE})*(2-t/{D_ENTREE}))))':eval=frame,crop=3828:2164,scale=1914:1082:flags=lanczos,setsar=1", '-t', str(D_ENTREE)] + X264 + [c('v3-entree-atelier')])
silence(c('v3-entree-atelier'))

# 3. visite : repères calés sur les mots (l'établi 0,98 s, là 2,38 s, « Et chez nous » 4,02 s), puis fin ralentie
reperes = ("[1:v]format=rgba,fade=t=in:st=0.75:d=0.15:alpha=1,fade=t=out:st=2.3:d=0.15:alpha=1[h1];"
           "[2:v]format=rgba,fade=t=in:st=2.5:d=0.15:alpha=1,fade=t=out:st=4.05:d=0.15:alpha=1[h2];"
           "[0:v][h1]overlay=0:0:enable='between(t,0.75,2.45)'[x];[x][h2]overlay=0:0:enable='between(t,2.5,4.2)',fps=30[v]")
ff(['-i', c(SOURCES['visite']), '-loop', '1', '-framerate', '30', '-t', '8.1', '-i', D + 'images/hud-1.png', '-loop', '1', '-framerate', '30', '-t', '8.1', '-i', D + 'images/hud-2.png',
    '-filter_complex', reperes, '-map', '[v]', '-t', '8.03'] + X264 + [c('v3-visite-reperes')])
d_visite = etire_fin(c('v3-visite-reperes'), c('v3-visite'), 0.65, 8.0, 0.4, 0.4, avant='[0:v]null[v0];')
silence(c('v3-visite'))

# 4. voiture avec badge : on entre 0,35 s après le début du clip, fin ralentie de 0,2 s
d_voiture = etire_fin(c(SOURCES['voiture'] + '-badge'), c('v3-voiture'), 0.0, 6.0, 0.3, 0.3, avant='[0:v]null[v0];')
silence(c('v3-voiture'))

# 5. carton de titre : le titre apparaît dès la coupe
T = {}
plans = [('ville', c(SOURCES['ville']), 0.3, 4.5, 'La ville au coucher du soleil'), ('entree', c(SOURCES['entree']), 0.0, 4.8, 'On avance vers le garage'),
         ('accueil', c(SOURCES['accueil']), 0.35, 5.88, 'Inès nous accueille et montre l’atelier'), ('atelier', c('v3-entree-atelier'), 0.0, D_ENTREE, 'On entre'),
         ('visite', c('v3-visite'), 0.0, d_visite, 'La visite, avec les repères'), ('voiture', c('v3-voiture'), 0.0, d_voiture, 'La citadine à réparer'),
         ('mission', c(SOURCES['mission']), 0.0, 4.9, 'À toi de trouver la panne')]
t = 0.0
for nom, _, a, b, _ in plans:
    T[nom] = t; t += b - a
d_carton = round(39.0 - t, 3)
ff(['-loop', '1', '-framerate', '30', '-t', str(d_carton), '-i', D + 'images/carton-fond.png', '-loop', '1', '-framerate', '30', '-t', str(d_carton), '-i', D + 'images/carton-titre.png',
    '-filter_complex', f"[0:v]scale=w='2*trunc(960*(1+0.04*t/{d_carton}))':h='2*trunc(540*(1+0.04*t/{d_carton}))':eval=frame,crop=1920:1080,setsar=1[bg];"
    "[1:v]format=rgba,fade=t=in:st=0:d=0.4:alpha=1[ti];[bg][ti]overlay=0:0:format=auto,format=yuv420p[v]", '-map', '[v]', '-t', str(d_carton)] + X264 + [c('v3-carton')])
silence(c('v3-carton'))
plans.append(('carton', c('v3-carton'), 0.0, d_carton, 'Carton de titre'))
T['carton'] = t

# 6. voix : chaque réplique part un peu avant le plan où l'on voit Inès
# accueil : la voix part pendant l'avancée (pas d'Inès à l'image) ; visite : idem pendant l'entrée, et le clip n'a pas été resynchronisé ;
# voiture et clé : clips resynchronisés, la voix part à la coupe (sinon on l'entend sur Inès qui sourit bouche fermée au plan d'avant)
voix = [('p2-accueil', T['accueil'] - 0.35), ('p3-visite', T['visite'] - 0.65), ('p4-voiture', T['voiture']), ('p5-mission', T['mission'])]
durees = {'p2-accueil': 6.61, 'p3-visite': 7.81, 'p4-voiture': 5.88, 'p5-mission': 3.97}
for (n1, a1), (n2, a2) in zip(voix, voix[1:]):
    assert a1 + durees[n1] + 0.1 <= a2, f'les voix {n1} et {n2} se chevauchent'

# 7. musique : forte sur l'intro et le carton, discrète sous la voix
bas, haut = voix[0][1] - 0.35, voix[-1][1] + durees['p5-mission'] + 0.15
ff(['-i', D + 'musique-39.mp3', '-af', f"aresample=48000,volume='if(lt(t,{bas}),0.48,if(lt(t,{bas + 0.6}),0.48-0.38*(t-{bas})/0.6,if(lt(t,{haut}),0.10,"
    f"if(lt(t,{haut + 0.8}),0.10+0.42*(t-{haut})/0.8,0.52))))':eval=frame,afade=t=in:st=0:d=0.15,afade=t=out:st=38.7:d=0.3", '-c:a', 'pcm_s16le', D + 'musique-mixee-v3.wav'])

# 8. fichier de montage au format de l'outil maison (rendu.py), puis rendu
m = {'titre': 'Néon Garage : cinématique d’ouverture',
     'pistes': [[{'src': src, 'in': a, 'out': b, 'zoom': 1.0 if nom == 'carton' else 1.01, 'volume': 0.0, 'nom': lib} for nom, src, a, b, lib in plans]],
     'audio': [{'src': D + 'voix/' + n + '.mp3', 'in': 0, 'out': durees[n], 'at': round(a, 3), 'volume': 1.0, 'nom': 'Voix d’Inès : ' + n} for n, a in voix]
     + [{'src': D + 'musique-mixee-v3.wav', 'in': 0, 'out': 39.0, 'at': 0, 'volume': 1.0, 'nom': 'Musique (niveaux déjà réglés)'}]}
json.dump(m, open(D + 'montage-final.json', 'w'), ensure_ascii=False, indent=1)
print('plans :', ' · '.join(f'{nom} {T[nom]:.2f}' for nom, *_ in plans), '· fin', round(T['carton'] + d_carton, 2))
print('voix :', ' · '.join(f'{n} {a:.2f}-{a + durees[n]:.2f}' for n, a in voix))
sortie = sys.argv[1] if len(sys.argv) > 1 else D + 'neon-garage-cinematique-v3.mp4'
subprocess.run([sys.executable, RENDU, D + 'montage-final.json', sortie], check=True)
