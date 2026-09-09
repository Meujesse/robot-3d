# Robot 3D — viewer interactif pour Genially

Petit robot volant en 3D interactive, pensé pour être inséré en iframe dans un Genially (fond transparent, ombre au sol, rotation, réactions, voix).

En ligne : https://meujesse.github.io/robot-3d/

## Pages

| Page | Ce qu'elle fait |
|---|---|
| `index.html` | Version de base : rotation automatique, manipulation à la souris, ombre, oscillation de vol. |
| `lab.html?v=2` | Il réagit au toucher : lève un bras, parle, son œil pulse. |
| `lab.html?v=3` | + il te regarde (son œil suit la souris ou le doigt). |
| `lab.html?v=4` | + il se déplace (entrée en vol, dérive, décollage quand on le touche). |
| `lab.html?v=5` | + il parle tout seul (accueil, « je te vois », « je décolle »). |
| `lab.html?v=6` | + il change d'état : bonne réponse, mauvaise réponse, dodo (boutons de démo). |
| `labels.html` | Points d'intérêt façon science-fiction : points lumineux, ligne et étiquette qui suivent la rotation. |
| `bras.html` | Test des pièces animées : bras droit, bras gauche, les deux, antenne, balancement, lueur. |
| `chat.html` | On discute : bulles de conversation, saisie au clavier ou dictée (micro du navigateur), réponses de l'agent ElevenLabs « Robot Meujesse » en texte. Le robot réfléchit (antenne, lueur) puis « parle » (œil, hochement, geste). |
| `voice.html` | On parle : conversation vocale temps réel avec l'agent (bouton « Parler au robot », micro requis). Le robot écoute (halo), réfléchit, parle (œil et corps animés sur sa voix), sous-titres. |

Paramètres d'URL sur `lab.html` : `touch=0`, `look=0`, `move=0`, `talk=0`, `state=0` pour couper une fonction ; `state=happy|wrong|sleep` pour démarrer dans un état ; `tag=` (vide) pour masquer l'étiquette ; `hint=0` pour masquer la consigne ; `fx=0` pour couper la touche robotique sur la voix.
Sur `index.html` : `speed=30`, `float=0`, `shadow=0`, `rotate=0`. Sur `labels.html` : `open=all`, `rotate=0`.

Paramètre commun à `chat.html` et `voice.html` : `agent=<id>` pour utiliser un autre agent ElevenLabs (par défaut « Robot Meujesse », id `agent_2201m240z9mmfjxs9dy7abez84ct`, public, voix « Robot Meujesse (Wall-E) », modèle de langue Gemini 2.5 Flash, prompt de personnalité modifiable dans ElevenLabs > Agents). L'intégration Genially doit garder `allow="microphone; autoplay"` sur l'iframe pour le mode vocal.

Pilotage depuis une page parente (si un jour Genially le permet, ou depuis une page HTML maison) : `iframe.contentWindow.postMessage({type:'robot:state', state:'happy'}, '*')` et `{type:'robot:look', x, y}`.

## Code d'intégration Genially

Insérer > Autres > coller :

```html
<iframe src="https://meujesse.github.io/robot-3d/lab.html?v=6" width="600" height="600" frameborder="0" allowtransparency="true" style="background:transparent;border:0" allow="autoplay; xr-spatial-tracking"></iframe>
```

## Fichiers

- `robot-source.png` : image d'origine (ChatGPT).
- `robot.glb` : modèle d'un seul bloc (Tripo v2.5, allégé, 1,2 Mo).
- `robot-parts.glb` : même robot découpé en pièces (corps, bras droit, bras gauche, antenne, œil) avec les animations `hello`, `hello_left`, `cheer`, `shrug`, `antenna`, `idle`.
- `audio/` : voix « Robot Meujesse (Wall-E) » (ElevenLabs, voix conçue sur mesure). `audio-maevys/` : la version voix douce féminine, gardée en réserve.
- `robot-rig.js` : moteur commun « robot vivant » (œil, gestes, corps, états) utilisé par chat.html et voice.html.
- `tools/split.mjs` : script de découpage + animations (gltf-transform). `tools/analyze*.mjs` : analyse de la géométrie.

Reconstruire le modèle découpé (Node local) :

```bash
cd tools && node split.mjs && cd .. && npx @gltf-transform/cli@4 optimize robot-parts-full.glb robot-parts.glb --compress draco --texture-compress webp --texture-size 2048 --simplify true --simplify-ratio 0.35 --simplify-error 0.0005 --join false
```

`robot-full.glb` et `robot-parts-full.glb` (versions lourdes) ne sont pas versionnés.
