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
