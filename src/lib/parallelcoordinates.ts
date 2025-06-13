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

declare global {
    let padding: any;
    let paddingXaxis: any;
    let width: any;
    let height: any;
    let dataset: any;
    let yAxis: {};
    let selected: [];
    let hoverSelected: [];
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
    let selectable: any;
    let hoverdata: any[];
    let hoverlabel: string;
    let yBrushes: {};
    let filters: {};
    let selectedDots: [];
}

declare const window: any;

//******** API ********//

//---------- Show and Hide Functions ----------

export function show(dimension: string): void {
    const tempFeatures = parcoords.newFeatures.slice();
    const isShown = getHiddenStatus(dimension);
    const temp = parcoords.currentPosOfDims.slice();
    const item = parcoords.currentPosOfDims.find((object) => object.key == dimension);
    const index = item.index;
    window.selected = getSelected();
    if (isShown == "hidden") {
        tempFeatures.splice(index, 0, dimension);
        redrawChart(parcoords.data, tempFeatures);

        window.parcoords.currentPosOfDims = temp.slice();

        window.parcoords.currentPosOfDims.forEach(function (item) {
            if (getHiddenStatus(item.key) != 'hidden') {
                if (item.isInverted) {
                    invertWoTransition(item.key);
                }
                if (item.top != 80 || item.bottom != 320) {
                    brush.filterWithCoords(item.top, item.bottom, parcoords.currentPosOfDims, item.key);
                }
                if (!isDimensionCategorical(item.key)) {
                    setDimensionRange(item.key, item.currentRangeBottom, item.currentRangeTop);
                }
            }
        });

        setSelection(window.selected);
    }
}

export function hide(dimension: string): void {
    d3.select('#contextmenu').style('display', 'none');
    const tempFeatures = parcoords.newFeatures.slice();
    const isShown = getHiddenStatus(dimension);
    const temp = window.parcoords.currentPosOfDims.slice();
    window.selected = getSelected();
    if (isShown == "shown") {
        tempFeatures.splice(tempFeatures.indexOf(dimension), 1);
        redrawChart(parcoords.data, tempFeatures);

        window.parcoords.currentPosOfDims = temp.slice();
        window.parcoords.currentPosOfDims.forEach(function (item) {
            if (getHiddenStatus(item.key) != 'hidden') {
                if (item.isInverted) {
                    invertWoTransition(item.key);
                }
                if (item.top != 80 || item.bottom != 320) {
                    brush.filterWithCoords(item.top, item.bottom, parcoords.currentPosOfDims, item.key);
                }
                if (!isDimensionCategorical(item.key)) {
                    setDimensionRange(item.key, item.currentRangeBottom, item.currentRangeTop);
                }
            }
        });

        setSelection(window.selected);
    }
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
    const processedDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
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

    helper.trans(window.selectable).each(function (d) {
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
    const processedDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
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

    helper.trans(window.selectable).each(function (d) {
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
    const processedDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
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

    helper.trans(window.selectable).each(function (d) {
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
        //setFilter(dimension, getCurrentMinRange(dimension), getCurrentMaxRange(dimension));
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]);
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMaxRange(dimension), getCurrentMinRange(dimension));
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
        //setFilter(dimension, getCurrentMinRange(dimension), getCurrentMaxRange(dimension));
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]).nice();
        window.yAxis = helper.setupYAxis(window.parcoords.features, window.parcoords.yScales,
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMaxRange(dimension), getCurrentMinRange(dimension));
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
        let editRecord = records[i].length > 10 ? records[i].substr(0, 10) + '...' : records[i];
        let selectedLine = utils.cleanLinePathString(editRecord);
        let isselected = isSelected(selectedLine);
        if (isselected) {
            selected.push(records[i]);
        }
    }
    return selected;
}

export function setSelection(records: string[]): void {
    let selectableLines = [];
    let editRecord;
    for (let i = 0; i < records.length; i++) {
        window.active.each(function (d) {
            editRecord = records[i].length > 10 ? records[i].substr(0, 10) + '...' : records[i];
            if (utils.cleanLinePathString(d[window.hoverlabel]) == utils.cleanLinePathString(editRecord)) {
                selectableLines.push(d);
            }
        });
        d3.select('.' + utils.cleanLinePathString(editRecord))
            .transition()
            .style('visibility', 'hidden');
    }

    window.selectable = svg.append('g')
        .attr('class', 'selectable')
        .selectAll('path')
        .data(selectableLines)
        .enter()
        .append('path')
        .attr('id', (d) => {
            const keys = Object.keys(d);
            window.key = keys[0];
            const selected_value = utils.cleanLinePathString(d[window.key]);
            return 'select_' + selected_value;
        })
        .style('pointer-events', 'none')
        .style('fill', 'none')
        .style('stroke', 'rgb(255, 165, 0)')
        .style('opacity', '1')
        .style('visibility', 'visible')
        .each(function (d) {
            d3.select(this)
                .attr('d', helper.linePath(d, parcoords.newFeatures, parcoords));
        })
        .on("contextmenu", function (event) {
            event.preventDefault();
        });
}

export function isSelected(record: string): boolean {
    let editRecord = record.length > 10 ? record.substr(0, 10) + '...' : record;
    let cleanedRecord = utils.cleanLinePathString(editRecord);
    const path = d3.select('#select_' + cleanedRecord);
    if (path.size() != 0) {
        return true;
    }
    else {
        return false;
    }
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
    let editRecord = record.length > 10 ? record.substr(0, 10) + '...' : record;
    const path = utils.cleanLinePathString(editRecord);
    d3.select('#select_' + path)
        .remove();
    d3.select('.' + path)
        .transition()
        .style('visibility', 'visible');
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
    let ids = [];

    deleteChart();

    let newFeatures = content['columns'].reverse();

    setUpParcoordData(content, newFeatures);

    const height = 360;

    /*window.svg = d3.select('#parallelcoords')
        .append('button')
        .text("Refresh")

    window.svg = d3.select('#parallelcoords')
        .append('button')
        .text('Selection Tool');*/

    window.svg = d3.select('#parallelcoords')
        .append('svg')
        .attr('id', 'pc_svg')
        .attr('viewBox', [-10, 0, window.width, height])
        .attr('font-family', 'Verdana, sans-serif');

    setDefsForIcons();

    window.active = setActivePathLines(svg, content, ids, window.parcoords);

    setFeatureAxis(svg, yAxis, window.active, window.parcoords, width, window.padding);

    selectionWithRectangle();

    window.svg
        .on('click', (event) => {
            if (!(event.shiftKey) && !(event.ctrlKey) && !(event.metaKey)) {
                if (!(event.target.id.includes('dimension_invert_'))) {
                    for (let i = 0; i < ids.length; i++) {
                        if (d3.select('.' + ids[i]).style('visibility') !== 'visible') {
                            setUnselected(ids[i]);
                        }
                    }
                }
            }
            if (event.ctrlKey || event.metaKey) {
                let selectedRecords = getSelected();

                for (let i = 0; i < selectedRecords.length; i++) {
                    if (selectedRecords[i] == event.target.id) {
                        toggleSelection(event.target.id);
                    }
                }
            }
        })
        .on("contextmenu", function (event) {
            event.stopPropagation();
            event.preventDefault();
        })
        .on("mouseenter", function () {
            helper.cleanTooltip();
        });

    window.onclick = (event) => {
        d3.select('#contextmenu').style('display', 'none');
        d3.select('#contextmenuRecords').style('display', 'none');
        if (!event.target.id.includes('Filter')) {
            d3.select('#popupFilter').style('display', 'none');
        }
        if (!event.target.id.includes('Range')) {
            d3.select('#popupRange').style('display', 'none');
        }
    }
}

export function deleteChart(): void {
    d3.select('#pc_svg').remove();
    d3.select('#contextmenu').remove();
    d3.select('#contextmenuRecords').remove();
    d3.select('#popupFilter').remove();
    d3.select('#popupRange').remove();
}

function selectionWithRectangle(): void {

    const svg = window.svg;
    let selectionRect = svg.append('rect')
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-dasharray', '3')
        .style('visibility', 'hidden');

    let isSelecting = false;
    let startX;
    let startY;

    svg.on('mousedown', function (event) {
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

    svg.on('mousemove', function (event) {
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

    svg.on('mouseup', function () {
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

function redrawChart(content: any, newFeatures: any): void {
    let ids = [];

    deleteChart();

    setUpParcoordData(content, newFeatures);

    let height = 360;
    let width = newFeatures.length * 100;

    window.svg = d3.select('#parallelcoords')
        .append('svg')
        .attr('id', 'pc_svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'Verdana, sans-serif')
        .on('click', (event) => {
            if (!(event.shiftKey || event.metaKey)) {
                if (!(event.target.id.includes('dimension_invert_'))) {
                    for (let i = 0; i < ids.length; i++) {
                        if (d3.select('.' + ids[i]).style('visibility') !== 'visible') {
                            setUnselected(ids[i]);
                        }
                    }
                }
            }
        })
        .on("contextmenu", function (event) {
            event.preventDefault();
        });

    setDefsForIcons();

    window.onclick = (event) => {
        d3.select('#contextmenu').style('display', 'none');
        d3.select('#contextmenuRecords').style('display', 'none');
    }

    window.active = setActivePathLines(svg, content, ids, window.parcoords);

    setFeatureAxis(svg, yAxis, window.active, window.parcoords, width, window.padding);
}

export function createSvgString(): any {
    //setUpParcoordData(window.parcoords.data, window.parcoords.newFeatures);


    let height = 360;
    let width = window.parcoords.newFeatures.length * 100;

    let xScalesForDownload = helper.setupXScales(width, window.padding, parcoords.features);
    let yScalesForDownload = helper.setupYScales(400, window.padding, window.parcoords.features, window.parcoords.newDataset);
    let yAxisForDownload = helper.setupYAxis(window.parcoords.features, yScalesForDownload, window.parcoords.newDataset);

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

    svgcreator.setFeatureAxisToDownload(svg, yAxisForDownload, yScalesForDownload, window.parcoords, window.padding);

    return svg.node().outerHTML;
}

let delay = null;
let selectedPath = null;
let tooltipPath;

const clearExistingDelay = () => {
    if (delay) {
        clearTimeout(delay);
        delay = null;
    }
};

const handlePointerEnter = (event, d) => {
    const data = helper.getAllPointerEventsData(event, window.hoverlabel);
    window.hoverdata = [...data];

    selectedPath = highlight(data);
    helper.createTooltipForPathLine(data, tooltipPath, event);

    clearExistingDelay();

    const datasetMap = new Map();
    parcoords.newDataset.forEach((record) => {
        const recordData = record[window.hoverlabel];
        datasetMap.set(recordData, record);
    });

    data.forEach((item) => {
        const matchingRecord = datasetMap.get(item);
        if (matchingRecord) {
            delay = setTimeout(() => {
                helper.createToolTipForValues(matchingRecord);
            }, 150);
        }
    });
};

const handlePointerLeaveOrOut = () => {
    doNotHighlight(selectedPath);

    clearExistingDelay();

    if (tooltipPath) {
        tooltipPath.style('visibility', 'hidden');
    }
    helper.cleanTooltip();
};


function setActivePathLines(svg: any, content: any, ids: any[],
    parcoords: {
        xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
    }): any {

    tooltipPath = d3.select('#parallelcoords')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

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
            const selected_value = utils.cleanLinePathString(d[window.key]);
            ids.push(selected_value);
            return 'line ' + selected_value;
        })
        .attr('id', (d) => {
            return d[window.key];
        })
        .each(function (d) {
            let element = d[window.key].length > 10 ? d[window.key].substr(0, 10) + '...' : d[window.key];
            d[window.key] = element;
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
        .on('click', () => {
            select(window.hoverdata);
        })
        .on('contextmenu', function (event, d) {
            setContextMenuForActiceRecords(contextMenu, event, d);
        })

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

    let tooltipValuesLabel = d3.select('#parallelcoords')
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
                .on('mouseenter', function (event, d) {
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
                });
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

    let tooltipValues = d3.select('#parallelcoords')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    let tooltipValuesTop = d3.select('#parallelcoords')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    let tooltipValuesDown = d3.select('#parallelcoords')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    setBrushDown(featureAxis, parcoords, active, tooltipValues);

    setBrushUp(featureAxis, parcoords, active, tooltipValues);

    setRectToDrag(featureAxis, svg, parcoords, active, tooltipValuesTop, tooltipValuesDown);

    context.setContextMenu(featureAxis, padding, parcoords, active, width);

    setInvertIcon(featureAxis, padding);
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

function highlight(data: any): any {
    let selectedPath = '';
    const dataWoSpecialC = data.map(item => item.replace(/[.,]/g, ''));

    if (dataWoSpecialC.length !== 0) {
        let tempText = dataWoSpecialC.join(',').replace(/,/g, ',.');
        tempText = utils.cleanLinePathArrayString(tempText);
        selectedPath = tempText;

        const newTempText = dataWoSpecialC.map((item) => {
            let cleanedItem = item.replace(/,./g, '');
            if (isSelected(item)) {
                setUnselected(item);
                window.hoverSelected = window.hoverSelected || [];
                window.hoverSelected.push(item);
            }
            return cleanedItem;
        });

        selectedPath = newTempText.join(',.');

        if (selectedPath) {
            d3.selectAll('.' + selectedPath)
                .transition().duration(5)
                .style('opacity', '0.7')
                .style('stroke', 'rgb(200, 28, 38)');
        }
    }

    return selectedPath;
}

function doNotHighlight(selectedPath: any): void {
    if (selectedPath !== '') {
        const tempText = selectedPath.split(',.');
        const newTempText = [];

        tempText.forEach(item => {
            newTempText.push(item);
            if (window.hoverSelected && window.hoverSelected.includes(item)) {
                setSelected(item);
                const index = window.hoverSelected.indexOf(item);
                window.hoverSelected.splice(index, 1);
            }
        });

        selectedPath = newTempText.join(',.');

        if (selectedPath) {
            d3.selectAll('.' + selectedPath)
                .transition()
                .style('opacity', '0.7')
                .style('stroke', 'rgb(0, 129, 175)');
        }
    }
}

// Selecting

function select(linePaths: any): void {
    for (let i = 0; i < linePaths.length; i++) {
        let selectedLine = utils.cleanLinePathString(linePaths[i]);
        setSelected(selectedLine);
    }
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