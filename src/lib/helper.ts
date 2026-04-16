import { select, selectAll } from "d3-selection";
import { scalePoint, scaleLinear } from "d3-scale";
import { axisLeft } from "d3-axis";
import { line } from "d3-shape";
import * as utils from "./utils";
import { parcoords, height, width, padding, hoverlabel } from "./globals";

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

function getLongestTickLabel(data: DataRow[], labelKey: string): string {
  const uniqueLabels = Array.from(
    new Set<string>(data.map((d: DataRow) => String(d[labelKey] ?? ""))),
  ).filter((s) => s.length > 0);
  const ticks =
    uniqueLabels.length > 30
      ? uniqueLabels.filter((_, i) => i % 4 === 0)
      : uniqueLabels;

  return ticks.reduce((longest, v) => {
    return v.length > longest.length ? v : longest;
  }, "");
}

function detectLastStringKey(data: DataRow[]): string {
  const keys = Object.keys(data[0]);

  const stringKeys = keys.filter(
    (key) => typeof data[0][key] === "string" && isNaN(Number(data[0][key])),
  );

  return stringKeys[stringKeys.length - 1];
}

export function setupXScales(
  header: DimensionHeader[],
  dataset: DataRow[],
): any {
  const labelKey = detectLastStringKey(dataset);

  const longest = getLongestTickLabel(dataset, labelKey);

  const longestTicklabel =
    longest.length > 10 ? longest.substr(0, 10) + "......." : longest;

  const labelWidth = getTextWidthSVG(longestTicklabel, "0.75rem Verdana");

  const margin = labelWidth * 0.6 + 16;
  const n = header.length;
  const pad = n <= 4 ? 0.1 : 0.2;
  return scalePoint()
    .domain(header.map((x: DimensionHeader) => x.name))
    .range([width - margin, margin])
    .padding(pad)
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
  pageX: number;
  pageY: number;
  text: string;
};

function recordIdOf(
  rec: DataRow & { id?: string; _id?: string; key?: string },
) {
  return rec.id ?? rec._id ?? rec.key;
}

export function createToolTipForValues(
  records: DataRow & { id?: string; _id?: string; key?: string },
  isSelect: boolean,
): void {
  const dimensions = getAllVisibleDimensionNames();
  const svg = select("#spcd3-pc_svg").node() as SVGSVGElement;
  if (!svg) return;
  const plotG =
    document.querySelector<SVGGElement>("#spcd3-pc_svg g.plot") ?? svg;
  const ctm = plotG.getScreenCTM();
  if (!ctm) return;

  const recordId = recordIdOf(records);

  const wrapper = document.querySelector<HTMLDivElement>(
    "#spcd3-parallelcoords .spcd3-chartWrapper",
  );
  if (!wrapper) return;

  const layer = select(wrapper)
    .selectAll(`div.tip-layer[data-record="${recordId}"]`)
    .data([recordId])
    .join("div")
    .attr("class", "spcd3-tip-layer")
    .attr("data-record", recordId);

  const wrapperRect = wrapper.getBoundingClientRect();

  const data: ToolTipItem[] = dimensions.map((dim) => {
    const yScale = parcoords.yScales[dim];
    const x = parcoords.xScales(dim);
    const record = records[dim];
    const recordText = String(record ?? "");
    const cleanRecord =
      recordText.length > 10 ? recordText.substr(0, 10) + "..." : recordText;
    const y = yScale(cleanRecord);

    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const sp = pt.matrixTransform(ctm);

    return {
      dim,
      pageX: sp.x - wrapperRect.left + wrapper.scrollLeft,
      pageY: sp.y - wrapperRect.top + wrapper.scrollTop,
      text: String(records[dim]),
    };
  });

  if (isSelect) {
    const tips = layer
      .selectAll("div.spcd3-tooltip-record-select")
      .data(data, (d: any) => d.dim);

    tips.join(
      (enter: any) =>
        enter
          .append("div")
          .attr(
            "id",
            `tooltip-record-select-${utils.cleanString(String(records[hoverlabel] ?? ""))}`,
          )
          .attr("class", "spcd3-tooltip-record-select")
          .style("left", (d: ToolTipItem) => `${d.pageX / 16}rem`)
          .style("top", (d: ToolTipItem) => `${d.pageY / 16}rem`)
          .text((d: ToolTipItem) => d.text),
      (update: any) =>
        update
          .style("left", (d: ToolTipItem) => `${d.pageX / 16}rem`)
          .style("top", (d: ToolTipItem) => `${d.pageY / 16}rem`)
          .text((d: ToolTipItem) => d.text),
      (exit: any) => exit.remove(),
    );
  } else {
    const tips = layer
      .selectAll("div.spcd3-tooltip-record")
      .data(data, (d: any) => dimensions);

    tips.join(
      (enter: any) =>
        enter
          .append("div")
          .attr("class", "spcd3-tooltip-record")
          .style("left", (d: ToolTipItem) => `${d.pageX / 16}rem`)
          .style("top", (d: ToolTipItem) => `${d.pageY / 16}rem`)
          .text((d: ToolTipItem) => d.text),
      (update: any) =>
        update
          .style("left", (d: ToolTipItem) => `${d.pageX / 16}rem`)
          .style("top", (d: ToolTipItem) => `${d.pageY / 16}rem`)
          .text((d: ToolTipItem) => d.text),
      (exit: any) => exit.remove(),
    );
  }
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
  selectAll(".spcd3-tooltip-record").remove();
}

export function cleanTooltipSelect(): void {
  selectAll(".spcd3-tooltip-record-select").remove();
}
