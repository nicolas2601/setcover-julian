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
  exacto: { status: string; sel_size: number; costo: number; tiempo_s: number; lp_relax_obj: number; gap_integralidad_pct: number };
  ga: { pop_size: number; generations: number; p_cross: number; p_mut: number; elitism: number; sel_size: number; costo: number; tiempo_s: number; gap_vs_exacto_pct: number; corridas_5_semillas?: number[]; media_5_corridas?: number; std_5_corridas?: number };
  comparativa: { metodo: string[]; costo: number[]; tiempo_s: number[] };
  ga_refinado: { pop_size: number; generations: number; p_cross: number; p_mut: string | number; elitism: number; seed?: number; sel_size: number; costo: number; tiempo_s: number; gap_vs_exacto_pct: number };
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

export const SELECTED_EXACT_ANTENNAS: number[] = [
  14, 20, 29, 44, 45, 94, 175, 183, 206, 272, 277, 307, 334, 354, 401, 404,
  432, 436, 438, 444, 467, 475,
];
export const SELECTED_GA_ANTENNAS: number[] = [
  19, 44, 45, 80, 175, 192, 196, 200, 213, 275, 277, 289, 354, 357, 358, 366,
  401, 404, 421, 467, 473, 493, 496,
];

export function syntheticConvergence(
  generations = 500, finalBest = 50546, initialBest = 65800,
  finalAvg = 51800, initialAvg = 78200,
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
