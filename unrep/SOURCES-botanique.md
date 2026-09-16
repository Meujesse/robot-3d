# Démo UNREP : reconnaissance des végétaux

Recherche du 16 septembre 2026. Tout ce qui n'a pas pu être confirmé par une source est marqué « non vérifié ».
Les fichiers bruts (PDF téléchargés, textes extraits, script de décompte, tableau complet) sont dans `unrep/src/` (`decompte.tsv`, `sets.json`, `count.py`, `parse2026.py`).

---

## 1. Listes réelles trouvées

### 1.1 Contexte utile pour la démo (règlement CNRV 2026)

Source : règlement du Concours national de reconnaissance des végétaux 2026, https://bo.valhor.fr/wp-content/uploads/2026/01/cnrv_reglement-2026_vf.pdf

- Niveaux : niveau 3 = CAP, BEP, BPA (donc CAPa) ; niveau 4 = Bac, BP (donc Bac Pro) ; niveau 5 = BTS (BTSA).
- Barème : niveau 3 = 20 végétaux × (genre + espèce + nom vernaculaire), pas de famille demandée ; niveau 4 = 30 végétaux × (famille + genre + espèce + nom vernaculaire) + « connaissance » sur 10 végétaux ; niveau 5 = 40 végétaux + connaissance sur 14.
- Les familles sont acceptées en français ou en latin (« ées » ou « eae »).
- Niveaux 4 et 5 : le candidat doit donner 3 caractéristiques issues de 3 catégories parmi 7 : port, morphologie (feuillage, floraison, inflorescence, fructification...), organes particuliers (bulbe vrai, rhizome, tubercule...), multiplication, conditions pédoclimatiques, biodiversité/origine, usages. C'est exactement ce qu'une démo 3D peut entraîner.
- Les listes officielles 2026 existent en trois versions : Aménagements paysagers (AP), Productions horticoles (PH), Distribution/Commerce/Vente (DCV), avec des colonnes par niveau. Plante & Cité les reprend sur Floriscope (ex. AP niveau 3 = 181 plantes : https://www.floriscope.io/listes/13478/concours-de-re-connaissance-des-vegetaux-2026-amenagements-paysagers-niveau-3-cnrv-ap3).
- Les listes CNRV précisent elles-mêmes qu'elles « ne possèdent aucun caractère officiel vis-à-vis des programmes de l'enseignement agricole » (mention présente sur les listes 2013 et 2017). Dans les faits, lycées et CFA s'en servent comme listes de travail (plusieurs lycées les hébergent sur leur site).

Remarque : je n'ai trouvé aucune liste publiée par l'UNREP ou sur maformationagricole.com. Pas de référentiel chlorofil.fr contenant une liste nominative de végétaux (les référentiels parlent de « reconnaissance des végétaux » sans liste).

### 1.2 Les 12 listes retenues pour le décompte

| # | Liste | Type | Taille (officielle, sinon nb de taxons repérés par le script) | URL |
|---|---|---|---|---|
| L1 | CNRV 2026 Aménagements paysagers, **niveau 3 (CAPa)** | Officielle CNRV (Valhor/Unep/DGER) | 181 | https://bo.valhor.fr/wp-content/uploads/2026/01/cnrv-2026-amenagements-paysagers-vf.pdf |
| L2 | CNRV 2026 Aménagements paysagers, **niveau 4 (Bac Pro)** | Officielle CNRV | 310 | même PDF que L1 (colonne niveau 4) |
| L3 | CNRV 2026 Productions horticoles, **niveau 4** | Officielle CNRV | 309 | https://bo.valhor.fr/wp-content/uploads/2026/01/cnrv-2026-productions-horticoles-vf.pdf |
| L4 | CNRV 2022 AP niveau 3 (CAP, BEP, BPA), hébergée par le lycée de Kerplouz (Auray) | CNRV, version 2022 | 178 repérés | https://www.kerplouz.com/wp-content/uploads/2022/05/Liste-Amenagements-Paysagers_Niveau-3-CAP-BEP-BPA_CNRV-2022.pdf |
| L5 | CNRV finale 2017 AP niveau V (CAPa JP), Kerplouz | CNRV, version 2017 | 146 repérés | https://www.kerplouz.com/wp-content/uploads/2018/04/Listes-Vegetaux-CAPa-Jardinier-Paysagiste.pdf |
| L6 | CNRV finale 2017 AP niveau IV (Bac Pro AP), Kerplouz | CNRV, version 2017 | 226 repérés | http://kerplouz.com/wp-content/uploads/2018/04/Listes-Vegetaux-Bac-Pro-Amenagement-Paysager.pdf |
| L7 | CNRV finale 2013 AP niveaux III, IV, V, lycée de Merdrignac | CNRV, version 2013 | 332 repérés | https://www.lycee-merdrignac.educagri.fr/wp-content/uploads/2015/02/130927-Liste-de-vegetaux-AP_PDF.pdf |
| L8 | CNRV finale 2013 PH niveaux III, IV, V, lycée de Merdrignac | CNRV, version 2013 | 384 repérés | https://www.lycee-merdrignac.educagri.fr/wp-content/uploads/2015/02/130927-Liste-de-vegetaux-PH_PDF.pdf |
| L9 | « Liste régionale de reconnaissance de végétaux » (arbres, arbustes, conifères, fruitiers, vivaces, bulbes, annuelles, adventices), lycée de Kerplouz | Liste d'établissement / régionale, faite par des enseignants | 131 repérés | https://www.kerplouz.com/wp-content/uploads/2018/03/Liste-r%C3%A9gionale-de-reconnaissance-de-v%C3%A9g%C3%A9taux.pdf |
| L10 | Concours régional de reconnaissance des végétaux, Travaux/Aménagements paysagers, « liste commune parcours 1-2-5, 150 taxons, 4e, 3e, CAPA, BEPA, CS » (région non indiquée) | Liste de concours régional | 150 | https://lapassiondesjardins.wordpress.com/wp-content/uploads/2013/11/liste-vc3a9gc3a9taux-capa-travaux-paysager.pdf (PDF à encodage cassé, retranscrit à la main depuis le rendu des pages) |
| L11 | Floriscope, liste « Reconnaissance des végétaux » (63 taxons, orientée terminale AP, auteur non indiqué, flore plutôt méditerranéenne) | Liste de formateur publiée sur Floriscope | 63 | https://www.floriscope.io/listes/8708/reconnaissance-des-vegetaux |
| L12 | Blog capajp.fr « socle commun » pour le CAP JP (janvier 2026) | Fiche de révision (source faible) | 29 | https://capajp.fr/blog/reconnaissance-vegetaux-cap-paysagiste |

Consultées mais non comptées (doublons de versions CNRV ou listes trop courtes) :
- CNRV 2026 Distribution/Commerce/Vente : https://bo.valhor.fr/wp-content/uploads/2026/01/cnrv-2026-distribution-commerce-vente-vf.pdf
- CNRV 2017 Production horticole (SNHF) : https://www.snhf.org/wp-content/uploads/2017/10/CNRV2017_Liste-Production-Horticole-3.10.2017.pdf
- CNRV AP + PH, PDF de mars 2021 mis en ligne par l'Unep : https://www.lesentreprisesdupaysage.fr/content/uploads/2021/03/listes-vegetaux-cnrv.pdf
- Page d'un enseignant (T. Jouet), mini-liste CAPa horticulture, qui cite *Tulipa* : http://thierry.jouet.free.fr/Sommaire/recocap.htm

Limite méthodologique : 8 listes sur 12 sont des versions successives de la liste CNRV. Le décompte mesure donc surtout la stabilité d'une plante dans le CNRV d'une édition à l'autre, et les listes L9 à L12 servent de contrôle « hors CNRV ». Le repérage est automatique (recherche genre + espèce dans le texte, avec correction des fautes de frappe les plus courantes) ; pour les entrées notées « × nombreux cultivars » (ex. *Forsythia*, *Weigela*, *Malus*), seul le genre est recherché.

### 1.3 Décompte (nombre de listes sur 12)

Colonnes : L1 à L12 dans l'ordre du tableau ci-dessus (X = présent).

| Score | Taxon | L1..L12 |
|---|---|---|
| **12** | *Buddleja davidii* (arbre aux papillons) | XXXXXXXXXXXX |
| **12** | ***Ginkgo biloba*** (arbre aux quarante écus) | XXXXXXXXXXXX |
| **12** | *Prunus laurocerasus* (laurier-cerise) | XXXXXXXXXXXX |
| **12** | *Taxus baccata* (if commun) | XXXXXXXXXXXX |
| 11 | *Buxus sempervirens* | XXXXXXXXXXX. |
| 11 | *Cercis siliquastrum* | XXXXXXXXXXX. |
| 11 | *Choisya ternata* | XXXXXXXXXXX. |
| 11 | *Fagus sylvatica* | XXXXXXXXXXX. |
| 11 | *Forsythia* (genre) | XXXXXXXXXX.X |
| 11 | *Liquidambar styraciflua* | XXXXXXXXXXX. |
| 11 | *Magnolia grandiflora* | XXXXXXXXXXX. |
| 11 | *Prunus cerasifera* | XXXXXXXXXXX. |
| 11 | *Weigela* (genre) | XXXXXXXXXX.X |
| 10 | *Acer palmatum* | XXXXXXXX.X.X |
| 10 | *Festuca glauca* | XXXXXXXXX..X |
| 10 | ***Lavandula angustifolia*** (lavande vraie) | XX.XX.XXXXXX |
| 10 | *Miscanthus sinensis* | XXXXXXXX.X.X |
| 10 | *Syringa vulgaris* (lilas commun) | XXXXXXXX.X.X |
| 10 | *Viburnum tinus*, *Laurus nobilis*, *Hibiscus syriacus*, *Pieris japonica*, *Carpinus betulus*, *Quercus robur*, *Quercus ilex*, *Picea abies*, *Rhus typhina*, *Cotinus coggygria*, *Koelreuteria paniculata*, *Wisteria sinensis*, *Heuchera*, *Chamaecyparis lawsoniana*... | voir decompte.tsv |
| 9 | *Hydrangea macrophylla*, *Hosta*, *Iris germanica* (rhizome), *Photinia × fraseri* 'Red Robin', *Aesculus hippocastanum*, *Acer campestre* | |
| 8 | *Agapanthus africanus* (rhizome charnu), *Magnolia × soulangeana* (7) | |

Plantes à bulbe (vrai bulbe), sur les 12 listes :

| Taxon | Score | Où |
|---|---|---|
| *Narcissus* × (narcisse, jonquille) | 3 | L2 (CNRV 2026 AP niveau 4), L3 (CNRV 2026 PH, présent aux niveaux 3, 4 et 5), L8 ; aussi dans CNRV 2026 DCV, CNRV 2017 PH et 2021 |
| *Tulipa* × (tulipe) | 3 | L3 (CNRV 2026 PH niveaux 3, 4, 5), L8, L9 (liste régionale Kerplouz) ; aussi CNRV 2026 DCV et la mini-liste CAPa de T. Jouet ; **absente de la liste CNRV 2026 AP** |
| *Crocus* × | 3 | L3, L8, L9 |
| *Hyacinthus orientalis* | 2 | L8, L9 |
| *Allium aflatunense* | 2 | L3, L8 |

Constat honnête : les bulbes existent bien dans les listes, mais ils sont nettement moins fréquents que les arbres et arbustes, et surtout présents dans les listes Productions horticoles. Dans les listes Aménagements paysagers, c'est le narcisse qui figure (CNRV 2026, niveau 4), pas la tulipe. Les « faux bulbes » à rhizome (*Iris germanica* 9/12, *Agapanthus africanus* 8/12) sont beaucoup plus fréquents.

---

## 2. Les 3 plantes proposées pour la démo

| Rôle | Plante | Score | Pourquoi |
|---|---|---|---|
| Arbre d'ornement | ***Ginkgo biloba*** L., arbre aux quarante écus | 12/12, et 4/4 hors CNRV | Présent partout, dès le niveau 3 (CAPa) en AP et en PH 2026. Visuellement unique en 3D : feuille en éventail, rameaux courts en « ergots », virage jaune d'or à l'automne, graines charnues sur les pieds femelles. Pédagogiquement riche (gymnosperme, pas de fleurs ni de vrais fruits). |
| Plante à bulbe | ***Narcissus*** (narcisse, jonquille ; espèce de référence *Narcissus pseudonarcissus* L.) | 3/12, mais présent dans les 3 listes CNRV 2026 (AP niv. 4, PH niv. 3 à 5, DCV) | Seul bulbe présent dans la liste CNRV 2026 Aménagements paysagers. Coupe du bulbe très démonstrative en 3D (plateau, écailles, bourgeon floral central). Alternative très proche : *Tulipa* (même score, mais absente de la liste AP 2026 ; intéressante car son bulbe est remplacé chaque année, ce qui fait un cycle 3D encore plus spectaculaire). |
| Troisième plante variée | ***Lavandula angustifolia*** Mill., lavande vraie | 10/12, et 4/4 hors CNRV | Présente au niveau 3 AP 2026. Sous-arbrisseau persistant, reconnaissable à l'odeur, à la tige carrée et aux feuilles opposées : parfait pour faire manipuler les critères « famille des Lamiacées ». Se modélise bien (touffe grise + épis). |

Alternatives solides si besoin : *Syringa vulgaris* (10/12, arbuste à fleurs), *Acer palmatum* (10/12), *Festuca glauca* ou *Miscanthus sinensis* (10/12, graminées), *Prunus laurocerasus*, *Taxus baccata* ou *Buddleja davidii* (12/12, mais moins spectaculaires en 3D).

---

## 3. Fiches botaniques vérifiées

### 3.1 *Ginkgo biloba* L. (arbre aux quarante écus)

Sources principales :
- Tela Botanica, nom retenu et classification : https://www.tela-botanica.org/bdtfx-nn-30178-synthese et API https://api.tela-botanica.org/service:eflore:0.1/bdtfx/noms?recherche=etendue&masque=Ginkgo%20biloba ; données Baseflor : https://api.tela-botanica.org/service:eflore:0.1/baseflor/informations/bdtfx.nn:30178?retour.format=max
- SNHF, fiche Ginkgo : https://www.snhf.org/fiche-plante/ginkgo/
- Floriscope (Plante & Cité) : https://www.floriscope.io/plantes/ginkgo-biloba
- Virginia Tech Dendrology : https://dendro.cnre.vt.edu/dendrology/syllabus/factsheet.cfm?ID=122
- NC State Extension : https://plants.ces.ncsu.edu/plants/ginkgo-biloba/
- Utah State University TreeBrowser : https://extension.usu.edu/treebrowser/catalog/ginkgo-maidenhair
- Wikipédia FR (dernier recours, pour dates de pollinisation et odeur) : https://fr.wikipedia.org/wiki/Ginkgo_biloba

| Rubrique | Contenu | Source |
|---|---|---|
| Nom commun | Arbre aux quarante écus, ginkgo (CNRV 2026 ajoute « abricotier d'argent ») | Liste CNRV 2026 AP |
| Nom latin | *Ginkgo biloba* L. [1771, Mantissa Alt., 331] | Tela Botanica |
| Famille | Ginkgoaceae (ordre Ginkgoales), seule famille actuelle. Pas de changement lié à l'APG : l'APG classe les angiospermes, le ginkgo est une gymnosperme. Piège de liste : certaines listes anciennes le rangent dans la rubrique « Conifères » (ex. L10), ce n'est pas un conifère au sens botanique. | Tela Botanica ; Floriscope (« gymnosperme hors conifères ») |
| Port et taille | Arbre de 20 à 30 m en France (jusqu'à 40 m) ; Floriscope indique 25 m × 11 m. Couronne étroite et ovale jeune, puis irrégulière et beaucoup plus large avec quelques grosses charpentières. | Wikipédia FR ; SNHF ; Floriscope ; Virginia Tech |
| Feuillage | Caduc, jaune d'or vif à l'automne avant la chute. | SNHF ; Floriscope ; NCSU |
| Disposition des feuilles | Alternes sur les pousses de l'année ; sur le bois de 2 ans et plus, groupées en bouquets (souvent 3 à 5) au bout de rameaux courts (« spur shoots »). | Virginia Tech ; NCSU ; Floriscope (« alterne ») |
| Limbe et bord | Simple, en éventail, souvent en deux lobes (d'où *biloba*), 5 à 8 cm de long et de large environ, sans nervure principale : nervation en éventail, dichotome. Bord entier, avec ou sans échancrure. Long pétiole. | Virginia Tech ; NCSU ; Wikipédia FR ; Floriscope ; USU |
| Aspect en hiver, bourgeons | Rameaux brun-rouge clair devenant gris, couverts de nombreux rameaux courts bien visibles ; bourgeons largement coniques à en dôme. | Virginia Tech ; USU |
| Écorce | Lisse jeune, puis gris-brun à crêtes irrégulières, finalement profondément sillonnée (sillons verticaux). | Virginia Tech ; Floriscope ; Wikipédia FR |
| « Fleurs » | Pas de vraies fleurs (gymnosperme). Espèce dioïque : pieds mâles à cônes polliniques pendants en chatons d'environ 2,5 cm ; pieds femelles à ovules nus portés par 1 à 2 au bout d'un long pédoncule. Pollinisation en mars-avril. | Virginia Tech ; NCSU ; Wikipédia FR ; SNHF |
| « Fruits » | Ce sont des graines nues, pas des fruits : environ 2 à 3 cm, jaune-orangé, à enveloppe charnue qui sent le beurre rance une fois tombée (acide butanoïque), coque interne dure et crème. Maturité septembre-octobre (Floriscope : septembre à novembre). Remarque : la base Baseflor de Tela Botanica code le « fruit » en « drupe », ce qui est botaniquement inexact. | Virginia Tech ; NCSU ; SNHF ; Wikipédia FR ; Floriscope ; Baseflor |
| Organes souterrains | Racine pivotante (une seule source trouvée). | SNHF |

Critères de reconnaissance (formulation prof) :
1. « Regardez la feuille : un éventail, souvent fendu en deux au milieu, et aucune nervure centrale. Les nervures partent toutes de la base et se divisent en deux. Aucune autre feuille de la liste ne fait ça. »
2. « Sur les vieux rameaux, les feuilles sortent en bouquets au bout de petits moignons, les rameaux courts. Sur la pousse de l'année, elles sont alternes. »
3. « En automne, tout l'arbre passe au jaune d'or et perd ses feuilles d'un coup : il est caduc, alors qu'on le range souvent à tort avec les conifères. »
4. « En hiver, on le reconnaît à ses rameaux gris hérissés de petits ergots et à ses bourgeons en dôme. »
5. « Sous un pied femelle, des "fruits" jaunes qui sentent le beurre rance : ce sont des graines nues. Pas de fleur, pas de fruit : c'est une gymnosperme. »

### 3.2 *Narcissus* (narcisse, jonquille), espèce de référence *Narcissus pseudonarcissus* L.

Dans les listes CNRV 2026, l'entrée est « *Narcissus* × nombreux cultivars, Narcisse, Jonquille ». La fiche décrit le genre, avec *N. pseudonarcissus* (jonquille des bois, narcisse trompette, espèce sauvage de France et parent des narcisses trompettes de jardin) comme modèle.

Sources principales :
- Tela Botanica, nom et classification : https://www.tela-botanica.org/bdtfx-nn-43646-synthese et API https://api.tela-botanica.org/service:eflore:0.1/bdtfx/noms/43646 ; classification : https://api.tela-botanica.org/service:eflore:0.1/bdtfx/taxons/43646/relations/superieurs ; Baseflor : https://api.tela-botanica.org/service:eflore:0.1/baseflor/informations/bdtfx.nn:43646?retour.format=max
- G. Hanks, *Narcissus Manual*, guide producteurs HDC/AHDB, 2013, chapitre 1.5 « Structure and life-cycle » (source technique de référence, basée sur les travaux de Rees) : https://projectblue.blob.core.windows.net/media/Default/Imported%20Publication%20Docs/Narcissus%20Guide%20final%20low%20res%20version%20(1).pdf
- Floriscope : https://www.floriscope.io/plantes/narcissus-pseudonarcissus
- SNHF, fiche Narcisses : https://www.snhf.org/fiche-plante/narcisses/
- Prépas SVT (définitions bulbe, plateau, tuniques, caïeux) : https://www.prepas-svt.fr/wp-content/uploads/2022/08/2023-QR4-des-bulbes...-et-des-bulbilles.pdf
- Wikipédia FR et EN (dernier recours) : https://fr.wikipedia.org/wiki/Narcissus_pseudonarcissus et https://en.wikipedia.org/wiki/Narcissus_(plant)

| Rubrique | Contenu | Source |
|---|---|---|
| Nom commun | Jonquille, narcisse jaune, narcisse trompette, jonquille des bois | Wikipédia FR ; liste CNRV 2026 (« Narcisse, Jonquille ») |
| Nom latin | Genre *Narcissus* L. [1753] ; espèce *Narcissus pseudonarcissus* L. [1753, Sp. Pl., 1 : 289] | Tela Botanica |
| Famille | Amaryllidaceae (ordre Asparagales, monocotylédones), sous-famille Amaryllidoideae. **Ancien classement : Liliacées** (classifications antérieures à l'APG). Piège classique en examen. | Tela Botanica ; Wikipédia FR (« Amaryllidaceae (APG III 2009) ; anciennement Liliaceae ») ; Wikipédia EN |
| Type biologique | Géophyte à bulbe ; plante vivace | Baseflor (« gbul ») ; Floriscope (« bulbes vrais ») |
| Taille | Généralement 20 à 40 cm | Wikipédia FR |
| Feuillage | Caduc (disparaît en été) ; feuilles toutes basales, linéaires, plates, un peu charnues, vert bleuté, de 4 à 15 mm de large, 2 à 5 par pied (Wikipédia EN : 3, rarement 4, chez la plante adulte). Disposition précise (distique ou non) : non vérifié. | Floriscope ; Wikipédia FR et EN |
| Tige | Hampe florale sans feuilles, creuse, lisse et aplatie avec angles visibles | Wikipédia EN et FR |
| Fleurs | Fleur solitaire terminale (une par hampe chez *N. pseudonarcissus* ; jusqu'à 20 selon les espèces du genre), penchée, 4 à 6 cm, hermaphrodite, pollinisée par les insectes. Protégée avant ouverture par une spathe membraneuse. 6 tépales jaune pâle autour d'une couronne (paracorolle) cylindrique crénelée jaune plus foncé ; 6 étamines ; ovaire infère à 3 loges. Chez les narcisses « trompette » (division 1 RHS), la couronne est aussi longue ou plus longue que les tépales. | Baseflor ; Wikipédia FR et EN ; Hanks (tableau des divisions RHS) |
| Floraison en France | Mars-avril (Floriscope) ; fin février à avril selon exposition (SNHF) ; de février à mai selon l'altitude (Wikipédia FR) | Floriscope ; SNHF ; Wikipédia FR |
| Fruit | Capsule sèche à 3 loges, déhiscente, nombreuses graines noires ; dispersion par les fourmis selon Baseflor (Wikipédia FR indique « barochore » : les sources divergent, non tranché) | Baseflor ; Wikipédia EN et FR |
| Organes souterrains | Bulbe tuniqué ovoïde à peau brun clair, tunique membraneuse, plateau liégeux d'où partent des racines adventives en couronne sur le bord du plateau. Wikipédia EN mentionne des racines contractiles qui tirent le bulbe plus profond (non recoupé par une seconde source). | Wikipédia EN ; Hanks |
| Toxicité | Bulbe très toxique (alcaloïdes dont galanthamine et lycorine, cristaux d'oxalate de calcium) : utile pour la catégorie « usages / précautions » | Wikipédia FR ; Hanks (galanthamine extraite des narcisses) |

**Structure interne du bulbe en coupe** (pour le modèle 3D)

D'après Hanks, *Narcissus Manual*, p. 14, complété par Prépas SVT :
- **Plateau** (« base plate ») : disque en bas du bulbe, c'est une tige très raccourcie. Il porte les racines en dessous et les écailles au-dessus.
- **Racines adventives** : naissent du plateau, en couronne sur son bord (Wikipédia EN).
- **Écailles charnues**, de deux sortes chez le narcisse : des bases de feuilles vertes de l'année précédente restées épaisses et charnues, et de « vraies » écailles qui n'ont jamais eu de partie aérienne.
- **Tunique** : les écailles les plus externes, vidées de leurs réserves, deviennent la peau sèche brune.
- **Bourgeon terminal (central)** : en automne, en coupant le bulbe dans la longueur, on trouve au centre le bouton floral déjà formé, entouré de la spathe membraneuse puis des jeunes feuilles jaune pâle.
- **Bourgeons latéraux** : à l'aisselle des écailles, ils forment de nouvelles « unités de bulbe », avec ou sans fleur.
- Particularité du narcisse : ce qu'on appelle « un bulbe » est en fait un groupe d'unités de bulbe d'âges différents. Chaque unité vit environ 4 ans : année 1, elle se forme et fait ses écailles ; année 2, elle forme d'autres écailles, des feuilles et, si elle est assez grosse, une fleur ; année 3, feuilles et fleur sortent ; année 4, ses dernières écailles s'épuisent et finissent en tunique.

**Cycle annuel** (Hanks, p. 14-15 ; SNHF pour les dates de jardin)

1. **Fin de printemps et été, repos apparent** : les feuilles jaunissent dès le début de l'été. Le bulbe est en « dormance », mais à l'intérieur l'activité continue : au Royaume-Uni, l'initiation de la fleur de l'année suivante commence en mai et se termine en juillet ou août (la couronne est la dernière pièce formée). C'est pour cela qu'on laisse le feuillage environ deux mois après la floraison (SNHF).
2. **Fin d'été et automne, enracinement** : après plantation (SNHF : en octobre, à 15 cm de profondeur), les racines sortent rapidement ; la pousse continue de grandir à l'intérieur du bulbe jusqu'au froid.
3. **Hiver, besoin de froid** : le narcisse doit subir une période de froid avant une croissance rapide et une floraison synchrone (sauf les *Tazetta* et quelques espèces d'automne).
4. **Fin d'hiver et printemps, débourrement puis floraison** : les feuilles et la hampe sortent, floraison de fin février à avril.
5. **Autour de la floraison, reconstitution** : le bulbe grossit vite pendant et juste après la floraison ; les vieilles écailles périphériques se vident et se flétrissent, tandis que les jeunes écailles, bases de feuilles et base de la hampe au centre se gorgent de réserves. Le bulbe se renouvelle par le centre et repousse les vieilles écailles vers l'extérieur.
6. **Multiplication végétative, caïeux** : l'axe du bulbe se ramifie ; un bulbe rond « à un nez » devient au fil des ans un bulbe à deux nez ou plus, qui finit par se séparer en caïeux (« offsets »), puis en touffes séparées (Hanks). La SNHF indique la multiplication par division des bulbes ou caïeux, deux mois après la floraison.
7. Différence avec la tulipe, d'après Hanks : le narcisse ne produit pas chaque année des bulbes fils distincts et faciles à séparer « comme le font les tulipes ».
8. **Bulbilles** : aucune des sources consultées ne mentionne de bulbilles chez le narcisse (non vérifié, à ne pas mettre dans la démo).
9. Par semis : longue phase juvénile, première floraison après 3 ans (certaines espèces) à 8 ans (certains hybrides) (Hanks).

Critères de reconnaissance (formulation prof) :
1. « Au centre de la fleur, une trompette : c'est la couronne, ou paracorolle, entourée de 6 tépales. Chez la jonquille, la trompette est aussi longue que les tépales. »
2. « Toutes les feuilles partent du sol, longues, plates, vert bleuté. La tige qui porte la fleur n'a aucune feuille et elle est un peu aplatie. »
3. « Sous la fleur, cherchez la petite spathe sèche comme du papier : c'est elle qui protégeait le bouton. »
4. « Le renflement vert est sous les tépales : ovaire infère. Et on ne dit plus Liliacées, on dit Amaryllidacées. »
5. « Coupez le bulbe en long : plateau en bas, écailles charnues emboîtées, peau brune dehors, et au centre la fleur de l'an prochain déjà prête. »

### 3.3 *Lavandula angustifolia* Mill. (lavande vraie)

Sources principales :
- Tela Botanica, nom retenu, classification : https://www.tela-botanica.org/bdtfx-nn-38072-synthese et API https://api.tela-botanica.org/service:eflore:0.1/bdtfx/taxons/38072/relations/superieurs ; Baseflor : https://api.tela-botanica.org/service:eflore:0.1/baseflor/informations/bdtfx.nn:38072?retour.format=max
- Floriscope : https://www.floriscope.io/plantes/lavandula-angustifolia
- FloreAlpes : https://www.florealpes.com/fiche_lavande.php
- Wikipédia FR et EN (dernier recours) : https://fr.wikipedia.org/wiki/Lavande_vraie et https://en.wikipedia.org/wiki/Lavandula_angustifolia
- EchoSciences Drôme (vulgarisation, pour la différence avec le lavandin) : https://www.echosciences-drome.fr/blog/lavande-drome-science/

| Rubrique | Contenu | Source |
|---|---|---|
| Nom commun | Lavande vraie, lavande officinale, lavande à feuilles étroites, lavande fine | Wikipédia FR ; liste CNRV 2026 (« Lavande vraie ; Lavande officinale ») ; EchoSciences |
| Nom latin | *Lavandula angustifolia* Mill. [1768, Gard. Dict., éd. 8 : n°2]. Synonymes courants : *L. officinalis* Chaix, *L. vera* DC. (la liste CNRV écrit « angustifolia (officinalis) ») | Tela Botanica ; Wikipédia FR |
| Famille | Lamiaceae (Lamiacées, anciennement dites Labiées, *Labiatae*), ordre Lamiales. Pas de changement de famille avec l'APG. | Tela Botanica ; listes CNRV 2013 et 2017 (« Lamiaceae (Labiatae) ») |
| Port et taille | Sous-arbrisseau en touffe basse. Hauteur : 30 à 60 cm (Wikipédia FR), 0,6 m max (Baseflor), 0,75 m × 1,1 m (Floriscope), 30 à 100 cm (FloreAlpes). Wikipédia EN donne 1 à 2 m, valeur non retenue car isolée. | Baseflor ; Floriscope ; Wikipédia FR ; FloreAlpes |
| Tiges | Quadrangulaires (carrées), ligneuses à la base, gris-vert ; vieille écorce grise | Wikipédia FR ; Floriscope |
| Feuillage | Persistant, gris-vert argenté | Floriscope ; Wikipédia EN |
| Disposition des feuilles | Opposées | Floriscope ; Wikipédia FR |
| Limbe et bord | Étroit, linéaire à lancéolé, 2,5 à 4,5 cm (Floriscope) ; bord : entier et enroulé selon l'usage courant, **non vérifié** dans les sources consultées | Floriscope ; Wikipédia EN (2 à 6 cm × 4 à 6 mm) |
| Fleurs | Bleu-violet à lilas ; petites fleurs en glomérules formant des épis terminaux de 2 à 8 cm, au bout de longues hampes fines sans feuilles (10 à 30 cm) ; corolle à deux lèvres (bilabiée), 4 étamines didynames ; pollinisation par les insectes | Baseflor ; Floriscope ; Wikipédia EN et FR |
| Floraison en France | Juin-juillet (Floriscope, FloreAlpes) ; juin à août (Baseflor) | Floriscope ; FloreAlpes ; Baseflor |
| Fruit | Tétrakène (4 petites nucules dans le calice) ; Baseflor code « akène » | Wikipédia FR ; Baseflor |
| Aspect hors floraison / hiver | Touffe persistante gris-vert (les feuilles restent). Aspect des hampes sèches en hiver : non vérifié. | Floriscope |
| Organes souterrains | Endomycorhizes signalées ; type de racine (pivotante ou non) : **non vérifié** | Floriscope |
| Confusion fréquente | Lavandin (*Lavandula × intermedia*) : feuilles plus larges et épis ramifiés ; la lavande fine a des épis sur de longues tiges fines, non ramifiées (source de vulgarisation) | EchoSciences Drôme |

Critères de reconnaissance (formulation prof) :
1. « Froissez une feuille : l'odeur suffit presque. Mais on ne s'arrête pas là. »
2. « Tige carrée et feuilles opposées : réflexe Lamiacées, comme le romarin ou la sauge. »
3. « Feuilles très étroites, gris-vert, qui restent l'hiver : *angustifolia* veut dire "à feuilles étroites". »
4. « Les fleurs bleu-violet sont en épi tout au bout d'une longue tige sans feuille, et chaque fleur a deux lèvres. »
5. « Si l'épi est ramifié et les feuilles plus larges, méfiance : c'est probablement un lavandin, pas la lavande vraie. »

---

## 4. Activité « relier » et phrase à trous

### 4.1 Six paires nom commun ↔ nom latin

| Nom commun | Nom latin | Score listes |
|---|---|---|
| Arbre aux quarante écus | *Ginkgo biloba* | 12/12 |
| Jonquille, narcisse trompette | *Narcissus pseudonarcissus* (les listes CNRV écrivent *Narcissus* ×) | 3/12, seul bulbe de la liste AP 2026 |
| Lavande vraie | *Lavandula angustifolia* | 10/12 |
| Laurier-cerise | *Prunus laurocerasus* | 12/12 |
| If commun | *Taxus baccata* | 12/12 |
| Arbre aux papillons | *Buddleja davidii* | 12/12 |

Distracteur bonus possible : « Laurier-sauce, *Laurus nobilis* » (10/12), pour piéger la confusion laurier-cerise / laurier-sauce.

### 4.2 Phrase à trous

« La lavande vraie, *Lavandula angustifolia*, appartient à la famille des **(1)** ; ses feuilles sont **(2)** et sa tige est **(3)**. »

| Trou | Bonne réponse | Distracteurs |
|---|---|---|
| (1) | Lamiacées (Lamiaceae) | Oléacées ; Astéracées ; Rosacées |
| (2) | opposées | alternes ; verticillées |
| (3) | carrée (quadrangulaire) | ronde (cylindrique) ; ailée |

Sources : Tela Botanica (famille), Floriscope (feuilles opposées), Wikipédia FR (tiges quadrangulaires).

Variante « piège famille » sur le bulbe : « Le narcisse, *Narcissus*, appartient à la famille des **Amaryllidacées** » ; distracteurs : Liliacées (ancien classement, piège), Iridacées, Asparagacées. Sources : Tela Botanica ; Wikipédia FR.

---

## 5. Photos Wikimedia Commons pour une question à image

Note technique : Wikimedia ne sert plus que des largeurs de vignette standard. L'URL en `800px-` renvoie une erreur HTTP 400 ; la largeur standard la plus proche, `960px-`, renvoie bien HTTP 200 (testé le 16 septembre 2026). Les URLs ci-dessous sont donc en 960 px (sauf la lavande, dont l'original fait exactement 800 px). Licences CC BY-SA : créditer l'auteur, citer la licence et partager à l'identique.

### Bonnes réponses

| Plante | Page fichier | Image directe | Auteur | Licence | Contenu vérifié visuellement |
|---|---|---|---|---|---|
| *Ginkgo biloba* | https://commons.wikimedia.org/wiki/File:Ginkgo_biloba_007.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Ginkgo_biloba_007.jpg/960px-Ginkgo_biloba_007.jpg | H. Zell | CC BY-SA 3.0 | Feuilles en éventail + deux graines jaune-orangé sur rameau court (Karlsruhe) |
| *Narcissus pseudonarcissus* | https://commons.wikimedia.org/wiki/File:Narcissus_pseudonarcissus_closeup.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Narcissus_pseudonarcissus_closeup.jpg/960px-Narcissus_pseudonarcissus_closeup.jpg | Meneerke bloem | CC BY-SA 3.0 | Fleur de profil, tépales jaune pâle, trompette jaune vif, feuilles linéaires (subsp. *pseudonarcissus*) |
| *Lavandula angustifolia* | https://commons.wikimedia.org/wiki/File:Lamiales_-_Lavandula_angustifolia_-_4.jpg | https://upload.wikimedia.org/wikipedia/commons/1/16/Lamiales_-_Lavandula_angustifolia_-_4.jpg (original 800 × 600) | Emőke Dénes | CC BY-SA 4.0 | Touffe gris-vert avec épis bleu-violet sur hampes nues (Londres) |

### Distracteurs visuellement proches (tous présents dans les listes CNRV 2026)

| Distracteur de | Plante | Page fichier | Image directe | Auteur | Licence | Pourquoi proche |
|---|---|---|---|---|---|---|
| Ginkgo | *Liriodendron tulipifera* (tulipier de Virginie ; AP 2026, cultivar 'Fastigiatum' au niveau 3) | https://commons.wikimedia.org/wiki/File:(ms)_Liriodendron_tulipifera_5.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/%28ms%29_Liriodendron_tulipifera_5.jpg/960px-%28ms%29_Liriodendron_tulipifera_5.jpg | Hladac | CC BY-SA 4.0 | Feuille à sommet tronqué et échancré, long pétiole, jaunit aussi à l'automne ; mais nervure principale bien visible |
| Narcisse | *Hemerocallis* (hémérocalle ; *H.* × *hybrida* en AP et PH 2026 niveau 4 ; photo de *H. lilioasphodelus*) | https://commons.wikimedia.org/wiki/File:Hemerocallis_lilioasphodelus_flower.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Hemerocallis_lilioasphodelus_flower.jpg/960px-Hemerocallis_lilioasphodelus_flower.jpg | Paolo Costa Baldi | CC BY-SA 3.0 | Fleur jaune à 6 tépales et feuilles rubanées basales ; mais pas de couronne en trompette |
| Lavande | *Perovskia* 'Blue Spire' (sauge d'Afghanistan, aujourd'hui *Salvia yangii* ; AP 2026 niveau 3, listée « Perovskia (Salvia) ») | https://commons.wikimedia.org/wiki/File:Salvia_yangii_%27Blue_Spire%27_2023-08-02_01.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Salvia_yangii_%27Blue_Spire%27_2023-08-02_01.jpg/960px-Salvia_yangii_%27Blue_Spire%27_2023-08-02_01.jpg | Agnieszka Kwiecień, Nova | CC BY-SA 4.0 | Touffe gris-argenté à épis bleu-lavande ; mais inflorescences très ramifiées, plante plus haute |

Photo écartée : « Narciso (Narcissus pseudonarcissus), Jardín Botánico, Múnich » (Diego Delso), car elle montre des tépales blancs et une couronne jaune, peu typique de l'espèce et trompeuse pour un exercice.

---

## 6. Points « non vérifié » à garder en tête

- Bord du limbe de la lavande (entier et enroulé) : usage courant, pas confirmé par les sources ouvertes consultées.
- Type de racine de la lavande : non trouvé.
- Racine pivotante du ginkgo : une seule source (SNHF).
- Racines contractiles du narcisse : Wikipédia EN seulement.
- Dispersion des graines du narcisse : myrmécochore (Baseflor) contre barochore (Wikipédia FR).
- Bulbilles chez le narcisse : aucune mention trouvée, ne pas en montrer.
- Liste L10 : région et année exactes non indiquées dans le document (mise en ligne 2013).
- Liste L11 Floriscope : auteur non indiqué.
