export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeDefault: [number, number, number, number] = [0.32, 0.72, 0, 1];
export const easeRapid: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const easeBack: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mapRange = (
  v: number, inMin: number, inMax: number, outMin: number, outMax: number,
) => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
