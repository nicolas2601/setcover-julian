/** GIC (General Intelligence Company) design tokens — primary palette.
 *  Oryzo tokens kept for backwards-compat with any legacy imports.
 */

export const gic = {
  color: {
    nightSky:       '#1f1f29',
    cofounderBlue:  '#0081c0',
    actionAzure:    '#41a1cf',
    pitchBlack:     '#000000',
    canvasWhite:    '#ffffff',
    offWhite:       '#fefffc',
    ashGray:        '#f9faf7',
    coolGray:       '#eef1ed',
    steelGray:      '#dee2de',
    darkCharcoal:   '#171717',
    charcoal:       '#2c2c2c',
    richBlack:      '#282834',
    slateGray:      '#444141',
    mediumGray:     '#646464',
    lightGray:      '#b4b8b4',
    // Extended for hero glow / 3D bloom
    glowBlue:       '#6cb8e2',
    deepNight:      '#14141c',
  },
  font: {
    family: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
    mono:   'var(--font-jetbrains), ui-monospace, monospace',
  },
  motion: {
    easeDefault: [0.32, 0.72, 0, 1] as const,
    easeRapid:   [0.22, 1, 0.36, 1] as const,
    easeBack:    [0.34, 1.56, 0.64, 1] as const,
  },
} as const;

/** @deprecated — oryzo palette kept for backward compat. Prefer `gic.*`. */
export const oryzo = {
  color: {
    studioBlack: '#100904',
    warmCream:   '#ffedd7',
    corkShadow:  '#40372e',
    darkCork:    '#382416',
    burntSienna: '#dc5000',
    greyBrown:   '#6c5f51',
    forestGrid:  '#445231',
    deepCork:    '#1c1410',
    glowEmber:   '#ff7a45',
    deepInk:     '#0a0604',
  },
  font: { family: 'var(--font-jakarta), ui-sans-serif, system-ui, sans-serif' },
  motion: {
    easeDefault: [0.32, 0.72, 0, 1] as const,
    easeRapid:   [0.22, 1, 0.36, 1] as const,
    easeBack:    [0.34, 1.56, 0.64, 1] as const,
  },
} as const;

/** Primary export — all chart/visual code should use `tokens.color.*` via GIC. */
export const tokens = {
  color: {
    // ── GIC primary ────────────────────────────────────────────────────────
    nightSky:       gic.color.nightSky,
    cofounderBlue:  gic.color.cofounderBlue,
    actionAzure:    gic.color.actionAzure,
    pitchBlack:     gic.color.pitchBlack,
    canvasWhite:    gic.color.canvasWhite,
    offWhite:       gic.color.offWhite,
    ashGray:        gic.color.ashGray,
    coolGray:       gic.color.coolGray,
    steelGray:      gic.color.steelGray,
    darkCharcoal:   gic.color.darkCharcoal,
    charcoal:       gic.color.charcoal,
    richBlack:      gic.color.richBlack,
    slateGray:      gic.color.slateGray,
    mediumGray:     gic.color.mediumGray,
    lightGray:      gic.color.lightGray,
    glowBlue:       gic.color.glowBlue,
    deepNight:      gic.color.deepNight,
    // ── Color-mapping shims (old oryzo names → GIC equivalents) ─────────────
    // Allows gradual migration; chart files reference these during transition.
    studioBlack:    gic.color.canvasWhite,   // bg on light charts → canvas white (transparent handled by parent)
    warmCream:      gic.color.darkCharcoal,  // on-light text → dark charcoal
    corkShadow:     gic.color.steelGray,     // axis/grid stroke → steel gray
    darkCork:       gic.color.offWhite,      // tooltip bg → off white
    burntSienna:    gic.color.cofounderBlue, // primary accent → cofounder blue
    greyBrown:      gic.color.mediumGray,    // muted labels → medium gray
    glowEmber:      gic.color.actionAzure,   // secondary glow → action azure
  },
  font: gic.font,
  motion: gic.motion,
} as const;
