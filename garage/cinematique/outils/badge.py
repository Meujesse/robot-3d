"""Remet le badge MJL sur la calandre de la citadine dans le plan de la voiture.

L'image clé générée a remplacé le badge par un disque gris vide. On repère ce disque image par image (pixels clairs et
peu saturés autour de sa position précédente), on lisse sa trajectoire, puis on pose le vrai badge (img/ui/badge-mjl.png)
par-dessus, à la bonne taille. Le son du clip est gardé tel quel.

    python3 badge.py clip.mp4 sortie.mp4 x0 y0     (x0, y0 = centre approximatif du disque sur la première image)
"""
import os, subprocess, sys
import numpy as np
from PIL import Image

FF = os.path.expanduser('~/bin/ffmpeg')
ICI = os.path.dirname(os.path.abspath(__file__))
clip, sortie, x0, y0 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
L, H = 1914, 1082
badge = Image.open(os.path.join(ICI, '..', '..', 'img', 'ui', 'badge-mjl.png')).convert('RGBA')

lecture = subprocess.Popen([FF, '-nostdin', '-loglevel', 'error', '-i', clip, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
images, pistes = [], []
cx, cy, r = x0, y0, 22.0
while True:
    brut = lecture.stdout.read(L * H * 3)
    if len(brut) < L * H * 3:
        break
    a = np.frombuffer(brut, dtype=np.uint8).reshape(H, L, 3)
    images.append(a)
    # fenêtre de recherche autour de la position précédente
    m = int(max(46, r * 2.4)); xa, ya = int(max(0, cx - m)), int(max(0, cy - m))
    f = a[ya:int(cy + m), xa:int(cx + m)].astype(int)
    clair = (f.min(axis=2) > 135) & ((f.max(axis=2) - f.min(axis=2)) < 45)
    if clair.sum() > 60:
        ys, xs = np.nonzero(clair)
        cx, cy = xa + xs.mean(), ya + ys.mean()
        r = float(np.sqrt(clair.sum() / np.pi))
    pistes.append((cx, cy, r))
lecture.wait()
p = np.array(pistes)
# lissage de la trajectoire (moyenne glissante sur 7 images) pour que le badge ne tremble pas
noyau = np.ones(7) / 7
lisse = np.column_stack([np.convolve(np.pad(p[:, k], 3, mode='edge'), noyau, mode='valid') for k in range(3)])
ecriture = subprocess.Popen([FF, '-nostdin', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{L}x{H}', '-r', '30', '-i', '-',
                             '-i', clip, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', sortie], stdin=subprocess.PIPE)
for a, (x, y, rr) in zip(images, lisse):
    im = Image.fromarray(a).convert('RGBA')
    d = max(8, int(round(rr * 2 * 1.12)))
    b = badge.resize((d, d), Image.LANCZOS)
    im.alpha_composite(b, (int(round(x - d / 2)), int(round(y - d / 2))))
    ecriture.stdin.write(np.asarray(im.convert('RGB')).tobytes())
ecriture.stdin.close(); ecriture.wait()
print(f'{len(images)} images · disque de {p[0, 2]:.1f} px de rayon au début, {p[-1, 2]:.1f} à la fin · centre {p[0, 0]:.0f},{p[0, 1]:.0f} → {p[-1, 0]:.0f},{p[-1, 1]:.0f}')
