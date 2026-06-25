import { select, selectAll } from "d3-selection";
import { scalePoint, scaleLinear } from "d3-scale";
import { axisLeft } from "d3-axis";
import { line } from "d3-shape";
import * as utils from "./utils";
import {
  parcoords,
  height,
  width,
  hoverlabel,
  dimensionSpacingVar,
} from "./globals";

const PADDING = 50;

type DataValue = string | number | boolean | null | undefined;
type DataRow = Record<string, DataValue>;
type DimensionHeader = { name: string };
type TooltipSelection = {
  text: (value: string) => TooltipSelection;
  style: (name: string, value: string) => TooltipSelection;
};

export function prepareData(
  data: DataRow[],
  dimensions: Array<string | number>,
): [DimensionHeader[], DataRow[]] {
  const dataset: DataRow[] = [];
  data.forEach((item: DataRow) => {
    const row: DataRow = {};
    dimensions.forEach((dimension: string | number) => {
      row[dimension] = item[dimension];
    });
    dataset.push(row);
  });
  const header: DimensionHeader[] = [];
  Object.keys(dataset[0]).forEach((element) => header.push({ name: element }));
  return [header, dataset];
}

export function setupYScales(
  header: DimensionHeader[],
  dataset: DataRow[],
): Record<string, any> {
  const yScales: Record<string, any> = {};
  header.map((x: DimensionHeader) => {
    const values = dataset.map((o: DataRow) => o[x.name]);
    const labels: string[] = [];
    const numericValues = values.every((v) => !isNaN(Number(v)));
    if (!numericValues) {
      values.forEach(function (element: DataValue) {
        const label = String(element ?? "");
        labels.push(label.length > 10 ? label.substr(0, 10) + "..." : label);
      });
      yScales[x.name] = scalePoint()
        .domain(labels)
        .range([PADDING, height - PADDING]);
    } else {
      const max = Math.max(
        ...dataset.map((o: { [x: string]: any }) => o[x.name]),
      );
      const min = Math.min(
        ...dataset.map((o: { [x: string]: any }) => o[x.name]),
      );
      if (min === max) {
        const epsilon = min === 0 ? 1 : Math.abs(min) * 0.01;
        yScales[x.name] = scaleLinear()
          .domain([min - epsilon, max + epsilon])
          .range([height - PADDING, PADDING]);
      } else {
        yScales[x.name] = scaleLinear()
          .domain([min, max])
          .range([height - PADDING, PADDING]);
      }
    }
  });
  return yScales;
}

function getTextWidthSVG(text: string, font: string): number {
  const temp = select("body")
    .append("svg")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .append("text")
    .style("font", font)
    .text(text);

  const textNode = temp.node();
  if (!textNode) {
    temp.remove();
    return 0;
  }

  const width = textNode.getBBox().width;

  temp.remove();
  return width;
}

function shortenAxisLabel(value: DataValue): string {
  const label = String(value ?? "");
  return label.length > 10 ? label.substr(0, 10) + "..." : label;
}
function getLongestVisibleTickLabel(
  data: DataRow[],
  header: DimensionHeader[],
): string {
  return header.reduce((longest: string, column: DimensionHeader) => {
    const values = data.map((d: DataRow) => d[column.name]);
    const numericValues = values.every((v: DataValue) => !isNaN(Number(v)));
    const labels = numericValues
      ? values.map((value: DataValue) => String(value ?? ""))
      : values.map(shortenAxisLabel);
    return labels.reduce(
      (currentLongest: string, label: string) =>
        label.length > currentLongest.length ? label : currentLongest,
      longest,
    );
  }, "");
}

export function calculateChartLayout(
  header: DimensionHeader[],
  dataset: DataRow[],
): {
  axisGap: number;
  chartWidth: number;
  leftPadding: number;
  rightPadding: number;
} {
  const n = header.length;
  const longestDimensionLabel = header.reduce(
    (longest: string, column: DimensionHeader) => {
      const label = shortenAxisLabel(column.name);
      return label.length > longest.length ? label : longest;
    },
    "",
  );
  const longestTickLabel = getLongestVisibleTickLabel(dataset, header);
  const dimensionLabelWidth = getTextWidthSVG(
    longestDimensionLabel,
    "0.7rem Verdana",
  );
  const tickLabelWidth = getTextWidthSVG(longestTickLabel, "0.75rem Verdana");
  const axisGap =
    dimensionSpacingVar ?? Math.max(96, Math.ceil(dimensionLabelWidth + 56));
  const leftPadding = Math.max(72, Math.ceil(tickLabelWidth + 44));
  const rightPadding = Math.max(48, Math.ceil(dimensionLabelWidth / 2 + 36));
  const chartWidth = Math.ceil(
    leftPadding + rightPadding + Math.max(0, n - 1) * axisGap,
  );
  return { axisGap, chartWidth, leftPadding, rightPadding };
}

export function setupXScales(
  header: DimensionHeader[],
  dataset: DataRow[],
): any {
  const { leftPadding, rightPadding } = calculateChartLayout(header, dataset);
  return scalePoint()
    .domain(header.map((x: DimensionHeader) => x.name))
    .range([width - rightPadding, leftPadding])
    .padding(0)
    .align(0.5);
}

function isLinearScale(scale: any): boolean {
  return typeof (scale as any).ticks === "function";
}

export function setupYAxis(
  yScales: Record<string, any>,
  dataset: DataRow[],
  hiddenDims: string[],
): Record<string, any> {
  const limit = 30;
  const yAxis: Record<string, any> = {};

  Object.entries(yScales).forEach(([key, scale]) => {
    if (hiddenDims.includes(key)) return;
    if (!isLinearScale(scale)) {
      const rawLabels = dataset.map((d: DataRow) => d[key]);
      const shortenedLabels = rawLabels.map((val: DataValue) =>
        typeof val === "string" && val.length > 10
          ? val.substr(0, 10) + "..."
          : val,
      );
      const uniqueLabels = Array.from(new Set(shortenedLabels));
      const ticks =
        uniqueLabels.length > limit
          ? uniqueLabels.filter((_, i) => i % 6 === 0)
          : uniqueLabels;

      yAxis[key] = axisLeft(scale)
        .tickValues(ticks)
        .tickFormat((d: any) => d);
    } else if (isLinearScale(scale)) {
      const linearScale = scale as any;
      const ticks: number[] = linearScale.ticks(5).concat(linearScale.domain());
      const sorted: number[] = Array.from(new Set(ticks)).sort((a, b) => a - b);

      if (sorted.length >= 2) {
        const diffStart = sorted[1] - sorted[0];
        if (diffStart < 5) {
          sorted.splice(1, 1);
        }
        const len = sorted.length;
        const last = sorted[len - 1];
        const secondLast = sorted[len - 2];
        const diffEnd = last - secondLast;
        if (diffEnd < 5) {
          sorted.splice(len - 2, 1);
        }
      }
      yAxis[key] = axisLeft(scale)
        .tickValues(sorted)
        .tickFormat((d: any) => d);
    }
  });
  return yAxis;
}

export function linePath(d: DataRow, newFeatures: string[]): any {
  const lineGenerator = line();
  const tempdata = Object.entries(d).filter((x) => x[0]);
  const points: [number, number][] = [];

  newFeatures.forEach((newFeature: string) => {
    const valueEntry = tempdata.find((x) => x[0] === newFeature);
    if (valueEntry) {
      const name = newFeature;
      const value: string = String(valueEntry[1]);
      const x =
        parcoords.dragging[name] !== undefined
          ? parcoords.dragging[name]
          : parcoords.xScales(name);
      const cleanedValue =
        value.length > 10 ? value.substr(0, 10) + "..." : value;
      const y = parcoords.yScales[name](cleanedValue);
      points.push([x, y]);
    }
  });
  return lineGenerator(points);
}

export function isInverted(dimension: string): boolean {
  const invertId = "#dimension_invert_" + utils.cleanString(dimension);
  const element = select(invertId);
  const arrowStatus = element.text();
  return arrowStatus == "down" ? true : false;
}

function getAllVisibleDimensionNames(): string[] {
  let listOfDimensions = parcoords.newFeatures.slice();
  return listOfDimensions.reverse();
}

type ToolTipItem = {
  dim: string;
  x: number;
  y: number;
  text: string;
};

const TOOLTIP_LABEL_HEIGHT = 16;
const TOOLTIP_LABEL_GAP = 3;
const TOOLTIP_LABEL_X_OFFSET = 10;
const TOOLTIP_LEADER_PADDING = 4;

function recordIdOf(
  rec: DataRow & { id?: string; _id?: string; key?: string },
) {
  return rec.id ?? rec._id ?? rec.key;
}

export function createToolTipForValues(
  records: DataRow & { id?: string; _id?: string; key?: string },
  isSelect: boolean,
  svgSelection: any = select("#spcd3-pc_svg"),
  xScales: any = parcoords.xScales,
  yScales: any = parcoords.yScales,
): void {
  const dimensions = getAllVisibleDimensionNames();
  const svgNode = svgSelection?.node?.();
  if (!svgNode) return;

  const recordId = utils.cleanString(
    String(records[hoverlabel] ?? recordIdOf(records) ?? ""),
  );
  if (!recordId) return;
  const tooltipType = isSelect ? "selected" : "hover";

  const layer = svgSelection
    .selectAll(
      `g.spcd3-tip-layer[data-record="${recordId}"][data-tooltip-type="${tooltipType}"]`,
    )
    .data([recordId])
    .join("g")
    .attr("class", "spcd3-tip-layer")
    .attr("data-record", recordId)
    .attr("data-tooltip-type", tooltipType)
    .style("display", null);
  layer.attr("id", isSelect ? `tooltip-record-select-${recordId}` : null);

  const data: ToolTipItem[] = dimensions.map((dim) => {
    const yScale = yScales[dim];
    const x = xScales(dim);
    const record = records[dim];
    const scaleValue =
      typeof record === "string" ? shortenAxisLabel(record) : record;
    const y = yScale(scaleValue);

    return {
      dim,
      x,
      y,
      text: String(record ?? ""),
    };
  }).filter(
    (item) => Number.isFinite(item.x) && Number.isFinite(item.y),
  );

  const tipClass = isSelect
    ? "spcd3-tooltip-record-select"
    : "spcd3-tooltip-record";

  layer
    .selectAll(`g.${tipClass}`)
    .data(data, (d: any) => d.dim)
    .join(
      (enter: any) => enter.append("g").attr("class", tipClass),
      (update: any) => update,
      (exit: any) => exit.remove(),
    )
    .attr(
      "transform",
      (d: ToolTipItem) => `translate(${d.x + 8}, ${d.y - 9})`,
    )
    .style("pointer-events", "none")
    .each(function (this: SVGGElement, d: ToolTipItem) {
      const label = select(this);
      const badgeWidth = Math.max(d.text.length * 6 + 8, 18);

      label
        .attr("data-dim", d.dim)
        .attr("data-anchor-x", d.x)
        .attr("data-anchor-y", d.y)
        .attr("data-badge-width", badgeWidth)
        .attr("data-priority", isSelect ? 2 : 1)
        .attr("data-tooltip-type", tooltipType);

      label
        .selectAll("line")
        .data([d])
        .join("line")
        .attr("class", "spcd3-tooltip-leader")
        .attr("stroke", isSelect ? "rgb(255, 165, 0)" : "var(--spcd3-text-primary)")
        .attr("stroke-width", isSelect ? 1.2 : 1)
        .attr("stroke-opacity", isSelect ? 0.9 : 0.45);

      label
        .selectAll("rect")
        .data([d])
        .join("rect")
        .attr("rx", 2)
        .attr("ry", 2)
        .attr("width", badgeWidth)
        .attr("height", 16)
        .attr(
          "fill",
          isSelect
            ? "rgb(255, 165, 0)"
            : "var(--spcd3-tooltip-record-bg)",
        )
        .attr(
          "stroke",
          isSelect
            ? "rgb(255, 165, 0)"
            : "var(--spcd3-tooltip-record-bg)",
        )
        .attr("stroke-width", 1);

      label
        .selectAll("text")
        .data([d])
        .join("text")
        .attr("x", 4)
        .attr("y", 11)
        .attr("font-size", 10)
        .attr(
          "fill",
          isSelect
            ? "black"
            : "var(--spcd3-tooltip-record-text)",
        )
        .text(d.text);
    });

  relayoutValueTooltips(svgSelection);
}

type TooltipLayoutNode = {
  anchorX: number;
  anchorY: number;
  badgeWidth: number;
  node: SVGGElement;
  priority: number;
};

function relayoutValueTooltips(svgSelection: any): void {
  const root = svgSelection?.node?.() as SVGSVGElement | null;
  if (!root) return;

  const hoverLabels = Array.from(
    root.querySelectorAll<SVGGElement>("g.spcd3-tip-layer g.spcd3-tooltip-record"),
  );
  hoverLabels.forEach((labelNode) => {
    const anchorX = Number(labelNode.getAttribute("data-anchor-x"));
    const anchorY = Number(labelNode.getAttribute("data-anchor-y"));
    if (!Number.isFinite(anchorX) || !Number.isFinite(anchorY)) return;

    const top = anchorY - TOOLTIP_LABEL_HEIGHT / 2;
    select(labelNode).attr(
      "transform",
      `translate(${anchorX + TOOLTIP_LABEL_X_OFFSET}, ${top})`,
    );
    select(labelNode)
      .select("line")
      .attr("x1", 0)
      .attr("y1", TOOLTIP_LABEL_HEIGHT / 2)
      .attr("x2", -TOOLTIP_LABEL_X_OFFSET + TOOLTIP_LEADER_PADDING)
      .attr("y2", TOOLTIP_LABEL_HEIGHT / 2);
  });

  const labels = Array.from(
    root.querySelectorAll<SVGGElement>("g.spcd3-tip-layer g.spcd3-tooltip-record-select"),
  );
  if (labels.length === 0) return;

  const labelsByDimension = new Map<string, TooltipLayoutNode[]>();

  labels.forEach((labelNode) => {
    const dim = labelNode.getAttribute("data-dim");
    const anchorX = Number(labelNode.getAttribute("data-anchor-x"));
    const anchorY = Number(labelNode.getAttribute("data-anchor-y"));
    const badgeWidth = Number(labelNode.getAttribute("data-badge-width"));
    const priority = Number(labelNode.getAttribute("data-priority") ?? "0");

    if (!dim || !Number.isFinite(anchorX) || !Number.isFinite(anchorY)) return;

    const items = labelsByDimension.get(dim) ?? [];
    items.push({
      anchorX,
      anchorY,
      badgeWidth: Number.isFinite(badgeWidth) ? badgeWidth : 18,
      node: labelNode,
      priority,
    });
    labelsByDimension.set(dim, items);
  });

  labelsByDimension.forEach((dimensionLabels) => {
    dimensionLabels.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.anchorY - b.anchorY;
    });

    let currentBottom = 0;
    dimensionLabels.forEach((item) => {
      const preferredTop = item.anchorY - TOOLTIP_LABEL_HEIGHT / 2;
      const minTop = TOOLTIP_LEADER_PADDING;
      const maxTop = height - TOOLTIP_LABEL_HEIGHT - TOOLTIP_LEADER_PADDING;
      const top = Math.max(
        minTop,
        Math.min(
          maxTop,
          Math.max(preferredTop, currentBottom + TOOLTIP_LABEL_GAP),
        ),
      );
      currentBottom = top + TOOLTIP_LABEL_HEIGHT;

      const translateX = item.anchorX + TOOLTIP_LABEL_X_OFFSET;
      select(item.node).attr("transform", `translate(${translateX}, ${top})`);

      select(item.node)
        .select("line")
        .attr("x1", 0)
        .attr("y1", TOOLTIP_LABEL_HEIGHT / 2)
        .attr("x2", -TOOLTIP_LABEL_X_OFFSET + TOOLTIP_LEADER_PADDING)
        .attr("y2", item.anchorY - top);

      select(item.node)
        .select("rect")
        .attr("width", item.badgeWidth)
        .attr("height", TOOLTIP_LABEL_HEIGHT);

      select(item.node)
        .select("text")
        .attr("x", 4)
        .attr("y", 11);
    });
  });
}

export function getAllPointerEventsData(event: MouseEvent): string[] {
  const selection = selectAll(
    document.elementsFromPoint(event.clientX, event.clientY),
  ).filter("path");
  if (selection == null) return [];
  const object = selection._groups;
  const data: string[] = [];
  for (let i = 0; i < object[0].length; i++) {
    const items = object.map((item: any[]) => item[i]);
    const itemsdata = items[0].__data__;
    if (!itemsdata || !itemsdata[hoverlabel]) continue;
    const text = itemsdata[hoverlabel];
    data.push(text);
  }
  return data;
}

export function createTooltipForLabel(
  tooltipText: string | string[] | null | undefined,
  tooltipLabel: TooltipSelection,
  event: MouseEvent,
): TooltipSelection | void {
  if (!tooltipText || tooltipText.length === 0) return;
  const x = event.clientX / 16;
  const y = event.clientY / 16;
  let tempText = tooltipText.toString();
  tempText = tempText.split(",").join("\r\n");
  tooltipLabel
    .text(tempText)
    .style("visibility", "visible")
    .style("position", "fixed")
    .style("top", `${y}rem`)
    .style("left", `${x}rem`);
  return tooltipLabel;
}

export function trans(g: any): any {
  return g.transition().duration(50);
}

export function position(dimension: any, dragging: any, xScales: any): any {
  const value = dragging[dimension];
  return value == null ? xScales(dimension) : value;
}

export function cleanTooltip(): void {
  selectAll('.spcd3-tip-layer[data-tooltip-type="hover"]').remove();
}

export function cleanTooltipSelect(): void {
  selectAll('.spcd3-tip-layer[data-tooltip-type="selected"]').remove();
}
