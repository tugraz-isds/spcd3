import * as d3 from 'd3';
import xmlFormat from 'xml-formatter';

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
    complete_arr[0] = unique(column_string['columns']).toString();
    return complete_arr.join('\r\n');
}

export function checkIfDuplicatesExists(value :string) {
    return new Set(value).size !== value.length
}

export function saveAsSvg() {
    let svg = document.getElementById('pc_svg');
    saveSvg(svg, 'parcoords.svg');
}

export function saveSvg(data, name) {
    
    data.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    let svgData = data.outerHTML;

    svgData = svgData.replaceAll(/cursor="[^"]*"/g, '')
    svgData = svgData.replace(/style="cursor:[^"]*"/g, '')

    let processedData = xmlFormat(svgData);

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