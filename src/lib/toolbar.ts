import * as d3 from "d3-selection";
import * as icon from "./icons/icons";
import * as pc from "./parallelcoordinates";
import * as io from "./io";
import { getChartZoomScale, setChartZoomScale } from "./persistence";
import {
  numberOfDimensions,
  numberOfRecords,
} from "./globals";

type ChartZoomState = {
  chartWrapper: HTMLDivElement;
  zoomInButton: HTMLButtonElement;
  zoomOutButton: HTMLButtonElement;
  zoomInput: HTMLInputElement;
  svg: SVGSVGElement;
  baseSvgWidth: number;
  baseSvgHeight: number;
  previousSvgInlineSize: string;
  previousSvgBlockSize: string;
  previousChartWrapperBlockSize: string;
  scale: number;
  isDraggingPan: boolean;
  didPan: boolean;
  panStartX: number;
  panStartY: number;
  panScrollLeft: number;
  panScrollTop: number;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerDown: (event: PointerEvent) => void;
  onClickCapture: (event: MouseEvent) => void;
  onWheel: (event: WheelEvent) => void;
};

let chartZoomState: ChartZoomState | null = null;
const MIN_CHART_SCALE = 0.5;
const MAX_CHART_SCALE = 3;
const CHART_SCALE_STEP = 0.25;

export function createToolbar(dataset: any[]): void {
  const toolbarRow = d3.select("#spcd3-toolbarRow");

  const { btn: toggleButton, tip: toggleTip } = makeIconButton(toolbarRow, {
    id: "toggleButton",
    iconHtml: icon.getExpandToolbarIcon(),
    tipText: "Expand Toolbar",
  });

  const toolbar = toolbarRow
    .append("div")
    .attr("id", "spcd3-toolbar")
    .attr("class", "spcd3-toolbar");

  makeIconButton(toolbar, {
    iconHtml: icon.getTableIcon(),
    tipText: "Show Table",
    onClick: () => showModalWithData(dataset),
  });

  const { btn: zoomOutButton } = makeTextButton(toolbar, {
    id: "zoomOutButton",
    text: "−",
    tipText: "Zoom Out",
  });
  const zoomControl = toolbar
    .append("span")
    .attr("class", "spcd3-toolbar-zoom-label");
  const zoomInput = zoomControl
    .append("input")
    .attr("class", "spcd3-toolbar-zoom-input")
    .attr("type", "text")
    .attr("inputmode", "decimal")
    .attr("aria-label", "Zoom percentage")
    .attr("value", "100");
  zoomControl.append("span").attr("aria-hidden", "true").text("%");
  const { btn: zoomInButton } = makeTextButton(toolbar, {
    id: "zoomInButton",
    text: "+",
    tipText: "Zoom In",
  });

  makeIconButton(toolbar, {
    id: "downloadButton",
    iconHtml: icon.getDownloadButton(),
    tipText: "Download Chart (SVG)",
    onClick: io.saveAsSvg,
  });

  enableChartZoom(zoomInButton.node(), zoomOutButton.node(), zoomInput.node());

  makeIconButton(toolbar, {
    id: "refreshButton",
    iconHtml: icon.getRefreshIcon(),
    tipText: "Refresh",
    onClick: pc.refresh,
  });

  makeIconButton(toolbar, {
    id: "resetButton",
    iconHtml: icon.getResetIcon(),
    tipText: "Reset",
    onClick: pc.reset,
  });

  let isExpanded = false;

  toggleButton.on("click", () => {
    isExpanded = !isExpanded;

    toolbar
      .style("max-width", isExpanded ? "12.5rem" : "0")
      .style("opacity", isExpanded ? "1" : "0")
      .style("pointer-events", isExpanded ? "auto" : "none")
      .style("overflow", isExpanded ? "visible" : "hidden");

    toggleTip.text(isExpanded ? "Collapse Toolbar" : "Expand Toolbar");

    const currentIcon = isExpanded
      ? icon.getCollapseToolbarIcon()
      : icon.getExpandToolbarIcon();
    toggleButton.select("#toggleButtonicon").html(currentIcon);
  });
}

export function closeChartModal(): void {
  if (!chartZoomState) return;

  const state = chartZoomState;
  window.removeEventListener("pointermove", state.onPointerMove);
  window.removeEventListener("pointerup", state.onPointerUp);
  window.removeEventListener("pointercancel", state.onPointerUp);
  state.chartWrapper.removeEventListener("pointerdown", state.onPointerDown);
  state.chartWrapper.removeEventListener("click", state.onClickCapture, true);
  state.chartWrapper.removeEventListener("wheel", state.onWheel);
  state.svg.style.inlineSize = state.previousSvgInlineSize;
  state.svg.style.blockSize = state.previousSvgBlockSize;
  state.chartWrapper.style.blockSize = state.previousChartWrapperBlockSize;
  state.chartWrapper.classList.remove("spcd3-chartWrapper--pannable");
  chartZoomState = null;
}

function makeIconButton(parent: any, opts: any) {
  const { id, iconHtml, tipText, onClick } = opts;

  const btn = parent
    .append("button")
    .attr("class", "spcd3-toolbar-button")
    .attr("type", "button")
    .attr("id", id ?? null);

  if (onClick) btn.on("click", onClick);

  btn
    .append("span")
    .attr("class", "spcd3-toolbar-buttonicon")
    .attr("id", `${id}icon`)
    .html(iconHtml);

  btn
    .select(".spcd3-toolbar-buttonicon")
    .selectAll("svg")
    .attr("class", "spcd3-toolbar-svg");

  const tip = parent
    .append("span")
    .attr("class", "spcd3-toolbar-buttontip")
    .attr("id", `${id}tip`)
    .attr("popover", "manual")
    .text(tipText ?? "");

  const btnNode = btn.node();
  const tipNode = tip.node();

  function show() {
    if (!tipNode) return;
    if (!tipNode.matches(":popover-open")) {
      tipNode.showPopover();
    }
    positionTip(btnNode, tipNode);
  }

  function hide() {
    if (!tipNode) return;
    if (tipNode.matches(":popover-open")) {
      tipNode.hidePopover();
    }
  }

  btn
    .on("mouseenter", show)
    .on("mouseleave", hide)
    .on("focus", show)
    .on("blur", hide);

  d3.select(window).on(`resize.${id}`, () => {
    if (tipNode?.matches(":popover-open")) {
      positionTip(btnNode, tipNode);
    }
  });

  d3.select(window).on(`scroll.${id}`, () => {
    if (tipNode?.matches(":popover-open")) {
      positionTip(btnNode, tipNode);
    }
  });

  return { btn, tip };
}

function makeTextButton(parent: any, opts: any) {
  const { id, text, tipText } = opts;
  const btn = parent
    .append("button")
    .attr("class", "spcd3-toolbar-button spcd3-toolbar-textbutton")
    .attr("type", "button")
    .attr("id", id)
    .attr("aria-label", tipText)
    .text(text);

  const tip = parent
    .append("span")
    .attr("class", "spcd3-toolbar-buttontip")
    .attr("id", `${id}tip`)
    .attr("popover", "manual")
    .text(tipText);
  const btnNode = btn.node();
  const tipNode = tip.node();
  const show = () => {
    if (!tipNode) return;
    if (!tipNode.matches(":popover-open")) tipNode.showPopover();
    positionTip(btnNode, tipNode);
  };
  const hide = () => {
    if (tipNode?.matches(":popover-open")) tipNode.hidePopover();
  };
  btn.on("mouseenter", show).on("mouseleave", hide).on("focus", show).on("blur", hide);
  return { btn, tip };
}

function positionTip(btnNode: any, tipNode: any) {
  if (!btnNode || !tipNode) return;

  const rect = btnNode.getBoundingClientRect();
  const gap = 8;

  tipNode.style.left = "0";
  tipNode.style.top = "0";

  const tipRect = tipNode.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.bottom + gap;

  const padding = 0.5;

  if (left < padding) left = padding;
  if (left + tipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tipRect.width - padding;
  }

  if (top + tipRect.height > window.innerHeight - padding) {
    top = rect.top - tipRect.height - gap;
  }

  if (top < padding) top = padding;

  tipNode.style.left = `${left / 16}rem`;
  tipNode.style.top = `${top / 16}rem`;
}

function showModalWithData(dataset: any[]): void {
  const overlay = d3
    .select("body")
    .append("div")
    .attr("class", "spcd3-modal-tableoverlay")
    .attr("id", "modalTableOverlay");

  overlay.on("click", () => {
    overlay.style("display", "none");
    modal.style("display", "none");
  });

  const modal = d3
    .select("body")
    .append("div")
    .attr("class", "spcd3-modal-tabledata")
    .attr("id", "dataModal");

  const saveAsCSV = document.createElement("button");
  saveAsCSV.className = "spcd3-button spcd3-save-csv-button";
  saveAsCSV.id = "saveAsCsv";
  saveAsCSV.textContent = "Download as CSV";
  modal.append(() => saveAsCSV);

  saveAsCSV.addEventListener("click", () => {
    const reservedArray = dataset.map(
      (entry: { [s: string]: unknown } | ArrayLike<unknown>) => {
        const entries = Object.entries(entry).reverse();
        return Object.fromEntries(entries);
      },
    );
    downloadCSV(reservedArray);
  });

  const closeButton = document.createElement("span");
  closeButton.className = "spcd3-close-button";
  closeButton.innerHTML = "&times;";
  closeButton.style.marginBottom = "1rem";
  modal.append(() => closeButton);

  const dimensionsElement = document.createElement("div");
  dimensionsElement.textContent = `Dataset has ${numberOfDimensions} dimensions and ${numberOfRecords} records.`;
  dimensionsElement.style.marginBottom = "1rem";
  modal.append(() => dimensionsElement);

  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "spcd3-scroll-wrapper";

  const tableContainer = document.createElement("table");
  tableContainer.className = "spcd3-tablecontainer";

  scrollWrapper.appendChild(tableContainer);
  modal.append(() => scrollWrapper);

  generateTable(dataset, tableContainer);

  closeButton.addEventListener("click", () => {
    modal.style("display", "none");
    overlay.style("display", "none");
  });
}

function generateTable(dataset: any[], table: HTMLTableElement) {
  const reservedArray = dataset.map(
    (entry: { [s: string]: unknown } | ArrayLike<unknown>) => {
      const entries = Object.entries(entry).reverse();
      return Object.fromEntries(entries);
    },
  );

  const headers = Object.keys(reservedArray[0]);
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.innerText = header.charAt(0).toUpperCase() + header.slice(1);
    th.className = "spcd3-th";

    const isNumericCol = reservedArray.every((row: { [x: string]: any }) => {
      const val = row[header];
      return !isNaN(parseFloat(val)) && isFinite(val);
    });

    th.style.textAlign = isNumericCol ? "right" : "left";

    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  reservedArray.forEach((obj: { [x: string]: any }) => {
    const row = document.createElement("tr");
    headers.forEach((key) => {
      const td = document.createElement("td");
      const value = obj[key];
      td.innerText = value;
      td.className = "spcd3-td";

      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        td.style.textAlign = "right";
      } else {
        td.style.textAlign = "left";
      }

      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
}

function downloadCSV(dataset: any[], filename = "data.csv") {
  if (!dataset || !dataset.length) return;

  const keys = Object.keys(dataset[0]);

  const csvRows = [];

  csvRows.push(keys.join(","));

  dataset.forEach((row: { [x: string]: any }) => {
    const values = keys.map((k) => {
      const value = row[k];
      return typeof value === "string" && value.includes(",")
        ? `"${value}"`
        : value;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function enableChartZoom(
  zoomInButton: HTMLButtonElement | null,
  zoomOutButton: HTMLButtonElement | null,
  zoomInput: HTMLInputElement | null,
): void {
  if (!zoomInButton || !zoomOutButton || !zoomInput) return;

  const chartWrapper = document.querySelector(".spcd3-chartWrapper") as HTMLDivElement | null;
  const svg = chartWrapper?.querySelector("#spcd3-pc_svg") as SVGSVGElement | null;
  if (!chartWrapper || !svg) return;

  const baseSvgWidth = Number(svg.getAttribute("width")) || svg.viewBox.baseVal.width;
  const baseSvgHeight = Number(svg.getAttribute("height")) || svg.viewBox.baseVal.height;
  const onPointerMove = (event: PointerEvent) => {
    const state = chartZoomState;
    if (!state?.isDraggingPan) return;
    state.didPan ||= Math.hypot(event.clientX - state.panStartX, event.clientY - state.panStartY) > 3;
    state.chartWrapper.scrollLeft = state.panScrollLeft - (event.clientX - state.panStartX);
    state.chartWrapper.scrollTop = state.panScrollTop - (event.clientY - state.panStartY);
  };
  const onPointerUp = () => {
    const state = chartZoomState;
    if (!state) return;
    state.isDraggingPan = false;
    state.chartWrapper.classList.remove("spcd3-chartWrapper--dragging");
  };
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 2) return;
    // Only empty SVG space starts panning; paths and axes retain their interactions.
    if (event.target !== svg) return;
    const state = chartZoomState;
    if (!state) return;
    event.preventDefault();
    state.isDraggingPan = true;
    state.didPan = false;
    state.panStartX = event.clientX;
    state.panStartY = event.clientY;
    state.panScrollLeft = chartWrapper.scrollLeft;
    state.panScrollTop = chartWrapper.scrollTop;
    chartWrapper.classList.add("spcd3-chartWrapper--dragging");
  };
  const onClickCapture = (event: MouseEvent) => {
    const state = chartZoomState;
    if (state?.didPan) {
      state.didPan = false;
      event.stopPropagation();
    }
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setChartScale((chartZoomState?.scale ?? 1) + direction * CHART_SCALE_STEP);
  };

  chartZoomState = {
    chartWrapper, zoomInButton, zoomOutButton, zoomInput, svg, baseSvgWidth, baseSvgHeight,
    previousSvgInlineSize: svg.style.inlineSize, previousSvgBlockSize: svg.style.blockSize,
    previousChartWrapperBlockSize: chartWrapper.style.blockSize,
    scale: 1, isDraggingPan: false, didPan: false, panStartX: 0, panStartY: 0,
    panScrollLeft: 0, panScrollTop: 0, onPointerMove, onPointerUp, onPointerDown, onClickCapture, onWheel,
  };
  chartWrapper.classList.add("spcd3-chartWrapper--pannable");
  chartWrapper.style.blockSize = `${pxToRem(baseSvgHeight)}rem`;
  chartWrapper.addEventListener("pointerdown", onPointerDown);
  chartWrapper.addEventListener("click", onClickCapture, true);
  chartWrapper.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  zoomOutButton.addEventListener("click", () => setChartScale((chartZoomState?.scale ?? 1) - CHART_SCALE_STEP));
  zoomInButton.addEventListener("click", () => setChartScale((chartZoomState?.scale ?? 1) + CHART_SCALE_STEP));
  zoomInput.addEventListener("change", () => setChartScaleFromInput());
  zoomInput.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setChartScaleFromInput();
      zoomInput.blur();
    }
  });
  setChartScale(getChartZoomScale());
}

function setChartScaleFromInput(): void {
  const state = chartZoomState;
  if (!state) return;

  const percentage = Number(state.zoomInput.value.trim().replace(/%$/, ""));
  if (Number.isFinite(percentage)) {
    setChartScale(percentage / 100);
  } else {
    state.zoomInput.value = String(Math.round(state.scale * 100));
  }
}

function setChartScale(nextScale: number): void {
  const state = chartZoomState;
  if (!state) return;

  const scale = Math.min(MAX_CHART_SCALE, Math.max(MIN_CHART_SCALE, nextScale));
  state.scale = scale;
  state.svg.style.inlineSize = `${pxToRem(state.baseSvgWidth * scale)}rem`;
  state.svg.style.blockSize = `${pxToRem(state.baseSvgHeight * scale)}rem`;
  state.zoomInput.value = String(Math.round(scale * 100));
  state.zoomInButton.disabled = scale >= MAX_CHART_SCALE;
  state.zoomOutButton.disabled = scale <= MIN_CHART_SCALE;
  setChartZoomScale(scale);
}

function pxToRem(value: number): number {
  const rootFontSize = Number(
    getComputedStyle(document.documentElement).fontSize.replace("px", ""),
  );

  if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) {
    return value / 16;
  }

  return value / rootFontSize;
}
