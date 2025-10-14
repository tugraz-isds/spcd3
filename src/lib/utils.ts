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
    return stringValue.replace('viewBox', `width="${size}" height="${size}" viewBox`);
}

export function throttle<Params extends any[]>(func: (...args: Params) => any,
    delay: number):
    (...args: Params) => void {
    let lastExecTime = 0;
    return function () {
        const context = this;
        const args = arguments;
        const currentTime = Date.now();
        if (currentTime - lastExecTime >= delay) {
            func.apply(context, args);
            lastExecTime = currentTime;
        }
    };
}

export function digits(value: number): number {
    return value
        .toString()
        .length
};

export function addNumberOfDigs(number: any, currentPosOfDims: any, dimensionName: any, key: any): void {
    let newObject = {};
    newObject[key] = number;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}

//https://stackoverflow.com/questions/123999/how-can-i-tell-if-a-dom-element-is-visible-in-the-current-viewport
export function isElementVisible(element: { node: () => { (): any; new(): any; getBoundingClientRect: { (): any; new(): any; }; contains: { (arg0: Element): any; new(): any; }; }; }) {
    let rect = element.node().getBoundingClientRect(),
        vWidth = window.innerWidth || document.documentElement.clientWidth,
        vHeight = window.innerHeight || document.documentElement.clientHeight,
        efp = function (x, y) { return document.elementFromPoint(x, y) };

    if (rect.right < 0 || rect.bottom < 0
        || rect.left > vWidth || rect.top > vHeight)
        return false;

    return (
        element.node().contains(efp(rect.left, rect.top))
        || element.node().contains(efp(rect.right, rect.top))
        || element.node().contains(efp(rect.right, rect.bottom))
        || element.node().contains(efp(rect.left, rect.bottom))
    );
}

export function getMouseCoords(event: { clientX: number; clientY: number; }, targetContainer = document.body) {
    if (targetContainer === document.body) {
      return [event.clientX + window.scrollX, event.clientY + window.scrollY];
    } else {
      const rect = targetContainer.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    }
}