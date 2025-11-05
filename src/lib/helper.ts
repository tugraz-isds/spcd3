import { select, selectAll, ScaleLinear } from 'd3-selection';
import { scalePoint, scaleLinear } from 'd3-scale';
import { axisLeft } from 'd3-axis';
import { line } from 'd3-shape';
import * as utils from './utils';
import { parcoords, height, width, padding, hoverlabel } from './globals';

export function prepareData(data: [], dimensions: any): any {
  let dataset = [];
  data.forEach((item: { [x: string]: any; }) => {
    let row = {};
    dimensions.forEach((dimension: string | number) => {
      row[dimension] = item[dimension];
    });
    dataset.push(row);
  })
  let header = [];
  Object.keys(dataset[0]).forEach(element => header.push({ 'name': element }));
  return [header, dataset];
}

export function setupYScales(header: any, dataset: any): any {
  let yScales = {};
  header.map((x: { name: string | number; }) => {
    const values = dataset.map((o: { [x: string]: any; }) => o[x.name]);
    let labels = [];
    if (isNaN(values[0]) !== false) {
      values.forEach(function (element: string) {
        labels.push(element.length > 10 ? element.substr(0, 10) + '...' :
        element);
      });
      yScales[x.name] = scalePoint()
        .domain(labels)
        .range([80, height - 80])
        .padding(0.2);
      }
      else {
        const max = Math.max(...dataset.map((o: { [x: string]: any; }) => o
        [x.name]));
        const min = Math.min(...dataset.map((o: { [x: string]: any; }) => o
        [x.name]));
        if (min === max) {
          const epsilon = min === 0 ? 1 : Math.abs(min) * 0.01;
          yScales[x.name] = scaleLinear()
            .domain([min - epsilon, max + epsilon])
            .range([height - 80, 80]);
        } else {
          yScales[x.name] = scaleLinear()
            .domain([min, max])
            .range([height - 80, 80]);
          }
      }
  });
  return yScales;
}

export function setupXScales(header: any): any {
  const n = header.length;
  const pad = (n <= 2) ? 0 : 0.2;
  return scalePoint()
    .domain(header.map((x: { name: any; }) => x.name))
    .range([width - padding, padding])
    .padding(pad)
    .align(0.5);
}

function isLinearScale(scale: any): scale is ScaleLinear<number, number> {
  return typeof (scale as any).ticks === 'function';
}

export function setupYAxis(yScales: any, dataset: any, hiddenDims: any): any {
  const limit = 30;
  const yAxis = {};
  
  Object.entries(yScales).forEach(([key, scale]) => {
    if (hiddenDims.includes(key)) return;
      const sample = dataset[0][key];
      const isNumeric = !isNaN(+sample);
      if (!isNumeric) {
        const rawLabels = dataset.map((d: { [x: string]: any; }) => d[key]);
        const shortenedLabels = rawLabels.map((val: string) =>
          typeof val === 'string' && val.length > 10 ? val.substr(0, 10) + 
          '...' : val
        );
        const uniqueLabels = Array.from(new Set(shortenedLabels));
        const ticks = uniqueLabels.length > limit
          ? uniqueLabels.filter((_, i) => i % 4 === 0)
          : uniqueLabels;

        yAxis[key] = axisLeft(scale).tickValues(ticks).tickFormat((d: any) => d);
      } else if (isLinearScale(scale)) {
        const ticks: number[] = scale.ticks(5).concat(scale.domain());
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
      yAxis[key] = axisLeft(scale).tickValues(sorted).tickFormat((d: any) => d);
    }
  });
  return yAxis;
}

export function linePath(d: any, newFeatures: any): any {
  const lineGenerator = line();
  const tempdata = Object.entries(d).filter(x => x[0]);
  const points = [];

  newFeatures.forEach((newFeature: string) => {
    const valueEntry = tempdata.find(x => x[0] === newFeature);
    if (valueEntry) {
      const name = newFeature;
      const value = valueEntry[1];
      const x = parcoords.dragging[name] !== undefined
        ? parcoords.dragging[name]
        : parcoords.xScales(name);
      const y = parcoords.yScales[name](value);
      points.push([x, y]);
    }
  });
  return lineGenerator(points);
}

export function isInverted(dimension: string): boolean {
  const invertId = '#dimension_invert_' + utils.cleanString(dimension);
  const element = select(invertId);
  const arrowStatus = element.text();
  return arrowStatus == 'down' ? true : false;
}

function getAllVisibleDimensionNames(): string[] {
  let listOfDimensions = parcoords.newFeatures.slice();
  return listOfDimensions.reverse();
}

type TipDatum = {
  dim: string;
  pageX: number;
  pageY: number;
  text: string;
};

function recordIdOf(rec: any, fallback: string) {
  return rec.id ?? rec._id ?? rec.key ?? fallback;
}

export function createToolTipForValues(records: any, recKey?: string) {
  const dimensions = getAllVisibleDimensionNames();
  const svg = select('#pc_svg').node() as SVGSVGElement;
  const plotG = (document.querySelector<SVGGElement>('#pc_svg g.plot') ?? svg);
  const ctm = plotG.getScreenCTM();
  if (!ctm) return;

  const recordId = recordIdOf(records, String(recKey ?? Math.random()));

  const layer = select('body')
    .selectAll<HTMLDivElement, string>(`div.tip-layer[data-record="${recordId}"]`)
    .data([recordId])
    .join('div')
    .attr('class', 'tip-layer')
    .attr('data-record', recordId)
    .style('position', 'absolute')
    .style('left', '0px')
    .style('top', '0px')
    .style('pointer-events', 'none');

  const data: TipDatum[] = dimensions
    .filter(dim => utils.isElementVisible(select('#rect_' + utils.cleanString(dim))))
    .map(dim => {
      const yScale = parcoords.yScales[dim];
      const x = parcoords.xScales(dim);
      const y = yScale(records[dim]);

      const pt = svg.createSVGPoint();
      pt.x = x; pt.y = y;
      const sp = pt.matrixTransform(ctm);

      return {
        dim,
        pageX: sp.x + window.scrollX + 8,
        pageY: sp.y + window.scrollY + 8,
        text: String(records[dim]),
      };
    });

  const tips = layer
    .selectAll<HTMLDivElement, TipDatum>('div.tooltip-div')
    .data(data, (d: any) => d.dim);

  tips.join(
    enter => enter.append('div')
      .attr('class', 'tooltip-div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('font-size', '0.65rem')
      .style('margin', '0.5rem')
      .style('color', 'red')
      .style('background-color', '#d3d3d3ad')
      .style('font-weight', 'bold')
      .style('padding', '0.12rem')
      .style('white-space', 'nowrap')
      .style('z-index', '9999')
      .style('left', d => `${d.pageX}px`)
      .style('top',  d => `${d.pageY}px`)
      .text(d => d.text), update => update
      .style('left', d => `${d.pageX}px`)
      .style('top',  d => `${d.pageY}px`)
      .text(d => d.text),
    exit => exit.remove()
  );
}

export function getAllPointerEventsData(event: any): any {
  const selection = selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter('path');
  if (selection == null) return;
  const object = selection._groups;
  const data = [];
  for (let i = 0; i < object[0].length; i++) {
    const items = object.map((item: any[]) => item[i]);
    const itemsdata = items[0].__data__;
    if (!itemsdata || !itemsdata[hoverlabel]) continue;
    const text = itemsdata[hoverlabel];
    data.push(text);
  }
  return data;
}

export function createTooltipForPathLine(tooltipText: string | any[], tooltipPath: { text: (arg0: any) => { (): any; new(): any; style: { (arg0: string, arg1: string): { (): any; new(): any; style: { (arg0: string, arg1: string): { (): any; new(): any; style: { (arg0: string, arg1: string): void; new(): any; }; }; new(): any; }; }; new(): any; }; }; }, event: { clientX: number; clientY: number; }) {
  if (!tooltipText || tooltipText.length === 0) return;
  const [x, y] = utils.getMouseCoords(event);
  let tempText = tooltipText.toString();
  tempText = tempText.split(',').join('\r\n');
  tooltipPath.text(tempText)
    .style('visibility', 'visible')
    .style('top', y / 16 + 'rem')
    .style('left', x / 16 + 0.5 + 'rem');
  return tooltipPath;
}

export function trans(g: any): any {
  return g.transition().duration(50);
}

export function position(dimension: any, dragging: any, xScales: any): any {
  const value = dragging[dimension];
  return value == null ? xScales(dimension) : value;
}

export function cleanTooltip(): void {
  selectAll('.tooltip-div').remove();
}