import "d3-transition";
import { select, selectAll } from "d3-selection";
import * as brush from "./brush";
import * as utils from "./utils";
import * as helper from "./helper";
import * as context from "./contextMenu";
import * as icon from "./icons/icons";
import * as toolbar from "./toolbar";
import * as api from "./helperApiFunc";
import {
  yAxis,
  parcoords,
  width,
  svg,
  setYaxis,
  setSvg,
  setWidth,
  setHeight,
  setPadding,
  setPaddingXaxis,
  setInitDimension,
  setActive,
  setYScales,
  setData,
  setFeatures,
  setNewDataset,
  setNewFeatures,
  setXScales,
  setHoverLabel,
  key,
  hoverlabel,
  setKey,
  height,
  setColumns,
  thickness,
  setLineThickness,
  setNumberOfDimensions,
  setNumberOfRecords,
  setContent,
  resetContentData,
  setHoveredRecords,
} from "./globals";

import "./reset.css";
import "./stylesheet.css";

declare const window: any;

//---------- IO Functions ----------

export function drawChart(content: []): void {
  setContent(content);
  const chartContent = content as any;
  var columns = structuredClone(chartContent["columns"]).reverse();
  setColumns(columns);

  setNumberOfDimensions(columns.length);
  setNumberOfRecords(content.length);

  deleteChart();

  if (thickness === undefined) {
    setLineThickness("0.4rem");
  }

  setUpParcoordData(content, columns);

  let chart = select("#spcd3-parallelcoords");

  if (chart === null) {
    chart = select(document.body)
      .append("div")
      .attr("id", "spcd3-parallelcoords");
  }

  const chartWrapper = chart.append("div").attr("class", "spcd3-chartWrapper");

  chartWrapper.append("div").attr("id", "spcd3-toolbarRow");

  toolbar.createToolbar(parcoords.newDataset);

  setSvg(
    chartWrapper
      .append("svg")
      .attr("id", "spcd3-pc_svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("preserveAspectRatio", "none"),
  );

  const plot = svg.append("g").attr("class", "plot");

  setDefsForIcons();

  setActive(setActivePathLines(plot, content, parcoords));

  setFeatureAxis(plot, yAxis, parcoords, width);
  ensureCursorThemeSync();
  refreshThemedCursors();
  realignToolbar();

  svg
    .on("contextmenu", function (event: any) {
      event.stopPropagation();
      event.preventDefault();
    })
    .on("mouseenter", function () {
      helper.cleanTooltip();
    })
    .on("click", function () {
      api.clearSelection();
    })
    .on("mousedown.selection", function (event: any) {
      event.preventDefault();
    })
    .on("mouseleave", function () {
      if (cleanupTimeout) {
        clearTimeout(cleanupTimeout);
        cleanupTimeout = setTimeout(() => {
          handlePointerLeaveOrOut();
        }, 100);
      }
    })
    .on("mousemove", function (event: any) {
      const chartBounds = svg.node().getBoundingClientRect();
      if (
        event.clientX < chartBounds.left ||
        event.clientX > chartBounds.right ||
        event.clientY < chartBounds.top ||
        event.clientY > chartBounds.bottom
      ) {
        handlePointerLeaveOrOut();
      }
    });

  window.onclick = () => {
    select("#contextmenu").style("display", "none");
    select("#contextmenuRecords").style("display", "none");
  };
}

export function reset() {
  drawChart(resetContentData);
}

export function refresh(): void {
  const dimensions = api.getAllVisibleDimensionNames();
  for (let i = 0; i < dimensions.length; i++) {
    api.show(dimensions[i]);
  }
}

export function deleteChart(): void {
  toolbar.closeChartModal();
  select("#spcd3-pc_svg").remove();
  select("#contextmenu").remove();
  select("#contextmenuRecords").remove();
  select("#modalFilter").remove();
  select("#modalRange").remove();
  select("#refreshButton").remove();
  select("#showData").remove();
  select("#spcd3-toolbarRow").remove();
  select(".spcd3-chartWrapper").remove();
  selectAll(".spcd3-tip-layer").remove();
  selectAll(".spcd3-tooltip-values").remove();
  helper.cleanTooltip();
  helper.cleanTooltipSelect();
  parcoords.currentPosOfDims.length = 0;
}

// ---------- Needed for Built-In Interactivity Functions ---------- //

function setUpParcoordData(data: any, newFeatures: []): void {
  setPadding(60);
  setPaddingXaxis(60);
  setInitDimension(newFeatures);
  setHeight(400);

  const label = newFeatures[newFeatures.length - 1];

  data.sort((a: { [x: string]: any }, b: { [x: string]: any }) => {
    const item1 = a[label];
    const item2 = b[label];

    if (item1 < item2) {
      return -1;
    } else if (item1 > item2) {
      return 1;
    } else {
      return 0;
    }
  });

  let dataset = helper.prepareData(data, newFeatures);
  setWidth(helper.calculateChartLayout(dataset[0], dataset[1]).chartWidth);
  setFeatures(dataset[0]);
  setNewDataset(dataset[1]);

  setXScales(helper.setupXScales(dataset[0], dataset[1]));
  setYScales(helper.setupYScales(dataset[0], dataset[1]));
  setNewFeatures(newFeatures);
  setData(data);

  for (let i = 0; i < newFeatures.length; i++) {
    let max: number;
    let min: number;
    if (
      isNaN(
        Math.max(
          ...parcoords.newDataset.map(
            (o: { [x: string]: any }) => o[newFeatures[i]],
          ),
        ),
      )
    ) {
      const sorted = [
        ...parcoords.newDataset.map(
          (o: { [x: string]: any }) => o[newFeatures[i]],
        ),
      ].sort((a, b) => a.localeCompare(b));
      min = sorted[sorted.length - 1];
      max = sorted[0];
    } else {
      max = Math.max(
        ...parcoords.newDataset.map(
          (o: { [x: string]: any }) => o[newFeatures[i]],
        ),
      );
      min = Math.min(
        ...parcoords.newDataset.map(
          (o: { [x: string]: any }) => o[newFeatures[i]],
        ),
      );
    }
    const ranges = api.getDimensionRange(newFeatures[i]);
    parcoords.currentPosOfDims.push({
      key: newFeatures[i],
      top: 50,
      bottom: 350,
      isInverted: false,
      index: i,
      min: min,
      max: max,
      sigDig: 0,
      currentRangeTop: ranges[1],
      currentRangeBottom: ranges[0],
      currentFilterBottom: ranges[0],
      currentFilterTop: ranges[1],
    });
  }

  const hiddenDims = api.getAllHiddenDimensionNames();
  setYaxis(
    helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims),
  );

  let counter = 0;
  parcoords.features.map((x: { name: string | number }) => {
    let numberOfDigs = 0;
    let values = parcoords.newDataset.map(
      (o: { [x: string]: any }) => o[x.name],
    );
    for (let i = 0; i < values.length; i++) {
      if (!isNaN(values[i])) {
        const tempNumberOfDigs = utils.digits(Number(values[i]));
        if (tempNumberOfDigs > numberOfDigs) {
          numberOfDigs = tempNumberOfDigs;
        }
      } else {
        continue;
      }
    }
    utils.addNumberOfDigs(
      numberOfDigs,
      parcoords.currentPosOfDims,
      x.name,
      "sigDig",
    );
    utils.addNumberOfDigs(
      counter,
      parcoords.currentPosOfDims,
      x.name,
      "recordId",
    );
    counter = counter + 1;
  });

  setHoverLabel(api.getAllVisibleDimensionNames()[0]);
}

let delay: ReturnType<typeof setTimeout> | null = null;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;
let removeCursorThemeListener: (() => void) | null = null;

function clearExistingDelay() {
  if (delay) {
    clearTimeout(delay);
    delay = null;
  }
}

function createThemedCursor(
  svgMarkup: string,
  size: number,
  meta: icon.CursorIconMeta,
): string {
  const [hotspotX, hotspotY] = utils.getCursorHotspot(meta, size);
  const themedSvg = utils.applyThemeToCursorSvg(
    utils.setSize(svgMarkup, size),
  );
  return `url('data:image/svg+xml,${encodeURIComponent(themedSvg)}') ${hotspotX} ${hotspotY}, auto`;
}

function refreshThemedCursors(): void {
  if (!Array.isArray(parcoords.newFeatures)) {
    return;
  }

  const topCursor = createThemedCursor(
    icon.getArrowTopCursor(),
    12,
    icon.getArrowTopCursorMeta(),
  );
  const bottomCursor = createThemedCursor(
    icon.getArrowBottomCursor(),
    12,
    icon.getArrowBottomCursorMeta(),
  );
  const rangeCursor = createThemedCursor(
    icon.getArrowTopAndBottom(),
    20,
    icon.getArrowTopAndBottomMeta(),
  );

  parcoords.newFeatures.forEach((dimension: string) => {
    const processed = utils.cleanString(dimension);
    const invertStatus = api.getInversionStatus(dimension);
    const invertCursor =
      invertStatus === "ascending"
        ? createThemedCursor(
            icon.getArrowDownCursor(),
            12,
            icon.getArrowDownCursorMeta(),
          )
        : createThemedCursor(
            icon.getArrowUpCursor(),
            12,
            icon.getArrowUpCursorMeta(),
          );

    select(`#invert_hitbox_${processed}`).style("cursor", invertCursor);
    select(`#dimension_invert_${processed}`).style("cursor", invertCursor);
    select(`#triangle_up_${processed}`).style("cursor", topCursor);
    select(`#triangle_up_hit${processed}`).style("cursor", topCursor);
    select(`#triangle_down_${processed}`).style("cursor", bottomCursor);
    select(`#triangle_down_hit${processed}`).style("cursor", bottomCursor);

    const rect = select(`#rect_${processed}`);
    if (rect.style("cursor") && rect.style("cursor") !== "default") {
      rect.style("cursor", rangeCursor);
    }
  });
}

function ensureCursorThemeSync(): void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    removeCursorThemeListener
  ) {
    return;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    window.requestAnimationFrame(refreshThemedCursors);
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
    removeCursorThemeListener = () =>
      mediaQuery.removeEventListener("change", handler);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handler);
    removeCursorThemeListener = () => mediaQuery.removeListener(handler);
  }
}

export function realignToolbar(): void {
  window.requestAnimationFrame(alignToolbarWithLeftmostAxisLabels);
}

function alignToolbarWithLeftmostAxisLabels(): void {
  const toolbarRow =
    document.querySelector<HTMLDivElement>("#spcd3-toolbarRow");
  const svgNode = document.querySelector<SVGSVGElement>("#spcd3-pc_svg");
  const axisNodes = Array.from(
    document.querySelectorAll<SVGGElement>("#spcd3-pc_svg .dimensions"),
  );
  if (!toolbarRow || !svgNode || axisNodes.length === 0) {
    return;
  }
  const toolbarRect = toolbarRow.getBoundingClientRect();
  const leftmostAxis = axisNodes.reduce(
    (leftmost, axis) =>
      axis.getBoundingClientRect().left < leftmost.getBoundingClientRect().left
        ? axis
        : leftmost,
    axisNodes[0],
  );
  const labelNodes = Array.from(
    leftmostAxis.querySelectorAll<SVGTextElement>(".tick text"),
  );
  const leftEdge = labelNodes.reduce(
    (minLeft, label) => Math.min(minLeft, label.getBoundingClientRect().left),
    leftmostAxis.getBoundingClientRect().left,
  );
  toolbarRow.style.paddingLeft = `${Math.max(0, leftEdge - toolbarRect.left) / 16}rem`;
  toolbarRow.style.visibility = "visible";
}

function handlePointerEnter(event: any, d: any) {
  clearExistingDelay();
  doNotHighlight();

  const data = helper.getAllPointerEventsData(event);
  setHoveredRecords(data);
  const tooltipLabel = selectAll(".spcd3-tooltip-label");

  highlight(data);
  helper.createTooltipForLabel(data, tooltipLabel, event);

  const datasetMap = new Map();
  parcoords.newDataset.forEach((record: { [x: string]: any }) => {
    datasetMap.set(record[hoverlabel], record);
  });

  data.forEach((item: any, i: number) => {
    const rec = datasetMap.get(item);
    if (rec) {
      helper.createToolTipForValues(rec, false);
    }
  });
}

function handlePointerLeaveOrOut() {
  doNotHighlight();
  clearExistingDelay();
  setHoveredRecords([]);
  selectAll(".spcd3-tooltip-label").style("visibility", "hidden");
  helper.cleanTooltip();
}

function handleClick(event: any, d: any) {
  var data = helper.getAllPointerEventsData(event);

  if (hoverSnapshot) data = hoverSnapshot;
  hoverSnapshot = null;

  const cleanedItems = data.map((item: string) =>
    utils.cleanString(item).replace(/[.,]/g, ""),
  );

  const selectedRecords = api.getSelected();

  if (event.metaKey || event.shiftKey) {
    cleanedItems.forEach((record: string) => {
      if (selectedRecords.includes(record)) {
        api.setUnselected(record);
        selectAll(`#tooltip-record-select-${record}`).style("display", "none");
      } else {
        api.setSelected(record);
        const datasetMap = new Map();
        parcoords.newDataset.forEach((cleanedItems: { [x: string]: any }) => {
          datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
        });

        data.forEach((item: any, i: number) => {
          const rec = datasetMap.get(item);
          if (rec && !api.isRecordColored(item)) {
            helper.createToolTipForValues(rec, true);
          }
        });
      }
    });
  } else if (event.ctrlKey) {
    cleanedItems.forEach((record: string) => {
      if (selectedRecords.includes(record)) {
        api.setUnselected(record);
        select(`#tooltip-record-select-${record}`).remove();
      } else {
        api.setSelected(record);
        const datasetMap = new Map();
        parcoords.newDataset.forEach((cleanedItems: { [x: string]: any }) => {
          datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
        });

        data.forEach((item: any, i: number) => {
          const rec = datasetMap.get(item);
          if (rec && !api.isRecordColored(item)) {
            helper.createToolTipForValues(rec, true);
          }
        });
      }
    });
  } else {
    api.clearSelection();
    api.setSelection(cleanedItems);
    const datasetMap = new Map();
    parcoords.newDataset.forEach((cleanedItems: { [x: string]: any }) => {
      datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
    });

    data.forEach((item: any, i: number) => {
      const rec = datasetMap.get(item);
      if (rec && !api.isRecordColored(item)) {
        helper.createToolTipForValues(rec, true);
      }
    });
  }
  event.stopPropagation();
}

function setActivePathLines(svg: any, content: any, parcoords: any): any {
  const contextMenuRecords = context.createContextMenuForRecords();
  const g = svg.append("g").attr("class", "active");

  g.selectAll("path.hitarea")
    .data(content)
    .enter()
    .append("path")
    .attr("class", "hitarea")
    .attr("id", (d: any) => {
      const keys = Object.keys(d);
      setKey(keys[0]);
      const selected_value = utils.cleanString(d[key]);
      return "area_" + selected_value;
    })
    .attr("d", (d: any) => helper.linePath(d, parcoords.newFeatures))
    .style("stroke", "transparent")
    .style("fill", "none")
    .style("stroke-width", thickness)
    .style("pointer-events", "stroke")
    .on("pointerenter", handlePointerEnter)
    .on("pointerleave", handlePointerLeaveOrOut)
    .on("pointerout", handlePointerLeaveOrOut)
    .on("click", handleClick)
    .on("contextmenu", function (event: any, d: any) {
      context.handleRecordContextMenu(contextMenuRecords, event, d);
      select("#contextmenu").style("display", "none");
    });

  return g
    .selectAll("path.visible")
    .data(content)
    .enter()
    .append("path")
    .attr("class", (d: any) => {
      const keys = Object.keys(d);
      setKey(keys[0]);
      const selected_value = utils.cleanString(d[key]);
      return "line " + selected_value;
    })
    .attr("id", (d: any) => utils.cleanString(d[key]))
    .attr("d", (d: any) => helper.linePath(d, parcoords.newFeatures))
    .style("pointer-events", "none")
    .style("stroke", "var(--spcd3-active-records)")
    .style("stroke-width", "0.12rem")
    .style("fill", "none");
}

export const throttleShowValues = utils.throttle(
  helper.createToolTipForValues,
  50,
);

function setFeatureAxis(
  svg: any,
  yAxis: any,
  parcoords: any,
  width: any,
): void {
  let featureAxis = svg
    .selectAll("g.feature")
    .data(parcoords.features)
    .enter()
    .append("g")
    .attr("class", "dimensions")
    .attr(
      "transform",
      (d: { name: any }) => "translate(" + parcoords.xScales(d.name) + ")",
    );

  featureAxis.append("g").each(function (this: any, d: { name: string }) {
    const processedDimensionName = utils.cleanString(d.name);
    select(this)
      .attr("class", "spcd3-dimensions-axis")
      .attr("id", "dimension_axis_" + processedDimensionName)
      .call(yAxis[d.name]);
  });

  select("body").append("div").attr("class", "spcd3-tooltip-label");

  const brushOverlay = svg
    .append("rect")
    .attr("class", "spcd3-brush-overlay")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .style("fill", "transparent")
    .style("pointer-events", "none");

  let tooltipValues = svg
    .append("g")
    .attr("class", "spcd3-tooltip-values")
    .style("visibility", "hidden");

  let tooltipValuesTop = svg
    .append("g")
    .attr("class", "spcd3-tooltip-values")
    .style("visibility", "hidden");

  let tooltipValuesDown = svg
    .append("g")
    .attr("class", "spcd3-tooltip-values")
    .style("visibility", "hidden");

  brush.setBrushDown(featureAxis, brushOverlay, tooltipValues);

  brush.setBrushUp(featureAxis, brushOverlay, tooltipValues);

  brush.setRectToDrag(featureAxis, tooltipValuesTop, tooltipValuesDown);

  setMarker(featureAxis);

  context.setContextMenu(featureAxis);

  setInvertIcon(featureAxis);
}

function setDefsForIcons(): void {
  const svgContainer = svg;
  let defs = svgContainer.select("defs");
  defs = svgContainer.append("defs");

  createImage(defs, "arrow_image_up", 12, 12, icon.getArrowUp());
  createImage(defs, "arrow_image_down", 12, 12, icon.getArrowDown());
  createImage(defs, "brush_image_top", 14, 10, icon.getArrowTop());
  createImage(defs, "brush_image_bottom", 14, 10, icon.getArrowBottom());
  createImage(defs, "brush_image_top_active", 14, 10, icon.getArrowTopActive());
  createImage(
    defs,
    "brush_image_bottom_active",
    14,
    10,
    icon.getArrowBottomActive(),
  );
}

function createImage(
  defs: any,
  id: any,
  width: any,
  height: any,
  image: any,
): void {
  const themedImage =
    id === "arrow_image_up" || id === "arrow_image_down"
      ? utils.applyThemeToSvg(image)
      : id.startsWith("brush_image_")
        ? utils.applyThemeToBrushSvg(image)
        : utils.applyThemeToSvg(image);

  defs
    .append("image")
    .attr("id", id)
    .attr("width", width)
    .attr("height", height)
    .attr("href", "data:image/svg+xml," + encodeURIComponent(themedImage));
}

function setInvertIcon(featureAxis: any): void {
  let value = (50 / 1.3).toFixed(4);

  const invertIcon = featureAxis
    .append("svg")
    .attr("x", -6 - 22)
    .attr("y", Number(value) - 22)
    .attr("width", 44)
    .attr("height", 22)
    .attr("overflow", "visible");

  invertIcon
    .append("rect")
    .attr("id", "invert_hitbox")
    .attr("class", "hitbox")
    .attr("x", 6)
    .attr("y", Number(value) - 33)
    .attr("width", 44)
    .attr("height", 15)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .each(function (this: any, d: { name: string }) {
      const processed = utils.cleanString(d.name);
      const [hotspotX, hotspotY] = utils.getCursorHotspot(
        icon.getArrowDownCursorMeta(),
        12,
      );
      select(this)
        .attr("id", "invert_hitbox_" + processed)
        .style(
          "cursor",
          `url('data:image/svg+xml,${encodeURIComponent(utils.applyThemeToCursorSvg(utils.setSize(icon.getArrowDownCursor(), 12)))}') ${hotspotX} ${hotspotY}, auto`,
        );
    });

  invertIcon
    .append("svg")
    .attr("width", 12)
    .attr("height", 12)
    .attr("x", 22.5)
    .attr("y", Number(value) - 33)
    .attr("viewBox", "0 0 6 10")
    .append("path")
    .attr("d", utils.ARROW_UP_PATH)
    .attr("fill", "currentColor")
    .each(function (this: any, d: { name: string }) {
      const processed = utils.cleanString(d.name);
      const [hotspotX, hotspotY] = utils.getCursorHotspot(
        icon.getArrowDownCursorMeta(),
        12,
      );
      select(this)
        .attr("id", "dimension_invert_" + processed)
        .text("up")
        .style(
          "cursor",
          `url('data:image/svg+xml,${encodeURIComponent(utils.applyThemeToCursorSvg(utils.setSize(icon.getArrowDownCursor(), 12)))}') ${hotspotX} ${hotspotY}, auto`,
        );
    });

  invertIcon.on("click", (event: any, d: { name: string }) => {
    api.invert(d.name);
    event.stopPropagation();
  });
}

// Hovering

let currentlyHighlightedItems: string[] = [];

let hoverSnapshot: any = null;

function highlight(data: any[]) {
  hoverSnapshot = data;

  const cleanedItems = data.map((item: string) =>
    utils.cleanString(item).replace(/[.,]/g, ""),
  );

  currentlyHighlightedItems = [...cleanedItems];

  cleanedItems.forEach((item: string) => {
    select("#" + item)
      .interrupt()
      .transition()
      .duration(40)
      .style("stroke", "rgba(200, 28, 38, 0.7)");
  });
}

function doNotHighlight() {
  if (!currentlyHighlightedItems.length) return;

  currentlyHighlightedItems.forEach((item: string) => {
    const line = select("#" + item);
    if (line.classed("selected")) {
      line.interrupt().style("stroke", "rgba(255, 165, 0, 1)");
    } else if (line.classed("colored")) {
      const color = line.property("clusterColor");
      line.interrupt().style("stroke", color);
    } else {
      line.interrupt().style("stroke", "var(--spcd3-active-records)");
    }
  });

  currentlyHighlightedItems = [];
}

function setMarker(featureAxis: any): void {
  featureAxis.each(function (this: any, d: { name: string }) {
    const processedDimensionName = utils.cleanString(d.name);
    select(this)
      .append("g")
      .append("rect")
      .attr("id", "marker_" + processedDimensionName)
      .attr("class", "spcd3-marker")
      .attr("width", 44)
      .attr("height", 330)
      .attr("x", -22)
      .attr("y", 30);
  });
}
