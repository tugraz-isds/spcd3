import {csvParse} from 'd3-dsv';
import xmlFormat from 'xml-formatter';

export function loadCSV(csv: string): any {
        let completeArray = csv.split(/\r?\n/);
        console.log(csv);
        console.log(completeArray);
        if (checkIfDuplicatesExists(completeArray[0]))
        {
            csv = removeDuplicateColumnNames(csv);
        }
        let tempData = csvParse(csv);
        return tempData.sort((a,b) => a.Name > b.Name ? 1 : -1);
}

export function removeDuplicateColumnNames(value :string): any {
    let completeArray = value.split(/\r?\n/);
    let column_string = csvParse(completeArray[0]);
    let n = 0;
    const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n+=1})`)(new Set));
    completeArray[0] = unique(column_string['columns']).toString();
    return completeArray.join('\r\n');
}

export function checkIfDuplicatesExists(value :string): any {
    return new Set(value).size !== value.length
}

export function saveAsSvg(): void {
    let svg = document.getElementById('pc_svg');
    saveSvg(svg, 'parcoords.svg');
}

export function saveSvg(data: any, name: string): void {
    
    data.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    let svgData = data.outerHTML;

    svgData = svgData.replaceAll(/cursor: url\([^)]*\) 8 8, auto;/g, '');
    svgData = svgData.replaceAll(/style="cursor:[^"]*"/g, '');

    let processedData = xmlFormat(svgData);
    processedData = processedData.replace(/    /g, '  ');

    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
    let svgBlob = new Blob([preface, processedData], {type:'image/svg+xml;charset=utf-8'});
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}