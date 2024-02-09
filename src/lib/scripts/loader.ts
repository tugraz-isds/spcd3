import * as d3 from 'd3';
import xmlFormat from 'xml-formatter';

export function loadCSV(csv: string): any {
        let completeArray = csv.split(/\r?\n/);
        if (checkIfDuplicatesExists(completeArray[0]))
        {
            csv = removeDuplicateColumnNames(csv);
        }
        let tempData = d3.csvParse(csv);
        return tempData.sort((a,b) => a.Name > b.Name ? 1 : -1);
}

export function removeDuplicateColumnNames(value :string): any {
    let completeArray = value.split(/\r?\n/);
    let column_string = d3.csvParse(completeArray[0]);
    let n = 0;
    const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n+=1})`)(new Set));
    completeArray[0] = unique(column_string['columns']).toString();
    return completeArray.join('\r\n');
}

export function checkIfDuplicatesExists(value :string): any {
    return new Set(value).size !== value.length
}

export function saveAsSvg2(): void {
    let svg = document.getElementById('pc_svg');
    saveSvg(svg, 'parcoords.svg');
}

export function saveSvg(data: any, name: string): void {
    
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

export function saveSvg2(data: any, name: string): void {
    
    let svgData = data;

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

export function createSVG(active, inactive, featureAxis, size) {
    const svgHead = createSVGInit(size);
    let svgBody =  '<g class="active">' + active;
    svgBody += '</g><g class="inactive">';
    svgBody += inactive;
    svgBody += '</g>';
    svgBody += featureAxis.replace(" undefined", "");
    svgBody += "</svg>";
    return svgHead + svgBody;
}

export function createSVGInit(size: any): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" id="pc_svg" viewBox="0,0,${size},400" font-family="Verdana, sans-serif" preserveAspectRatio="none" style="overflow: auto;">`;
}