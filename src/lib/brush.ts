import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import * as icon from './icons/icons';
import * as helper from './utils';
import { isDimensionCategorical } from './helperApiFunc';
import * as api from './helperApiFunc';
import { parcoords } from './globals';


// globals
const TOP_AXIS_LOW_VALUE = 40;
const TOP_AXIS_VALUE = 50;
const BOTTOM_AXIS_VALUE = 350;
const RECT_VALUE = 300;

let tooltipValues = select('#parallelcoords')
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden');

let tooltipValuesTop = select('#parallelcoords')
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden');

let tooltipValuesDown = select('#parallelcoords')
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden');

// Brushing

export function setRectToDrag(featureAxis): void {

    let delta: any;
    featureAxis.each(function (d: { name: string; }) {
        const processedDimensionName = helper.cleanString(d.name);
        select(this)
            .append('g')
            .attr('class', 'rect')
            .append('rect')
            .attr('id', 'rect_' + processedDimensionName)
            .attr('width', 12)
            .attr('height', RECT_VALUE)
            .attr('x', -6)
            .attr('y', 50)
            .attr('fill', 'rgb(242, 242, 76)')
            .attr('opacity', '0.5')
            .style('cursor', 'default')
            .call(drag()
                .on('drag', (event: any, d: any) => {
                    if (parcoords.newFeatures.length > 25) {
                        throttleDragAndBrush(processedDimensionName, d, event, delta,
                        tooltipValuesTop, tooltipValuesDown, window);
                    }
                    else {
                        dragAndBrush(processedDimensionName, d, event, delta,
                        tooltipValuesTop, tooltipValuesDown, window);
                    }
                })
                .on('start', (event: { y: number; }, d: any) => {
                    let current = select("#rect_" + processedDimensionName);
                    delta = current.attr("y") - event.y;
                })
                .on('end', () => {
                    tooltipValuesTop.style('visibility', 'hidden');
                    tooltipValuesDown.style('visibility', 'hidden');
                }));
    });
}

export function setBrushUp(featureAxis, brushOverlay): void {

    featureAxis.each(function (d: { name: string }) {
        const processedDimensionName = helper.cleanString(d.name);
        const g = select(this).append('g').attr('class', 'brush_' + processedDimensionName);

        g.append('use')
            .attr('id', 'triangle_up_' + processedDimensionName)
            .attr('x', -7)
            .attr('y', BOTTOM_AXIS_VALUE)
            .attr('width', 14)
            .attr('height', 10)
            .attr('href', '#brush_image_top')
            .attr('pointer-events', 'none')
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopCursor()), 13)}') 8 8, auto`);

        const hit = g.append('rect')
            .attr('class', 'handle-hitbox')
            .attr('id', 'triangle_up_hit' + processedDimensionName)
            .attr('x', -15)
            .attr('y', BOTTOM_AXIS_VALUE)
            .attr('width', 30)
            .attr('height', 30)
            .style('fill', 'transparent')
            .style('pointer-events', 'all')
            .style('touch-action', 'none')
            .style('-webkit-user-select', 'none')
            .style('user-select', 'none')
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopCursor()), 13)}') 8 8, auto`);

        const makeDrag = () => drag()
            .container(function () { return (this as any).ownerSVGElement || this; })
            .on('start', () => {
                brushOverlay.raise().style('pointer-events', 'all');
                g.select('#triangle_up_' + processedDimensionName).raise();
                g.selectAll('.handle-hitbox').raise();
            })
            .on('drag', (event: any, dd: any) => {
                if (parcoords.newFeatures.length > 25) {
                    throttleBrushUp(processedDimensionName, event, dd, tooltipValues, window);
                } else {
                    brushUp(processedDimensionName, event, dd, tooltipValues, window);
                }

                const yNow = g.select('#triangle_up_' + processedDimensionName).attr('y');
                if (yNow != null) {
                    hit.attr('y', +yNow);
                }
                g.selectAll('.handle-hitbox').raise();
            })
            .on('end', () => {
                cleanup(brushOverlay, tooltipValues);
                requestAnimationFrame(() => {
                const newHit = g.select<SVGRectElement>('.handle-hitbox');
                if (!newHit.empty()) {
                    newHit.call(makeDrag());
                }
                });
            });
        hit.call(makeDrag());
    });
}

export function setBrushDown(featureAxis, brushOverlay): void {

    featureAxis.each(function (d: { name: string }) {
        const processedDimensionName = helper.cleanString(d.name);
        const g = select(this).append('g').attr('class', 'brush_' + processedDimensionName);

        g.append('use')
            .attr('id', 'triangle_down_' + processedDimensionName)
            .attr('x', -7)
            .attr('y', TOP_AXIS_LOW_VALUE)
            .attr('width', 14)
            .attr('height', 10)
            .attr('href', '#brush_image_bottom')
            .attr('pointer-events', 'none')
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowBottomCursor()), 13)}') 8 8, auto`);

        const hit = g.append('rect')
            .attr('class', 'handle-hitbox')
            .attr('id', 'triangle_down_hit' + processedDimensionName)
            .attr('x', -15)
            .attr('y', TOP_AXIS_LOW_VALUE)
            .attr('width', 30)
            .attr('height', 30)
            .style('fill', 'transparent')
            .style('pointer-events', 'all')
            .style('touch-action', 'none')
            .style('-webkit-user-select', 'none')
            .style('user-select', 'none')
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowBottomCursor()), 13)}') 8 8, auto`);

        const makeDrag = () => drag()
            .container(function () { return (this as any).ownerSVGElement || this; })
            .on('start', () => {
                brushOverlay.raise().style('pointer-events', 'all');
                g.select('#triangle_down_' + processedDimensionName).raise();
                g.selectAll('.handle-hitbox').raise();
            })
            .on('drag', (event: any, dd: any) => {
                if (parcoords.newFeatures.length > 25) {
                    throttleBrushDown(processedDimensionName, event, dd, tooltipValues, window);
                } else {
                    brushDown(processedDimensionName, event, dd, tooltipValues, window);
                }

                const yNow = g.select('#triangle_down_' + processedDimensionName).attr('y');
                if (yNow != null) {
                    hit.attr('y', +yNow);
                }
                g.selectAll('.handle-hitbox').raise();
            })
            .on('end', () => {
                cleanup(brushOverlay, tooltipValues);
                requestAnimationFrame(() => {
                    const newHit = g.select<SVGRectElement>('.handle-hitbox');
                    if (!newHit.empty()) {
                        newHit.call(makeDrag());
                    }
                });
            });    
        hit.call(makeDrag());
    });
}

function cleanup(brushOverlay, tooltipValues) {
    brushOverlay.style('pointer-events', 'none').lower();
    tooltipValues.style('visibility', 'hidden');
}

export function brushDown(cleanDimensionName: string, event: any, d: any,
    tooltipValues: any, window: any): void {

    const yPosBottom = Number(select('#triangle_up_' + cleanDimensionName).attr('y'));

    let yPosTop: number;
    let yPosRect: number;
    let topToAdd: number;

    if (event.y < TOP_AXIS_LOW_VALUE) {
        yPosTop = TOP_AXIS_LOW_VALUE;
        yPosRect = TOP_AXIS_VALUE;
        topToAdd = TOP_AXIS_VALUE;
    }
    else if (event.y > yPosBottom - 10) {
        yPosTop = yPosBottom - 10;
        topToAdd = yPosBottom - 10;
        yPosRect = BOTTOM_AXIS_VALUE;
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

    addPosition(yPosRect, d.name, 'top');

    if (yPosTop == TOP_AXIS_LOW_VALUE && yPosBottom == BOTTOM_AXIS_VALUE) {
        select('#rect_' + cleanDimensionName)
            .style('cursor', 'default');
    }
    else {
        select('#rect_' + cleanDimensionName)
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 20)}') 8 8, auto`);
    }

    if (yPosTop == TOP_AXIS_LOW_VALUE) {
         select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom');
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(242, 242, 76)')
            .attr('opacity', '0.5');
    }
    else {
        select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom_active');
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(255, 255, 0)')
            .attr('opacity', '0.7');
    }

    select('#triangle_down_' + cleanDimensionName).attr('y', yPosTop);
    select('#triangle_down_hit' + cleanDimensionName).attr('y', yPosTop);

    const heightTopRect = yPosRect - TOP_AXIS_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;

    select('#rect_' + cleanDimensionName)
        .attr('y', yPosRect)
        .attr('height', RECT_VALUE - heightTopRect - heightBottomRect);

    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, window, true);
    }

    updateLines(d.name, cleanDimensionName);
}

export function brushUp(cleanDimensionName: any, event: any, d: any,
    tooltipValues: any, window: any): void {

    const yPosTop = Number(select('#triangle_down_' + cleanDimensionName).attr('y'));

    let yPosBottom: number;

    if (event.y < yPosTop + 10) {
        yPosBottom = yPosTop + 10;
    }
    else if (event.y > BOTTOM_AXIS_VALUE) {
        yPosBottom = BOTTOM_AXIS_VALUE;
    }
    else if (event.y == yPosTop + 10) {
        yPosBottom = yPosTop;
    }
    else {
        yPosBottom = event.y;
    }

    addPosition(yPosBottom, d.name, 'bottom');

    if (yPosTop == TOP_AXIS_LOW_VALUE && yPosBottom == BOTTOM_AXIS_VALUE) {
        select('#rect_' + cleanDimensionName)
            .attr('href', '#brush_image_top_active')
            .style('cursor', 'default');
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(234, 234, 40)')
            .attr('opacity', '0.5');
    }
    else {
        select('#rect_' + cleanDimensionName)
            .attr('href', '#brush_image_top_active')
            .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 20)}') 8 8, auto`);
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(255, 255, 0)')
            .attr('opacity', '0.7');
    }

    if (yPosBottom == BOTTOM_AXIS_VALUE) {
         select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top');
    }
    else {
        select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top_active');
    }

    select('#triangle_up_' + cleanDimensionName).attr('y', yPosBottom);
    select('#triangle_up_hit' + cleanDimensionName).attr('y', yPosBottom);

    const heightTopRect = yPosTop - TOP_AXIS_LOW_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;

    select('#rect_' + cleanDimensionName)
        .attr('height', RECT_VALUE - heightTopRect - heightBottomRect);

    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, window, false);
    }

    updateLines(d.name, cleanDimensionName);
}

export function dragAndBrush(cleanDimensionName: any, d: any, event: any,
    delta: any, tooltipValuesTop: any, tooltipValuesDown: any, window: any): 
    void {

    let yPosTop: number;
    let yPosRect: number;
    let topToAdd: number;

    const yPosBottom = select('#triangle_up_' + cleanDimensionName).attr('y');
    const yPosTopNew = select('#triangle_down_' + cleanDimensionName).attr('y');

    const heightTopRect = yPosTopNew - TOP_AXIS_LOW_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;

    const rectHeight = RECT_VALUE - heightTopRect - heightBottomRect;

    if (event.y + delta - 10 <= TOP_AXIS_LOW_VALUE) {
        yPosTop = TOP_AXIS_LOW_VALUE;
        topToAdd = TOP_AXIS_VALUE;
        yPosRect = TOP_AXIS_VALUE;
    }
    else if (event.y + delta + rectHeight >= BOTTOM_AXIS_VALUE) {
        yPosTop = BOTTOM_AXIS_VALUE - rectHeight - 10;
        topToAdd = BOTTOM_AXIS_VALUE - rectHeight - 10;
        yPosRect = BOTTOM_AXIS_VALUE - rectHeight;
    }
    else {
        yPosTop = event.y + delta - 10;
        topToAdd = event.y + delta - 10;
        yPosRect = yPosTop + 10;
    }

    addPosition(yPosRect, d.name, 'top');
    addPosition(yPosRect + rectHeight, d.name, 'bottom');

    if (yPosTop == TOP_AXIS_LOW_VALUE) {
        select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom');
    }
    else {
        select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom_active');
    }

    if (yPosBottom == BOTTOM_AXIS_VALUE) {
        select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top');
    }
    else {
        select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top_active');
    }

    if (rectHeight < RECT_VALUE) {
        select('#rect_' + cleanDimensionName)
            .attr('y', yPosRect);
        select('#triangle_down_' + cleanDimensionName)
            .attr('y', yPosTop);
        select('#triangle_up_' + cleanDimensionName)
            .attr('y', yPosRect + rectHeight);
        select('#triangle_up_hit' + cleanDimensionName)
            .attr('y', yPosRect + rectHeight);
        select('#triangle_down_hit' + cleanDimensionName)
            .attr('y', yPosTop);

        if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
            setToolTipDragAndBrush(tooltipValuesTop, tooltipValuesDown, d, window, true, yPosTop, yPosRect + rectHeight);
        }
        updateLines(d.name, cleanDimensionName);
    }
}

export function filter(dimensionName: string, min: number, max: number): void {

    const cleanDimensionName = helper.cleanString(dimensionName);
    const invertStatus = getInvertStatus(dimensionName);
    const yScale = parcoords.yScales[dimensionName];

    let topPosition = yScale(min);
    let bottomPosition = yScale(max);

    if (invertStatus) {
        [topPosition, bottomPosition] = [bottomPosition, topPosition];
    }
    const rectY = Math.min(topPosition, bottomPosition);
    const rectHeight = Math.abs(bottomPosition - topPosition);

    addPosition(topPosition, dimensionName, 'top');
    addPosition(bottomPosition, dimensionName, 'bottom');

    select('#rect_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY)
        .attr('height', rectHeight);

    select('#triangle_down_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY - 10);

    select('#triangle_down_hit' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY - 10);

    select('#triangle_up_' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY + rectHeight);

    select('#triangle_up_hit' + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr('y', rectY + rectHeight);

    if (topPosition == TOP_AXIS_VALUE) {
        select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom');
    }
    else {
        select('#triangle_down_' + cleanDimensionName)
            .attr('href', '#brush_image_bottom_active');
    }

    if (bottomPosition == BOTTOM_AXIS_VALUE) {
        select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top'); 
    }
    else {
        select('#triangle_up_' + cleanDimensionName)
            .attr('href', '#brush_image_top_active');  
    }

    if (topPosition != TOP_AXIS_VALUE || bottomPosition != BOTTOM_AXIS_VALUE) {
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(255, 255, 0)')
            .attr('opacity', '0.7');
    }
    else {
        select('#rect_' + cleanDimensionName)
            .attr('fill', 'rgb(242, 242, 76)')
            .attr('opacity', '0.5');
    }

    let active = select('g.active').selectAll('path');

    const rectTop = Math.min(topPosition, bottomPosition);
    const rectBottom = Math.max(topPosition, bottomPosition);

    if (isDimensionCategorical(dimensionName)) {
        const selectedCategories = yScale.domain().filter((cat: any) => {
            const pos = yScale(cat)!;
            return pos >= rectTop && pos <= rectBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimensionName, "currentFilterCategories");
    }
    else {
        addRange(yScale.invert(rectBottom), parcoords.currentPosOfDims, dimensionName, "currentFilterBottom");
        addRange(yScale.invert(rectTop), parcoords.currentPosOfDims, dimensionName, "currentFilterTop");
    }

    active.each(function (d: { [x: string]: any; }) {
        const value = yScale(d[dimensionName]);

        const currentLine = getLineName(d);
        const dimNameToCheck = select('.' + currentLine).text();

        const emptyString = '';
        if (value < rectTop || value > rectBottom) {
            if (dimNameToCheck === emptyString) {
                makeInactive(currentLine, dimensionName, 1000);
            }
        }
        else if (dimNameToCheck === dimensionName && dimNameToCheck !== emptyString) {
            let checkedLines: string[] = [];
            parcoords.currentPosOfDims.forEach(function (item: { top: any; bottom: any; }) {
                if (item.top != yScale.range()[1] || item.bottom != yScale.range()[0]) {
                    checkAllPositionsTop(item, dimensionName, d, checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimensionName, d, checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, 1000);
            }
        }
    });
}

export function filterWithCoords(topPosition: number, bottomPosition: number,
    dimension: string) {
    addPosition(topPosition, dimension, 'top');
    addPosition(bottomPosition, dimension, 'bottom');

    const cleanDimensionName = helper.cleanString(dimension);

    let rectHeight = bottomPosition - topPosition;

    select('#rect_' + cleanDimensionName)
        .attr('y', topPosition);
    select('#triangle_down_' + cleanDimensionName)
        .attr('y', topPosition - 10);
    select('#triangle_up_' + cleanDimensionName)
        .attr('y', bottomPosition);
    select('#rect_' + cleanDimensionName)
        .attr('height', rectHeight);


    const invertStatus = getInvertStatus(dimension);
    const maxValue = invertStatus == false ? parcoords.yScales[dimension].domain()[1] : parcoords.yScales[dimension].domain()[0];

    const minValue = invertStatus == false ? parcoords.yScales[dimension].domain()[0] : parcoords.yScales[dimension].domain()[1];

    const range = maxValue - minValue;

    let active = select('g.active').selectAll('path');
    const emptyString = '';
    active.each(function (d: { [x: string]: number; }) {
        const currentLine = getLineName(d);
        const dimNameToCheck = select('.' + currentLine).text();

        let value: any;
        if (invertStatus) {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                RECT_VALUE / range * (d[dimension] - minValue) + TOP_AXIS_VALUE;
        }
        else {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                RECT_VALUE / range * (maxValue - d[dimension]) + TOP_AXIS_VALUE;
        }

        if (value < topPosition || value > bottomPosition) {
            makeInactive(currentLine, dimension, 1000);
        }
        else if (dimNameToCheck == dimension && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item: any) {
                checkAllPositionsTop(item, dimension, d, checkedLines, currentLine);
                checkAllPositionsBottom(item, dimension, d, checkedLines, currentLine);

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

export function addPosition(yPosTop: number, dimension: string, key: string): void {
    let newObject = {};
    newObject[key] = yPosTop;
    const target = parcoords.currentPosOfDims.find((obj: { key: any; }) => obj.key == dimension);
    Object.assign(target, newObject);
}

function setToolTipBrush(tooltipValues: any, d: any, event: any, window: any, 
    direction: any): void {

    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];

    const scale = maxValue - minValue;

    let tooltipValue: any;
    if (invertStatus) {
        tooltipValue = direction == true ? ((event.y - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale)) + minValue) :
            ((event.y - TOP_AXIS_VALUE) / (RECT_VALUE / (scale)) + minValue);
    }
    else {
        tooltipValue = direction == true ? maxValue - ((event.y - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale))) :
            maxValue - ((event.y - TOP_AXIS_VALUE) / (RECT_VALUE / (scale)));
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

    const digs = getSigDig(d.name);
    tooltipValues.text(Math.round(tooltipValue.toPrecision(digs).toLocaleString('en-GB') * 10) / 10);
    tooltipValues.style('visibility', 'visible');
    tooltipValues.style('top', window.event.pageY/16 + 'rem').style('left', window.event.pageX/16 + 'rem');
    tooltipValues.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
        .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
}

function setToolTipDragAndBrush(tooltipValuesTop: any, tooltipValuesDown: any,
    d: any, window: any, direction: any, yPosTop: number,
    yPosBottom: number): void {

    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];

    const scale = maxValue - minValue;

    let tooltipValueTop: any;
    let tooltipValueBottom: any;
    if (invertStatus) {
        tooltipValueTop = direction == true ? ((yPosTop - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale)) + minValue) :
            ((yPosTop - TOP_AXIS_VALUE) / (RECT_VALUE / (scale)) + minValue);
        tooltipValueBottom = direction == true ? ((yPosBottom - TOP_AXIS_VALUE) / (RECT_VALUE / (scale)) + minValue) :
            ((yPosBottom - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale)) + minValue);
    }
    else {
        tooltipValueTop = direction == true ? maxValue - ((yPosTop - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale))) :
            maxValue - ((yPosTop - TOP_AXIS_VALUE) / (RECT_VALUE / (scale)));
        tooltipValueBottom = direction == true ? maxValue - ((yPosBottom - TOP_AXIS_VALUE) / (RECT_VALUE / (scale))) :
            maxValue - ((yPosBottom - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / (scale)));
    }

    if ((!invertStatus && tooltipValueTop == maxValue) || (invertStatus && tooltipValueTop == minValue)) {
        tooltipValuesTop.style('visibility', 'hidden');
    }
    else {
        tooltipValuesTop.text(Math.round(tooltipValueTop));
        tooltipValuesTop.style('visibility', 'visible');
        tooltipValuesTop.style('top', Number(yPosTop + 180)/16 + 'rem').style('left', window.event.pageX/16 + 'rem');
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
        tooltipValuesDown.style('top', Number(yPosBottom + 180)/16 + 'rem').style('left', window.event.pageX/16 + 'rem');
        tooltipValuesDown.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
            .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
    }
}

function updateLines(dimension: string, cleanDimensionName: string): void {

    const rangeTop = Number(select('#triangle_down_' + cleanDimensionName).attr('y'));
    const rangeBottom = Number(select('#triangle_up_' + cleanDimensionName).attr('y'));

    const invertStatus = getInvertStatus(dimension);
    const maxValue = invertStatus == false ? parcoords.yScales[dimension].domain()[1] : parcoords.yScales[dimension].domain()[0];

    const minValue = invertStatus == false ? parcoords.yScales[dimension].domain()[0] : parcoords.yScales[dimension].domain()[1];

    const range = maxValue - minValue;

    let currentFilters = api.getFilter(dimension);

    if (isDimensionCategorical(dimension)) {
        const selectedCategories = parcoords.yScales[dimension].domain().filter((cat: any) => {
            const pos = parcoords.yScales[dimension](cat)!;
            return pos >= rangeTop && pos <= rangeBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimension, "currentFilterCategories");
    }
    else {
        addRange(currentFilters[0], parcoords.currentPosOfDims, dimension, "currentFilterBottom");
        addRange(currentFilters[1], parcoords.currentPosOfDims, dimension, "currentFilterTop");
    }

    let active = select('g.active').selectAll('path');

    active.each(function (d: { [x: string]: number; }) {
        let value: any;
        if (invertStatus) {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                RECT_VALUE / range * (d[dimension] - minValue) + TOP_AXIS_VALUE;
        }
        else {
            value = isNaN(maxValue) ? parcoords.yScales[dimension](d[dimension]) :
                RECT_VALUE / range * (maxValue - d[dimension]) + TOP_AXIS_VALUE;
        }

        const currentLine = getLineName(d);
        const dimNameToCheck = select('.' + currentLine).text();

        const emptyString = '';

        if (value < rangeTop + 10 || value > rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (value == BOTTOM_AXIS_VALUE && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (value == TOP_AXIS_VALUE && value == rangeTop + 10 && value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (dimNameToCheck == dimension && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item: { top: number; bottom: number; }) {
                if (item.top != TOP_AXIS_VALUE || item.bottom != BOTTOM_AXIS_VALUE) {
                    checkAllPositionsTop(item, dimension, d,
                        checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimension, d,
                        checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, RECT_VALUE);
            }
        }
        else {
            // do nothing
        }
    });
}

function addRange(value: number, dims: any[], dimension: string, property: string): void {
    const dimSettings = dims.find(d => d.key === dimension);
    if (!dimSettings) return;

    const yScale = parcoords.yScales[dimension];
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


function checkAllPositionsTop(positionItem: any, dimension: any, d: any, 
    checkedLines: any[], currentLine: any): void {

    if (positionItem.key != dimension && positionItem.top != TOP_AXIS_LOW_VALUE) {

        const invertStatus = getInvertStatus(positionItem.key);
        const maxValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[1] :
            parcoords.yScales[positionItem.key].domain()[0];

        const minValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[0] :
            parcoords.yScales[positionItem.key].domain()[1];

        const scale = maxValue - minValue;

        let value: any;
        if (!isNaN(maxValue)) {
            value = invertStatus == false ? RECT_VALUE / scale * (maxValue - d[positionItem.key]) + TOP_AXIS_VALUE :
                RECT_VALUE / scale * (d[positionItem.key] - minValue) + TOP_AXIS_VALUE;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key])
        }

        if (value < positionItem.top) {
            checkedLines.push(currentLine);
            select('.' + currentLine).text(positionItem.key);
        }
        else {
            //makeActive(currentLine);
        }
    }
}

function checkAllPositionsBottom(positionItem: any, dimension: string, d: any, 
    checkedLines: any[], currentLine: any): void {

    if (positionItem.key != dimension && positionItem.bottom != BOTTOM_AXIS_VALUE) {

        const invertStatus = getInvertStatus(positionItem.key);
        const maxValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[1] :
            parcoords.yScales[positionItem.key].domain()[0];

        const minValue = invertStatus == false ? parcoords.yScales[positionItem.key].domain()[0] :
            parcoords.yScales[positionItem.key].domain()[1];

        const scale = maxValue - minValue;

        let value: any;
        if (!isNaN(maxValue)) {
            value = invertStatus == false ? RECT_VALUE / scale * (maxValue - d[positionItem.key]) + TOP_AXIS_VALUE :
                RECT_VALUE / scale * (d[positionItem.key] - minValue) + TOP_AXIS_VALUE;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key])
        }

        if (value >= positionItem.bottom) {
            checkedLines.push(currentLine);
            select('.' + currentLine).text(positionItem.key);
        }
        else {
            //makeActive(currentLine);
        }
    }
}

function makeActive(currentLineName: string, duration: number): void {
    if (select('.' + currentLineName).classed('selected')) {
        select('.' + currentLineName)
            .text('')
            .transition()
            .duration(duration)
            .style('stroke', 'rgba(255, 165, 0, 1)');

        select('#area_' + currentLineName)
            .style('pointer-events', 'stroke')
            .style('stroke', 'transparent')
            .style('stroke-width', '0.4rem')
            .text('');
    }
    else if (select('.' + currentLineName).classed('colored')) {
        let color = select('.' + currentLineName).property('clusterColor');
        select('.' + currentLineName)
            .text('')
            .transition()
            .duration(duration)
            .style('stroke', color);

        select('#area_' + currentLineName)
            .style('pointer-events', 'stroke')
            .style('stroke', 'transparent')
            .style('stroke-width', '0.4rem')
            .text('');
    }
    else {
        select('.' + currentLineName)
            .text('')
            .transition()
            .duration(duration)
            .style('stroke', 'rgba(0, 129, 175, 0.5)');

        select('#area_' + currentLineName)
            .style('pointer-events', 'stroke')
            .style('stroke', 'transparent')
            .style('stroke-width', '0.4rem')
            .text('');
    }
}

function makeInactive(currentLineName: string, dimension: string, duration: number): void {
    const line = select('.' + currentLineName);
    const hitline = select('#area_' + currentLineName);

    line
        .text(dimension)
        .transition()
        .duration(duration)
        .style('stroke', 'rgba(211, 211, 211, 0.4');
    
    hitline
        .text(dimension)
        .transition()
        .duration(duration)
        .style('stroke', 'rgba(211, 211, 211, 0.4')
        .style('stroke-width', '0.12rem')
        .on('end', function () {
            select(this).style('pointer-events', 'none');
        });
}

export function addSettingsForBrushing(dimension: string,
    invertStatus: boolean): void {
    const processedName = helper.cleanString(dimension);
    const yScale = parcoords.yScales[dimension];

    const dimensionSettings = parcoords.currentPosOfDims.find((d: { key: string; }) => d.key === dimension);
    let top: number, bottom: number;
    if (isDimensionCategorical(dimension)) {
        const domain = yScale.domain();
        const sorted = domain.slice().sort((a: any, b: any) => yScale(a) - yScale(b));
        const topCategory = sorted[0];
        const bottomCategory = sorted[sorted.length - 1];
        top = yScale(topCategory);
        bottom = yScale(bottomCategory);
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

    const rect = select('#rect_' + processedName);
    const triDown = select('#triangle_down_' + processedName);
    const triUp = select('#triangle_up_' + processedName);

    rect.transition()
        .duration(RECT_VALUE)
        .attr('y', rectY)
        .attr('height', rectH);

    triDown.transition()
        .duration(RECT_VALUE)
        .attr('y', rectY - 10);

    triUp.transition()
        .duration(RECT_VALUE)
        .attr('y', rectY + rectH);

    if (rectY-10 == TOP_AXIS_LOW_VALUE) {
        select('#triangle_down_' + processedName)
            .attr('href', '#brush_image_bottom');
    }
    else {
        select('#triangle_down_' + processedName)
            .attr('href', '#brush_image_bottom_active');
    }

    if (rectY + rectH == BOTTOM_AXIS_VALUE) {
        select('#triangle_up_' + processedName)
            .attr('href', '#brush_image_top');
    }
    else {
        select('#triangle_up_' + processedName)
            .attr('href', '#brush_image_top_active');
    }

    addPosition(top, dimension, 'top');
    addPosition(bottom, dimension, 'bottom');
}

function getInvertStatus(key: any): boolean {
    const item = parcoords.currentPosOfDims.find((object: { key: any; }) => object.key == key);
    return item.isInverted;
}

function getSigDig(key: any): number {
    const item = parcoords.currentPosOfDims.find((object: { key: any; }) => object.key == key);
    return item.sigDig;
}

export function addInvertStatus(status: any, dimensionName: any, key: any): void {
    let newObject = {};
    newObject[key] = status;
    const target = parcoords.currentPosOfDims.find((obj: { key: any; }) => obj.key == dimensionName);
    Object.assign(target, newObject);
}

const delay = 50;
export const throttleBrushDown = helper.throttle(brushDown, delay);
export const throttleBrushUp = helper.throttle(brushUp, delay);
export const throttleDragAndBrush = helper.throttle(dragAndBrush, delay);