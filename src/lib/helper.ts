import * as d3 from 'd3-selection';
import * as scale from 'd3-scale';
import * as axis from 'd3-axis';
import * as path from 'd3-shape';
import * as utils from './utils';

export function prepareData(data: any, newFeatures: any): any {
    let newDataset = [];
    data.forEach(obj => {
        let newdata = {};
        newFeatures.forEach(feature => {
            newdata[feature] = obj[feature];
        });
        newDataset.push(newdata);
    })
    let features = [];
    Object.keys(newDataset[0]).forEach(element => features.push({ 'name': element }));
    return [features, newDataset];
}

export function setupYScales(height: any, padding: any, features: any, newDataset: any): any {
    let yScales = {};
    features.map(x => {
        const values = newDataset.map(o => o[x.name]);
        let labels = [];
        if (isNaN(values[0]) !== false) {
            values.forEach(function (element) {
                labels.push(element.length > 10 ? element.substr(0, 10) + '...' : element);
            });
            yScales[x.name] = scale.scalePoint()
                .domain(labels)
                .range([padding, height - padding])
                .padding(0.2);
        }
        else {
            const max = Math.max(...newDataset.map(o => o[x.name]));
            const min = Math.min(...newDataset.map(o => o[x.name]));
            yScales[x.name] = scale.scaleLinear()
                .domain([min, max])
                .range([height - padding, padding]);
        }
    });
    return yScales;
}

export function setupXScales(width: any, padding: any, features: any): any {
    return scale.scalePoint()
        .domain(features.map(x => x.name))
        .range([width - padding, padding]);
}

function isLinearScale(scale: any): scale is d3.ScaleLinear<number, number> {
    return typeof (scale as any).ticks === 'function';
}

export function setupYAxis(yScales: any, newDataset: any, hiddenDims: any): any {
    const limit = 30;
    const yAxis = {};

    Object.entries(yScales).forEach(([key, scale]) => {
        if (hiddenDims.includes(key)) return;

        const sample = newDataset[0][key];
        const isNumeric = !isNaN(+sample);

        if (!isNumeric) {
            const rawLabels = newDataset.map(d => d[key]);
            const shortenedLabels = rawLabels.map(val =>
                typeof val === 'string' && val.length > 10 ? val.substr(0, 10) + '...' : val
            );
            const uniqueLabels = Array.from(new Set(shortenedLabels));

            const ticks = uniqueLabels.length > limit
                ? uniqueLabels.filter((_, i) => i % 4 === 0)
                : uniqueLabels;

            yAxis[key] = axis.axisLeft(scale).tickValues(ticks);
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
            yAxis[key] = axis.axisLeft(scale).tickValues(sorted);
        }
    });
    return yAxis;
}

export function linePath(d: any, newFeatures: any, parcoords: any): any {
    const lineGenerator = path.line();
    const tempdata = Object.entries(d).filter(x => x[0]);
    const points = [];

    newFeatures.forEach(newFeature => {
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
    const element = d3.select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == 'down' ? true : false;
}

function getAllVisibleDimensionNames(): string[] {
    let listOfDimensions = parcoords.newFeatures.slice();
    return listOfDimensions.reverse();
}

export function createToolTipForValues(recordData): void {
    const dimensions = getAllVisibleDimensionNames();

    const svg = d3.select('#pc_svg').node() as SVGSVGElement;

    dimensions.forEach(dimension => {
        const cleanString = utils.cleanString(dimension);

        if (utils.isElementVisible(d3.select('#rect_' + cleanString))) {
            const yScale = parcoords.yScales[dimension];

            const x = parcoords.xScales(dimension);
            const y = yScale(recordData[dimension]);

            const pt = svg.createSVGPoint();
            pt.x = x;
            pt.y = y;
            const screenPoint = pt.matrixTransform(svg.getScreenCTM());

            d3.select('body')
                .append('div')
                .attr('class', 'tooltip-div')
                .style('position', 'absolute')
                .style('left', `${screenPoint.x}px`)
                .style('top', `${screenPoint.y}px`)
                .style('font-size', '0.65rem')
                .style('margin', '0.5rem')
                .style('color', 'red')
                .style('background-color', '#d3d3d3ad')
                .style('font-weight', 'bold')
                .style('padding', '0.12rem')
                .style('white-space', 'nowrap')
                .text(recordData[dimension].toString());
        }
    });
}

export function getAllPointerEventsData(event: any, hoverlabel: string): any {
    const selection = d3.selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter('path');
    const object = selection._groups;
    const data = [];
    for (let i = 0; i < object[0].length; i++) {
        const items = object.map(item => item[i]);
        const itemsdata = items[0].__data__;
        const text = itemsdata[hoverlabel];
        data.push(text);
    }
    return data;
}

export function createTooltipForPathLine(tooltipText, tooltipPath, event) {
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

export function position(dimensionName: any, dragging: any, xScales: any): any {
    const value = dragging[dimensionName];
    return value == null ? xScales(dimensionName) : value;
}

export function cleanTooltip() {
    d3.selectAll('.tooltip-div').remove();
}