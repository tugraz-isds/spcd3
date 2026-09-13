import * as d3 from "d3-selection";
import * as icon from "./icons/icons";
import * as pc from "./parallelcoordinates";
import * as io from "./io";
import {
  numberOfDimensions,
  numberOfRecords,
  resetContentData,
} from "./globals";

type ChartModalState = {
  overlay: HTMLDivElement;
  panel: HTMLDivElement;
  viewport: HTMLDivElement;
  chartWrapper: HTMLDivElement;
  placeholder: Comment;
  originalParent: HTMLElement;
  closeButton: HTMLSpanElement;
  zoomInButton: HTMLButtonElement;
  zoomOutButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  panButton: HTMLButtonElement;
  zoomLabel: HTMLSpanElement;
  panInteractionBlocker: HTMLDivElement;
  svg: SVGSVGElement;
  baseSvgWidth: number;
  baseSvgHeight: number;
  previousSvgInlineSize: string;
  previousSvgBlockSize: string;
  previousSvgPointerEvents: string;
  previousChartWrapperInert: boolean;
  scale: number;
  panMode: boolean;
  isDraggingPan: boolean;
  panStartX: number;
  panStartY: number;
  panScrollLeft: number;
  panScrollTop: number;
  tooltipElements: HTMLSpanElement[];
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
};

let chartModalState: ChartModalState | null = null;
const MIN_MODAL_SCALE = 0.5;
const MAX_MODAL_SCALE = 3;
const MODAL_SCALE_STEP = 0.25;

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

  makeIconButton(toolbar, {
    id: "zoomModeButton",
    iconHtml: icon.getZoomButton(),
    tipText: "Zoom Mode",
    onClick: () => openZoomMode(dataset),
  });

  makeIconButton(toolbar, {
    id: "downloadButton",
    iconHtml: icon.getDownloadButton(),
    tipText: "Download Chart (SVG)",
    onClick: io.saveAsSvg,
  });

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
  if (!chartModalState) return;

  const state = chartModalState;
  window.removeEventListener("pointermove", state.onPointerMove);
  window.removeEventListener("pointerup", state.onPointerUp);
  window.removeEventListener("pointercancel", state.onPointerUp);

  setPanMode(false);

  state.chartWrapper.classList.remove("spcd3-chartWrapper--modal");
  state.chartWrapper.inert = state.previousChartWrapperInert;
  state.svg.style.inlineSize = state.previousSvgInlineSize;
  state.svg.style.blockSize = state.previousSvgBlockSize;
  state.svg.style.pointerEvents = state.previousSvgPointerEvents;
  state.tooltipElements.forEach((element) => element.remove());

  state.originalParent.insertBefore(state.chartWrapper, state.placeholder);
  state.placeholder.remove();
  state.overlay.remove();
  chartModalState = null;
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

function openZoomMode(dataset: any[]): void {
  if (chartModalState) return;

  const chartRoot = document.querySelector("#spcd3-parallelcoords");
  const chartWrapper = chartRoot?.querySelector(
    ".spcd3-chartWrapper",
  ) as HTMLDivElement | null;

  if (!chartRoot || !chartWrapper || !chartWrapper.parentElement) return;

  const svg = chartWrapper.querySelector("#spcd3-pc_svg") as SVGSVGElement | null;
  if (!svg) return;

  const baseSvgWidth =
    Number(svg.getAttribute("width")) ||
    svg.viewBox.baseVal.width ||
    svg.getBoundingClientRect().width;
  const baseSvgHeight =
    Number(svg.getAttribute("height")) ||
    svg.viewBox.baseVal.height ||
    svg.getBoundingClientRect().height;

  const originalParent = chartWrapper.parentElement as HTMLElement;
  const placeholder = document.createComment("spcd3-chart-modal-anchor");
  originalParent.insertBefore(placeholder, chartWrapper);

  const overlay = document.createElement("div");
  overlay.className = "spcd3-chart-modal-overlay";

  const panel = document.createElement("div");
  panel.className = "spcd3-chart-modal";
  overlay.appendChild(panel);

  const header = document.createElement("div");
  header.className = "spcd3-chart-modal-header";
  panel.appendChild(header);

  const controls = document.createElement("div");
  controls.className = "spcd3-chart-modal-controls";
  header.appendChild(controls);

  const showTableButton = createModalIconControlButton(
    icon.getTableIcon(),
    "Show Table",
  );
  const downloadButton = createModalIconControlButton(
    icon.getDownloadButton(),
    "Download Chart (SVG)",
  );
  const resetButton = createModalIconControlButton(
    icon.getResetIcon(),
    "Reset chart",
  );
  const zoomOutButton = createModalControlButton("−", "Zoom Out");
  const zoomInButton = createModalControlButton("+", "Zoom In");
  const panButton = createModalIconControlButton(
    icon.getPanButton(),
    "Toggle Pan Mode",
  );
  panButton.setAttribute("aria-pressed", "false");

  const zoomLabel = document.createElement("span");
  zoomLabel.className = "spcd3-chart-modal-zoom-label";

  const closeButton = document.createElement("span");
  closeButton.className = "spcd3-close-button";
  closeButton.innerHTML = "&times;";

  controls.appendChild(zoomOutButton);
  controls.appendChild(zoomInButton);
  controls.appendChild(zoomLabel);
  controls.appendChild(panButton);
  controls.appendChild(showTableButton);
  controls.appendChild(downloadButton);
  controls.appendChild(resetButton);
  panel.appendChild(closeButton);

  const viewport = document.createElement("div");
  viewport.className = "spcd3-chart-modal-viewport";
  panel.appendChild(viewport);

  const panInteractionBlocker = document.createElement("div");
  panInteractionBlocker.className = "spcd3-chart-modal-pan-interaction-blocker";
  viewport.appendChild(panInteractionBlocker);

  chartWrapper.classList.add("spcd3-chartWrapper--modal");
  viewport.appendChild(chartWrapper);

  const onPointerMove = (event: PointerEvent) => {
    if (!chartModalState || !chartModalState.isDraggingPan) return;

    const deltaX = event.clientX - chartModalState.panStartX;
    const deltaY = event.clientY - chartModalState.panStartY;

    chartModalState.viewport.scrollLeft = chartModalState.panScrollLeft - deltaX;
    chartModalState.viewport.scrollTop = chartModalState.panScrollTop - deltaY;
  };

  const onPointerUp = () => {
    if (!chartModalState) return;
    chartModalState.isDraggingPan = false;
    if (chartModalState.panMode) {
      chartModalState.viewport.classList.remove("spcd3-chart-modal-viewport--dragging");
    }
  };

  chartModalState = {
    overlay,
    panel,
    viewport,
    chartWrapper,
    placeholder,
    originalParent,
    closeButton,
    zoomInButton,
    zoomOutButton,
    resetButton,
    panButton,
    zoomLabel,
    panInteractionBlocker,
    svg,
    baseSvgWidth,
    baseSvgHeight,
    previousSvgInlineSize: svg.style.inlineSize,
    previousSvgBlockSize: svg.style.blockSize,
    previousSvgPointerEvents: svg.style.pointerEvents,
    previousChartWrapperInert: chartWrapper.inert,
    scale: 1,
    panMode: false,
    isDraggingPan: false,
    panStartX: 0,
    panStartY: 0,
    panScrollLeft: 0,
    panScrollTop: 0,
    tooltipElements: [
      attachTooltip(showTableButton, "Show Table"),
      attachTooltip(downloadButton, "Download Chart (SVG)"),
      attachTooltip(resetButton, "Reset"),
      attachTooltip(zoomOutButton, "Zoom Out"),
      attachTooltip(zoomInButton, "Zoom In"),
      attachTooltip(panButton, "Toggle Pan Mode"),
    ],
    onPointerMove,
    onPointerUp,
  };

  closeButton.addEventListener("click", closeChartModal);
  closeButton.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeChartModal();
    }
  });
  overlay.addEventListener("click", (event: MouseEvent) => {
    if (event.target === overlay) {
      closeChartModal();
    }
  });

  showTableButton.addEventListener("click", () => {
    showModalWithData(dataset);
  });
  downloadButton.addEventListener("click", () => {
    io.saveAsSvg();
  });
  resetButton.addEventListener("click", () => {
    const modalDataset = resetContentData ?? dataset;
    pc.reset();
    requestAnimationFrame(() => {
      openZoomMode(modalDataset);
    });
  });
  zoomOutButton.addEventListener("click", () => {
    setChartModalScale((chartModalState?.scale ?? 1) - MODAL_SCALE_STEP);
  });
  zoomInButton.addEventListener("click", () => {
    setChartModalScale((chartModalState?.scale ?? 1) + MODAL_SCALE_STEP);
  });
  panButton.addEventListener("click", () => {
    setPanMode(!(chartModalState?.panMode ?? false));
  });

  viewport.addEventListener("pointerdown", (event: PointerEvent) => {
    if (!chartModalState?.panMode) return;
    if (event.button !== 0) return;

    event.preventDefault();
    chartModalState.isDraggingPan = true;
    chartModalState.panStartX = event.clientX;
    chartModalState.panStartY = event.clientY;
    chartModalState.panScrollLeft = chartModalState.viewport.scrollLeft;
    chartModalState.panScrollTop = chartModalState.viewport.scrollTop;
    chartModalState.viewport.classList.add("spcd3-chart-modal-viewport--dragging");
  });

  document.body.appendChild(overlay);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  setChartModalScale(1);
}

function createModalControlButton(
  text: string,
  ariaLabel: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "spcd3-button spcd3-chart-modal-control";
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);
  button.textContent = text;
  return button;
}

function createModalIconControlButton(
  iconHtml: string,
  ariaLabel: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "spcd3-button spcd3-chart-modal-control spcd3-chart-modal-control--icon";
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);

  const iconElement = document.createElement("span");
  iconElement.className = "spcd3-toolbar-buttonicon";
  iconElement.innerHTML = iconHtml;
  iconElement
    .querySelectorAll("svg")
    .forEach((svgElement) => svgElement.classList.add("spcd3-toolbar-svg"));

  button.appendChild(iconElement);
  return button;
}

function attachTooltip(button: HTMLButtonElement, text: string): HTMLSpanElement {
  const tip = document.createElement("span");
  tip.className = "spcd3-toolbar-buttontip";
  tip.setAttribute("popover", "manual");
  tip.textContent = text;
  document.body.appendChild(tip);

  function show() {
    if (!tip.matches(":popover-open")) {
      tip.showPopover();
    }
    positionTip(button, tip);
  }

  function hide() {
    if (tip.matches(":popover-open")) {
      tip.hidePopover();
    }
  }

  button.addEventListener("mouseenter", show);
  button.addEventListener("mouseleave", hide);
  button.addEventListener("focus", show);
  button.addEventListener("blur", hide);
  return tip;
}

function setChartModalScale(nextScale: number): void {
  if (!chartModalState) return;

  const scale = Math.min(MAX_MODAL_SCALE, Math.max(MIN_MODAL_SCALE, nextScale));
  chartModalState.scale = scale;
  chartModalState.svg.style.inlineSize = `${pxToRem(chartModalState.baseSvgWidth * scale)}rem`;
  chartModalState.svg.style.blockSize = `${pxToRem(chartModalState.baseSvgHeight * scale)}rem`;
  chartModalState.zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

function setPanMode(isActive: boolean): void {
  if (!chartModalState) return;

  chartModalState.panMode = isActive;
  chartModalState.isDraggingPan = false;
  chartModalState.panButton.setAttribute("aria-pressed", String(isActive));
  chartModalState.panButton.classList.toggle("is-active", isActive);
  chartModalState.viewport.classList.toggle("spcd3-chart-modal-viewport--pannable", isActive);
  chartModalState.viewport.classList.remove("spcd3-chart-modal-viewport--dragging");
  chartModalState.panInteractionBlocker.classList.toggle("is-active", isActive);
  chartModalState.chartWrapper.inert = isActive;
  chartModalState.svg.style.pointerEvents = isActive
    ? "none"
    : chartModalState.previousSvgPointerEvents;
  chartModalState.zoomLabel.textContent = `${Math.round(chartModalState.scale * 100)}%`;
  d3.select("#contextmenu").style("display", "none");
  d3.select("#contextmenuRecords").style("display", "none");
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
