import * as d3 from 'd3';

export function loadCSV(csv :string) {
        let complete_arr = csv.split(/\r?\n/);
        if (checkIfDuplicatesExists(complete_arr[0]))
        {
            csv = removeDuplicateColumnNames(csv);
        }
        let tmp_data = d3.csvParse(csv);
        return tmp_data.sort((a,b) => a.Name > b.Name ? 1 : -1);
}

export function removeDuplicateColumnNames(value :string) {
    let complete_arr = value.split(/\r?\n/);
    let column_string = d3.csvParse(complete_arr[0]);
    let n = 0;
    const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n+=1})`)(new Set));
    complete_arr[0] = unique(column_string["columns"]).toString();
    return complete_arr.join('\r\n');
}

export function checkIfDuplicatesExists(value :string) {
    return new Set(value).size !== value.length
}