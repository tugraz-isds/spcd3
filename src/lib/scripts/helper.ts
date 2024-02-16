import * as brush from './brush';

export function cleanString(stringValue: string): string {
    let value = stringValue.replace(/ /g,'_');
        return value.replace(/[.,*\-%&'\[{()}\]]/g, '');
}

export function cleanLinePathString(stringValue: string): string {
    return stringValue.replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
}

export function cleanLinePathArrayString(stringValue: string): string {
    return stringValue.replace(/[*\- 0123456789%&'\[{()}\]]/g, '');
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
const delay = 50;
export const throttleBrushDown = throttle(brush.brushDown, delay);
export const throttleBrushUp = throttle(brush.brushUp, delay);
export const throttleDragAndBrush = throttle(brush.dragAndBrush, delay);