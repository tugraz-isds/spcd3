import * as d3 from 'd3-selection';
import * as icon from './icons/icons';
import * as helper from './utils';

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

    addPosition(topToAdd, parcoords.currentPosOfDims, d.name, 'top');

    if (yPosTop == 70 && yPosBottom == 320) {
        d3.select('#rect_' + cleanDimensionName)
            .style('cursor', 'default');
    }
    else {
        d3.select('#rect_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 15)}') 8 8, auto`)
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

    updateLines(parcoords, active, d.name, cleanDimensionName);
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
        d3.select('#rect_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 15)}') 8 8, auto`)
    }

    d3.select('#triangle_up_' + cleanDimensionName).attr('y', yPosBottom);

    const heightTopRect = yPosTop - 70;
    const heightBottomRect = 320 - yPosBottom;

    d3.select('#rect_' + cleanDimensionName)
        .attr('height', 240 - heightTopRect - heightBottomRect);

    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, parcoords, window, false);
    }

    updateLines(parcoords, active, d.name, cleanDimensionName);
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

    addPosition(topToAdd, parcoords.currentPosOfDims, d.name, 'top');
    addPosition(yPosRect + rectHeight, parcoords.currentPosOfDims, d.name, 'bottom');

    if (rectHeight < 240) {
        d3.select('#rect_' + cleanDimensionName)
            .attr('y', yPosRect);
        d3.select('#triangle_down_' + cleanDimensionName)
            .attr('y', yPosTop);
        d3.select('#triangle_up_' + cleanDimensionName)
            .attr('y', yPosRect + rectHeight);

        const dimensionName = d.name;
        const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
        const maxValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[1] :
            parcoords.yScales[dimensionName].domain()[0];

        const minValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[0] :
            parcoords.yScales[dimensionName].domain()[1];

        const range = maxValue - minValue;

        if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
            setToolTipDragAndBrush(tooltipValuesTop, tooltipValuesDown, d, parcoords, window, true, yPosTop, yPosRect + rectHeight);
        }

        active.each(function (d) {
            const currentLine = getLineName(d);

            let value: any;
            if (invertStatus) {
                value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                    240 / range * (d[dimensionName] - minValue) + 80;
            }
            else {
                value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                    240 / range * (maxValue - d[dimensionName]) + 80;
            }

            const dimNameToCheck = d3.select('.' + currentLine).text();

            const emptyString = '';
            if (value < yPosRect || value > yPosRect + rectHeight) {
                makeInactive(currentLine, dimensionName);
            }
            else if (dimNameToCheck == dimensionName && dimNameToCheck != emptyString) {
                let checkedLines = [];
                parcoords.currentPosOfDims.forEach(function (item) {
                    if (item.top != 80 && item.bottom != 320) {
                        checkAllPositionsTop(item, dimensionName, parcoords, d, checkedLines, currentLine);
                        checkAllPositionsBottom(item, dimensionName, parcoords, d, checkedLines, currentLine);
                    }
                });
                if (!checkedLines.includes(currentLine)) {
                    makeActive(currentLine);
                }
            }
            else {
                // do nothing
            }
        });
    }
}

export function filter(dimensionName: any, topValue: any, bottomValue: any, parcoords: any): void {

    const cleanDimensionName = helper.cleanString(dimensionName);
    const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
    const yScale = parcoords.yScales[dimensionName];
    const [minValue, maxValue] = invertStatus ? yScale.domain().slice().reverse() : yScale.domain();
    
    const scaleValue = (value: number) => {
        if (isNaN(value)) {
            return yScale(value);
        }
        const range = maxValue - minValue;
        return invertStatus ? 240 / range * (value - minValue) + 80 :
               240 / range * (maxValue - value) + 80;
    };

    let topPosition = scaleValue(topValue);
    let bottomPosition = scaleValue(bottomValue);
    let rectHeight = bottomPosition - topPosition;

    addPosition(topPosition, parcoords.currentPosOfDims, dimensionName, 'top');
    addPosition(bottomPosition, parcoords.currentPosOfDims, dimensionName, 'bottom');

    d3.select('#rect_' + cleanDimensionName)
        .transition()
        .duration(500)
        .attr('y', topPosition)
        .attr('height', rectHeight)
        .style('opacity', 0.3);

    d3.select('#triangle_down_' + cleanDimensionName)
        .transition()
        .duration(600)
        .attr('y', topPosition - 10);

    d3.select('#triangle_up_' + cleanDimensionName)
        .transition()
        .duration(600)
        .attr('y', bottomPosition);

    let active = d3.select('g.active').selectAll('path');

    const rangeTop = topPosition - 10;
    const rangeBottom = bottomPosition;
    const range = maxValue - minValue;

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
                makeInactive(currentLine, dimensionName);
            }
        }
        else if (value == 320 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName);
            }
        }
        else if (value == 80 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName);
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
                makeActive(currentLine);
            }
        }
        else {
            // do nothing
        }
    })
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
            makeInactive(currentLine, dimension);
        }
        else if (dimNameToCheck == dimension && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                checkAllPositionsTop(item, dimension, parcoords, d, checkedLines, currentLine);
                checkAllPositionsBottom(item, dimension, parcoords, d, checkedLines, currentLine);

            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine);
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
    tooltipValues.style('top', window.event.clientY + 'px').style('left', window.event.clientX + 'px');
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
        tooltipValuesTop.style('top', Number(yPosTop+180) + 'px').style('left', window.event.clientX + 'px');
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
        tooltipValuesDown.style('top', Number(yPosBottom+180) + 'px').style('left', window.event.clientX + 'px');
        tooltipValuesDown.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
            .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
    }
}

function updateLines(parcoords: {
    xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
},
    active: any, dimensionName: any, cleanDimensionName: any): void {

    const rangeTop = Number(d3.select('#triangle_down_' + cleanDimensionName).attr('y'));
    const rangeBottom = Number(d3.select('#triangle_up_' + cleanDimensionName).attr('y'));

    const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[1] :
        parcoords.yScales[dimensionName].domain()[0];

    const minValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[0] :
        parcoords.yScales[dimensionName].domain()[1];

    const range = maxValue - minValue;

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
                makeInactive(currentLine, dimensionName);
            }
        }
        else if (value == 320 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName);
            }
        }
        else if (value == 80 && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName);
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
                makeActive(currentLine);
            }
        }
        else {
            // do nothing
        }
    });
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

function makeActive(currentLineName: any): void {
    if (d3.select('.' + currentLineName).classed('selected')) {
        d3.select('.' + currentLineName)
            .transition()
            .duration(300)
            .style('pointer-events', 'stroke')
            .style('stroke', 'rgb(255, 165, 0)')
            .style('opacity', '1')
            .text('');
    }
    else {
        d3.select('.' + currentLineName)
            .transition()
            .duration(300)
            .style('pointer-events', 'stroke')
            .style('stroke', 'rgb(0, 129, 175)')
            .style('opacity', '0.5')
            .text('');
    }
}

function makeInactive(currentLineName: any, dimensionName: any): void {
    d3.select('.' + currentLineName)
        .transition()
        .duration(300)
        .style('pointer-events', 'none')
        .style('stroke', 'lightgrey')
        .style('opacity', '0.4')
        .text(dimensionName);
}

export function addSettingsForBrushing(dimensionName: any, parcoords: any): void {
    const processedDimensionName = helper.cleanString(dimensionName);
    const rectHeight = Number(d3.select('#rect_' + processedDimensionName).node().getBoundingClientRect().height);
    const yPosRectTop = Number(d3.select('#rect_' + processedDimensionName).attr('y'));
    const yPosRectBottom = yPosRectTop + rectHeight;

    if (yPosRectTop > 80 && yPosRectBottom < 320) {
        const distanceBottom = 320 - d3.select('#triangle_up_' + processedDimensionName).attr('y');
        d3.select('#rect_' + processedDimensionName).attr('y', 80 + distanceBottom);
        d3.select('#triangle_down_' + processedDimensionName).attr('y', 80 + distanceBottom);
        d3.select('#triangle_up_' + processedDimensionName).attr('y', 80 + distanceBottom + rectHeight);
        addPosition(80 + distanceBottom, parcoords.currentPosOfDims, dimensionName, 'top');
        addPosition(80 + distanceBottom + rectHeight, parcoords.currentPosOfDims, dimensionName, 'bottom');
    }
    else if (yPosRectTop > 80 && yPosRectBottom >= 320) {
        d3.select('#rect_' + processedDimensionName).attr('y', 80);
        d3.select('#rect_' + processedDimensionName).attr('height', 240 - (yPosRectTop - 80));
        d3.select('#triangle_down_' + processedDimensionName).attr('y', 80);
        d3.select('#triangle_up_' + processedDimensionName).attr('y', 320 - (yPosRectTop - 80));
        addPosition(80, parcoords.currentPosOfDims, dimensionName, 'top');
        addPosition(320 - (yPosRectTop - 80), parcoords.currentPosOfDims, dimensionName, 'bottom');
    }
    else if (yPosRectTop <= 80 && yPosRectBottom < 320) {
        d3.select('#rect_' + processedDimensionName).attr('y', 320 - rectHeight);
        d3.select('#rect_' + processedDimensionName).attr('height', 240 - (320 - yPosRectBottom));
        d3.select('#triangle_down_' + processedDimensionName).attr('y', 80 + (320 - yPosRectBottom) - 10);
        d3.select('#triangle_up_' + processedDimensionName).attr('y', 320);
        addPosition(80 + (320 - yPosRectBottom) - 10, parcoords.currentPosOfDims, dimensionName, 'top');
        addPosition(320, parcoords.currentPosOfDims, dimensionName, 'bottom');
    }
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

