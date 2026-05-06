export function cleanString(stringValue: string): string {
  let value = stringValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (/^[0-9]/.test(value)) {
    value = "x-" + value;
  }
  return value;
}

export function setSize(stringValue: string, size: number): string {
  return stringValue.replace(
    "viewBox",
    `width="${size}" height="${size}" viewBox`,
  );
}

export const BRUSH_IDLE_FILL = "rgb(242, 242, 76)";
export const BRUSH_ACTIVE_FILL = "rgb(255, 255, 0)";
export const ARROW_UP_PATH = "M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 z";
export const ARROW_DOWN_PATH = "M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 z";

export function getInactiveLineStroke(): string {
  const isDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return isDark ? "rgba(177, 188, 199, 0.18)" : "rgba(211, 211, 211, 0.4)";
}

export function applyThemeToSvg(svg: string): string {
  const isDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const textColor = isDark ? "#eef3f7" : "#000000";
  const surfaceColor = isDark ? "#1b2126" : "#dbe3ea";
  const cursorSurfaceColor = isDark ? "#1b2126" : "#e7edf3";
  const handleColor = BRUSH_IDLE_FILL;
  const handleActiveColor = BRUSH_ACTIVE_FILL;

  return svg
    .replaceAll("currentColor", textColor)
    .replaceAll('stroke="black"', `stroke="${textColor}"`)
    .replaceAll('stroke="#000"', `stroke="${textColor}"`)
    .replaceAll('fill="black"', `fill="${textColor}"`)
    .replaceAll('fill="#000"', `fill="${textColor}"`)
    .replaceAll('stroke="white"', `stroke="${surfaceColor}"`)
    .replaceAll('fill="white"', `fill="${surfaceColor}"`)
    .replaceAll('fill="#fff"', `fill="${surfaceColor}"`)
    .replaceAll('fill="#ffffff"', `fill="${surfaceColor}"`)
    .replaceAll('fill="rgb(242, 242, 76)"', `fill="${handleColor}"`)
    .replaceAll('fill="rgb(255, 255, 0)"', `fill="${handleActiveColor}"`)
    .replaceAll('fill="rgb(214, 176, 28)"', `fill="${handleColor}"`)
    .replaceAll('fill="rgb(235, 196, 44)"', `fill="${handleActiveColor}"`)
    .replaceAll('fill="#f9f9f9"', `fill="${cursorSurfaceColor}"`);
}

export function applyThemeToBrushSvg(svg: string): string {
  const isDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const strokeColor = isDark ? "#10233a" : "black";
  const handleColor = BRUSH_IDLE_FILL;
  const handleActiveColor = BRUSH_ACTIVE_FILL;
  const surfaceColor = isDark ? "#1b2126" : "#dbe3ea";

  let themed = svg
    .replaceAll('stroke="#000000"', `stroke="${strokeColor}"`)
    .replaceAll('stroke="#000"', `stroke="${strokeColor}"`)
    .replaceAll('stroke="black"', `stroke="${strokeColor}"`)
    .replaceAll('fill="rgb(242, 242, 76)"', `fill="${handleColor}"`)
    .replaceAll('fill="rgb(255, 255, 0)"', `fill="${handleActiveColor}"`)
    .replaceAll('fill="rgb(214, 176, 28)"', `fill="${handleColor}"`)
    .replaceAll('fill="rgb(235, 196, 44)"', `fill="${handleActiveColor}"`)
    .replaceAll('fill="white"', `fill="${surfaceColor}"`)
    .replaceAll('fill="#fff"', `fill="${surfaceColor}"`)
    .replaceAll('fill="#ffffff"', `fill="${surfaceColor}"`);

  if (isDark) {
    themed = themed
      .replaceAll('stroke-width="0.4"', 'stroke-width="0.22"')
      .replaceAll('stroke-width="0.400000"', 'stroke-width="0.22"');
  }

  return themed;
}

export function applySvgColor(svg: string, color: string): string {
  return svg
    .replaceAll("currentColor", color)
    .replaceAll('stroke="black"', `stroke="${color}"`)
    .replaceAll('stroke="#000"', `stroke="${color}"`)
    .replaceAll('fill="black"', `fill="${color}"`)
    .replaceAll('fill="#000"', `fill="${color}"`);
}

export function getCursorHotspot(
  meta: {
    hotspotX: number;
    hotspotY: number;
    viewBoxMinX: number;
    viewBoxMinY: number;
    viewBoxWidth: number;
    viewBoxHeight: number;
  },
  size: number,
): [number, number] {
  const x = Math.round(
    ((meta.hotspotX - meta.viewBoxMinX) / meta.viewBoxWidth) * size,
  );
  const y = Math.round(
    ((meta.hotspotY - meta.viewBoxMinY) / meta.viewBoxHeight) * size,
  );
  return [x, y];
}

export function throttle<Params extends any[]>(
  func: (...args: Params) => any,
  delay: number,
): (...args: Params) => void {
  let lastExecTime = 0;
  return function (this: unknown, ...args: Params) {
    const context = this;
    const currentTime = Date.now();
    if (currentTime - lastExecTime >= delay) {
      func.apply(context, args);
      lastExecTime = currentTime;
    }
  };
}

export function digits(value: number): number {
  return value.toString().length;
}

export function addNumberOfDigs(
  number: any,
  currentPosOfDims: any,
  dimensionName: any,
  key: any,
): void {
  const newObject: Record<string, any> = {};
  newObject[key] = number;
  const target = currentPosOfDims.find((obj: any) => obj.key == dimensionName);
  Object.assign(target, newObject);
}

export function getMouseCoords(
  event: { clientX: number; clientY: number },
  targetContainer = document.body,
) {
  if (targetContainer === document.body) {
    return [event.clientX + window.scrollX, event.clientY + window.scrollY];
  } else {
    const rect = targetContainer.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }
}
