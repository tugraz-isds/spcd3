import xmlFormat from 'xml-formatter';
import * as icon from './icons/icons';
import * as pc from './parallelcoordinates';

export function saveAsSvg(): void {
  let name = 'parcoords.svg';
  let svgString = pc.createSvgString();

  let svgArrowUp = encodeURIComponent(icon.getArrowUp());
  let svgArrowDown = encodeURIComponent(icon.getArrowDown());
  let svgArrowBottom = encodeURIComponent(icon.getArrowBottom());
  let svgArrowTop = encodeURIComponent(icon.getArrowTop());

  let regexUp = /<image id="arrow_image_up"[^>]*href="data:image\/svg\+xml[^"]*">/g;

  let regexDown = /<image id="arrow_image_down"[^>]*href="data:image\/svg\+xml[^"]*">/g;

  let regexTop = /<image id="brush_image_top"[^>]*href="data:image\/svg\+xml[^"]*">/g;

  let regexBottom = /<image id="brush_image_bottom"[^>]*href="data:image\/svg\+xml[^"]*">/g;

  svgString = svgString.replaceAll(regexUp, getImageTag("arrow_image_up", svgArrowUp));
  svgString = svgString.replaceAll(regexDown, getImageTag("arrow_image_down", svgArrowDown));
  svgString = svgString.replaceAll(regexBottom, getImageTag("brush_image_bottom", svgArrowBottom));
  svgString = svgString.replaceAll(regexTop, getImageTag("brush_image_top", svgArrowTop));

  let processedData = xmlFormat(svgString, { indentation: '  ', collapseContent: true })

  let preface = '<?xml version="1.0" standalone="no"?>\r\n';
  let svgBlob = new Blob([preface, processedData], { type: 'image/svg+xml;charset=utf-8' });
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