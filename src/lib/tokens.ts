/** ORYZO colors + fonts. Rest is FREE from taste-skill. */
export const tokens = {
  color: {
    studioBlack: "#100904",
    warmCream:   "#ffedd7",
    corkShadow:  "#40372e",
    darkCork:    "#382416",
    burntSienna: "#dc5000",
    greyBrown:   "#6c5f51",
    forestGrid:  "#445231",
    // Extended palette for dramatic gradients (used selectively)
    deepCork:    "#1c1410",
    glowEmber:   "#ff7a45",
    deepInk:     "#0a0604",
  },
  font: { family: "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif" },
  motion: {
    easeDefault: [0.32, 0.72, 0, 1] as const,
    easeRapid: [0.22, 1, 0.36, 1] as const,
    easeBack: [0.34, 1.56, 0.64, 1] as const,
  },
} as const;
