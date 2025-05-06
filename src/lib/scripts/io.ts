import {csvParse} from 'd3-dsv';
import * as d3 from 'd3-selection';
import xmlFormat from 'xml-formatter';
import * as icon from '../icons/icons';

export function loadCSV(csv: string): any {
        let completeArray = csv.split(/\r?\n/);
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

    data.querySelectorAll(".domain").forEach(el => {
        el.removeAttribute("class");
    });

    let svgData = data.outerHTML;

    svgData = svgData.replaceAll(/cursor: url\([^)]*\) 8 8, auto;/g, '');
    svgData = svgData.replaceAll(/style="cursor:[^"]*"/g, '');
    svgData = svgData.replaceAll(/<rect style=[^>]*><\/rect>/g, '');
    svgData = svgData.replaceAll(/id="pc_svg"/g, '');

    let svgArrowUp = encodeURIComponent(icon.getArrowUp());
    let svgArrowDown = encodeURIComponent(icon.getArrowDown());
    let svgArrowBottom = encodeURIComponent(icon.getArrowBottom());
    let svgArrowTop = encodeURIComponent(icon.getArrowTop());

    let regexUp = /<image id="arrow_image_up"[^>]*href="data:image\/svg\+xml[^"]*">/g;

    let regexDown = /<image id="arrow_image_down"[^>]*href="data:image\/svg\+xml[^"]*">/g;

    let regexTop = /<image id="brush_image_top"[^>]*href="data:image\/svg\+xml[^"]*">/g;

    let regexBottom = /<image id="brush_image_bottom"[^>]*href="data:image\/svg\+xml[^"]*">/g;

    svgData = svgData.replaceAll(regexUp, getImageTag("arrow_image_up", svgArrowUp));
    svgData = svgData.replaceAll(regexDown, getImageTag("arrow_image_down", svgArrowDown));
    svgData = svgData.replaceAll(regexBottom, getImageTag("brush_image_bottom", svgArrowBottom));
    svgData = svgData.replaceAll(regexTop, getImageTag("brush_image_top", svgArrowTop));

    let processedData = xmlFormat(svgData);
    processedData = flattenTextTags(processedData);
    processedData = cleanUseElements(processedData);
    processedData = cleanPathElements(processedData);
    processedData = removeEmptyOrHiddenRects(processedData);
    processedData = processedData.replace(/pointer-events\s*:\s*[^;"]*;?/g, '');
    processedData = processedData.replace(/    /g, '  ');
    processedData = processedData.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');

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

function getImageTag(key: string, svg: string): string {
    return `<image id="${key}" width="12" height="12" href="data:image/svg+xml,${svg}">`;
}

function flattenTextTags(svgString) {
    return svgString.replace(/<text([^>]*)>\s*([\s\S]*?)\s*<\/text>/g, (_, attrs, content) => {
      const flattened = content.replace(/\s+/g, ' ').trim();
      return `<text${attrs}>${flattened}</text>`;
    });
  }

  function cleanUseElements(svgString) {
    return svgString.replace(/<use([^>]*)>([\s\S]*?)<\/use>/g, (_, attrs) => {
      return `<use${attrs}/>`;
    });
  }

  function cleanPathElements(svgString) {
    return svgString.replace(/<path([^>]*)>([\s\S]*?)<\/path>/g, (_, attrs) => {
      return `<path${attrs}/>`;
    });
  }

  function removeEmptyOrHiddenRects(svgString) {
    return svgString.replace(/<rect([^>]*?)\s*\/?>/g, (match, attrs) => {
      const hasZeroSize = /(?:\s|")width\s*=\s*["']?0(?:\.0*)?["']?/i.test(attrs) &&
                          /(?:\s|")height\s*=\s*["']?0(?:\.0*)?["']?/i.test(attrs);
      const hasHiddenStyle = /visibility\s*:\s*hidden|display\s*:\s*none/i.test(attrs);
  
      if (hasZeroSize || hasHiddenStyle) {
        return '';
      }
      return match;
    });
  }
  
  