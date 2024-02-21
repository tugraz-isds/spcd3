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

//source: https://stackoverflow.com/questions/22884720/what-is-the-fastest-way-to-count-the-number-of-significant-digits-of-a-number
export function digits (value) {
    return value
        .toExponential()
        .replace(/^([0-9]+)\.?([0-9]+)?e[\+\-0-9]*$/g, "$1$2")
        .length
};

export function addNumberOfDigs(number: any, currentPosOfDims: any, dimensionName: any, key: any):void {
    let newObject = {};
    newObject[key] = number;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}