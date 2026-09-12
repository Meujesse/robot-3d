#!/bin/sh
# Fabrication du modèle final de la fée, à partir du modèle validé d'avant
# la chirurgie des jambes (fee/fee-avant-fente.glb, non versionné).
#   1. les pétales de la jupe quittent les os des jambes pour la taille
#   2. la soudure entre les deux jambes est tranchée, les parois refermées
set -e
cd "$(dirname "$0")"
node repoids.mjs fee-repoids.json
node fente.mjs  fee-fente.json
