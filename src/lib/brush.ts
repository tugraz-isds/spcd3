import * as d3 from 'd3-selection';
import * as icon from './icons/icons';
import * as helper from './utils';
import { isDimensionCategorical } from './parallelcoordinates';

export function brushDown(cleanDimensionName: any, event: any, d: any,
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {},
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    },
    active: any, tooltipValues: any, window: any): void {

    const yPosBottom = Number(d3.select('#triangle_up_' + cleanDimensionName).attr('y'));

    let yPosTop: number;
    let yPosRect: number;
    let topToAdd: number;

    if (event.y < 70) {
        yPosTop = 70;
        yPosRect = 80;
        topToAdd = 80;
    }
    else if (event.y > yPosBottom - 10) {
        yPosTop = yPosBottom - 10;
        topToAdd = yPosBottom - 10;
        yPosRect = 320;
    }
    else if (event.y == yPosBottom - 10) {
        yPosTop = yPosBottom - 10;
        topToAdd = yPosBottom - 10;
        yPosRect = yPosTop + 10;
    }
    else {
        yPosTop = event.y;
        topToAdd = event.y;
        yPosRect = event.y + 10;
    }

    addPosition(yPosRect, parcoords.currentPosOfDims, d.name, 'top');

    if (yPosTop == 70 && yPosBottom == 320) {
        d3.select('#rect_' + cleanDimensionName)
            .style('cursor', 'default');
    }
    else {
        d3.select('#rect_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 20)}') 8 8, auto`)
    }

    d3.select('#triangle_down_' + cleanDimensionName).attr('y', yPosTop);

    const heightTopRect = yPosRect - 80;
    const heightBottomRect = 320 - yPosBottom;

    d3.select('#rect_' + cleanDimensionName)
        .attr('y', yPosRect)
        .attr('height', 240 - heightTopRect - heightBottomRect);

    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, parcoords, window, true);
    }

    updateLines(parcoords, d.name, cleanDimensionName);
}

export function brushUp(cleanDimensionName: any, event: any, d: any,
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {},
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    },
    active: any, tooltipValues: any, window: any): void {

    const yPosTop = Number(d3.select('#triangle_down_' + cleanDimensionName).attr('y'));

    let yPosBottom: number;

    if (event.y < yPosTop + 10) {
        yPosBottom = yPosTop + 10;
    }
    else if (event.y > 320) {
        yPosBottom = 320;
    }
    else if (event.y == yPosTop + 10) {
        yPosBottom = yPosTop;
    }
    else {
        yPosBottom = event.y;
    }

    addPosition(yPosBottom, parcoords.currentPosOfDims, d.name, 'bottom');

    if (yPosTop == 70 && yPosBottom == 320) {
        d3.select('#rect_' + cleanDimensionName)
            .style('cursor', 'default');
    }
    else {
        d3.select('#rect_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 20)}') 8 8, auto`)
    }

    d3.select('#triangle_up_' + cleanDimensionName).attr('y', yPosBottom);

    const heightTopRect = yPosTop - 70;
    const heightBottomRect = 320 - yPosBottom;

    d3.select('#rect_' + cleanDimensionName)
        .attr('height', 240 - heightTopRect - heightBottomRect);

    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, parcoords, window, false);
    }

    updateLines(parcoords, d.name, cleanDimensionName);
}

export function dragAndBrush(cleanDimensionName: any, d: any, svg: any, event: any,
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    },
    active: any, delta: any, tooltipValuesTop: any, tooltipValuesDown: any, window: any): void {

    let yPosTop: number;
    let yPosRect: number;
    let topToAdd: number;

    const yPosBottom = d3.select('#triangle_up_' + cleanDimensionName).attr('y');
    const yPosTopNew = d3.select('#triangle_down_' + cleanDimensionName).attr('y');

    const heightTopRect = yPosTopNew - 70;
    const heightBottomRect = 320 - yPosBottom;

    const rectHeight = 240 - heightTopRect - heightBottomRect;

    if (event.y + delta - 10 <= 70) {
        yPosTop = 70;
        topToAdd = 80;
        yPosRect = 80;
    }
    else if (event.y + delta + rectHeight >= 320) {
        yPosTop = 320 - rectHeight - 10;
        topToAdd = 320 - rectHeight - 10;
        yPosRect = 320 - rectHeight;
    }
    else {
        yPosTop = event.y + delta - 10;
        topToAdd = event.y + delta - 10;
        yPosRect = yPosTop + 10;
    }

    addPosition(yPosRect, parcoords.currentPosOfDims, d.name, 'top');
    addPosition(yPosRect + rectHeight, parcoords.currentPosOfDims, d.name, 'bottom');

    if (rectHeight < 240) {
        d3.select('#rect_' + cleanDimensionName)
            .attr('y', yPosRect);
        d3.select('#triangle_down_' + cleanDimensionName)
            .attr('y', yPosTop);
        d3.select('#triangle_up_' + cleanDimensionName)
            .attr('y', yPosRect + rectHeight);

        if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
            setToolTipDragAndBrush(tooltipValuesTop, tooltipValuesDown, d, parcoords, window, true, yPosTop, yPosRect + rectHeight);
        }
        updateLines(parcoords, d.name, cleanDimensionName);
    }
}

export function filter(dimensionName: any, min: any, max: any, parcoords: any): void {

    const cleanDimensionName = helper.cleanString(dimensionName);
    const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
    const yScale = parcoords.yScales[dimensionName];

    let topPosition = yScale(min);
    let bottomPosition = yScale(max);

    if (invertStatus) {
        [topPosition, bottomPosition] = [bottomPosition, topPosition];
    }
    const rectY = Math.min(topPosition, bottomPosition);
    const rectHeight = Math.abs(bottomPosition - topPosition);

    addPosition(topPosition, parcoords.currentPosOfDims, dimensionName, 'top');
    addPosition(bottomPosition, parcoords.currentPosOfDims, dimensionName, 'bottom');

    d3.select('#rect_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY)
        .attr('height', rectHeight)
        .style('opacity', 0.3);

    d3.select('#triangle_down_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY - 10);

    d3.select('#triangle_up_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY + rectHeight);

    let active = d3.select('g.active').selectAll('path');

    const rectTop = Math.min(topPosition, bottomPosition);
    const rectBottom = Math.max(topPosition, bottomPosition);

    if (isDimensionCategorical(dimensionName)) {
        const selectedCategories = yScale.domain().filter(cat => {
            const pos = yScale(cat)!;
            return pos >= rectTop && pos <= rectBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimensionName, "currentFilterCategories");
    }
    else {
        addRange(yScale.invert(rectBottom), parcoords.currentPosOfDims, dimensionName, "currentFilterBottom");
        addRange(yScale.invert(rectTop), parcoords.currentPosOfDims, dimensionName, "currentFilterTop");
    }

    active.each(function (d) {
        const value = yScale(d[dimensionName]);

        const currentLine = getLineName(d);
        const dimNameToCheck = d3.select('.' + currentLine).text();

        const emptyString = '';
        if (value < rectTop || value > rectBottom) {
            if (dimNameToCheck === emptyString) {
                makeInactive(currentLine, dimensionName, 1000);
            }
        }
        else if (dimNameToCheck === dimensionName && dimNameToCheck !== emptyString) {
            let checkedLines: string[] = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                if (item.top != yScale.range()[1] || item.bottom != yScale.range()[0]) {
                    checkAllPositionsTop(item, dimensionName, parcoords, d, checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimensionName, parcoords, d, checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, 1000);
            }
        }
    });
}

export function filterWithCoords(topPosition, bottomPosition, currentPosOfDims, dimension) {
    addPosition(topPosition, currentPosOfDims, dimension, 'top');
    addPosition(bottomPosition, currentPosOfDims, dimension, 'bottom');

    const cleanDimensionName = helper.cleanString(dimension);

    let rectHeight = bottomPosition - topPosition;

    d3.select('#rect_' + cleanDimensionName)
        .attr('y', topPosition);
    d3.select('#triangle_down_' + cleanDimensionName)
        .attr('y', topPosition - 10);
    d3.select('#triangle_up_' + cleanDimensionName)
        .attr('y', bottomPosition);
    d3.select('#rect_' + cleanDimensionName)
        .attr('height', rectHeight);


    const invertStatus = getInvertStatus(dimension, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? parcoords.yScales[dimension].domain()[1] :
        parcoords.yScales[dimension].domain()[0];

    const minValue = invertStatus == false ? parcoords.yScales[dimension].domain()[0] :
        parcoords.yScales[dimension].domain()[1];

    const range = maxValue - minValue;

    let active = d3.select('g.active').selectAll('path');
    const emptyString = '';
    active.each(function (d) {
        const currentLine = getLineName(d);
        const dimNameToCheck = d3.select('.' + currentLine).text();

        let value: any;
        if (invertStatus) {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                240 / range * (d[dimension] - minValue) + 80;
        }
        else {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                240 / range * (maxValue - d[dimension]) + 80;
        }

        if (value < topPosition || value > bottomPosition) {
            makeInactive(currentLine, dimension, 1000);
        }
        else if (dimNameToCheck == dimension && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                checkAllPositionsTop(item, dimension, parcoords, d, checkedLines, currentLine);
                checkAllPositionsBottom(item, dimension, parcoords, d, checkedLines, currentLine);

            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, 1000);
            }
        }
    });
}


function getLineName(d: any): string {
    const keys = Object.keys(d);
    const key = keys[0];
    return helper.cleanString(d[key]);
}

export function addPosition(yPosTop: any, currentPosOfDims: any, dimensionName: any, key: any): void {
    let newObject = {};
    newObject[key] = yPosTop;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}

function setToolTipBrush(tooltipValues: any, d: any, event: any, parcoords: any,
    window: any, direction: any): void {

    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];

    const scale = maxValue - minValue;

    let tooltipValue: any;
    if (invertStatus) {
        tooltipValue = direction == true ? ((event.y - 70) / (240 / (scale)) + minValue) :
            ((event.y - 80) / (240 / (scale)) + minValue);
    }
    else {
        tooltipValue = direction == true ? maxValue - ((event.y - 70) / (240 / (scale))) :
            maxValue - ((event.y - 80) / (240 / (scale)));
    }

    if (!invertStatus) {
        if (tooltipValue > range[1]) {
            tooltipValue = range[1];
        }
        if (tooltipValue < range[0]) {
            tooltipValue = range[0];
        }
    }
    else {
        if (tooltipValue > range[0]) {
            tooltipValue = range[0];
        }
        if (tooltipValue < range[1]) {
            tooltipValue = range[1];
        }
    }

    const digs = getSigDig(d.name, parcoords.currentPosOfDims);
    tooltipValues.text(Math.round(tooltipValue.toPrecision(digs).toLocaleString('en-GB') * 10) / 10);
    tooltipValues.style('visibility', 'visible');
    tooltipValues.style('top', window.event.pageY + 'px').style('left', window.event.pageX + 'px');
    tooltipValues.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
        .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
}

function setToolTipDragAndBrush(tooltipValuesTop: any, tooltipValuesDown: any,
    d: any, parcoords: any, window: any, direction: any, yPosTop,
    yPosBottom): void {

    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];

    const scale = maxValue - minValue;

    let tooltipValueTop: any;
    let tooltipValueBottom: any;
    if (invertStatus) {
        tooltipValueTop = direction == true ? ((yPosTop - 70) / (240 / (scale)) + minValue) :
            ((yPosTop - 80) / (240 / (scale)) + minValue);
        tooltipValueBottom = direction == true ? ((yPosBottom - 80) / (240 / (scale)) + minValue) :
            ((yPosBottom - 70) / (240 / (scale)) + minValue);
    }
    else {
        tooltipValueTop = direction == true ? maxValue - ((yPosTop - 70) / (240 / (scale))) :
            maxValue - ((yPosTop - 80) / (240 / (scale)));
        tooltipValueBottom = direction == true ? maxValue - ((yPosBottom - 80) / (240 / (scale))) :
            maxValue - ((yPosBottom - 70) / (240 / (scale)));
    }

    if ((!invertStatus && tooltipValueTop == maxValue) || (invertStatus && tooltipValueTop == minValue)) {
        tooltipValuesTop.style('visibility', 'hidden');
    }
    else {
        tooltipValuesTop.text(Math.round(tooltipValueTop));
        tooltipValuesTop.style('visibility', 'visible');
        tooltipValuesTop.style('top', Number(yPosTop + 180) + 'px').style('left', window.event.pageX + 'px');
        tooltipValuesTop.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
            .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
    }

    if ((!invertStatus && tooltipValueBottom == minValue) || (invertStatus && tooltipValueBottom == maxValue)) {
        tooltipValuesDown.style('visibility', 'hidden');
    }
    else {
        tooltipValuesDown.text(Math.round(tooltipValueBottom));
        tooltipValuesDown.style('visibility', 'visible');
        tooltipValuesDown.style('top', Number(yPosBottom + 180) + 'px').style('left', window.event.pageX + 'px');
        tooltipValuesDown.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
            .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
    }
}

function updateLines(parcoords: {
    xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
}, dimensionName: any, cleanDimensionName: any): void {

    const rangeTop = Number(d3.select('#triangle_down_' + cleanDimensionName).attr('y'));
    const rangeBottom = Number(d3.select('#triangle_up_' + cleanDimensionName).attr('y'));

    const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[1] :
        parcoords.yScales[dimensionName].domain()[0];

    const minValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[0] :
        parcoords.yScales[dimensionName].domain()[1];

    const range = maxValue - minValue;

    if (isDimensionCategorical(dimensionName)) {
        const selectedCategories = parcoords.yScales[dimensionName].domain().filter(cat => {
            const pos = parcoords.yScales[dimensionName](cat)!;
            return pos >= rangeTop && pos <= rangeBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimensionName, "currentFilterCategories");
    }
    else {
        addRange(parcoords.yScales[dimensionName].invert(rangeBottom), parcoords.currentPosOfDims, dimensionName, "currentFilterBottom");
        addRange(parcoords.yScales[dimensionName].invert(rangeTop), parcoords.currentPosOfDims, dimensionName, "currentFilterTop");
    }

    let active = d3.select('g.active').selectAll('path');

    active.each(function (d) {
        let value: any;
        if (invertStatus) {
            value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                240 / range * (d[dimensionName] - minValue) + 80;
        }
        else {
            value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                240 / range * (maxValue - d[dimensionName]) + 80;
        }

        const currentLine = getLineName(d);
        const dimNameToCheck = d3.select('.' + currentLine).text();

        const emptyString = '';

        if (value < rangeTop + 10 || value > rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName, 100);
            }
        }
        else if (value == 320 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName, 100);
            }
        }
        else if (value == 80 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName, 100);
            }
        }
        else if (dimNameToCheck == dimensionName && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                if (item.top != 80 || item.bottom != 320) {
                    checkAllPositionsTop(item, dimensionName, parcoords, d,
                        checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimensionName, parcoords, d,
                        checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, 300);
            }
        }
        else {
            // do nothing
        }
    });
}

function addRange(value: any, dims: any[], dimensionName: string, property: string): void {
    const dimSettings = dims.find(d => d.key === dimensionName);
    if (!dimSettings) return;

    const yScale = parcoords.yScales[dimensionName];
    const domain = yScale.domain();

    if (typeof domain[0] === "number") {
        dimSettings.type = "numeric";
        if (property === "currentFilterTop" || property === "currentFilterBottom") {
            dimSettings[property] = value;
        }
    } 
    else {
        dimSettings.type = "categorical";
        if (property === "currentFilterCategories") {
            dimSettings.currentFilterCategories = value;
        }
    }
}


function checkAllPositionsTop(positionItem: any, dimensionName: any, parcoords: {
    xScales: any;
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any;
    features: any[]; newDataset: any[];
}, d: any, checkedLines: any[],
    currentLine: any): void {

    if (positionItem.key != dimensionName && positionItem.top != 70) {

        const invertStatus = getInvertStatus(positionItem.key, parcoords.currentPosOfDims);
        const maxValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[1] :
            parcoords.yScales[positionItem.key].domain()[0];

        const minValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[0] :
            parcoords.yScales[positionItem.key].domain()[1];

        const scale = maxValue - minValue;

        let value: any;
        if (!isNaN(maxValue)) {
            value = invertStatus == false ? 240 / scale * (maxValue - d[positionItem.key]) + 80 :
                240 / scale * (d[positionItem.key] - minValue) + 80;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key])
        }

        if (value < positionItem.top) {
            checkedLines.push(currentLine);
            d3.select('.' + currentLine).text(positionItem.key);
        }
        else {
            //makeActive(currentLine);
        }
    }
}

function checkAllPositionsBottom(positionItem: any, dimensionName: any, parcoords: {
    xScales: any;
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any;
    features: any[]; newDataset: any[];
}, d: any, checkedLines: any[],
    currentLine: any): void {

    if (positionItem.key != dimensionName && positionItem.bottom != 320) {

        const invertStatus = getInvertStatus(positionItem.key, parcoords.currentPosOfDims);
        const maxValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[1] :
            parcoords.yScales[positionItem.key].domain()[0];

        const minValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[0] :
            parcoords.yScales[positionItem.key].domain()[1];

        const scale = maxValue - minValue;

        let value: any;
        if (!isNaN(maxValue)) {
            value = invertStatus == false ? 240 / scale * (maxValue - d[positionItem.key]) + 80 :
                240 / scale * (d[positionItem.key] - minValue) + 80;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key])
        }

        if (value >= positionItem.bottom) {
            checkedLines.push(currentLine);
            d3.select('.' + currentLine).text(positionItem.key);
        }
        else {
            //makeActive(currentLine);
        }
    }
}

function makeActive(currentLineName: string, duration: number): void {
    if (d3.select('.' + currentLineName).classed('selected')) {
        d3.select('.' + currentLineName)
            .style('pointer-events', 'stroke')
            .text('')
            .transition()
            .duration(duration)
            .style('stroke', 'rgb(255, 165, 0)')
            .style('opacity', '1');
    }
    else {
        d3.select('.' + currentLineName)
            .style('pointer-events', 'stroke')
            .text('')
            .transition()
            .duration(duration)
            .style('stroke', 'rgb(0, 129, 175)')
            .style('opacity', '0.5');
    }
}

function makeInactive(currentLineName: string, dimensionName: string, duration: number): void {
    const line = d3.select('.' + currentLineName);

    line
        .text(dimensionName)
        .transition()
        .duration(duration)
        .style('stroke', 'lightgrey')
        .style('opacity', 0.4)
        .on('end', function () {
            d3.select(this).style('pointer-events', 'none');
        });
}

export function addSettingsForBrushing(dimensionName: string, parcoords: any,
    invertStatus: boolean, filter: [number, number]): void {
    const processedName = helper.cleanString(dimensionName);
    const yScale = parcoords.yScales[processedName];

    const dimensionSettings = parcoords.currentPosOfDims.find((d) => d.key === processedName);
    let top, bottom;
    if (isDimensionCategorical(dimensionName)) {
        let categories = dimensionSettings.currentFilterCategories;
        let positions = categories.map(cat => yScale(cat));
        top = d3.min(positions);
        bottom = d3.max(positions);
    }
    else {
        top = yScale(dimensionSettings.currentFilterTop);
        bottom = yScale(dimensionSettings.currentFilterBottom);
    }
    
    if (invertStatus) {
        [top, bottom] = [bottom, top];
    }

    const rectY = Math.min(top, bottom);
    const rectH = Math.abs(bottom - top);

    const rect = d3.select('#rect_' + processedName);
    const triDown = d3.select('#triangle_down_' + processedName);
    const triUp = d3.select('#triangle_up_' + processedName);

    rect.transition()
        .duration(300)
        .attr('y', rectY)
        .attr('height', rectH)
        .style('opacity', 0.3);

    triDown.transition()
        .duration(300)
        .attr('y', rectY - 10);

    triUp.transition()
        .duration(300)
        .attr('y', rectY + rectH);

    addPosition(top, parcoords.currentPosOfDims, dimensionName, 'top');
    addPosition(bottom, parcoords.currentPosOfDims, dimensionName, 'bottom');
}

function getInvertStatus(key: any, currentPosOfDims: any): boolean {
    const item = currentPosOfDims.find((object) => object.key == key);
    return item.isInverted;
}

function getSigDig(key: any, currentPosOfDims: any): number {
    const item = currentPosOfDims.find((object) => object.key == key);
    return item.sigDig;
}

export function addInvertStatus(status: any, currentPosOfDims: any, dimensionName: any, key: any): void {
    let newObject = {};
    newObject[key] = status;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}

const delay = 50;
export const throttleBrushDown = helper.throttle(brushDown, delay);
export const throttleBrushUp = helper.throttle(brushUp, delay);
export const throttleDragAndBrush = helper.throttle(dragAndBrush, delay);