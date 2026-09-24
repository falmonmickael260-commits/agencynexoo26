# Nexoo Agency — site

Agence créative, **Valence — Drôme — France**.

État actuel : **Loader + Hero + section Services**. Rien d'autre n'est construit.

## Lancer

```bash
npm install
npm run site          # site Vite            → http://localhost:5173
npm run studio        # Remotion Studio      → compositions du loader
npm run site:build    # build de production  → dist-site/
```

## Mise en ligne

Déployé sur GitHub Pages à chaque push sur `main`
(`.github/workflows/deploy.yml`). Le workflow typecheck, lint, build, publie.

Pages sert un *project site*, donc les URL d'assets doivent être préfixées par le
nom du dépôt : le build lit `SITE_BASE`, que le workflow dérive de
`GITHUB_REPOSITORY` plutôt que de le coder en dur — un renommage du dépôt ne
casse donc pas silencieusement les chemins. En local, `SITE_BASE` n'est pas
défini et le site est servi depuis la racine.

## Architecture

Le point central : **le loader est une composition Remotion, et sa dernière image
*est* le hero** — pas une imitation.

```
shared/            code partagé par le loader ET le site — source unique
  brand.ts         identité, specs typo, géométrie du point, services
  HeroFrame.tsx    la structure du hero, rendue à l'identique des deux côtés
  Masthead.tsx     NEXOO ● AGENCY, ajusté au pixel sur les gouttières
  wordmark.ts      mesure de la ligne réelle (pas d'un run de texte)
  hero.css         mise en page commune
  tokens.css       couleurs, typo, rythme, motion

src/nexoo/         le loader, comme composition Remotion
  NexooLoader.tsx  chorégraphie (2,6 s @ 60 fps)
  timeline.ts      toutes les temporisations, en frames

site/              le site Vite
  components/      Hero, Services, Field (canvas), LoaderStage (Player)
  components/services/ServiceArt.tsx   les 5 pièces, dessinées en SVG
  lib/motion.ts    une seule boucle rAF pour toute la page
```

### Pourquoi la transition est invisible

`<Player>` est monté avec `compositionWidth/Height` **mesurés sur le hero
lui-même** : l'échelle interne vaut donc exactement 1, et un pixel de composition
= un pixel CSS. Comme les deux couches rendent le même `<HeroFrame>` avec la même
feuille de style, l'image finale du loader et la première du hero sont
identiques — vérifié : glyphes, filets et point rouge à 0,00 px d'écart.

Le loader affiche aussi le pied de page réel, invisible, pour en réserver la
hauteur : sans lui le mastheads se décalerait de plusieurs dizaines de pixels au
passage de relais.

### Le point rouge

C'est l'origine de toute l'animation : il arrive seul, se comprime, puis projette
un filet horizontal d'où le mot se déplie vers l'extérieur — NEXOO vers la
gauche, AGENCY vers la droite. Sa pulsation au repos fait un nombre entier de
cycles au moment exact du relais, pour qu'il soit à l'échelle 1 des deux côtés.

Dans le hero il respire, s'ouvre à l'approche du curseur et penche vers lui.

### La section Services

Cinq **doubles pages éditoriales**, pas une liste. Chaque service est une
composition : un chiffre géant en filaire posé derrière la pièce, la pièce
elle-même, puis le texte — trois plans qui défilent à des vitesses différentes.
La direction alterne d'une page à l'autre pour que le rythme ne se fige jamais.

Les visuels sont de vraies pièces, dessinées ici : les imprimés sont sur un
papier crème (c'est ce contraste avec le fond encre qui les fait lire comme de
l'impression), l'écran reste sombre. Chaque pièce est découpée en plans qui
s'inclinent vers le curseur.

Deux pièges évités, volontairement :

- le texte **ne chevauche pas** les visuels — les imprimés sont crème, la typo
  est blanche, les deux s'annulent. C'est le chiffre, en filaire et derrière,
  qui porte la superposition ;
- le chiffre ne traverse pas le titre : il reste derrière la pièce et n'émerge
  que dans la gouttière.

## Ressources

Tout est **libre et gratuit**, rien de payant, aucune photo stock.

| Ressource | Source | Licence |
|---|---|---|
| Archivo (variable, `wdth` 62–125) | Google Fonts / Omnibus-Type | OFL 1.1 |
| Instrument Serif | Google Fonts / Instrument | OFL 1.1 |
| JetBrains Mono | Google Fonts / JetBrains | OFL 1.1 |
| Visuels des services | dessinés dans `site/components/services/ServiceArt.tsx` | — |
| Grain | `feTurbulence` SVG en ligne (`shared/tokens.css`) | — |

L'axe `wdth` d'Archivo porte le geste du loader : la requête Google Fonts doit
impérativement conserver `wdth` (voir `shared/fonts.css`).

## Aides de relecture (dev uniquement, retirées du build)

- `?loaderFrame=N` — fige le loader sur une image, pour comparer au hero
- `?motion=reduce` — force le parcours *prefers-reduced-motion*
- `window.__nexooMotion.set(x, y)` — pilote le pointeur amorti

## Accessibilité / performance

- `prefers-reduced-motion` : pas de loader, pas de parallaxe, pas de panneau
  curseur, le champ dessine une image fixe, et la boucle rAF ne tourne pas.
- Le contenu des services est **visible par défaut** ; l'animation s'active
  seulement si elle peut réellement se jouer.
- Une seule boucle rAF, écritures directes en style (aucun re-render React au
  pointeur ou au scroll) — une passe complète mesurée à ~1,5 ms (p95 3,4 ms).
- Le champ est du canvas 2D, regroupé en un nombre fixe de `stroke()` par image.
- `@remotion/player` est isolé dans son propre chunk.
