export function cleanString(stringValue: string): string {
    let value = stringValue.replace(/ /g,'_');
        return value.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
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