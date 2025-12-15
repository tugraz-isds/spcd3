import xmlFormat from 'xml-formatter';
import * as icon from './icons/icons';
import * as svgcreator from './svgStringCreator';
import * as api from './helperApiFunc';
import * as helper from './helper';
import { create } from 'd3-selection';
import { parcoords, height, padding, width, key } from './globals';

export function createSvgString(): string {

    type Feature = { name: string };
    const orderedFeatures: Feature[] = parcoords.newFeatures.map((name: any) => ({ name }));

    const hiddenDims = api.getAllHiddenDimensionNames();

    let yScalesForDownload = helper.setupYScales(parcoords.features, parcoords.newDataset);
    let yAxisForDownload = helper.setupYAxis(yScalesForDownload, parcoords.newDataset, hiddenDims);
    let xScalesForDownload = helper.setupXScales(orderedFeatures);

    let svg = create('svg')
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'Verdana, sans-serif');

    let defs = svg.append('defs');

    defs.append('image')
        .attr('id', 'arrow_image_up')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowUp());

    defs.append('image')
        .attr('id', 'arrow_image_down')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowDown());

    defs.append('image')
        .attr('id', 'brush_image_top')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowTop());

    defs.append('image')
        .attr('id', 'brush_image_bottom')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowBottom());

    svgcreator.setFeatureAxisToDownload(svg, yAxisForDownload, yScalesForDownload, xScalesForDownload);

    svgcreator.setActivePathLinesToDownload(svg);

    return svg.node().outerHTML;
}

export function saveAsSvg(): void {
  let svgString = createSvgString();

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
  svgString = svgString.replaceAll("currentColor", "black");
  svgString = svgString.replaceAll("stroke=\"black\"", "");
  svgString = svgString.replaceAll("fill=\"black\"", "");
  svgString = svgString.replaceAll("dy=\"0\"", "");
  svgString = svgString.replaceAll("fill=\"none\" font-size=\"10\" font-family=\"sans-serif\" text-anchor=\"end\"", 
    "fill=\"none\" font-size=\"8\" text-anchor=\"end\" stroke=\"black\"");
  svgString = svgString.replaceAll("domain", "dimension");
  svgString = svgString.replaceAll("12px", "12");

  setOptionsAndDownload(svgString);
}

function setOptionsAndDownload(svgString: string) {
  let name = 'parcoords.svg';
  const modalOverlay = document.createElement('div');
  modalOverlay.style.position = 'fixed';
  modalOverlay.style.top = '0';
  modalOverlay.style.left = '0';
  modalOverlay.style.width = '100vw';
  modalOverlay.style.height = '100vh';
  modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
  modalOverlay.style.display = 'flex';
  modalOverlay.style.justifyContent = 'center';
  modalOverlay.style.alignItems = 'center';
  modalOverlay.style.zIndex = '9999';

  const modal = document.createElement('div');
  modal.style.backgroundColor = 'white';
  modal.style.padding = '0';
  modal.style.border = '0.08rem solid gray';
  modal.style.borderRadius = '0.5rem';
  modal.style.boxShadow = '0 0 0.625rem rgba(0,0,0,0.3)';
  modal.style.textAlign = 'center';
  modal.style.minWidth = '18rem';

  const fakeheader = document.createElement('div');
  fakeheader.style.height = '0.4rem';
  fakeheader.style.background = 'lightgrey';
  fakeheader.style.borderTopLeftRadius = '0.5rem';
  fakeheader.style.borderTopRightRadius = '0.5rem';
  modal.append(fakeheader);

  const title = document.createElement('div');
  title.textContent = 'Download Chart (SVG)';
  title.style.padding = '0.5rem';
  title.style.marginBottom = '0.5rem';
  title.style.background = 'lightgrey';
  title.style.textAlign =  'left';

  const closeButton = document.createElement('span');
  closeButton.innerHTML = '&times;';
  closeButton.style.padding = '0.5rem';
  closeButton.style.marginBottom = '0.5rem';
  closeButton.style.marginLeft = '9rem';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.fontSize = '1.25rem';
  closeButton.style.textAlign = 'right';
  title.append(closeButton);

  modal.append(title);

  const form = document.createElement('div');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '1rem';

  const rowDecimals = document.createElement('div');
  rowDecimals.style.display = 'flex';
  rowDecimals.style.alignItems = 'center';
  rowDecimals.style.justifyContent = 'space-between';

  const label = document.createElement('label');
  label.textContent = 'Decimals places (0-10): ';
  label.style.padding = '0.35rem';
  label.style.textAlign = 'left';
  label.style.flex = '1';
  label.htmlFor = 'decimalsInput';

  const input = document.createElement('input');
  input.style.marginRight = '0.45rem';
  input.type = 'number';
  input.min = '0';
  input.max = '10';
  input.value = '2';
  input.id = 'decimalsInput';
  input.style.width = '3.125rem';

  rowDecimals.appendChild(label);
  rowDecimals.appendChild(input);

  const rowKeepClasses = document.createElement('div');
  rowKeepClasses.style.display = 'flex';
  rowKeepClasses.style.alignItems = 'center';
  rowKeepClasses.style.justifyContent = 'space-between';

  const labelKeepClasses = document.createElement('label');
  labelKeepClasses.textContent = 'Keep classes: ';
  labelKeepClasses.style.padding = '0.35rem';
  labelKeepClasses.style.flex = '1';
  labelKeepClasses.style.textAlign = 'left';
  labelKeepClasses.style.marginRight = '0.5rem';

  const inputKeepClasses = document.createElement('input');
  inputKeepClasses.type = 'checkbox';
  inputKeepClasses.id = 'keepClassesInput';
  inputKeepClasses.style.marginRight = '0.45rem';
  inputKeepClasses.style.verticalAlign = 'middle';
  inputKeepClasses.checked = true;

  rowKeepClasses.appendChild(labelKeepClasses);
  rowKeepClasses.appendChild(inputKeepClasses);

  const rowRemoveUiControls = document.createElement('div');
  rowRemoveUiControls.style.display = 'flex';
  rowRemoveUiControls.style.alignItems = 'center';
  rowRemoveUiControls.style.justifyContent = 'space-between';

  const labelRemoveUiControls = document.createElement('label');
  labelRemoveUiControls.textContent = 'Download without UI controls: ';
  labelRemoveUiControls.style.padding = '0.35rem';
  labelRemoveUiControls.style.flex = '1';
  labelRemoveUiControls.style.textAlign = 'left';
  labelRemoveUiControls.style.marginRight = '0.5rem';

  const inputRemoveUiControls = document.createElement('input');
  inputRemoveUiControls.type = 'checkbox';
  inputRemoveUiControls.id = 'removeUiControlsInput';
  inputRemoveUiControls.style.marginRight = '0.45rem';
  inputRemoveUiControls.style.verticalAlign = 'middle';
  inputRemoveUiControls.checked = true;

  rowRemoveUiControls.appendChild(labelRemoveUiControls);
  rowRemoveUiControls.appendChild(inputRemoveUiControls);

  const button = document.createElement('button');
  button.textContent = 'Download';
  button.style.cursor = 'pointer';
  button.style.marginLeft = '0.5rem';
  button.style.marginTop = '0.4rem';
  button.style.marginBottom = '0.5rem';
  button.style.marginRight = '0.5rem';
  button.style.display = 'block';

  form.appendChild(rowDecimals);
  form.appendChild(rowKeepClasses);
  form.appendChild(rowRemoveUiControls);
  form.appendChild(button)
  modal.appendChild(form);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  input.focus();

  button.addEventListener('click', () => {
    const decimals = parseInt(input.value);
    if (isNaN(decimals) || decimals < 0 || decimals > 10) {
      alert('Please enter a number between 2 and 10.');
      input.focus();
      return;
    }

    let updatedSVG = roundDecimals(svgString, decimals);

    updatedSVG = updatedSVG.replaceAll("class=\"records\" style=\"opacity: 1; stroke: rgba(0, 129, 175, 1); stroke-width: 2; fill: none;\"",
      "class=\"records\" style=\"opacity: 0.5; stroke: rgba(0, 129, 175, 0.8); stroke-width: 2; fill: none;\"");

    if (!inputKeepClasses.checked) {
      updatedSVG = removeClasses(updatedSVG);
    }

    if (inputRemoveUiControls.checked) {
      updatedSVG = removeUiControls(updatedSVG);
    }

    let processedData = xmlFormat(updatedSVG, { indentation: '  ', collapseContent: true })

    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
    let svgBlob = new Blob([preface, processedData], { type: 'image/svg+xml;charset=utf-8' });
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    document.body.removeChild(modalOverlay);
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  });

  closeButton.addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
}

function getImageTag(key: string, svg: string): string {
  return `<image id="${key}" width="12" height="12" href="data:image/svg+xml,${svg}">`;
}

function roundDecimals(svgString: string, decimals: number): string {
  return svgString.replace(/(\d*\.\d+)/g, (match) => {
    return parseFloat(match).toFixed(decimals);
  });
}

function removeClasses(svgString: string): string {
  return svgString.replace(/\sclass="[^"]*"/g, '');
}

function removeUiControls(svgString: string): string {
  svgString = svgString.replace(/<defs[\s\S]*?<\/defs>/g, '');
  svgString = svgString.replace(/<g><use[\s\S]*?<\/use><\/g>/g, '');
  svgString = svgString.replace(/<g><rect[\s\S]*?<\/rect><\/g>/g, '');
  svgString = svgString.replace(/y\s*=\s*["']?18["']?/g, 'y="29"');
  return svgString;
}