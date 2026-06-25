import xmlFormat from "xml-formatter";
import * as svgcreator from "./svgStringCreator";
import * as api from "./helperApiFunc";
import * as helper from "./helper";
import { create } from "d3-selection";
import { parcoords, height, width } from "./globals";

export function createSvgString(includeDataValues = false): string {
  type Feature = { name: string };
  const orderedFeatures: Feature[] = parcoords.newFeatures.map((name: any) => ({
    name,
  }));

  const hiddenDims = api.getAllHiddenDimensionNames();

  let yScalesForDownload = helper.setupYScales(
    parcoords.features,
    parcoords.newDataset,
  );
  let yAxisForDownload = helper.setupYAxis(
    yScalesForDownload,
    parcoords.newDataset,
    hiddenDims,
  );
  let xScalesForDownload = helper.setupXScales(
    orderedFeatures,
    parcoords.newDataset,
  );

  let svg = create("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
    .attr("viewBox", [0, 0, width, height])
    .attr("font-family", "Verdana, sans-serif");

  let defs = svg.append("defs");

  appendSymbol(defs, "arrow_image_up", "0 0 6 10", [
    {
      fill: "black",
      d: "M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 Z",
    },
  ]);
  appendSymbol(defs, "arrow_image_down", "0 0 6 10", [
    {
      fill: "black",
      d: "M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 Z",
    },
  ]);
  appendSymbol(defs, "brush_image_top", "0 0 100 86", [
    {
      fill: "rgb(242, 242, 76)",
      stroke: "black",
      strokeWidth: "7",
      d: "M 7 79 L 50 7 L 93 79 Z",
    },
  ]);
  appendSymbol(defs, "brush_image_bottom", "0 0 100 86", [
    {
      fill: "rgb(242, 242, 76)",
      stroke: "black",
      strokeWidth: "7",
      d: "M 7 7 L 93 7 L 50 79 Z",
    },
  ]);

  svgcreator.setFeatureAxisToDownload(
    svg,
    yAxisForDownload,
    yScalesForDownload,
    xScalesForDownload,
  );

  svgcreator.setActivePathLinesToDownload(svg);
  if (includeDataValues) {
    svgcreator.setSelectedRecordValuesToDownload(
      svg,
      xScalesForDownload,
      yScalesForDownload,
    );
  }

  return svg.node().outerHTML;
}

export function saveAsSvg(): void {
  setOptionsAndDownload();
}

function setOptionsAndDownload() {
  let name = "parcoords.svg";

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "spcd3-modal-overlay";
  modalOverlay.style.display = "block";

  const modal = document.createElement("div");
  modal.className = "spcd3-modal";
  modal.style.display = "block";
  modal.style.width = "30vw";

  const header = document.createElement("div");
  header.className = "spcd3-modal-header";
  header.style.paddingLeft = "0";

  const title = document.createElement("div");
  title.textContent = "Download Chart (SVG)";
  title.className = "spcd3-modal-title";
  title.style.paddingLeft = "0";

  const closeButton = document.createElement("span");
  closeButton.innerHTML = "&times;";
  closeButton.className = "spcd3-close-button";

  modal.appendChild(title);
  modal.appendChild(closeButton);

  modal.appendChild(header);

  const form = document.createElement("div");
  form.className = "spcd3-form";

  const rowDecimals = document.createElement("div");
  rowDecimals.className = "spcd3-options-div";

  const label = document.createElement("label");
  label.className = "spcd3-label";
  label.textContent = "Decimals places (0-10): ";
  label.htmlFor = "decimalsInput";

  const input = document.createElement("input");
  input.className = "spcd3-input";
  input.type = "number";
  input.min = "0";
  input.max = "10";
  input.value = "2";
  input.id = "decimalsInput";

  rowDecimals.appendChild(label);
  rowDecimals.appendChild(input);

  const rowKeepClasses = document.createElement("div");
  rowKeepClasses.className = "spcd3-options-div";

  const labelKeepClasses = document.createElement("label");
  labelKeepClasses.className = "spcd3-label";
  labelKeepClasses.textContent = "Keep classes: ";

  const inputKeepClasses = document.createElement("input");
  inputKeepClasses.className = "spcd3-input";
  inputKeepClasses.type = "checkbox";
  inputKeepClasses.id = "keepClassesInput";
  inputKeepClasses.checked = true;

  rowKeepClasses.appendChild(labelKeepClasses);
  rowKeepClasses.appendChild(inputKeepClasses);

  const rowIncludeUiControls = document.createElement("div");
  rowIncludeUiControls.className = "spcd3-options-div";

  const labelIncludeUiControls = document.createElement("label");
  labelIncludeUiControls.className = "spcd3-label";
  labelIncludeUiControls.textContent = "Include UI controls: ";

  const inputIncludeUiControls = document.createElement("input");
  inputIncludeUiControls.className = "spcd3-input";
  inputIncludeUiControls.type = "checkbox";
  inputIncludeUiControls.id = "includeUiControlsInput";
  inputIncludeUiControls.checked = true;

  rowIncludeUiControls.appendChild(labelIncludeUiControls);
  rowIncludeUiControls.appendChild(inputIncludeUiControls);

  const rowIncludeDataValues = document.createElement("div");
  rowIncludeDataValues.className = "spcd3-options-div";

  const labelIncludeDataValues = document.createElement("label");
  labelIncludeDataValues.className = "spcd3-label";
  labelIncludeDataValues.textContent = "Include data values: ";

  const inputIncludeDataValues = document.createElement("input");
  inputIncludeDataValues.className = "spcd3-input";
  inputIncludeDataValues.type = "checkbox";
  inputIncludeDataValues.id = "includeDataValuesInput";
  inputIncludeDataValues.checked = true;

  rowIncludeDataValues.appendChild(labelIncludeDataValues);
  rowIncludeDataValues.appendChild(inputIncludeDataValues);

  const button = document.createElement("button");
  button.textContent = "Download";
  button.className = "spcd3-button spcd3-generic-button";

  form.appendChild(rowDecimals);
  form.appendChild(rowKeepClasses);
  form.appendChild(rowIncludeUiControls);
  form.appendChild(rowIncludeDataValues);
  form.appendChild(button);
  modal.appendChild(form);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  input.focus();

  button.addEventListener("click", () => {
    const decimals = parseInt(input.value);
    if (isNaN(decimals) || decimals < 0 || decimals > 10) {
      alert("Please enter a number between 2 and 10.");
      input.focus();
      return;
    }

    let svgString = createSvgString(inputIncludeDataValues.checked);
    svgString = svgString.replaceAll("currentColor", "black");
    svgString = svgString.replaceAll('stroke="black"', "");
    svgString = svgString.replaceAll('fill="black"', "");
    svgString = svgString.replaceAll('dy="0"', "");
    svgString = svgString.replaceAll(
      'fill="none" font-size="10" font-family="sans-serif" text-anchor="end"',
      'fill="none" font-size="8" text-anchor="end" stroke="black"',
    );
    svgString = svgString.replaceAll("domain", "dimension");
    svgString = svgString.replaceAll("12px", "12");
    svgString = svgString.replaceAll(
      'class="tick" opacity="1"',
      'class="tick" fill="black" stroke="none"',
    );

    let updatedSVG = roundDecimals(svgString, decimals);

    updatedSVG = updatedSVG.replaceAll(
      'class="records" style="opacity: 1; stroke: rgba(0, 129, 175, 1); stroke-width: 2; fill: none;"',
      'class="records" style="opacity: 0.5; stroke: rgba(0, 129, 175, 0.8); stroke-width: 2; fill: none;"',
    );

    if (!inputKeepClasses.checked) {
      updatedSVG = removeClasses(updatedSVG);
    }

    if (!inputIncludeUiControls.checked) {
      updatedSVG = removeUiControls(updatedSVG);
      updatedSVG = updatedSVG.replaceAll(
        '<svg y="25" x="-6"><use width="12" height="12" y="0" x="0" href="#arrow_image_up"></use></svg>',
        "",
      );
    }

    let processedData = xmlFormat(updatedSVG, {
      indentation: "  ",
      collapseContent: true,
    });

    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
    let svgBlob = new Blob([preface, processedData], {
      type: "image/svg+xml;charset=utf-8",
    });
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    document.body.removeChild(modalOverlay);
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  });

  closeButton.addEventListener("click", () => {
    document.body.removeChild(modalOverlay);
  });
}

type SymbolPathDefinition = {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
};

function appendSymbol(
  defs: any,
  id: string,
  viewBox: string,
  paths: SymbolPathDefinition[],
): void {
  const symbol = defs.append("symbol").attr("id", id).attr("viewBox", viewBox);

  paths.forEach((pathDefinition) => {
    const path = symbol.append("path").attr("d", pathDefinition.d);
    if (pathDefinition.fill) {
      path.attr("fill", pathDefinition.fill);
    }
    if (pathDefinition.stroke) {
      path.attr("stroke", pathDefinition.stroke);
    }
    if (pathDefinition.strokeWidth) {
      path.attr("stroke-width", pathDefinition.strokeWidth);
    }
  });
}

function roundDecimals(svgString: string, decimals: number): string {
  return svgString.replace(/(\d*\.\d+)/g, (match) => {
    return parseFloat(match).toFixed(decimals);
  });
}

function removeClasses(svgString: string): string {
  return svgString.replace(/\sclass="[^"]*"/g, "");
}

function removeUiControls(svgString: string): string {
  svgString = svgString.replace(/<defs[\s\S]*?<\/defs>/g, "");
  svgString = svgString.replace(/<g><use[\s\S]*?<\/use><\/g>/g, "");
  svgString = svgString.replace(/<g><rect[\s\S]*?<\/rect><\/g>/g, "");
  svgString = svgString.replace(/y\s*=\s*["']?18["']?/g, 'y="29"');
  return svgString;
}
