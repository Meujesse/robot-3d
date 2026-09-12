#!/bin/sh
# Fabrication du dragon v2 (gueule ouverte, squelette humanoïde Tripo) :
#   1. greffe des ailes, de la queue, du foyer de feu et des paupières
#   2. allègement (draco, webp 2048, simplification 15 %)
#   3. flamme en géométrie sur l'os feuBone, écrite dans dragon/dragon.glb
set -e
cd "$(dirname "$0")"
node graft-bones.mjs dragon2-rig.json
PATH="$PWD/node_modules/.bin:$PATH" gltf-transform optimize /Users/jynchereze/Downloads/lisa-3d/dragon/dragon-v2-os.glb /tmp/d2-opt.glb --compress draco --texture-compress webp --texture-size 2048 --simplify true --simplify-ratio 0.15 --simplify-error 0.0008 --join false
node flamme.mjs dragon2-flamme.json
node paupieres.mjs dragon2-paupieres.json
