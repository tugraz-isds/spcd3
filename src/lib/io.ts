import xmlFormat from 'xml-formatter';
import * as icon from './icons/icons';
import * as pc from './parallelcoordinates';

export function saveAsSvg(): void {
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
  title.textContent = 'Download SVG';
  title.style.padding = '0.5rem';
  title.style.marginBottom = '0.5rem';
  title.style.background = 'lightgrey';
  title.style.textAlign =  'left';
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
  inputKeepClasses.checked = true;

  rowKeepClasses.appendChild(labelKeepClasses);
  rowKeepClasses.appendChild(inputKeepClasses);

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

    if (!inputKeepClasses.checked) {
      updatedSVG = removeClasses(updatedSVG);
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
}

function getImageTag(key: string, svg: string): string {
  return `<image id="${key}" width="12" height="12" href="data:image/svg+xml,${svg}">`;
}

function roundDecimals(svgString, decimals) {
  return svgString.replace(/(\d*\.\d+)/g, (match) => {
    return parseFloat(match).toFixed(decimals);
  });
}

function removeClasses(svgString: string): string {
  return svgString.replace(/\sclass="[^"]*"/g, '');
}