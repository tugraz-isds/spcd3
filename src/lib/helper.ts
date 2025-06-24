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

export function setupYAxis(features: any[], yScales: any, newDataset: any): any {

    const limit = 30;
    let counter = 0;
    let yAxis = {};

    Object.entries(yScales).map(key => {
        let tempFeatures = Array.from(features.values()).map(c => c.name);
        let tempValues = newDataset.map(o => o[tempFeatures[counter]]);
        let labels = [];
        tempValues.forEach(function (element) {
            labels.push(element.length > 10 ? element.substr(0, 10) + '...' : element);
        });
        counter = counter + 1;

        if (isNaN(labels[0])) {
            let uniqueArray = labels.filter(function (item, index, self) {
                return index === self.indexOf(item);
            })
            if (uniqueArray.length > limit) {
                let filteredArray = labels.filter(function (value, index, array) {
                    return index % 4 == 0;
                });
                yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(filteredArray);
            }
            else {
                yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(labels);
            }
        }
        else {
            let ranges = yScales[key[0]].ticks(5).concat(yScales[key[0]].domain());
            let sortRanges = ranges.sort(function (a, b) { return a - b });
            let uniqueRanges = [...new Set(sortRanges)];
            if (Number(uniqueRanges[1]) - 5 < Number(uniqueRanges[0])) {
                uniqueRanges.splice(1, 1);
            }
            if (Number(uniqueRanges[uniqueRanges.length - 1]) - 5 < Number(uniqueRanges[uniqueRanges.length - 2])) {
                uniqueRanges.splice(uniqueRanges.length - 2, 1);
            }
            yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(uniqueRanges);
        }
    });
    return yAxis;
}

export function linePath(d: any, newFeatures: any, parcoords: any): any {
    let lineGenerator = path.line();
    const tempdata = Object.entries(d).filter(x => x[0]);
    let points = [];

    newFeatures.map(newfeature => {
        tempdata.map(x => {
            if (newfeature === x[0]) {
                points.push([parcoords.xScales(newfeature), parcoords.yScales[newfeature](x[1])]);
            }
        })
    })
    return (lineGenerator(points));
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
    let counter = 0;

    const rectLeft = d3.select('#rect_' + dimensions[0])?.node()?.getBoundingClientRect().left;

    dimensions.forEach(dimension => {
        const cleanString = utils.cleanString(dimension);

        if (utils.isElementVisible(d3.select('#rect_' + cleanString))) {
            const tooltipValues = d3.select('#parallelcoords')
                .append('g')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('visibility', 'hidden');

            const invertStatus = isInverted(dimension);
            const scale = parcoords.yScales[dimension];
            const maxValue = invertStatus ? scale.domain()[0] : scale.domain()[1];
            const minValue = invertStatus ? scale.domain()[1] : scale.domain()[0];
            const range = maxValue - minValue;

            let value;
            if (invertStatus) {
                value = isNaN(maxValue) ? scale(recordData[dimension]) :
                    240 / range * (recordData[dimension] - minValue) + 80;
            } else {
                value = isNaN(maxValue) ? scale(recordData[dimension]) :
                    240 / range * (maxValue - recordData[dimension]) + 80;
            }

            const x = (rectLeft + (counter * 95)) / 16;
            const y = (value + 195) / 16;

            tooltipValues.text(recordData[dimension].toString())
                .style('visibility', 'visible')
                .style('top', `${y}rem`)
                .style('left', `${x}rem`)
                .style('font-size', '0.65rem')
                .style('margin', '0.5rem')
                .style('color', 'red')
                .style('background-color', '#d3d3d3ad')
                .style('font-weight', 'bold')
                .style('padding', '0.12rem')
                .style('white-space', 'pre-line')
                .style('margin-left', '0.5rem');

            counter++;
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
    d3.selectAll(".tooltip")
        .remove();
}