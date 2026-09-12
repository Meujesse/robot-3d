#!/bin/sh
# Fabrication de la fée v2 (image Tripo « Pose en T », jambes écartées, rig humanoïde Tripo) :
#   1. greffe des ailes (membrane, axes latéral z / profondeur x) et des paupières
#   2. allègement (draco, webp 2048, simplification 15 %) directement dans fee/fee.glb
set -e
cd "$(dirname "$0")"
node graft-bones.mjs fee2-rig.json
PATH="$PWD/node_modules/.bin:$PATH" gltf-transform optimize /Users/jynchereze/Downloads/lisa-3d/fee2/fee2-os.glb ../fee/fee.glb --compress draco --texture-compress webp --texture-size 2048 --simplify true --simplify-ratio 0.15 --simplify-error 0.0008 --join false
