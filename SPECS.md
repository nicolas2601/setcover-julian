# SPECS v4 — SetCover (DRAMATIC, INTERACTIVE)

## Goal
**Página de presentación cinematográfica, interactiva, dramática** para SET COVER 500×500 (Julian/Nicolas IO UNAB 2026). Demostrar capacidad de frontend y diseño nivel awwwards/Lusion/Linear.

## Constraints (from user)
- **ORYZO**: solo colores (`#100904 / #ffedd7 / #dc5000 / #40372e / #382416 / #6c5f51`) y la fuente única (Plus Jakarta Sans variable)
- Para todo lo demás: **LIBRE de taste-skill** — usar TODOS los recursos de `taste-skill/components/`

## Stack
- Next 16.2 + Bun 1.3 + TS strict + Tailwind v4
- **GSAP 3 + @gsap/react + ScrollTrigger + Observer + Flip** — animación principal
- **Lenis** — smooth scroll
- **Framer Motion v12** — micro-interacciones + AnimatePresence
- **React Three Fiber + drei + postprocessing** — hero 3D + escenas WebGL dramáticas
- **maath** — para easings/utils 3D
- **split-type** — char/word reveals
- **highlight.js** sync — code blocks
- **KaTeX + react-katex** — math
- **Plus Jakarta Sans** variable única
- Custom SVG charts con GSAP draw

## Taste-skill components a USAR (referencia obligatoria)

Del `taste-skill/components/`:
- **gsap-explore.md** (34 demos oficiales):
  - `image-mask-on-scroll` → hero reveal
  - `motionpath-waypoints` → conectar antenas con clientes
  - `pinned-panels-with-overscroll` → Scenes 4 + 5 scrollytelling
  - `responsive-line-splits-on-scroll` → headlines escenas
  - `flip-gallery-modal` → comparativa métodos
  - `text-masking` → display headlines
  - `velocity-skew` → marquee + transiciones
  - `directional-marquee` → footer
- **aceternity-ui.md**:
  - `hero-parallax` → Scene 1
  - `container-scroll-animation` → Scene 4 con MATLAB tree
  - `card-stack` → 8 ingredientes GA
  - `compare` → Exacto vs GA
  - `meteors` reducido para drama
- **reactbits.md**:
  - `split-text` + `scroll-reveal` + `blur-text`
  - `glare-hover` para cards
  - `metallic-paint` (sutil) en hero stat
  - `scroll-stack` para ingredientes
  - `count-up`
- **21st-community.md**: gradient hero refs

## Hard rules
- **NUNCA** `whileInView` que esconda contenido permanente
- **NUNCA** `dynamic({ ssr: false })` para contenido visible
- Default visible-by-default. Animaciones son DECORACIÓN, no gate
- Coordenadas SVG con `.toFixed(2)` para SSR-safe
- `Math.imul` para LCG
- Reduced-motion respetado SIEMPRE

## Scenes (dramáticas, NO planas)

### Scene 1 · Hero
- Full viewport. **R3F WebGL background**: 500 puntos antenas en disco esférico flotando, con shader sutil + bloom. Líneas binarias activas al hover. Cámara con parallax mouse.
- Display headline 156px+ ("Un problema de **2⁵⁰⁰**") con split-text char-by-char y blur-in
- Mouse magnetic en el headline
- Marquee inferior con "SET COVER · OPTIMIZACIÓN COMBINATORIA · NP-DIFÍCIL · ...
- Scroll prompt 

### Scene 2 · Problema — Pinned scrollytelling
- Sticky pinned 200vh
- A medida que el usuario scrollea, la matriz 500×500 se construye celda por celda (canvas/SVG dramático)
- Stats grandes (display 84px) revelan uno por uno con CountUp + glare-hover
- Texto editorial flotando

### Scene 3 · Formulación matemática
- Display 84px "Un modelo. **Tres reglas**"
- ModelILP KaTeX gigante con animated brackets
- 3 explanation rows con magnetic numerals (cada uno reacciona al cursor)

### Scene 4 · Exacto — Pinned scrollytelling EXTREMO
- Sticky pinned 300vh
- Branch & Bound tree se construye nodo por nodo con scroll (GSAP timeline scrubbed)
- Cuando llega a un nodo pruned, animation de strikethrough
- En paralelo: code MATLAB type-on effect (chars aparecen sincronizado con scroll)
- Result pills aparecen al final con stagger dramático

### Scene 5 · GA — Pinned scrollytelling con WebGL
- Sticky pinned 250vh
- R3F: 150 puntos (población) animándose, evolucionan a clusters con scroll
- HUD: "Generación X / 500" updating
- 8 ingredientes aparecen como cards superpuestas con FLIP animation (GSAP Flip plugin)
- Code snippet revealing

### Scene 6 · Convergencia
- ConvergenceChart con líneas que SE DIBUJAN con scroll (GSAP DrawSVG alternative)
- Slider interactivo "viajar por generaciones" — al mover, scrub timeline
- Annotations flotantes que aparecen en momentos clave

### Scene 7 · Comparación — split-screen interactive
- Compare component (Aceternity) → drag divider entre "Exacto" y "GA"
- Bar chart dramático con bars que crecen con scroll
- Toggle 3 vistas (Costo / Tiempo / Gap) con FLIP

### Scene 8 · Robustez
- 5 seeds como cards en stack 3D
- Dot plot interactivo con tooltip rich

### Scene 9 · Conclusiones
- 3 takeaways como cards full-screen con scroll-snap
- Cada uno con su propia paleta dentro de ORYZO

### Scene 10 · Referencias + Footer marquee
- Lista IEEE
- Marquee gigante repeating "SET COVER · NICOLÁS · JULIÁN · UNAB · 2026 · ..."
- Easter egg al final
