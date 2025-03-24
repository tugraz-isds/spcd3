import 'd3-transition';
import * as d3 from 'd3-selection';
import * as drag from 'd3-drag';
import * as path from 'd3-shape';
import * as axis from 'd3-axis';
import * as scale from 'd3-scale';
import * as ease from 'd3-ease';
import * as brush from './brush';
import * as helper from './helper';
import * as icon from '../icons/icons';

declare global {
    let padding: any;
    let paddingXaxis: any;
    let width: any;
    let height: any;
    let dataset: any;
    let yAxis: {};
    let scrollXPos: any;
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
    let timer: number;
    let active: any;
    let key: string;
    let svg: any;
    let selectable: any;
    let min: number;
    let max: number;
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
                    console.log(item.key);
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
    const processedDimensionName = helper.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
    const textElement = d3.select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? helper.setSize(icon.getArrowDownCursor(), 12) : helper.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${arrowStyle}') 8 8 , auto`);

    d3.select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
            .domain(parcoords.yScales[dimension]
            .domain().reverse())))
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            })
        .ease(ease.easeCubic);
    

    trans(active).each(function (d) {
        d3.select(this)
        .transition()
        .duration(1000)
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            })
        .ease(ease.easeCubic)});

    brush.addSettingsForBrushing(dimension, parcoords);
    if (isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}

function invertWoTransition(dimension: string): void {
    const processedDimensionName = helper.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
    const textElement = d3.select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? helper.setSize(icon.getArrowDownCursor(), 12) : helper.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${arrowStyle}') 8 8 , auto`);

    d3.select(dimensionId)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
            .domain(parcoords.yScales[dimension]
            .domain().reverse())));

    let active = d3.select('g.active')
        .selectAll('path')
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            });

    trans(active).each(function (d) {
        d3.select(this)
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            })});

    brush.addSettingsForBrushing(dimension, parcoords);
    if (isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}

export function getInversionStatus(dimension: string): string {
    const invertId = '#dimension_invert_' + helper.cleanString(dimension);
    const element = d3.select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == 'up' ? 'ascending' : 'descending';
}

export function setInversionStatus(dimension: string, status: string): void {
    const processedDimensionName = helper.cleanString(dimension);
    const invertId = '#dimension_invert_' + processedDimensionName;
    const dimensionId = '#dimension_axis_' + processedDimensionName;
    const textElement = d3.select(invertId);
    const arrow = status === 'ascending' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = status === 'ascending' ? helper.setSize(icon.getArrowDownCursor(), 12) : helper.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(status === 'ascending' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${arrowStyle}') 8 8 , auto`);

    d3.select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
        .scale(parcoords.yScales[dimension]
        .domain(parcoords.yScales[dimension]
        .domain().reverse())))
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            })
        .ease(ease.easeCubic);
    

    trans(active).each(function (d) {
        d3.select(this)
        .transition()
        .duration(1000)
            .attr('d', (d) => { 
                return linePath(d, parcoords.newFeatures, parcoords); 
            })
        .ease(ease.easeCubic)});

    brush.addSettingsForBrushing(dimension, parcoords);
    if (isInverted(dimension)) {
        brush.addInvertStatus(true, parcoords.currentPosOfDims, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, parcoords.currentPosOfDims, dimension, "isInverted");
    }
}

export function isInverted(dimension: string): boolean {
    const invertId = '#dimension_invert_' + helper.cleanString(dimension);
    const element = d3.select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == 'down' ? true : false;
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
        [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension-1]] = 
        [parcoords.newFeatures[indexOfDimension-1], parcoords.newFeatures[indexOfDimension]];
    }
    else {
        [parcoords.newFeatures[indexOfDimension+1], parcoords.newFeatures[indexOfDimension]] = 
        [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension+1]];
    }
    
    parcoords.xScales.domain(parcoords.newFeatures);

    let active = d3.select('g.active').selectAll('path');
    let featureAxis = d3.selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', function(d) {
            return linePath(d, parcoords.newFeatures, parcoords);
        })
        .ease(ease.easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', function(d) {
            return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
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
            for(let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB-1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i-1]);
                }
            }
        }
        else {
            for(let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                if (i != indexOfDimensionB-1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i+1]);
                }
            }
        }
    }
    else {
        if (indexOfDimensionA > indexOfDimensionB) {
            for(let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB+1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i-1]);
                }
            }
        }
        else {
            for(let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                swap(parcoords.newFeatures[i], parcoords.newFeatures[i+1]);
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
            return linePath(d, parcoords.newFeatures, parcoords);
        })
        .ease(ease.easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', (d) => {
            return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
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
    const inverted = isInverted(dimension);
    if (inverted) {
        window.parcoords.yScales[dimension].domain([max, min]);
        window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMinRange(dimension), getCurrentMaxRange(dimension));
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]);
        window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMaxRange(dimension), getCurrentMinRange(dimension));
    }

    addRange(min, window.parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(max, window.parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    // draw active lines
    d3.select('#dimension_axis_' + helper.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d) => { 
            return linePath(d, window.parcoords.newFeatures, window.parcoords); 
        })
        .ease(ease.easeCubic);

    active.each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', linePath(d, window.parcoords.newFeatures, window.parcoords))
            .ease(ease.easeCubic);
    });
}

export function setDimensionRangeRounded(dimension: string, min: number, max: number): void {
    const inverted = isInverted(dimension);
    if (inverted) {
        window.parcoords.yScales[dimension].domain([max, min]).nice();
        window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMinRange(dimension), getCurrentMaxRange(dimension));
    }
    else {
        window.parcoords.yScales[dimension].domain([min, max]).nice();
        window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
            window.parcoords.newDataset);
        //setFilter(dimension, getCurrentMaxRange(dimension), getCurrentMinRange(dimension));
    }

    addRange(min, window.parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(max, window.parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    // draw active lines
    d3.select('#dimension_axis_' + helper.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(ease.easeCubic);

    let active = d3.select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d) => { 
            return linePath(d, window.parcoords.newFeatures, window.parcoords); 
        })
        .ease(ease.easeCubic);

    active.each(function (d) {
        d3.select(this)
            .transition()
            .duration(1000)
            .attr('d', linePath(d, window.parcoords.newFeatures, window.parcoords))
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

function addRange(value: number, currentPosOfDims: any, dimensionName: any, key: any):void {
    let newObject = {};
    newObject[key] = Number(value);
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}


//---------- Filter Functions ----------

export function getFilter(dimension): any {
    const invertStatus = isInverted(dimension);
    const dimensionRange = getDimensionRange(dimension);
    const maxValue = invertStatus == false ? dimensionRange[1] : dimensionRange[0];
    const minValue = invertStatus == false ? dimensionRange[0] : dimensionRange[1];
    const range = maxValue - minValue;

    const dimensionSettings = window.parcoords.currentPosOfDims.find((obj) => obj.key == dimension);
    const top =  invertStatus == false ? maxValue - (dimensionSettings.top - 80) / (240/range) :
                (dimensionSettings.top - 80) / (240/range) + minValue;
    const bottom = invertStatus == false ? maxValue - (dimensionSettings.bottom - 80) / (240/range) :
                (dimensionSettings.bottom - 80) / (240/range) + minValue;
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
        let selectedLine = helper.cleanLinePathString(editRecord);
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
    for(let i = 0; i < records.length; i++) {
        window.active.each(function (d) {
            editRecord = records[i].length > 10 ? records[i].substr(0, 10) + '...' : records[i];
            if(helper.cleanLinePathString(d[window.hoverlabel]) == helper.cleanLinePathString(editRecord)) {
                selectableLines.push(d);
            }
        });
        d3.select('.' + helper.cleanLinePathString(editRecord))
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
            const selected_value = helper.cleanLinePathString(d[window.key]);
            return 'select_' + selected_value;
        })
        .style('pointer-events', 'none')
        .style('fill', 'none')
        .style('stroke', 'rgb(255, 165, 0)')
        .style('opacity', '1')
        .style('visibility', 'visible')
        .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords));
        })
        .on("contextmenu", function (event) {
            event.preventDefault();
        });
}

export function isSelected(record: string): boolean {
    let editRecord = record.length > 10 ? record.substr(0, 10) + '...' : record;
    let cleanedRecord = helper.cleanLinePathString(editRecord);
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
    const path = helper.cleanLinePathString(editRecord);
    d3.select('#select_' + path)
            .remove();
    d3.select('.' + path)
            .transition()
            .style('visibility', 'visible');
}

//---------- Selection Functions With IDs ----------

export function setSelectionWithId(recordIds: []): void {
    let records : string[] = [];
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
        .attr('viewBox', [0, 0, window.width, height])
        .attr('font-family', 'Verdana, sans-serif');

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
        cleanTooltip();
    });
    
    window.onclick = (event) => {
        d3.select('#contextmenu').style('display', 'none');
        d3.select('#contextmenuRecords').style('display', 'none');
        if(!event.target.id.includes('Filter')) {
            d3.select('#popupFilter').style('display', 'none');
        }
        if(!event.target.id.includes('Range')) {
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

    svg.on('mousedown', function(event) {
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

    svg.on('mousemove', function(event) {
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

    svg.on('mouseup', function() {
        if (!isSelecting) return;
        isSelecting = false;
    
        const x1 = parseFloat(selectionRect.attr('x'));
        const y1 = parseFloat(selectionRect.attr('y'));
        const x2 = x1 + parseFloat(selectionRect.attr('width'));
        const y2 = y1 + parseFloat(selectionRect.attr('height'));
    
        svg.selectAll('g.active path')
            .each(function(d) {
                const path = d3.select(this).node();
                const pathData = path.getAttribute('d');

                const pathCoords = pathData.match(/[ML]\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/g);
    
                let isInSelection = false;
    
                if (pathCoords) {
                    pathCoords.forEach(function(coord) {
                        const matches = coord.match(/[-+]?\d*\.?\d+/g);
                        const [x, y] = matches.map(Number);
                    
                        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
                            isInSelection = true;
                        }
                    });
                }
    
                if (isInSelection) {
                    d3.select(this)
                        .each(function() {
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
    for(let i = 0; i < dimensions.length; i++) {
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

    const label = newFeatures[newFeatures.length-1];
    
    data.sort((a,b) => {
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

    let dataset = prepareData(data, newFeatures);

    window.parcoords = {};
    window.parcoords.features = dataset[0];
    window.parcoords.newDataset = dataset[1];

    window.parcoords.xScales = setupXScales(window.width, window.paddingXaxis, dataset[0]);
    window.parcoords.yScales = setupYScales(window.height, window.padding, dataset[0], dataset[1]);
    window.parcoords.dragging = {};
    window.parcoords.dragPosStart = {};
    window.parcoords.currentPosOfDims = [];
    window.parcoords.newFeatures = newFeatures;

    window.parcoords.data = data;

    for(let i = 0; i < newFeatures.length; i++) {
        const max = Math.max(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
        const min = Math.min(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
        const ranges = getDimensionRange(newFeatures[i]);
        window.parcoords.currentPosOfDims.push(
            { key: newFeatures[i], top: 80, bottom: 320, isInverted: false, index: i ,
                 min: min, max: max, sigDig: 0, currentRangeTop: ranges[1], currentRangeBottom: ranges[0] }
        );
    }

    window.yAxis = {};
    window.yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);

    let counter = 0;
    window.parcoords.features.map(x => {
        let numberOfDigs = 0
        let values = window.parcoords.newDataset.map(o => o[x.name]);
        for (let i = 0; i < values.length; i++) {
            if(!isNaN(values[i])){
                const tempNumberOfDigs = helper.digits(Number(values[i]));
                if (tempNumberOfDigs > numberOfDigs)
                {
                    numberOfDigs = tempNumberOfDigs;
                }
            }
            else {
                continue;
            }
        }
        helper.addNumberOfDigs(numberOfDigs, window.parcoords.currentPosOfDims, x.name, 'sigDig');
        helper.addNumberOfDigs(counter, window.parcoords.currentPosOfDims, x.name, 'recordId');
        counter = counter + 1;
    });

    window.hoverlabel = getAllVisibleDimensionNames()[0];
}

function prepareData(data: any, newFeatures: any): any {
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

function setupYScales(height: any, padding: any, features: any, newDataset: any): any {
    let yScales = {};
    features.map(x => {
        const values = newDataset.map(o => o[x.name]);
        let labels = [];
        if (isNaN(values[0]) !== false) {
            values.forEach(function(element) {
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
            window.max = max;
            window.min = min;
            yScales[x.name] = scale.scaleLinear()
                .domain([min, max])
                .range([height - padding, padding]);
        }
    });
    return yScales;
}

function setupXScales(width: any, padding: any, features: any): any {
    return scale.scalePoint()
        .domain(features.map(x => x.name))
        .range([width - padding, padding]);
}

function setupYAxis(features :any[], yScales: any, newDataset: any): any {
    
    const limit = 30;
    let counter = 0;
    let yAxis = {};

    Object.entries(yScales).map(key => {
        let tempFeatures = Array.from(features.values()).map(c => c.name);
        let tempValues = newDataset.map(o => o[tempFeatures[counter]]);
        let labels = [];
        tempValues.forEach(function(element) {
            labels.push(element.length > 10 ? element.substr(0, 10) + '...' : element);
        });
        counter = counter + 1;

        if(isNaN(labels[0])) {
            let uniqueArray = labels.filter(function(item, index, self) {
                return index === self.indexOf(item);
            })
            if(uniqueArray.length > limit)
            {
                let filteredArray = labels.filter(function(value, index, array) {
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
            let sortRanges = ranges.sort(function(a,b){return a-b});
            let uniqueRanges = [...new Set(sortRanges)];
            if (Number(uniqueRanges[1]) - 5 < Number(uniqueRanges[0])) {
                uniqueRanges.splice(1,1);
            }
            if (Number(uniqueRanges[uniqueRanges.length-1]) - 5 < Number(uniqueRanges[uniqueRanges.length-2])) {
                uniqueRanges.splice(uniqueRanges.length-2,1);
            }
            yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(uniqueRanges);
        }
    });
    return yAxis;
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
    
    window.onclick = (event) => {
        d3.select('#contextmenu').style('display', 'none');
        d3.select('#contextmenuRecords').style('display', 'none');
    }

    window.active = setActivePathLines(svg, content, ids, window.parcoords);

    setFeatureAxis(svg, yAxis, window.active, window.parcoords, width, window.padding);
}

function cleanTooltip(){
	d3.selectAll(".tooltip")
    	.remove();
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
    const data = getAllPointerEventsData(event);
    window.hoverdata = [...data];

    selectedPath = highlight(data);
    createTooltipForPathLine(data, tooltipPath, event);

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
                createToolTipForValues(matchingRecord);
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
    cleanTooltip();
};


function setActivePathLines(svg: any, content: any, ids: any[], 
    parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}; 
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
            const selected_value = helper.cleanLinePathString(d[window.key]);
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
                .attr('d', linePath(d, parcoords.newFeatures, parcoords));
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
            contextMenu.style('left', event.clientX/16 + 'rem')
            .style('top', event.clientY/16 + 'rem')
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
        })

    return active;
}

const delay1 = 50;
export const throttleShowValues = helper.throttle(createToolTipForValues, delay1);

function trans(g: any): any {
    return g.transition().duration(50);
}

function position(dimensionName: any, dragging: any, xScales: any): any {
    const value = dragging[dimensionName];  
    return value == null ? xScales(dimensionName) : value;
}

function linePath(d: any, newFeatures: any, parcoords: any): any {
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

function createTooltipForPathLine(tooltipText: any, tooltipPath: any, event: any): any {
    if (tooltipText.length !== 0) {
        let tempText = tooltipText.toString();
        tempText = tempText.split(',').join('\r\n');
        tooltipPath.text(tempText);
        tooltipPath.style('visibility', 'visible');
        tooltipPath.style('top', event.clientY/16 + 'rem').style('left', event.clientX/16 + 'rem');
        tooltipPath.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
            .style('background-color', 'lightgrey').style('margin-left', 0.5 + 'rem');
        return tooltipPath;
    }
}

function createToolTipForValues(recordData): void {
    const dimensions = getAllVisibleDimensionNames();
    let counter = 0;

    const rectLeft = d3.select('#rect_' + dimensions[0])?.node()?.getBoundingClientRect().left;

    dimensions.forEach(dimension => {
        const cleanString = helper.cleanString(dimension);

        if (helper.isElementVisible(d3.select('#rect_' + cleanString))) {
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

            const x = (rectLeft + (counter * 95))/16;
            const y = (value + 140)/16;

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

function getAllPointerEventsData(event: any): any {
    const selection = d3.selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter('path');
    const object = selection._groups;
    const data = [];
    for (let i = 0; i < object[0].length; i++) {
        const items = object.map(item => item[i]);
        const itemsdata = items[0].__data__;
        const label = window.hoverlabel;
        const text = itemsdata[label];
        data.push(text);
    }
    return data;
}

function setFeatureAxis(svg: any, yAxis: any, active: any,
    parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}; 
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; }, 
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
            const processedDimensionName = helper.cleanString(d.name);
            d3.select(this)
                .attr('id', 'dimension_axis_' + processedDimensionName)
                .call(yAxis[d.name])
                .on('mouseenter', function (event, d) {
                    tooltipValuesLabel.text('');
                    tooltipValuesLabel.style('top', event.clientY/16 + 'rem').style('left', event.clientX/16 + 'rem');
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
        console.log(tickElements);
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

    setDefsForIcons();

    setBrushDown(featureAxis, parcoords, active, tooltipValues);

    setBrushUp(featureAxis, parcoords, active, tooltipValues);
   
    setRectToDrag(featureAxis, svg, parcoords, active, tooltipValuesTop, tooltipValuesDown);

    setContextMenu(featureAxis, padding, parcoords, active, width);

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
        tempText = helper.cleanLinePathArrayString(tempText);
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
    for(let i = 0; i < linePaths.length; i++) {
        let selectedLine = helper.cleanLinePathString(linePaths[i]);
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
    let value = (padding/1.5).toFixed(4);

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
            const processedDimensionName = helper.cleanString(d.name);
            d3.select(this)
                .attr('id', 'dimension_invert_' + processedDimensionName)
                .text('up')
                .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowDownCursor(), 12)}') 8 8, auto`);
        })
        .on('click', onInvert());
}

// Context Menu

function setContextMenu(featureAxis: any, padding: any, parcoords: { xScales: any; yScales: {}; 
    dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
    features: any[]; newDataset: any[]}, active: any, width: any): void {
    
    let tooltipFeatures = d3.select('#parallelcoords')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    let contextMenu = d3.select('#parallelcoords')
        .append('g')
        .attr('id', 'contextmenu')
        .style('position', 'absolute')
        .style('display', 'none');

    let popupWindowRange = d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'popupRange')
        .style('position', 'absolute')
        .style('display', 'none');

    popupWindowRange.append('div').text('Set Range for ').style('padding-left', 0.5 + 'rem').style('font-size', 'large');
    let closeButtonRange = popupWindowRange.append('a').text('x').style('position', 'absolute').style('right', -1 + 'rem')
    .style('top', 0.5 + 'rem').style('width', 2.5 + 'rem').style('height', 2.5 + 'rem')
    .style('opacity', 0.3).style('background-color', 'transparent').style('cursor', 'pointer').attr('id', 'closeButtonRange');
    let headerDimensionRange = popupWindowRange.append('div').style('padding-left', 0.5 + 'rem').style('font-size', 'large')
    .attr('id', 'headerDimensionRange');
    let infoRange = popupWindowRange.append('div').style('color', 'grey').style('font-size', 'smaller')
    .style('padding-left', 0.5 + 'rem').style('padding-bottom', 0.5 + 'rem').style('padding-top', 1 + 'rem').attr('id', 'infoRange');
    let infoRange2 = popupWindowRange.append('div').style('color', 'grey').style('font-size', 'smaller')
    .style('padding-left', 0.5 + 'rem').style('padding-bottom', 0.5 + 'rem').style('padding-top', 1 + 'rem').attr('id', 'infoRange2');
    popupWindowRange.append('label').text('Min').style('padding', 0.5 + 'rem');
    let inputMinRange = popupWindowRange.append('input').attr('id', 'minRangeValue').style('width', 2.5 + 'rem');
    popupWindowRange.append('label').text('Max').style('padding', 0.5 + 'rem');
    let inputMaxRange = popupWindowRange.append('input').attr('id', 'maxRangeValue').style('width', 2.5 + 'rem');
    let rangeButton = popupWindowRange.append('button').text('Save').style('margin-left', 0.5 + 'rem')
    .style('width', 6.2 + 'rem').style('margin-top', 1 + 'rem').attr('id', 'buttonRange');
    
    let popupWindowRangeError = popupWindowRange
        .append('div')
        .attr('id', 'errorRange')
        .style('position', 'absolute')
        .style('display', 'none');
    
    let popupWindowFilter = d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'popupFilter')
        .style('position', 'absolute')
        .style('display', 'none')

    popupWindowFilter.append('div').text('Set Filter for ').style('padding-left', 0.5 + 'rem').style('font-size', 'large');
    let headerDimensionFilter = popupWindowFilter.append('div').style('padding-left', 0.5 + 'rem').style('font-size', 'large')
    .attr('id', 'headerDimensionFilter');
    let closeButtonFilter = popupWindowFilter.append('a').text('x').style('position', 'absolute').style('right', -1 + 'rem')
    .style('top', 0.5 + 'rem').style('width', 2.5 + 'rem').style('height', 2.5 + 'rem')
    .style('opacity', 0.3).style('background-color', 'transparent').style('cursor', 'pointer').attr('id', 'closeButtonFilter');
    popupWindowFilter.append('label').text('Min').style('padding', 0.5 + 'rem');
    let inputMinFilter = popupWindowFilter.append('input').attr('id', 'minFilterValue').style('width', 2 + 'rem');
    popupWindowFilter.append('label').text('Max').style('padding', 0.5 + 'rem');
    let inputMaxFilter = popupWindowFilter.append('input').attr('id', 'maxFilterValue').style('width', 2 + 'rem');
    let filterButton = popupWindowFilter.append('button').text('Save').style('margin-left', 0.5 + 'rem')
    .style('width', 6.2 + 'rem').style('margin-top', 1 + 'rem').attr('id', 'buttonFilter');

    let popupWindowFilterError = popupWindowFilter
        .append('div')
        .attr('id', 'errorFilter')
        .style('position', 'absolute')
        .style('display', 'none');
    
    contextMenu.append('div')
        .attr('id', 'hideMenu')
        .attr('class', 'contextmenu')
        .text('Hide');
    contextMenu.append('div')
        .attr('id', 'invertMenu')
        .attr('class', 'contextmenu')
        .text('Invert');
    contextMenu.append('div')
        .attr('id', 'rangeMenu')
        .attr('class', 'contextmenu')
        .text('Set Range...');
    contextMenu.append('div')
        .attr('id', 'resetRangeMenu')
        .attr('class', 'contextmenu')
        .text('Set Range from Data');
    contextMenu.append('div')
        .attr('id', 'resetRoundRangeMenu')
        .attr('class', 'contextmenu')
        .text('Set Rounded Range from Data');
    contextMenu.append('div')
        .attr('id', 'filterMenu')
        .attr('class', 'contextmenu')
        .text('Set Filter...');
    contextMenu.append('div')
        .attr('id', 'resetfilterMenu')
        .attr('class', 'contextmenu')
        .text('Reset Filter');
    contextMenu.append('div')
        .attr('id', 'showAllMenu')
        .attr('class', 'contextmenu')
        .text('Show All');

    let y_value = (padding/1.7).toFixed(4);
    
    featureAxis
        .append('text')
        .attr('class', 'dimension')
        .attr('text-anchor', 'middle')
        .attr('y', y_value)
        .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
        .style('font-size', '0.7rem')
        .call(drag.drag()
            .on('start', onDragStartEventHandler(parcoords))
            .on('drag', onDragEventHandler(parcoords, active, featureAxis, width))
            .on('end', onDragEndEventHandler(parcoords, featureAxis, active))
        )
        .on('mouseover', function () {
            return tooltipFeatures.style('visibility', 'visible');
        })
        .on('mousemove', (event, d) => {
            if (getDimensionPosition(d.name) == 0) {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowRight(), 12)}') 8 8, auto`);
            } else if (getDimensionPosition(d.name) == parcoords.newFeatures.length - 1) {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowLeft(), 12)}') 8 8, auto`);
            } else {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowLeftAndRight(), 12)}') 8 8, auto`);
            }

            tooltipFeatures.text(d.name);
            tooltipFeatures.style('top', 12.8 + 'rem').style('left', event.clientX/16 + 'rem');
            tooltipFeatures.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
                .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
                .style('padding', 0.12 + 'rem')
                .style('background-color', 'lightgrey').style('margin-left', 0.5 + 'rem');
            return tooltipFeatures;
        })
        .on('mouseout', function () {
            return tooltipFeatures.style('visibility', 'hidden');
        })
        .on('contextmenu', function (event, d) {
            const dimension = d.name;
            const values = parcoords.newDataset.map(o => o[dimension]);
            
            contextMenu.style('left', event.clientX/16 + 'rem')
            .style('top', 13.6 + 'rem')
            .style('display', 'block')
            .style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
            .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
            .style('padding', 0.35 + 'rem')
            .style('background-color', 'white').style('margin-left', 0.5 + 'rem')
            .style('cursor', 'pointer')
            .on('click', (event) => {
                event.stopPropagation();
            });

            d3.select('#hideMenu')
                .on('click', (event) => {
                    hide(dimension);
                    event.stopPropagation();
                });
            
            d3.select('#invertMenu')
                .on('click', (event) => {
                    invert(dimension);
                    event.stopPropagation();
                });
            
            if (!isNaN(values[0])) {
            d3.select('#rangeMenu')
                .style('border-top', '0.08rem lightgrey solid')
                .style('visibility', 'visible')
                .style('color', 'black')
                .on('click', (event) => {
                    let minRange = getCurrentMinRange(dimension);
                    let maxRange = getCurrentMaxRange(dimension);
                    var resultMin = (minRange - Math. floor(minRange)) !== 0;
                    var resultMax = (maxRange - Math. floor(maxRange)) !== 0;
                    let minValue = String(minRange);
                    let maxValue = String(maxRange);
                    if (resultMin && !resultMax) {
                        const count = minValue.split('.')[1].length;
                        maxValue = maxRange.toFixed(count);
                    }
                    else if (!resultMin && resultMax) {
                        const count = maxValue.split('.')[1].length;
                        minValue = minRange.toFixed(count);
                    }
                    inputMinRange.attr('value', minValue);
                    inputMaxRange.attr('value', maxValue);
                    popupWindowRange.style('display', 'block')
                            .style('width', 17 + 'rem')
                            .style('height', 13 + 'rem')
                            .style('background', 'white')
                            .style('border', '0.0625rem solid black')
                            .style('border-radius', 0.25 + 'rem')
                            .style('padding', 1 + 'rem')
                            .style('margin', 'auto')
                            .style('top', 0)
                            .style('right', 0)
                            .style('bottom', 0)
                            .style('left', 0)
                            .style('z-index', 10);
                    const newText = dimension.length > 25 ? dimension.substr(0,25) + '...' : dimension;
                    headerDimensionRange.text(newText);
                    infoRange.text('The current range of ' + dimension + ' is between ' + 
                        minValue + ' and ' + 
                        maxValue + '.');
                    infoRange2.text('The original range of ' + dimension + ' is between ' + 
                        getMinValue(dimension) + ' and ' + 
                        getMaxValue(dimension) + '.');
                    rangeButton.on('click', () => {
                        let min = d3.select('#minRangeValue').node().value;
                        let max = d3.select('#maxRangeValue').node().value;
                        const inverted = isInverted(dimension);
                        let isOk = true;
                        
                        if (inverted) {
                            if (max < getMinValue(dimension) || 
                                min > getMaxValue(dimension)) {
                                popupWindowRangeError.text(`The range has to be bigger than 
                                ${minValue} and 
                                ${maxValue}.`)
                                .style('display', 'block')
                                .style('padding-left', 0.5 + 'rem')
                                .style('padding-top', 0.5 + 'rem')
                                .style('color', 'red')
                                .style('font-size', 'x-small');
                                isOk = false;
                            }
                        }
                        else {
                            if (min > getMinValue(dimension) || 
                                max < getMaxValue(dimension)) {
                                popupWindowRangeError.text(`The range has to be bigger than 
                                ${minValue} and 
                                ${maxValue}.`)
                                .style('display', 'block')
                                .style('padding-left', 0.5 + 'rem')
                                .style('padding-top', 0.5 + 'rem')
                                .style('color', 'red')
                                .style('font-size', 'x-small');
                                isOk = false;
                            }
                        }
                        if (isOk) {
                            popupWindowRangeError.style('display', 'none');
                            setDimensionRange(dimension, min, max);
                            popupWindowRange.style('display', 'none');
                        }
                        
                    });
                    inputMaxRange.on('keypress', (event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            document.getElementById("buttonRange").click();
                        }
                    });
                    inputMinRange.on('keypress', (event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            document.getElementById("buttonRange").click();
                        }
                    });
                    closeButtonRange.on('click', () => {
                        popupWindowRange.style('display', 'none');
                    });
                    event.stopPropagation();
                });
            }
            else {
                d3.select('#rangeMenu').style('display', 'false')
                .style('color', 'lightgrey')
                .style('border-top', '0.08rem lightgrey solid');
            }
            if (!isNaN(values[0])) {
                d3.select('#resetRangeMenu')
                .style('visibility', 'visible')
                .style('color', 'black')
                .on('click', (event) => {
                    setDimensionRange(dimension, getMinValue(dimension), getMaxValue(dimension));
                    event.stopPropagation();
                });
            }
            else {
                d3.select('#resetRangeMenu').style('display', 'false')
                .style('color', 'lightgrey');
            }
            if (!isNaN(values[0])) {
                d3.select('#resetRoundRangeMenu')
                .style('visibility', 'visible')
                .style('color', 'black')
                .on('click', (event) => {
                    setDimensionRangeRounded(dimension, getMinValue(dimension), getMaxValue(dimension));
                    event.stopPropagation();
                });
            }
            else {
                d3.select('#resetRoundRangeMenu').style('display', 'false')
                .style('color', 'lightgrey');
            }
            if (!isNaN(values[0])) {
                let currentFilters = getFilter(dimension);
                inputMaxFilter.attr('value', currentFilters[0]);
                inputMinFilter.attr('value', currentFilters[1]);
                d3.select('#filterMenu')
                    .style('border-top', '0.08rem lightgrey solid')
                    .style('visibility', 'visible')
                    .style('color', 'black')
                    .on('click', (event) => {
                        popupWindowFilter.style('display', 'block')
                            .style('width', 17 + 'rem')
                            .style('height', 8 + 'rem')
                            .style('background', 'white')
                            .style('border', '0.0625rem solid black')
                            .style('border-radius', 0.25 + 'rem')
                            .style('padding', 1 + 'rem')
                            .style('margin', 'auto')
                            .style('top', 0)
                            .style('right', 0)
                            .style('bottom', 0)
                            .style('left', 0)
                            .style('z-index', 10);
                        const newText1 = dimension.length > 25 ? dimension.substr(0,25) + '...' : dimension;  
                        headerDimensionFilter.text(newText1);
                        filterButton.on('click', () => {
                            let min = d3.select('#minFilterValue').node().value;
                            let max = d3.select('#maxFilterValue').node().value;
                            const ranges = getDimensionRange(dimension);
                            const inverted = isInverted(dimension);
                            let isOk = true;
                        
                            if (inverted) {
                                if (min < ranges[1]) {
                                    min = ranges[1];
                                    popupWindowFilterError.text(`Min value is smaller than 
                                    ${getMinValue(dimension)}, filter is set to min.`)
                                    .style('display', 'block')
                                    .style('padding-left', 0.5 + 'rem')
                                    .style('padding-top', 0.5 + 'rem')
                                    .style('color', 'red')
                                    .style('font-size', 'x-small');
                                    isOk = false;
                                }
                                if (max > ranges[0]) {
                                    max = ranges[0];
                                    popupWindowFilterError.text(`Max value is bigger than 
                                    ${getMaxValue(dimension)}, filter is set to max.`)
                                    .style('display', 'block')
                                    .style('padding-left', 0.5 + 'rem')
                                    .style('padding-top', 0.5 + 'rem')
                                    .style('color', 'red')
                                    .style('font-size', 'x-small');
                                    isOk = false;
                                }
                            }
                            else {
                                if (min < ranges[0]) {
                                    min = ranges[0];
                                    popupWindowFilterError.text(`Min value is smaller than 
                                    ${getMinValue(dimension)}, filter is set to min.`)
                                    .style('display', 'block')
                                    .style('padding-left', 0.5 + 'rem')
                                    .style('padding-top', 0.5 + 'rem')
                                    .style('color', 'red')
                                    .style('font-size', 'x-small');
                                    isOk = false;
                                }
                                if (max > ranges[1]) {
                                    max = ranges[1];
                                    popupWindowFilterError.text(`Max value is bigger than 
                                    ${getMaxValue(dimension)}, filter is set to max.`)
                                    .style('display', 'block')
                                    .style('padding-left', 0.5 + 'rem')
                                    .style('padding-top', 0.5 + 'rem')
                                    .style('color', 'red')
                                    .style('font-size', 'x-small');
                                    isOk = false;
                                }
                            }
                            if (inverted) {
                                setFilter(dimension, min, max);
                            }
                            else {
                                setFilter(dimension, max, min);
                            }
                            if (isOk) {
                                popupWindowFilterError.style('display', 'none');
                                popupWindowFilter.style('display', 'none');
                            }
                    });
                    inputMaxFilter.on('keypress', (event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            document.getElementById("buttonFilter").click();
                        }
                    });
                    inputMinFilter.on('keypress', (event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            document.getElementById("buttonFilter").click();
                        }
                    });
                    closeButtonFilter.on('click', () => {
                        popupWindowFilter.remove();
                        popupWindowFilterError.style('display', 'none');
                    });
                    event.stopPropagation();
                });
            }
            else {
                d3.select('#filterMenu').style('display', 'false')
                .style('color', 'lightgrey')
                .style('border-top', '0.08rem lightgrey solid');
            }
            if (!isNaN(values[0])) {
                d3.select('#resetfilterMenu')
                    .style('visibility', 'visible')
                    .style('color', 'black')
                    .on('click', (event) => {
                        const range = getDimensionRange(dimension);
                        if (isInverted(dimension)) {
                            setFilter(dimension, range[1], range[0]);
                        }
                        else {
                            setFilter(dimension, range[1], range[0]);
                        }
                        event.stopPropagation();
                });
            }
            else {
                d3.select('#resetfilterMenu').style('display', 'false')
                .style('color', 'lightgrey');
            }
            d3.select('#showAllMenu')
                .style('visibility', 'visible')
                .style('border-top', '0.08rem lightgrey solid')
                .on('click', (event) => {
                    const hiddenDimensions = getAllHiddenDimensionNames();
                    for(let i = 0; i < hiddenDimensions.length; i++) {
                        show(hiddenDimensions[i]);
                    }
                    event.stopPropagation();
                });
            d3.selectAll('.contextmenu').style('padding', 0.35 + 'rem');
            event.preventDefault();
        });
}

// Brushing

function setRectToDrag(featureAxis: any, svg: any, parcoords: { xScales: any; yScales: {}; 
    dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
    features: any[]; newDataset: any[]; }, active: any, tooltipValuesTop: any,
    tooltipValuesDown: any): void {
    
    let delta: any;
    featureAxis
        .each(function (d) {
            const processedDimensionName = helper.cleanString(d.name);
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

function setBrushUp(featureAxis: any, parcoords: { xScales: any; yScales: {}; dragging: {}; 
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; 
    newDataset: any[];}, active: any, tooltipValues: any): void {
    
    featureAxis
        .each(function (d) {
            const processedDimensionName = helper.cleanString(d.name);
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
                .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowTopCursor(), 13)}') 8 8, auto`)
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

function setBrushDown(featureAxisG: any, parcoords: { xScales: any; yScales: {}; dragging: {}; 
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; 
    newDataset: any[];}, active: any, tooltipValues: any): void {
    
    featureAxisG
        .each(function (d) {
            const processedDimensionName = helper.cleanString(d.name);
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
                .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowBottomCursor(), 13)}') 8 8, auto`)
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

function getSelectedRecords(event) {
    let selection = event.selection;
    let dimensions = getAllVisibleDimensionNames();

    for (let i = 0; i < window.parcoords.newDataset.length; i++) {
        let recordData = window.parcoords.newDataset[i];
       
        for (let j = 0; j < dimensions.length - 1; j++) {
            let isIntersect = selection[0][0] <= window.parcoords.xScales(dimensions[j+1]) && 
            window.parcoords.xScales(dimensions[j]) < selection[1][0] &&
            selection[0][1] <= window.parcoords.yScales[dimensions[j+1]](recordData[dimensions[j+1]]) && 
            window.parcoords.yScales[dimensions[j]](recordData[dimensions[j]]) < selection[1][1];
            if (isIntersect) {
                setSelected(recordData[window.hoverlabel]);
            }
        }
    
    }
}

// Dragging

function onDragStartEventHandler(parcoords: any): any {
    {
        return function onDragStart (d)
        {
            this.__origin__ = parcoords.xScales((d.subject).name);
            parcoords.dragging[(d.subject).name] = this.__origin__;
            parcoords.dragPosStart[(d.subject).name] = this.__origin__;
            const element = document.getElementById("parallelcoords");
            window.scrollXPos = element.scrollLeft;
        }
    }
}

function scroll(parcoords, d) {
    const element = document.getElementById("parallelcoords");
    if(parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).name] &&
             parcoords.dragging[(d.subject).name] > window.innerWidth - 20) {
                element.scrollLeft += 5;
            }
            else if (window.scrollXPos + 20 > parcoords.dragging[(d.subject).name]) {
                element.scrollLeft -= 5;
            }
}

function onDragEventHandler(parcoords: any, active: any, featureAxis: any, width: any): any {
    {
        return function onDrag(d) {
            
            if (window.timer !== null) {
                clearInterval(window.timer);
                window.timer = null;
            }
            window.timer = setInterval(() => {scroll(parcoords, d), 100});
            
            parcoords.dragging[(d.subject).name] = Math.min(width-window.paddingXaxis, 
                Math.max(window.paddingXaxis, this.__origin__ += d.x));

            active.each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            });

            parcoords.newFeatures.sort((a, b) => {
                return position(b, parcoords.dragging, parcoords.xScales) 
                    - position(a, parcoords.dragging, parcoords.xScales) - 1;
            });
        
            parcoords.xScales.domain(parcoords.newFeatures);
           
            featureAxis.attr('transform', (d) => {
                return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
            });
        }
    }
}

function onDragEndEventHandler(parcoords: any, featureAxis: any, active: any): any {
    {
        return function onDragEnd(d) {
            const width = window.width;
            const distance = (width-80)/parcoords.newFeatures.length;
            const init = parcoords.dragPosStart[(d.subject).name];

            if (parcoords.dragPosStart[(d.subject).name] > parcoords.dragging[(d.subject).name]) {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + position(d.name, init-distance, parcoords.xScales) + ')';
                })
            }
            else {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + position(d.name, init+distance, parcoords.xScales) + ')';
                })
            }
            delete this.__origin__;
            delete parcoords.dragging[(d.subject).name];
            delete parcoords.dragPosStart[(d.subject).name];
            
            trans(active).each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            });
        };
    }
}