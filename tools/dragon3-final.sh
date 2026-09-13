#!/bin/sh
# Dragon gueule fermée (même personnage, image Tripo « bouche fermée ») :
#   greffe ailes/queue/paupières → allègement → paupières en géométrie, dans dragon/dragon-ferme.glb
set -e
cd "$(dirname "$0")"
node graft-bones.mjs dragon3-rig.json
PATH="$PWD/node_modules/.bin:$PATH" gltf-transform optimize /Users/jynchereze/Downloads/lisa-3d/dragon/dragon-ferme-os.glb ../dragon/dragon-ferme.glb --compress draco --texture-compress webp --texture-size 2048 --simplify true --simplify-ratio 0.15 --simplify-error 0.0008 --join false
node paupieres.mjs dragon3-paupieres.json
