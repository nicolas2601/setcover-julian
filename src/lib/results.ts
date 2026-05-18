import raw from "@/data/results.json";

export type ResultsShape = {
  eda: {
    n_clientes: number; n_antenas: number; densidad_matriz: number;
    total_unos: number; min_antenas_por_cliente: number; max_antenas_por_cliente: number;
    promedio_antenas_por_cliente: number; mediana_antenas_por_cliente: number;
    min_clientes_por_antena: number; max_clientes_por_antena: number;
    promedio_clientes_por_antena: number; mediana_clientes_por_antena: number;
    antenas_inutiles_cubren_0: number; clientes_huerfanos: number; factible: boolean;
    costo_min: number; costo_max: number; costo_medio: number; costo_mediana: number;
    costo_std: number; costo_total_si_seleccionara_todas: number; lb_minimo_por_cliente: number;
  };
  greedy: { sel_size: number; costo: number; tiempo_s: number };
  exacto: { status: string; sel_size: number; costo: number; tiempo_s: number; lp_relax_obj: number; gap_integralidad_pct: number; gap_residual_pct?: number; nodos_bb?: number };
  ga: { pop_size: number; generations: number; p_cross: number; p_mut: number | string; elitism: number; sel_size: number; costo: number; tiempo_s: number; gap_vs_exacto_pct: number; corridas_5_semillas?: number[]; media_5_corridas?: number; std_5_corridas?: number; estancamiento_gen?: number; gen_convergencia?: number; gap_medio_pct?: number; cv_pct?: number };
  comparativa: { metodo: string[]; costo: number[]; tiempo_s: number[] };
  ga_refinado: { pop_size: number; generations: number; p_cross: number; p_mut: string | number; elitism: number; seed?: number; sel_size: number; costo: number; tiempo_s: number; gap_vs_exacto_pct: number; estancamiento_gen?: number; corridas_5_semillas?: number[]; media_5_corridas?: number; std_5_corridas?: number };
  speedup?: number;
  authors?: { nicolas: string; julian: string };
};

export const results = raw as ResultsShape;

export const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");
export const fmtNumber = (n: number, frac = 2) =>
  n.toLocaleString("es-CO", { maximumFractionDigits: frac, minimumFractionDigits: frac });
export const fmtInt = (n: number) =>
  n.toLocaleString("es-CO", { maximumFractionDigits: 0 });
export const fmtTime = (s: number) => {
  if (s < 0.01) return `${(s * 1000).toFixed(2)} ms`;
  if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
  if (s < 60) return `${s.toFixed(2)} s`;
  return `${(s / 60).toFixed(1)} min`;
};
export const fmtPct = (n: number, frac = 2) => `${n.toFixed(frac)}%`;

// Canonical antenna selections (from FINAL paper)
export const SELECTED_EXACT_ANTENNAS: number[] = [
  14, 43, 44, 73, 114, 166, 196, 200, 210, 277, 308, 354, 357, 363, 401, 403,
  405, 421, 436, 453, 456, 497,
];
export const SELECTED_GA_ANTENNAS: number[] = [
  19, 29, 44, 45, 80, 94, 175, 196, 200, 277, 354, 357, 358, 366, 401, 404,
  411, 421, 444, 457, 467, 473, 493,
];

// Authors + key metrics
export const AUTHORS = {
  nicolas: "Nicolás Moreno",
  julian: "Julian Arteaga",
} as const;
export const SPEEDUP = 83;

export function syntheticConvergence(
  generations = 95, finalBest = 50795, initialBest = 85000,
  finalAvg = 52500, initialAvg = 95000,
): { gen: number; best: number; avg: number }[] {
  const series: { gen: number; best: number; avg: number }[] = [];
  for (let g = 0; g < generations; g++) {
    const t = g / (generations - 1);
    const best = finalBest + (initialBest - finalBest) * Math.exp(-4 * t);
    const avgBase = finalAvg + (initialAvg - finalAvg) * Math.exp(-3 * t);
    const noise = Math.sin(g * 0.7) * 220 + Math.sin(g * 0.31 + 1.3) * 150;
    const avg = Math.max(best + 250, avgBase + noise);
    series.push({ gen: g + 1, best: Math.round(best), avg: Math.round(avg) });
  }
  return series;
}
