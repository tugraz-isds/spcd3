export function cleanString(stringValue: string) {
    let value = stringValue.replace(/ /g,'_');
        return value.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
}