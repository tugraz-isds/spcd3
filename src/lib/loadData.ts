import {csvParse} from 'd3-dsv';

export function loadCSV(csv: string): any {
        let completeArray = csv.split(/\r?\n/);
        if (checkIfDuplicatesExists(completeArray[0]))
        {
            csv = removeDuplicateColumnNames(csv);
        }
        let tempData = csvParse(csv);
        return tempData.sort((a,b) => a.Name > b.Name ? 1 : -1);
}

function removeDuplicateColumnNames(value :string): any {
    let completeArray = value.split(/\r?\n/);
    let column_string = csvParse(completeArray[0]);
    let n = 0;
    const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n+=1})`)(new Set));
    completeArray[0] = unique(column_string['columns']).toString();
    return completeArray.join('\r\n');
}

function checkIfDuplicatesExists(value :string): any {
    return new Set(value).size !== value.length
}
