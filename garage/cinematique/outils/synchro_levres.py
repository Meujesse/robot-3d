"""Contrôle objectif de la synchronisation des lèvres d'un clip : l'ouverture de la bouche (repères Vision, bouche.swift)
est comparée à l'enveloppe de la voix. On donne la corrélation, le décalage qui la maximise, la part d'images où le visage
est visible pendant la réplique, et la bouche qui bouge (ou non) pendant les silences.

    python3 synchro_levres.py clip.mp4 [debut_voix fin_voix]
"""
import os, subprocess, sys, tempfile, glob
import numpy as np

FF = os.path.expanduser('~/bin/ffmpeg')
ICI = os.path.dirname(os.path.abspath(__file__))
IPS = 15


def analyse(clip, a=None, b=None):
    d = tempfile.mkdtemp(prefix='levres-')
    subprocess.run([FF, '-nostdin', '-loglevel', 'error', '-i', clip, '-vf', f'fps={IPS},scale=1280:-1', os.path.join(d, 'i%04d.png')], check=True)
    images = sorted(glob.glob(os.path.join(d, 'i*.png')))
    r = subprocess.run(['swift', os.path.join(ICI, 'bouche.swift')] + images, capture_output=True, text=True)
    ouv = np.array([float(l.split(';')[1]) if l.count(';') >= 1 else -1 for l in r.stdout.strip().split('\n')])
    p = subprocess.run([FF, '-nostdin', '-loglevel', 'error', '-i', clip, '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True)
    x = np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32) / 32768
    pas = 16000 // IPS
    env = np.array([np.sqrt(np.mean(x[i * pas:(i + 1) * pas] ** 2)) if (i + 1) * pas <= len(x) else 0 for i in range(len(ouv))])
    parle = env > 0.02
    if a is not None:
        t = np.arange(len(ouv)) / IPS
        parle &= (t >= a) & (t <= b)
    vu = ouv >= 0
    res = {'images': len(ouv), 'visage vu': f'{100 * vu.mean():.0f} %', 'visage vu pendant la voix': f'{100 * vu[parle].mean():.0f} %' if parle.any() else '-'}
    # corrélation entre ouverture et enveloppe, sur les images où le visage est vu, pour des décalages de -5 à +5 images
    o = np.where(vu, ouv, np.nan)
    meilleur = (-9, 0)
    for k in range(-5, 6):
        e = np.roll(env, k)
        ok = vu & ~np.isnan(o)
        if k > 0: ok[:k] = False
        if k < 0: ok[k:] = False
        if ok.sum() > 10 and np.std(o[ok]) > 0 and np.std(e[ok]) > 0:
            c = float(np.corrcoef(o[ok], e[ok])[0, 1])
            if c > meilleur[0]: meilleur = (c, k)
    res['corrélation bouche / voix'] = round(meilleur[0], 2)
    res['décalage (images à 15 i/s)'] = meilleur[1]
    res['ouverture moyenne en parlant'] = round(float(np.nanmean(o[parle & vu])), 4) if (parle & vu).any() else '-'
    silence = ~parle & vu
    res['ouverture moyenne en silence'] = round(float(np.nanmean(o[silence])), 4) if silence.any() else '-'
    return res


if __name__ == '__main__':
    clip = sys.argv[1]
    a, b = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (None, None)
    print(os.path.basename(clip), analyse(clip, a, b))
