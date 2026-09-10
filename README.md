# Robot 3D — viewer interactif pour Genially

Noki, petit robot volant en 3D interactive, pensé pour être inséré en iframe dans un Genially (fond transparent, ombre au sol, rotation, réactions, voix).

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

## Lisa (personnage 2D conversationnel)

Lisa, la guide illustrée de Meujesse Learning, avec la même mécanique que Noki mais en dessin animé en direct (pas de 3D) :

| Page | Fichier | Ce qu'elle fait |
|---|---|---|
| V11 · Lisa : on discute (écrit) | `lisa-chat.html` | Bulles à l'écrit ; la bouche suit les syllabes de la réponse. Le micro bascule sur une vraie conversation vocale (elle parle avec sa voix ElevenLabs), les bulles restent. |
| V12 · Lisa : on parle (vocal) | `lisa-voice.html` | Conversation uniquement vocale, sous-titres discrets. |
| Banc d'essai | `lisa-test.html` | Toutes les postures, les plans et un curseur d'ouverture de bouche (`?pose=accueil&plan=gros&ouv=0.6`). |

Moteur commun `lisa-rig.js` :
- **19 postures** (dossier `lisa/`, planches WebP + morceau HD de bouche + calque paupières), choisies par l'agent via l'outil client `lisa_attitude` (salut, presentation, accueil, index, decompte, question, curiosite, reflexion, haussement, pouce, enthousiasme, emerveillement, perplexite, deception, reveuse, hanches, designe, invitation, neutre) ou automatiquement selon l'état (écoute → neutre/curiosité, réflexion → réflexion/rêveuse, parole → posture parlante).
- **Caméra** : plan pied / américain / buste / gros plan choisi selon la posture, coupe franche à chaque changement, léger décalage latéral et lent rapprochement pendant qu'elle parle.
- **Bouche** : bas du visage redessiné en continu sur canvas (méthode Parcoursup'easy : ouverture proportionnelle à celle du dessin, vraies dents reprises quand il y en a). En vocal, l'ouverture suit l'énergie de la voix et la forme suit les syllabes du texte reçu ; à l'écrit, rythme syllabique (≈170 ms).
- **Vie** : clignement reconstruit depuis le dessin (1,9 à 6,5 s, double une fois sur cinq), respiration (champ de déplacement, 4,8 s, éteinte au-dessus du menton), balancement 13 s, hochement à la prise de parole.
- Agent ElevenLabs « Lisa (Meujesse) » `agent_2701m25dand9fq5rb32gndx037je`, voix Lisa `aXeX06kNUkBCrYoK0UVs`, mêmes réglages de latence que Noki. Paramètre `?agent=` pour en changer.

Fabrication des postures : `~/Downloads/lisa-2d/tools/montage.py` (boîte du visage par les iris, yeux, masque de bouche sous le nez, mesure de l'ouverture, calque paupières), `dbg_masque.py` pour la planche de vérification. Deux poses yeux fermés (joie, rire) ne passent pas la détection et sont laissées de côté.

## Lisa 3D (Tripo Pro + Blender + three.js)

| Page | Fichier | Ce qu'elle fait |
|---|---|---|
| Lisa 3D · modèle brut | `lisa3d-base.html` | Le modèle Tripo v3.1 tel quel dans model-viewer (rotation, fond transparent). Référence « sans retouche ». |
| Lisa 3D · on discute | `lisa3d-chat.html` | Même conversation que la 2D (bulles + micro), avec la Lisa 3D riggée : gestes Tripo, bouche et paupières animées. |
| Lisa 3D · on parle | `lisa3d-voice.html` | Conversation vocale seule. |
| Banc d'essai | `lisa3d-test.html` | Toutes les animations, plans de caméra, curseur de bouche (`?glb=…`). |

Comment c'est fait :
- **Modèle** : image « rendu 3D » générée par ChatGPT → Tripo v3.1 (55 cr) → rig automatique (20 cr) + 14 animations retargetées (greet_01/02, wave_goodbye_01, agree, clap, heart_pose, laugh_01, scratch, look_around, fold_arms, depressed, dance_01, idle, wait) → export GLB squelette + animations (79 Mo) → `gltf-transform optimize` (draco, webp 2048, simplification 15 %) → `lisa3d/lisa.glb` **2,7 Mo**.
- **Blender 5.2.1** (installé, piloté en ligne de commande, scripts dans `~/Downloads/lisa-3d/blender/`) sert d'atelier : analyse du maillage, repères du visage par échantillonnage de la texture, rendu orthographique du visage (`face_render.py`) qui alimente le pipeline 2D. L'essai de déformation du visage par formes (shape keys) a été abandonné : la bouche fermée n'a pas d'intérieur et la déformation faisait un bloc.
- **Visage** : les yeux fermés et la bouche sont les calques 2D (même mesure `montage.py` que pour les 35 poses, sur le rendu de face) **projetés en décalcomanies sur le visage 3D** (three.js `DecalGeometry`), attachés à l'os de la tête : ils suivent les hochements et les animations. La bouche est redessinée en continu par `lisa-bouche.js`, avec `gmin` 0,19 pour une ouverture lisible.
- **Caméra** : plans pied / américain / buste / gros plan, suit le bassin, léger suivi de la souris, coupe à chaque posture. Dans un onglet caché, la boucle passe en `setTimeout`.
- Les postures de l'agent (`lisa_attitude`) sont traduites en animations dans `lisa3d-rig.js` (`ATTITUDES`).

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
