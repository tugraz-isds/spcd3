import xmlFormat from "xml-formatter";
import { isTauri } from "@tauri-apps/api/core";
import { dirname, join } from "@tauri-apps/api/path";
import { save as saveWithNativeDialog } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import * as svgcreator from "./svgStringCreator";
import * as api from "./helperApiFunc";
import * as helper from "./helper";
import { create } from "d3-selection";
import { parcoords, height, width } from "./globals";
import {
  getSvgDownloadSettings,
  setSvgDownloadSettings,
  getTauriSvgSaveDirectory,
  setTauriSvgSaveDirectory,
} from "./persistence";

const DOWNLOAD_TOP_BALANCE_PADDING = 32;
const DEFAULT_SVG_FILENAME = "parcoords.svg";

type BrowserSaveFilePickerOptions = {
  excludeAcceptAllOption?: boolean;
  id?: string;
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type BrowserWritableFileStream = {
  write: (data: Blob | BufferSource | string) => Promise<void>;
  close: () => Promise<void>;
};

type BrowserFileSystemFileHandle = {
  createWritable: () => Promise<BrowserWritableFileStream>;
};

type BrowserSaveWindow = Window & {
  showSaveFilePicker?: (
    options?: BrowserSaveFilePickerOptions,
  ) => Promise<BrowserFileSystemFileHandle>;
};

export function createSvgString(includeDataValues = false): string {
  type Feature = { name: string };
  const orderedFeatures: Feature[] = parcoords.newFeatures.map((name: any) => ({
    name,
  }));
  const layout = helper.calculateChartLayout(
    orderedFeatures,
    parcoords.newDataset,
  );
  const leftBalancePadding = Math.max(0, layout.rightPadding - layout.leftPadding);
  const rightBalancePadding = Math.max(
    0,
    layout.leftPadding - layout.rightPadding,
  );

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
    .attr("viewBox", [
      -leftBalancePadding,
      -DOWNLOAD_TOP_BALANCE_PADDING,
      width + leftBalancePadding + rightBalancePadding,
      height + DOWNLOAD_TOP_BALANCE_PADDING,
    ])
    .attr("font-family", "Verdana, sans-serif");
  const contentRoot = svg.append("g");

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
    contentRoot,
    yAxisForDownload,
    yScalesForDownload,
    xScalesForDownload,
  );

  svgcreator.setActivePathLinesToDownload(contentRoot);
  if (includeDataValues) {
    svgcreator.setSelectedRecordValuesToDownload(
      contentRoot,
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
  const persistedSettings = getSvgDownloadSettings();

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
  input.value = persistedSettings.decimals.toString();
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
  inputKeepClasses.checked = persistedSettings.keepClasses;

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
  inputIncludeUiControls.checked = persistedSettings.includeUiControls;

  rowIncludeUiControls.appendChild(labelIncludeUiControls);
  rowIncludeUiControls.appendChild(inputIncludeUiControls);

  const rowIncludeDataValues = document.createElement("div");
  rowIncludeDataValues.className = "spcd3-options-div";

  const labelIncludeDataValues = document.createElement("label");
  labelIncludeDataValues.className = "spcd3-label";
  labelIncludeDataValues.textContent =
    "Include data values of selected records: ";

  const inputIncludeDataValues = document.createElement("input");
  inputIncludeDataValues.className = "spcd3-input";
  inputIncludeDataValues.type = "checkbox";
  inputIncludeDataValues.id = "includeDataValuesInput";
  inputIncludeDataValues.checked = persistedSettings.includeDataValues;

  rowIncludeDataValues.appendChild(labelIncludeDataValues);
  rowIncludeDataValues.appendChild(inputIncludeDataValues);

  const rowConvertSymbols = document.createElement("div");
  rowConvertSymbols.className = "spcd3-options-div";

  const labelConvertSymbols = document.createElement("label");
  labelConvertSymbols.className = "spcd3-label";
  labelConvertSymbols.textContent = "Convert symbols to paths: ";

  const inputConvertSymbols = document.createElement("input");
  inputConvertSymbols.className = "spcd3-input";
  inputConvertSymbols.type = "checkbox";
  inputConvertSymbols.id = "convertSymbolsInput";
  inputConvertSymbols.checked = persistedSettings.convertSymbolsToPaths;

  rowConvertSymbols.appendChild(labelConvertSymbols);
  rowConvertSymbols.appendChild(inputConvertSymbols);

  const button = document.createElement("button");
  button.textContent = "Download";
  button.className = "spcd3-button spcd3-generic-button";

  form.appendChild(rowDecimals);
  form.appendChild(rowKeepClasses);
  form.appendChild(rowIncludeUiControls);
  form.appendChild(rowIncludeDataValues);
  form.appendChild(rowConvertSymbols);
  form.appendChild(button);
  modal.appendChild(form);
  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  input.focus();

  button.addEventListener("click", async () => {
    const name = DEFAULT_SVG_FILENAME;

    const decimals = parseInt(input.value);
    if (isNaN(decimals) || decimals < 0 || decimals > 10) {
      alert("Please enter a number between 2 and 10.");
      input.focus();
      return;
    }

    setSvgDownloadSettings({
      decimals,
      keepClasses: inputKeepClasses.checked,
      includeUiControls: inputIncludeUiControls.checked,
      includeDataValues: inputIncludeDataValues.checked,
      convertSymbolsToPaths: inputConvertSymbols.checked,
    });

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

    if (inputConvertSymbols.checked) {
      updatedSVG = convertSymbolsToPaths(updatedSVG);
    }

    let processedData = xmlFormat(updatedSVG, {
      indentation: "  ",
      collapseContent: true,
    });

    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgContent = `${preface}${processedData}`;

    button.disabled = true;

    try {
      const savedInTauri = await saveSvgWithTauri(svgContent, name);
      if (savedInTauri) {
        document.body.removeChild(modalOverlay);
        return;
      }

      const savedInBrowserPicker = await saveSvgWithBrowserFilePicker(
        svgContent,
        name,
      );
      if (!savedInBrowserPicker) {
        downloadSvgInBrowser(svgContent, name);
      }

      document.body.removeChild(modalOverlay);
    } catch (error) {
      console.error("Failed to save SVG", error);
      alert("The SVG file could not be saved.");
    } finally {
      button.disabled = false;
    }
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

async function saveSvgWithBrowserFilePicker(
  svgContent: string,
  suggestedFileName: string,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const browserWindow = window as BrowserSaveWindow;
  const showSaveFilePicker = browserWindow.showSaveFilePicker;
  if (!showSaveFilePicker) {
    return false;
  }

  try {
    const fileHandle = await showSaveFilePicker({
      id: "spcd3-svg-download",
      suggestedName: suggestedFileName,
      types: [
        {
          description: "SVG files",
          accept: { "image/svg+xml": [".svg"] },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(svgContent);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }

    console.warn("Browser file picker save failed, falling back to download", error);
    return false;
  }
}

async function saveSvgWithTauri(
  svgContent: string,
  suggestedFileName: string,
): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  const defaultPath = await getTauriSvgDefaultPath(suggestedFileName, join);
  const selectedPath = await saveWithNativeDialog({
    title: "Download Chart (SVG)",
    defaultPath,
    filters: [{ name: "SVG", extensions: ["svg"] }],
  });

  if (!selectedPath) {
    return true;
  }

  await writeTextFile(selectedPath, svgContent);
  await rememberTauriSvgSaveDirectory(selectedPath, dirname);
  return true;
}

async function getTauriSvgDefaultPath(
  suggestedFileName: string,
  join: (...paths: string[]) => Promise<string>,
): Promise<string> {
  const storedDirectory = getTauriSvgSaveDirectory();

  if (storedDirectory) {
    return await join(storedDirectory, suggestedFileName);
  }

  return suggestedFileName;
}

async function rememberTauriSvgSaveDirectory(
  selectedPath: string,
  dirname: (path: string) => Promise<string>,
): Promise<void> {
  const directory = await dirname(selectedPath);
  if (directory) {
    setTauriSvgSaveDirectory(directory);
  }
}

function downloadSvgInBrowser(svgContent: string, filename: string): void {
  const svgBlob = new Blob([svgContent], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(svgUrl);
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

function convertSymbolsToPaths(svgString: string): string {
  const parser = new DOMParser();
  const documentSvg = parser.parseFromString(svgString, "image/svg+xml");
  const svgRoot = documentSvg.documentElement;
  const defs = svgRoot.querySelector("defs");
  if (!defs) return svgString;

  const symbols = new Map<string, SVGSymbolElement>();
  defs.querySelectorAll("symbol").forEach((symbol) => {
    const id = symbol.getAttribute("id");
    if (id) {
      symbols.set(id, symbol as SVGSymbolElement);
    }
  });

  svgRoot.querySelectorAll("use").forEach((useNode) => {
    const href =
      useNode.getAttribute("href") || useNode.getAttribute("xlink:href");
    if (!href || !href.startsWith("#")) return;

    const symbol = symbols.get(href.slice(1));
    if (!symbol) return;

    const replacement = createPathsFromSymbol(documentSvg, symbol, useNode);
    const parent = useNode.parentElement;
    if (!parent) return;

    if (
      parent.tagName.toLowerCase() === "svg" &&
      parent.childElementCount === 1 &&
      parent.parentElement
    ) {
      parent.parentElement.replaceChild(replacement, parent);
    } else {
      parent.replaceChild(replacement, useNode);
    }
  });

  defs.remove();
  return new XMLSerializer().serializeToString(svgRoot);
}

function createPathsFromSymbol(
  documentSvg: Document,
  symbol: SVGSymbolElement,
  useNode: Element,
): SVGGElement {
  const group = documentSvg.createElementNS("http://www.w3.org/2000/svg", "g");
  const symbolSvgParent =
    useNode.parentElement?.tagName.toLowerCase() === "svg"
      ? useNode.parentElement
      : null;

  const symbolX = parseSvgNumber(symbolSvgParent?.getAttribute("x"));
  const symbolY = parseSvgNumber(symbolSvgParent?.getAttribute("y"));
  const useX = parseSvgNumber(useNode.getAttribute("x"));
  const useY = parseSvgNumber(useNode.getAttribute("y"));
  const width = parseSvgNumber(useNode.getAttribute("width"), 0);
  const height = parseSvgNumber(useNode.getAttribute("height"), 0);

  const [minX, minY, viewBoxWidth, viewBoxHeight] = parseViewBox(
    symbol.getAttribute("viewBox"),
  );
  const scaleX = viewBoxWidth === 0 ? 1 : width / viewBoxWidth;
  const scaleY = viewBoxHeight === 0 ? 1 : height / viewBoxHeight;

  const transforms = [
    `translate(${symbolX + useX} ${symbolY + useY})`,
    `scale(${scaleX} ${scaleY})`,
  ];
  if (minX !== 0 || minY !== 0) {
    transforms.push(`translate(${-minX} ${-minY})`);
  }
  group.setAttribute("transform", transforms.join(" "));

  symbol.querySelectorAll("path").forEach((pathNode) => {
    const path = documentSvg.createElementNS("http://www.w3.org/2000/svg", "path");
    Array.from(pathNode.attributes).forEach((attribute) => {
      path.setAttribute(attribute.name, attribute.value);
    });
    group.appendChild(path);
  });

  return group;
}

function parseViewBox(viewBox: string | null): [number, number, number, number] {
  if (!viewBox) return [0, 0, 0, 0];
  const values = viewBox
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value));
  if (values.length !== 4 || values.some((value) => Number.isNaN(value))) {
    return [0, 0, 0, 0];
  }
  return [values[0], values[1], values[2], values[3]];
}

function parseSvgNumber(value: string | null | undefined, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}
