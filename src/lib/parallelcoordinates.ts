import 'd3-transition';
import * as d3 from 'd3-selection';
import * as drag from 'd3-drag';
import * as ease from 'd3-ease';
import * as brush from './brush';
import * as utils from './utils';
import * as helper from './helper';
import * as context from './contextMenu';
import * as svgcreator from './svgStringCreator';
import * as icon from './icons/icons';
import * as toolbar from './toolbar';

declare global {
    let padding: any;
    let paddingXaxis: any;
    let width: any;
    let height: any;
    let yAxis: {};
    let selected: [];
    let parcoords: {
        xScales: any,
        yScales: {},
        dragging: {},
        dragPosStart: {},
        currentPosOfDims: any,
        newFeatures: any,
        features: any[],
        newDataset: any,
        data: any
    };
    let active: any;
    let key: string;
    let svg: any;
    let hoverlabel: string;
    let refreshData: any;
    let initDimension: any;
}

declare const window: any;

//******** API ********//

//---------- Show and Hide Functions ----------

export function hide(dimension: string): void {
    const newDimensions = window.parcoords.newFeatures.filter(d => d !== dimension);
    const featureSet = window.parcoords.features.filter(d => d.name !== dimension);

    window.parcoords.features = featureSet;
    window.parcoords.newFeatures = newDimensions;

    window.parcoords.xScales.domain(newDimensions);

    d3.selectAll('.dimensions')
        .filter(d => newDimensions.includes(d.name || d))
        .transition()
        .duration(1000)
        .attr('transform', d =>
            'translate(' + helper.position(d.name || d, parcoords.dragging, parcoords.xScales) + ')'
        )
        .ease(ease.easeCubic);

    d3.selectAll('.dimensions')
        .filter(d => d.name === dimension)
        .transition()
        .duration(500)
        .style('opacity', 0)
        .on('end', function () {
            d3.select(this).attr('visibility', 'hidden');
        });

    d3.select('g.active').selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', d => helper.linePath(d, newDimensions, parcoords))
        .ease(ease.easeCubic);
}


export function show(dimension: string): void {
    if (window.parcoords.newFeatures.includes(dimension)) return;

    const existingIndex = window.initDimension.indexOf(dimension);
    if (existingIndex !== -1) {
        window.parcoords.newFeatures.splice(existingIndex, 0, dimension);
        const removedItem = { name: dimension };
        window.parcoords.features.push(removedItem);
    }

    window.parcoords.xScales.domain(window.parcoords.newFeatures);

    d3.selectAll('.dimensions')
    .filter(d => (typeof d === "object" ? d.name : d) === dimension)
        .style('opacity', 1)
        .transition()
        .duration(500)
        .attr('visibility', 'visible');;

    d3.selectAll('.dimensions')
        .filter(d => window.parcoords.newFeatures.includes(
            typeof d === "object" ? d.name : d
        ))
        .transition()
        .duration(1000)
        .attr('transform', d =>
            'translate(' + helper.position(d.name || d, parcoords.dragging, parcoords.xScales) + ')'
        )
        .ease(ease.easeCubic);

    d3.select('g.active').selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', d => helper.linePath(d, window.parcoords.newFeatures, parcoords))
        .ease(ease.easeCubic);
}

export function getHiddenStatus(dimension: string): string {
    const index = parcoords.newFeatures.indexOf(dimension);
    if (index != -1) {
        return "shown";
    }
    else {
        return "hidden";
    }
}

//---------- Invert Functions ----------

export function invert(dimension: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = d3.select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    d3.select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())))
        .ease(ease.easeCubic);

    helper.trans(window.active).each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', (d) => {
                return helper.linePath(d, parcoords.newFeatures, parcoords);
            })
            .ease(ease.easeCubic)
    });

    brush.addSettingsForBrushing(dimension, parcoords);
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}

export function invertWoTransition(dimension: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = d3.select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    d3.select(dimensionId)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())));

    helper.trans(window.active).each(function (d) {
        d3.select(this)
            .attr('d', (d) => {
                return helper.linePath(d, parcoords.newFeatures, parcoords);
            })
    });

    brush.addSettingsForBrushing(dimension, parcoords);
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}

export function getInversionStatus(dimension: string): string {
    const invertId = '#dimension_invert_' + utils.cleanString(dimension);
    const element = d3.select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == 'up' ? 'ascending' : 'descending';
}

export function setInversionStatus(dimension: string, status: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = d3.select(invertId);
    const arrow = status === 'ascending' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = status === 'ascending' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(status === 'ascending' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    d3.select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())))
        .ease(ease.easeCubic);


    helper.trans(window.active).each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', (d) => {
                return helper.linePath(d, parcoords.newFeatures, parcoords);
            })
            .ease(ease.easeCubic)
    });

    brush.addSettingsForBrushing(dimension, parcoords);
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}


//---------- Move Functions ----------

export function moveByOne(dimension: string, direction: string): void {

    let parcoords = window.parcoords;

    const indexOfDimension = parcoords.newFeatures.indexOf(dimension);

    const indexOfNeighbor = direction == 'right' ? indexOfDimension - 1
        : indexOfDimension + 1;

    const neighbour = parcoords.newFeatures[indexOfNeighbor];

    const width = window.width;
    const pos = parcoords.xScales(dimension);
    const posNeighbour = parcoords.xScales(neighbour);

    const distance = 93.5; //(width-window.paddingXaxis)/parcoords.newFeatures.length;

    parcoords.dragging[dimension] = direction == 'right' ? pos + distance :
        pos - distance;

    parcoords.dragging[neighbour] = direction == 'right' ? posNeighbour - distance :
        posNeighbour + distance;

    if (direction == 'right') {
        [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension - 1]] =
            [parcoords.newFeatures[indexOfDimension - 1], parcoords.newFeatures[indexOfDimension]];
    }
    else {
        [parcoords.newFeatures[indexOfDimension + 1], parcoords.newFeatures[indexOfDimension]] =
            [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension + 1]];
    }

    parcoords.xScales.domain(parcoords.newFeatures);

    let active = d3.select('g.active').selectAll('path');
    let featureAxis = d3.selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', function (d) {
            return helper.linePath(d, parcoords.newFeatures, parcoords);
        })
        .ease(ease.easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', function (d) {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(ease.easeCubic);

    delete parcoords.dragging[dimension];
    delete parcoords.dragging[neighbour];
}

export function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void {
    let parcoords = window.parcoords;

    const indexOfDimensionA = getDimensionPosition(dimensionA);
    const indexOfDimensionB = getDimensionPosition(dimensionB);

    if (toRightOf) {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
                }
            }
        }
    }
    else {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB + 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
            }
        }
    }
}

export function swap(dimensionA: string, dimensionB: string): void {
    let parcoords = window.parcoords;

    const positionA = parcoords.xScales(dimensionA);
    const positionB = parcoords.xScales(dimensionB);

    parcoords.dragging[dimensionA] = positionB;
    parcoords.dragging[dimensionB] = positionA;

    const indexOfDimensionA = parcoords.newFeatures.indexOf(dimensionA);
    const indexOfDimensionB = parcoords.newFeatures.indexOf(dimensionB);

    [parcoords.newFeatures[indexOfDimensionA], parcoords.newFeatures[indexOfDimensionB]] =
        [parcoords.newFeatures[indexOfDimensionB], parcoords.newFeatures[indexOfDimensionA]];

    parcoords.xScales.domain(parcoords.newFeatures);

    let active = d3.select('g.active').selectAll('path');
    let featureAxis = d3.selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', (d) => {
            return helper.linePath(d, parcoords.newFeatures, parcoords);
        })
        .ease(ease.easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', (d) => {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(ease.easeCubic);

    delete parcoords.dragging[dimensionA];
    delete parcoords.dragging[dimensionB];
}

//---------- Range Functions ----------

export function getDimensionRange(dimension: string): any {
    return parcoords.yScales[dimension].domain();
}

export function setDimensionRange(dimension: string, min: number, max: number): void {
    const inverted = helper.isInverted(dimension);
    if (inverted) {
        window.parcoords.yScales[dimension].domain([max, min]);
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]);
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
    }

    addRange(min, window.parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(max, window.parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    // draw active lines
    d3.select('#dimension_axis_' + utils.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d) => {
            return helper.linePath(d, window.parcoords.newFeatures, window.parcoords);
        })
        .ease(ease.easeCubic);

    active.each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', helper.linePath(d, window.parcoords.newFeatures, window.parcoords))
            .ease(ease.easeCubic);
    });
}

export function setDimensionRangeRounded(dimension: string, min: number, max: number): void {
    const inverted = helper.isInverted(dimension);
    if (inverted) {
        window.parcoords.yScales[dimension].domain([max, min]).nice();
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]).nice();
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
    }

    addRange(min, window.parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(max, window.parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    // draw active lines
    d3.select('#dimension_axis_' + utils.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d) => {
            return helper.linePath(d, window.parcoords.newFeatures, window.parcoords);
        })
        .ease(ease.easeCubic);

    active.each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', helper.linePath(d, window.parcoords.newFeatures, window.parcoords))
            .ease(ease.easeCubic);
    });
}

export function getMinValue(dimension: any): number {
    const item = window.parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.min;
}

export function getMaxValue(dimension: any): number {
    const item = window.parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.max;
}

export function getCurrentMinRange(dimension: any): number {
    const item = window.parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.currentRangeBottom;
}

export function getCurrentMaxRange(dimension: any): number {
    const item = window.parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.currentRangeTop;
}

function addRange(value: number, currentPosOfDims: any, dimensionName: any, key: any): void {
    let newObject = {};
    newObject[key] = Number(value);
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}


//---------- Filter Functions ----------

export function getFilter(dimension): any {
    const invertStatus = helper.isInverted(dimension);
    const dimensionRange = getDimensionRange(dimension);
    const maxValue = invertStatus == false ? dimensionRange[1] : dimensionRange[0];
    const minValue = invertStatus == false ? dimensionRange[0] : dimensionRange[1];
    const range = maxValue - minValue;

    const dimensionSettings = window.parcoords.currentPosOfDims.find((obj) => obj.key == dimension);
    const top = invertStatus == false ? maxValue - (dimensionSettings.top - 80) / (240 / range) :
        (dimensionSettings.top - 80) / (240 / range) + minValue;
    const bottom = invertStatus == false ? maxValue - (dimensionSettings.bottom - 80) / (240 / range) :
        (dimensionSettings.bottom - 80) / (240 / range) + minValue;
    return [top, bottom];
}

export function setFilter(dimension: string, min: number, max: number): void {
    brush.filter(dimension, min, max, parcoords);
}

//---------- Selection Functions ----------

export function getSelected(): any[] {
    let selected = [];

    const records = getAllRecords();
    for (let i = 0; i < records.length; i++) {
        let isselected = isSelected(records[i]);
        if (isselected) {
            selected.push(records[i]);
        }
    }
    return selected;
}

export function setSelection(records: string[]): void {
    for (let i = 0; i < records.length; i++) {
        let stroke = d3.select('#' + utils.cleanString(records[i])).style('stroke');
        if (stroke !== 'lightgrey') {
            d3.select('#' + utils.cleanString(records[i]))
                .classed('selected', true)
                .transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
    }
}

export function isSelected(record: string): boolean {
    return d3.select('#' + utils.cleanString(record)).classed('selected');
}

export function toggleSelection(record: string): void {
    const selected = isSelected(record);
    if (selected) {
        setUnselected(record);
    }
    else {
        setSelected(record);
    }
}

export function setSelected(record: string): void {
    let selectableLines = [];
    selectableLines.push(record);
    setSelection(selectableLines);
}

export function setUnselected(record: string): void {
    d3.selectAll('#' + utils.cleanString(record))
        .classed('selected', false)
        .transition()
        .style('opacity', '0.5')
        .style('stroke', 'rgb(0, 129, 175)');
}

//---------- Selection Functions With IDs ----------

export function setSelectionWithId(recordIds: []): void {
    let records: string[] = [];
    for (let i = 0; i < recordIds.length; i++) {
        let record = getRecordWithId(recordIds[i]);
        records.push(record);
    }
    setSelection(records);
}

export function isSelectedWithRecordId(recordId: number): boolean {
    let record = getRecordWithId(recordId);
    return isSelected(record);
}

export function getRecordWithId(recordId: any): string {
    const item = window.parcoords.currentPosOfDims.find((object) => object.recordId == recordId);
    return item.key;
}

export function toggleSelectionWithId(recordId: number): void {
    const record = getRecordWithId(recordId);
    toggleSelection(record);
}

export function setSelectedWithId(recordId: number): void {
    const record = getRecordWithId(recordId);
    setSelected(record);
}

export function setUnselectedWithId(recordId: number): void {
    const record = getRecordWithId(recordId);
    setUnselected(record);
}

//---------- IO Functions ----------

export function drawChart(content: any): void {
    window.refreshData = structuredClone(content);

    deleteChart();

    let newFeatures = content['columns'].reverse();

    setUpParcoordData(content, newFeatures);

    const height = 360;

    const wrapper = d3.select('#parallelcoords');

    wrapper.append('div')
        .attr('id', 'toolbarRow')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('align-items', 'center')
        .style('margin-top', '1.5rem')
        .style('margin-left', '1rem')
        .style('margin-bottom', 0);

    toolbar.createToolbar(window.parcoords.newDataset);

    window.svg = wrapper
        .append('svg')
        .attr('id', 'pc_svg')
        .attr('viewBox', [-10, 20, window.width, height])
        .attr('font-family', 'Verdana, sans-serif')
        .attr('user-select', 'none')
        .style('margin-top', 0);

    setDefsForIcons();

    window.active = setActivePathLines(svg, content, window.parcoords);

    setFeatureAxis(svg, yAxis, window.active, window.parcoords, width, window.padding);

    window.svg
        .on("contextmenu", function (event) {
            event.stopPropagation();
            event.preventDefault();
        })
        .on("mouseenter", function () {
            helper.cleanTooltip();
        })
        .on("click", function () {
            clearSelection();
        });

    window.onclick = (event) => {
        d3.select('#contextmenu').style('display', 'none');
        d3.select('#contextmenuRecords').style('display', 'none');
    }
}

export function reset() {
    drawChart(window.refreshData);
    let toolbar = d3.select('#toolbar');
    toolbar.style('max-width', '12.5rem')
        .style('opacity', '1')
        .style('pointer-events', 'auto');

    let toggleButton = d3.select('#toggleButton');
    toggleButton.attr('title', 'Collapse toolbar');
    
    toggleButton.html(icon.getCollapseToolbarIcon());
}


export function refresh() {
    const dimensions = getAllVisibleDimensionNames();
    for (let i = 0; i < dimensions.length; i++) {
        show(dimensions[i]);
    }
}

export function deleteChart(): void {
    d3.select('#pc_svg').remove();
    d3.select('#contextmenu').remove();
    d3.select('#contextmenuRecords').remove();
    d3.select('#modalFilter').remove();
    d3.select('#modalRange').remove();
    d3.select('#refreshButton').remove();
    d3.select('#showData').remove();
    d3.select('#toolbarRow').remove();
}

let isSelectionMode = false;

function selectionWithRectangle(enable: boolean): void {

    const svg = window.svg;

    svg.on('.selection', null);

    if (!enable) return;

    let selectionRect = svg.append('rect')
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-dasharray', '3')
        .style('visibility', 'hidden')
        .style('pointer-events', 'none');

    let isSelecting = false;
    let startX;
    let startY;

    svg.on('mousedown.selection', function (event) {
        event.preventDefault();
        isSelecting = true;
        const [x, y] = d3.pointer(event);
        startX = x;
        startY = y;

        selectionRect
            .attr('x', startX)
            .attr('y', startY)
            .attr('width', 0)
            .attr('height', 0)
            .style('visibility', 'visible');
    });

    svg.on('mousemove.selection', function (event) {
        if (!isSelecting) return;
        const [x, y] = d3.pointer(event);
        const width = Math.abs(x - startX);
        const height = Math.abs(y - startY);

        selectionRect
            .attr('x', Math.min(x, startX))
            .attr('y', Math.min(y, startY))
            .attr('width', width)
            .attr('height', height);
    });

    svg.on('mouseup.selection', function () {
        if (!isSelecting) return;
        isSelecting = false;

        const x1 = parseFloat(selectionRect.attr('x'));
        const y1 = parseFloat(selectionRect.attr('y'));
        const x2 = x1 + parseFloat(selectionRect.attr('width'));
        const y2 = y1 + parseFloat(selectionRect.attr('height'));

        svg.selectAll('g.active path')
            .each(function (d) {
                const path = d3.select(this).node();
                const pathData = path.getAttribute('d');

                const pathCoords = pathData.match(/[ML]\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/g);

                let isInSelection = false;

                if (pathCoords) {
                    pathCoords.forEach(function (coord) {
                        const matches = coord.match(/[-+]?\d*\.?\d+/g);
                        const [x, y] = matches.map(Number);

                        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
                            isInSelection = true;
                        }
                    });
                }

                if (isInSelection) {
                    d3.select(this)
                        .each(function () {
                            const pathElement = d3.select(this);
                            const pathId = pathElement.attr('id');
                            setSelected(pathId);
                        });
                }
            });
        selectionRect.style('visibility', 'hidden');
    });

}

//---------- Helper Functions ----------

export function getAllRecords(): any[] {
    const selection = window.active;
    const object = selection._groups;
    const data = [];
    for (let i = 0; i < object[0].length; i++) {
        const items = object.map(item => item[i]);
        const keys = Object.keys(items);
        const text = items[keys[0]].id;
        data.push(text);
    }
    return data;
}

export function getAllVisibleDimensionNames(): string[] {
    let listOfDimensions = parcoords.newFeatures.slice();
    return listOfDimensions.reverse();
}

export function getAllDimensionNames(): string[] {
    return window.parcoords.data['columns'];
}

export function getAllHiddenDimensionNames(): string[] {
    const dimensions = getAllDimensionNames();
    const hiddenDimensions = [];
    for (let i = 0; i < dimensions.length; i++) {
        if (getHiddenStatus(dimensions[i]) == 'hidden') {
            hiddenDimensions.push(dimensions[i]);
        }
    }
    return hiddenDimensions;
}

export function getNumberOfDimensions(): number {
    return parcoords.newFeatures.length;
}

export function getDimensionPosition(dimension: string): number {
    return parcoords.newFeatures.indexOf(dimension);
}

export function isDimensionCategorical(dimension: string): boolean {
    let values = window.parcoords.newDataset.map(o => o[dimension]);
    if (isNaN(values[0])) {
        return true;
    }
    return false;
}

export function setDimensionForHovering(dimension: string): void {
    window.hoverlabel = dimension;
}

// ---------- Needed for Built-In Interactivity Functions ---------- //

function setUpParcoordData(data: any, newFeatures: any): any {

    window.padding = 80;
    window.paddingXaxis = 75;
    window.width = newFeatures.length * 100;
    window.height = 400;
    window.initDimension = newFeatures;

    const label = newFeatures[newFeatures.length - 1];

    data.sort((a, b) => {
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

    window.parcoords = {};
    window.parcoords.features = dataset[0];
    window.parcoords.newDataset = dataset[1];

    window.parcoords.xScales = helper.setupXScales(window.width, window.paddingXaxis, dataset[0]);
    window.parcoords.yScales = helper.setupYScales(window.height, window.padding, dataset[0], dataset[1]);
    window.parcoords.dragging = {};
    window.parcoords.dragPosStart = {};
    window.parcoords.currentPosOfDims = [];
    window.parcoords.newFeatures = newFeatures;

    window.parcoords.data = data;

    for (let i = 0; i < newFeatures.length; i++) {
        const max = Math.max(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
        const min = Math.min(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
        const ranges = getDimensionRange(newFeatures[i]);
        window.parcoords.currentPosOfDims.push(
            {
                key: newFeatures[i], top: 80, bottom: 320, isInverted: false, index: i,
                min: min, max: max, sigDig: 0, currentRangeTop: ranges[1], currentRangeBottom: ranges[0]
            }
        );
    }

    window.yAxis = {};
    window.yAxis = helper.setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);

    let counter = 0;
    window.parcoords.features.map(x => {
        let numberOfDigs = 0
        let values = window.parcoords.newDataset.map(o => o[x.name]);
        for (let i = 0; i < values.length; i++) {
            if (!isNaN(values[i])) {
                const tempNumberOfDigs = utils.digits(Number(values[i]));
                if (tempNumberOfDigs > numberOfDigs) {
                    numberOfDigs = tempNumberOfDigs;
                }
            }
            else {
                continue;
            }
        }
        utils.addNumberOfDigs(numberOfDigs, window.parcoords.currentPosOfDims, x.name, 'sigDig');
        utils.addNumberOfDigs(counter, window.parcoords.currentPosOfDims, x.name, 'recordId');
        counter = counter + 1;
    });

    window.hoverlabel = getAllVisibleDimensionNames()[0];
}

export function createSvgString(): any {
    let height = window.height;
    let width = window.width;

    let yScalesForDownload = helper.setupYScales(400, window.padding, window.parcoords.features, window.parcoords.newDataset);
    let yAxisForDownload = helper.setupYAxis(window.parcoords.features, yScalesForDownload, window.parcoords.newDataset);
    let xScalesForDownload = helper.setupXScales(window.width, window.paddingXaxis, parcoords.features);

    let svg = d3.create('svg')
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'Verdana, sans-serif');

    let defs = svg.append('defs');

    defs.append('image')
        .attr('id', 'arrow_image_up')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowUp());

    defs.append('image')
        .attr('id', 'arrow_image_down')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowDown());

    defs.append('image')
        .attr('id', 'brush_image_top')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowTop());

    defs.append('image')
        .attr('id', 'brush_image_bottom')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowBottom());


    svgcreator.setActivePathLinesToDownload(svg, window.parcoords, window.key);

    svgcreator.setFeatureAxisToDownload(svg, yAxisForDownload, yScalesForDownload, window.parcoords, window.padding, xScalesForDownload);

    return svg.node().outerHTML;
}

const tooltipPath = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('pointer-events', 'none')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', '#fff')
    .style('padding', '0.5rem')
    .style('border-radius', '0.25rem')
    .style('font-size', '0.75rem')
    .style('z-index', '1000');

const tooltipTest = d3.select('body')
    .append('div')
    .attr('id', 'tooltipTest')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('pointer-events', 'none')
    .style('background', 'lightgrey')
    .style('padding', '0.2rem')
    .style('border', '1px solid gray')
    .style('border-radius', '0.2rem')
    .style('white-space', 'pre-line')
    .style('font-size', '0.75rem')
    .style('z-index', '1000');

let delay = null;
let cleanupTimeout = null;

const clearExistingDelay = () => {
    if (delay) {
        clearTimeout(delay);
        delay = null;
    }
};

const handlePointerEnter = (event, d) => {
    if (isSelectionMode) return;
    clearExistingDelay();
    doNotHighlight();

    const data = helper.getAllPointerEventsData(event, window.hoverlabel);

    highlight(data);
    helper.createTooltipForPathLine(data, tooltipTest, event);

    const datasetMap = new Map();
    parcoords.newDataset.forEach((record) => {
        datasetMap.set(record[window.hoverlabel], record);
    });

    data.forEach((item) => {
        const matchingRecord = datasetMap.get(item);
        if (matchingRecord) {
            helper.createToolTipForValues(matchingRecord);
        }
    });
};


const handlePointerLeaveOrOut = () => {
    doNotHighlight();
    clearExistingDelay();
    tooltipPath.style('visibility', 'hidden');
    d3.select('#tooltipTest').style('visibility', 'hidden');
    helper.cleanTooltip();
};

d3.select('#pc_svg').on('mouseleave', () => {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    cleanupTimeout = setTimeout(() => {
        doNotHighlight();
        clearExistingDelay();
        tooltipPath.style('visibility', 'hidden');
        d3.select('#tooltipTest').style('visibility', 'hidden');
        helper.cleanTooltip();
    }, 100);
});

document.addEventListener('mousemove', (e) => {
    const chartBounds = document.querySelector('#pc_svg').getBoundingClientRect();
    if (
        e.clientX < chartBounds.left ||
        e.clientX > chartBounds.right ||
        e.clientY < chartBounds.top ||
        e.clientY > chartBounds.bottom
    ) {
        handlePointerLeaveOrOut();
    }
});

function setActivePathLines(svg: any, content: any,
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    }): any {

    let contextMenu = d3.select('#parallelcoords')
        .append('g')
        .attr('id', 'contextmenuRecords')
        .style('position', 'absolute')
        .style('display', 'none');

    contextMenu.append('div')
        .attr('id', 'selectRecord')
        .attr('class', 'contextmenu')
        .text('Select Record');
    contextMenu.append('div')
        .attr('id', 'unSelectRecord')
        .attr('class', 'contextmenu')
        .text('Unselect Record');
    contextMenu.append('div')
        .attr('id', 'toggleRecord')
        .attr('class', 'contextmenu')
        .text('Toggle Record');
    contextMenu.append('div')
        .attr('id', 'addSelection')
        .attr('class', 'contextmenu')
        .text('Add to Selection');
    contextMenu.append('div')
        .attr('id', 'removeSelection')
        .attr('class', 'contextmenu')
        .text('Remove from Selection');

    let active = svg.append('g')
        .attr('class', 'active')
        .selectAll('path')
        .data(content)
        .enter()
        .append('path')
        .attr('class', (d) => {
            const keys = Object.keys(d);
            window.key = keys[0];
            const selected_value = utils.cleanString(d[window.key]);
            return 'line ' + selected_value;
        })
        .attr('id', (d) => {
            return utils.cleanString(d[window.key]);
        })
        .each(function (d) {
            d3.select(this)
                .attr('d', helper.linePath(d, parcoords.newFeatures, parcoords));
        })
        .style('opacity', '0.5')
        .style('pointer-events', 'stroke')
        .style('stroke', 'rgb(0, 129, 175)')
        .style('stroke-width', '0.1rem')
        .style('fill', 'none')
        .on('pointerenter', handlePointerEnter)
        .on('pointerleave', handlePointerLeaveOrOut)
        .on('pointerout', handlePointerLeaveOrOut)
        .on('mouseenter', handlePointerEnter)
        .on('mouseout', handlePointerLeaveOrOut)
        .on('mouseleave', handlePointerLeaveOrOut)
        .on('click', function (event, d) {
            const data = helper.getAllPointerEventsData(event, window.hoverlabel);
            const selectedRecords = getSelected();

            if (event.metaKey || event.shiftKey) {
                data.forEach(record => {
                    if (selectedRecords.includes(record)) {
                        setUnselected(record);
                    } else {
                        select([record]);
                    }
                });
            }
            else if (event.ctrlKey) {
                data.forEach(record => {
                    toggleSelection(record);
                })
            }
            else {
                clearSelection();
                select(data);
            }
            event.stopPropagation();
        })
        .on('contextmenu', function (event, d) {
            setContextMenuForActiceRecords(contextMenu, event, d);
        });

    return active;
}

const delay1 = 50;
export const throttleShowValues = utils.throttle(helper.createToolTipForValues, delay1);

function setContextMenuForActiceRecords(contextMenu: any, event: any, d: any) {
    contextMenu.style('left', event.clientX / 16 + 'rem')
        .style('top', event.clientY / 16 + 'rem')
        .style('display', 'block')
        .style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.35 + 'rem')
        .style('background-color', 'white').style('margin-left', 0.5 + 'rem')
        .style('cursor', 'pointer')
        .on('click', (event) => {
            event.stopPropagation();
        });

    d3.select('#selectRecord')
        .on('click', (event) => {
            setSelected(d[window.hoverlabel]);
            event.stopPropagation();
            d3.select('#contextmenuRecords').style('display', 'none');
        });

    d3.select('#unSelectRecord')
        .on('click', (event) => {
            setUnselected(d[window.hoverlabel]);
            event.stopPropagation();
            d3.select('#contextmenuRecords').style('display', 'none');
        });

    d3.select('#toggleRecord')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            toggleSelection(d[window.hoverlabel]);
            event.stopPropagation();
            d3.select('#contextmenuRecords').style('display', 'none');
        });

    d3.select('#addSelection')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            let selectedRecords = [];
            selectedRecords = getSelected();
            selectedRecords.push(d[window.hoverlabel]);
            setSelection(selectedRecords);
            event.stopPropagation();
            d3.select('#contextmenuRecords').style('display', 'none');
        });

    d3.select('#removeSelection')
        .on('click', (event) => {
            setUnselected(d[window.hoverlabel]);
            event.stopPropagation();
            d3.select('#contextmenuRecords').style('display', 'none');
        });
    d3.selectAll('.contextmenu').style('padding', 0.35 + 'rem');
    event.preventDefault();
}

function setFeatureAxis(svg: any, yAxis: any, active: any,
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    },
    width: any, padding: any): void {

    let featureAxis = svg.selectAll('g.feature')
        .data(parcoords.features)
        .enter()
        .append('g')
        .attr('class', 'dimensions')
        .attr('transform', d => ('translate(' + parcoords.xScales(d.name) + ')'));

    let tooltipValuesLabel = d3.select('body')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    featureAxis
        .append('g')
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .attr('id', 'dimension_axis_' + processedDimensionName)
                .call(yAxis[d.name])
                /*.on('mouseenter', function (event, d) {
                    tooltipValuesLabel.text('');
                    tooltipValuesLabel.style('top', event.clientY / 16 + 'rem').style('left', event.clientX / 16 + 'rem');
                    tooltipValuesLabel.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
                        .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
                        .style('padding', 0.12 + 'rem')
                        .style('background-color', 'lightgrey').style('margin-left', 0.5 + 'rem');
                    return tooltipValuesLabel.style('visibility', 'hidden');
                })
                .on('mouseout', function () {
                    return tooltipValuesLabel.style('visibility', 'hidden');
                })*/;
        });

    let tickElements = document.querySelectorAll('g.tick');
    tickElements.forEach((gElement) => {
        let transformValue = gElement.getAttribute('transform');
        let yValue = transformValue.match(/translate\(0,([^\)]+)\)/);
        if (yValue) {
            let originalValue = parseFloat(yValue[1]);
            let shortenedValue = originalValue.toFixed(4);
            gElement.setAttribute('transform', `translate(0,${shortenedValue})`);
        }
    });

    let tooltipValues = d3.select('body')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    let tooltipValuesTop = d3.select('#parallelcoords')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    let tooltipValuesDown = d3.select('#parallelcoords')
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    setBrushDown(featureAxis, parcoords, active, tooltipValues);

    setBrushUp(featureAxis, parcoords, active, tooltipValues);

    setRectToDrag(featureAxis, svg, parcoords, active, tooltipValuesTop, tooltipValuesDown);

    setMarker(featureAxis);

    context.setContextMenu(featureAxis, padding, parcoords, active, width);

    setInvertIcon(featureAxis, padding);
}

export function showMarker(dimension) {
    const cleanDimensionName = utils.cleanString(dimension);
    d3.select('#marker_' + cleanDimensionName).attr('opacity', 1);
}

export function hideMarker(dimension) {
    const cleanDimensionName = utils.cleanString(dimension);
    d3.select('#marker_' + cleanDimensionName).attr('opacity', 0);
}

function setDefsForIcons(): void {
    const svgContainer = window.svg;
    let defs = svgContainer.select('defs');
    defs = svgContainer.append('defs');

    defs.append('image')
        .attr('id', 'arrow_image_up')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowUp());

    defs.append('image')
        .attr('id', 'arrow_image_down')
        .attr('width', 12)
        .attr('height', 12)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowDown());

    defs.append('image')
        .attr('id', 'brush_image_top')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowTop());

    defs.append('image')
        .attr('id', 'brush_image_bottom')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowBottom());
}

// Hovering

let currentlyHighlightedItems = [];

function highlight(data) {

    if (isSelectionMode) return;

    const cleanedItems = data.map(item =>
        utils.cleanString(item).replace(/[.,]/g, '')
    );

    currentlyHighlightedItems = [...cleanedItems];

    cleanedItems.forEach(item => {
        d3.select('#' + item)
            .transition()
            .duration(5)
            .style('opacity', '0.7')
            .style('stroke', 'rgb(200, 28, 38)');
    });
}

function doNotHighlight() {

    if (!currentlyHighlightedItems.length) return;

    currentlyHighlightedItems.forEach(item => {
        const line = d3.select('#' + item);
        if (line.classed('selected')) {
            line.transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
        else {
            line.transition()
                .style('stroke', 'rgb(0, 129, 175)')
                .style('opacity', '0.5');
        }
    });

    currentlyHighlightedItems = [];
}

// Selecting

function select(linePaths: any): void {
    for (let i = 0; i < linePaths.length; i++) {
        setSelected(linePaths[i]);
    }
}

function clearSelection(): void {
    const selectedRecords = getSelected();
    selectedRecords.forEach(element => {
        d3.select('#' + utils.cleanString(element))
            .classed('selected', false)
            .transition()
            .style('stroke', 'rgb(0, 129, 175)')
            .style('opacity', '0.5');

    });
}


// Inverting

function onInvert(): any {
    {
        return function invertDim(event, d) {
            invert(d.name);
        };
    }
}

function setInvertIcon(featureAxis: any, padding: any): void {
    let value = (padding / 1.5).toFixed(4);

    featureAxis
        .append('svg')
        .attr('y', value)
        .attr('x', -6)
        .append('use')
        .attr('width', 12)
        .attr('height', 12)
        .attr('y', 0)
        .attr('x', 0)
        .attr('href', '#arrow_image_up')
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .attr('id', 'dimension_invert_' + processedDimensionName)
                .text('up')
                .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowDownCursor()), 12)}') 8 8, auto`);
        })
        .on('click', onInvert());
}

function setMarker(featureAxis: any): void {
    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .append('g')
                .attr('class', 'marker')
                .append('rect')
                .attr('id', 'marker_' + processedDimensionName)
                .attr('width', 44)
                .attr('height', 305)
                .attr('x', -22)
                .attr('y', 30)
                .attr('fill', 'none')
                .attr('stroke', 'red')
                .attr('stroke-width', '0.15rem')
                .attr('opacity', '0')

        });
}

// Brushing

function setRectToDrag(featureAxis: any, svg: any, parcoords: {
    xScales: any; yScales: {};
    dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any;
    features: any[]; newDataset: any[];
}, active: any, tooltipValuesTop: any,
    tooltipValuesDown: any): void {

    let delta: any;
    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .append('g')
                .attr('class', 'rect')
                .append('rect')
                .attr('id', 'rect_' + processedDimensionName)
                .attr('width', 12)
                .attr('height', 240)
                .attr('x', -6)
                .attr('y', 80)
                .attr('fill', 'rgb(255, 255, 0)')
                .attr('opacity', '0.4')
                .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowTopAndBottom()), 12)}') 8 8, auto`)
                .call(drag.drag()
                    .on('drag', (event, d) => {
                        if (parcoords.newFeatures.length > 25) {
                            brush.throttleDragAndBrush(processedDimensionName, d, svg, event, parcoords, active, delta,
                                tooltipValuesTop, tooltipValuesDown, window);
                        }
                        else {
                            brush.dragAndBrush(processedDimensionName, d, svg, event, parcoords, active, delta,
                                tooltipValuesTop, tooltipValuesDown, window);
                        }

                    })
                    .on('start', (event, d) => {
                        let current = d3.select("#rect_" + processedDimensionName);
                        delta = current.attr("y") - event.y;
                    })
                    .on('end', () => {
                        tooltipValuesTop.style('visibility', 'hidden');
                        tooltipValuesDown.style('visibility', 'hidden');
                    }));
        });
}

function setBrushUp(featureAxis: any, parcoords: {
    xScales: any; yScales: {}; dragging: {};
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any): void {

    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .append('g')
                .attr('class', 'brush_' + processedDimensionName)
                .append('use')
                .attr('id', 'triangle_up_' + processedDimensionName)
                .attr('y', 320)
                .attr('x', -7)
                .attr('width', 14)
                .attr('height', 10)
                .attr('href', '#brush_image_top')
                .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowTopCursor()), 13)}') 8 8, auto`)
                .call(drag.drag().on('drag', (event, d) => {
                    if (parcoords.newFeatures.length > 25) {
                        brush.throttleBrushUp(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
                    }
                    else {
                        brush.brushUp(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
                    }
                })
                    .on('end', () => {
                        tooltipValues.style('visibility', 'hidden');
                    }));
        });
}

function setBrushDown(featureAxis: any, parcoords: {
    xScales: any; yScales: {}; dragging: {};
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[];
    newDataset: any[];
}, active: any, tooltipValues: any): void {

    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            d3.select(this)
                .append('g')
                .attr('class', 'brush_' + processedDimensionName)
                .append('use')
                .attr('id', 'triangle_down_' + processedDimensionName)
                .attr('y', 70)
                .attr('x', -7)
                .attr('width', 14)
                .attr('height', 10)
                .attr('href', '#brush_image_bottom')
                .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowBottomCursor()), 13)}') 8 8, auto`)
                .call(drag.drag()
                    .on('drag', (event, d) => {
                        if (parcoords.newFeatures.length > 25) {
                            brush.throttleBrushDown(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
                        }
                        else {
                            brush.brushDown(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
                        }
                    })
                    .on('end', () => {
                        tooltipValues.style('visibility', 'hidden');
                    }));
        });
}