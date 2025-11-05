import { canvasEl } from "./globals";

function getPolylinePoints(d: any, parcoords: any): [number, number][] {
  const pts: [number, number][] = [];
  parcoords.newFeatures.forEach((name: string) => {
    const x =
      parcoords.dragging[name] !== undefined
        ? parcoords.dragging[name]
        : parcoords.xScales(name);
    const y = parcoords.yScales[name](d[name]);
    pts.push([x, y]);
  });
  return pts;
}

export function redrawCanvasLines(
  ctx: any,
  dataset: any[],
  parcoords: any
): void {
  if (!ctx || !canvasEl || !dataset) return;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.lineWidth = 2; // ≈ 0.12rem
  for (const d of dataset) {
    const pts = getPolylinePoints(d, parcoords);
    if (!pts.length) continue;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = "rgba(0, 129, 175, 0.5)";
    ctx.stroke();
  }
}

export function initCanvas2D(dpr: number) {
  const ctx = canvasEl.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 2D only
  return ctx;
}
