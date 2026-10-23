// Geometry for the home page weather map, shared by the server render (first frame) and the
// browser animation, so the page looks the same before and after the script runs.

export const FIELD = { W: 440, H: 340, cx: 236, cy: 172, rings: 8 };

/** A point on ring k at angle a, at time t (seconds). Inner rings turn faster, like a storm. */
export function ringPoint(k: number, a: number, t: number, cx = FIELD.cx, cy = FIELD.cy): [number, number] {
  const spin = a + t * 0.06 * (FIELD.rings + 1 - k) / FIELD.rings;
  const r = (14 + k * 17) * (1 + 0.13 * Math.sin(2 * spin + k * 0.45 + t * 0.5) + 0.06 * Math.sin(3 * spin - k * 0.3 - t * 0.35));
  return [cx + r * Math.cos(spin) * 1.25, cy + r * Math.sin(spin) * 0.85];
}

/** A closed ring as a smooth path (Catmull-Rom spline drawn with cubic Beziers). */
export function ringPath(k: number, t: number, cx = FIELD.cx, cy = FIELD.cy): string {
  const n = 40;
  const pts = Array.from({ length: n }, (_, i) => ringPoint(k, (i / n) * Math.PI * 2, t, cx, cy));
  const p = (i: number) => pts[(i + n) % n];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/** Ring and angle for promise i of n (newest first): older promises sit on outer rings. */
export function markerSlot(i: number, n: number): { k: number; a: number } {
  const k = n <= 1 ? 4 : 2 + Math.round((i / (n - 1)) * (FIELD.rings - 2));
  return { k, a: 0.6 + i * 2.39996 };
}
