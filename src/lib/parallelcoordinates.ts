import 'd3-transition';
import { select, selectAll} from 'd3-selection';
import { drag } from 'd3-drag';
import { easeCubic } from 'd3-ease';
import * as brush from './brush';
import * as utils from './utils';
import * as helper from './helper';
import * as context from './contextMenu';
import * as icon from './icons/icons';
import * as toolbar from './toolbar';
import * as api from './helperApiFunc';
import { yAxis, parcoords, width, svg, height, active, setYaxis, setRefreshData, setSvg, padding, refreshData, setWidth, setHeight, setPadding, setPaddingXaxis, setInitDimension, setActive, setYScales, setData, setFeatures, setParcoords, setNewDataset, setNewFeatures, setCurrentPosOfDims, setDragPosStart, setDragging, setXScales, setHoverLabel, paddingXaxis, key, hoverlabel, setKey } from './globals';

declare const window: any;

//******** API ********//

//---------- Invert Functions ----------

export function invertWoTransition(dimension: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select(dimensionId)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())));

    helper.trans(active).each(function (d: any) {
        select(this)
            .attr('d', (d: any) => {
                return helper.linePath(d, parcoords.newFeatures);
            })
    });

    const filter = api.getFilter(dimension);
    brush.addSettingsForBrushing(dimension, helper.isInverted(dimension));
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, dimension, "isInverted");
    }
}


export function setInversionStatus(dimension: string, status: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = select(invertId);
    const arrow = status === 'ascending' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = status === 'ascending' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(status === 'ascending' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())))
        .ease(easeCubic);


    helper.trans(active).each(function (d: any) {
        select(this)
            .transition()
            .duration(1000)
            .attr('d', (d: any) => {
                return helper.linePath(d, parcoords.newFeatures);
            })
            .ease(easeCubic)
    });

    const filter = api.getFilter(dimension);
    brush.addSettingsForBrushing(dimension, helper.isInverted(dimension));
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, dimension, "isInverted");
    }
}


//---------- Move Functions ----------

export function moveByOne(dimension: string, direction: string): void {

    const indexOfDimension = parcoords.newFeatures.indexOf(dimension);

    const indexOfNeighbor = direction == 'right' ? indexOfDimension - 1
        : indexOfDimension + 1;

    const neighbour = parcoords.newFeatures[indexOfNeighbor];

    const pos = parcoords.xScales(dimension);
    const posNeighbour = parcoords.xScales(neighbour);

    const distance = parcoords.xScales.step();

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

    let active = select('g.active').selectAll('path');
    let featureAxis = selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', function (d: any) {
            return helper.linePath(d, parcoords.newFeatures);
        })
        .ease(easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', function (d: { name: any; }) {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(easeCubic);

    delete parcoords.dragging[dimension];
    delete parcoords.dragging[neighbour];
}

export function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void {
    const indexOfDimensionA = api.getDimensionPosition(dimensionA);
    const indexOfDimensionB = api.getDimensionPosition(dimensionB);

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

    const positionA = parcoords.xScales(dimensionA);
    const positionB = parcoords.xScales(dimensionB);

    parcoords.dragging[dimensionA] = positionB;
    parcoords.dragging[dimensionB] = positionA;

    const indexOfDimensionA = parcoords.newFeatures.indexOf(dimensionA);
    const indexOfDimensionB = parcoords.newFeatures.indexOf(dimensionB);

    [parcoords.newFeatures[indexOfDimensionA], parcoords.newFeatures[indexOfDimensionB]] =
        [parcoords.newFeatures[indexOfDimensionB], parcoords.newFeatures[indexOfDimensionA]];

    parcoords.xScales.domain(parcoords.newFeatures);

    let active = select('g.active').selectAll('path');
    let featureAxis = selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', (d: any) => {
            return helper.linePath(d, parcoords.newFeatures);
        });

    featureAxis.transition()
        .duration(1000)
        .attr('transform', (d: { name: any; }) => {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(easeCubic);

    delete parcoords.dragging[dimensionA];
    delete parcoords.dragging[dimensionB];
}

//---------- Selection Functions ----------

export function getSelected(): string[] {
    let selected = [];

    const records = api.getAllRecords();
    for (let i = 0; i < records.length; i++) {
        let isselected = api.isSelected(records[i]);
        if (isselected) {
            selected.push(records[i]);
        }
    }
    return selected;
}

export function setSelection(records: string[]): void {
    for (let i = 0; i < records.length; i++) {
        let stroke = select('#' + utils.cleanString(records[i])).style('stroke');
        if (stroke !== 'lightgrey') {
            select('#' + utils.cleanString(records[i]))
                .classed('selected', true)
                .transition()
                .style('stroke', 'rgba(255, 165, 0, 1)');
        }
    }
}

export function toggleSelection(record: string): void {
    const selected = api.isSelected(record);
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
    selectAll('#' + utils.cleanString(record))
        .classed('selected', false)
        .transition()
        .style('stroke', 'rgba(0, 129, 175, 0.5)');
}

export function isRecordInactive(record: string): boolean {
    const stroke = select('#' + utils.cleanString(record));
    let node = stroke.node();
    let style = node.style.stroke;
    return style === 'rgba(211, 211, 211, 0.4)' ? true : false;
}

//---------- Selection Functions With IDs ----------

export function setSelectionWithId(recordIds: string[]): void {
    let records: string[] = [];
    for (let i = 0; i < recordIds.length; i++) {
        let record = getRecordWithId(recordIds[i]);
        records.push(record);
    }
    setSelection(records);
}

export function isSelectedWithRecordId(recordId: string): boolean {
    let record = getRecordWithId(recordId);
    return api.isSelected(record);
}

export function getRecordWithId(recordId: string): string {
    const item = parcoords.currentPosOfDims.find((object: { recordId: string; }) => object.recordId == recordId);
    return item.key;
}

export function toggleSelectionWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    toggleSelection(record);
}

export function setSelectedWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    setSelected(record);
}

export function setUnselectedWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    setUnselected(record);
}

//---------- IO Functions ----------

export function drawChart(content: []): void {
    setRefreshData(structuredClone(content));
    deleteChart();

    let newFeatures = content['columns'].reverse();

    setUpParcoordData(content, newFeatures);

    const height = 360;

    let wrapper = select('#parallelcoords');

    if (wrapper === null)
        wrapper = select<HTMLBodyElement, unknown>(document.body)
        .append<HTMLDivElement>("div")
        .attr('id', 'parallelcoords');

    wrapper
        .style('display', 'block')
        .style('width', '100%')
        .style('margin', '0')
        .style('padding', '0')
        .style('text-align', 'left')
        .style('justify-content', 'center')
        .style('align-items', 'center');

    const chartWrapper = wrapper.append('div')
        .attr('id', 'chartWrapper')
        .style('display', 'block')
        .style('width', '100%')
        .style('margin', '0')
        .style('padding', '0')
        .style('text-align', 'left');

    chartWrapper.append('div')
        .attr('id', 'toolbarRow')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('align-items', 'center')
        .style('justify-content', 'flex-start')
        .style('margin-top', '1.2rem')
        .style('margin-left', '1rem')
        .style('margin-bottom', 0);

    toolbar.createToolbar(parcoords.newDataset);

    setSvg(chartWrapper.append('svg')
        .attr('id', 'pc_svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'Verdana, sans-serif'));

    setDefsForIcons();

    setFeatureAxis(svg, yAxis, parcoords, width, padding);

    setActive(setActivePathLines(svg, content, parcoords));

    svg
        .on("contextmenu", function (event: any) {
            event.stopPropagation();
            event.preventDefault();
        })
        .on("mouseenter", function () {
            helper.cleanTooltip();
        })
        .on("click", function () {
            clearSelection();
        })
        .on("mousedown.selection", function (event: any) {
            event.preventDefault();
        });

    window.onclick = () => {
        select('#contextmenu').style('display', 'none');
        select('#contextmenuRecords').style('display', 'none');
    }
}

export function reset() {
    drawChart(refreshData);
    let toolbar = select('#toolbar');
    toolbar.style('max-width', '12.5rem')
        .style('opacity', '1')
        .style('pointer-events', 'auto');

    let toggleButton = select('#toggleButton');
    toggleButton.attr('title', 'Collapse toolbar');

    toggleButton.html(icon.getCollapseToolbarIcon());
}


export function refresh(): void {
    const dimensions = api.getAllVisibleDimensionNames();
    for (let i = 0; i < dimensions.length; i++) {
        api.show(dimensions[i]);
    }
}

export function deleteChart(): void {
    select('#pc_svg').remove();
    select('#contextmenu').remove();
    select('#contextmenuRecords').remove();
    select('#modalFilter').remove();
    select('#modalRange').remove();
    select('#refreshButton').remove();
    select('#showData').remove();
    select('#toolbarRow').remove();
    parcoords.currentPosOfDims.length = 0;
}

//---------- Helper Functions ----------


// ---------- Needed for Built-In Interactivity Functions ---------- //

function setUpParcoordData(data: any, newFeatures: []): void {

    setPadding(60);
    setPaddingXaxis(60);
    setWidth(newFeatures.length * 100);
    setHeight(400);
    setInitDimension(newFeatures);

    const label = newFeatures[newFeatures.length - 1];

    data.sort((a: { [x: string]: any; }, b: { [x: string]: any; }) => {
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

    setFeatures(dataset[0]);
    setNewDataset(dataset[1]);

    setXScales(helper.setupXScales(dataset[0]));
    setYScales(helper.setupYScales(dataset[0], dataset[1]));
    setNewFeatures(newFeatures);
    setData(data);

    for (let i = 0; i < newFeatures.length; i++) {
        let max: number;
        let min: number;
        if (isNaN(Math.max(...parcoords.newDataset.map((o: { [x: string]: any; }) => o[newFeatures[i]])))) {
            const sorted = [...parcoords.newDataset.map((o: { [x: string]: any; }) => o[newFeatures[i]])].sort((a, b) => a.localeCompare(b));
            min = sorted[sorted.length - 1];
            max = sorted[0];
        }
        else {
            max = Math.max(...parcoords.newDataset.map((o: { [x: string]: any; }) => o[newFeatures[i]]));
            min = Math.min(...parcoords.newDataset.map((o: { [x: string]: any; }) => o[newFeatures[i]]));
        }
        const ranges = api.getDimensionRange(newFeatures[i]);
        parcoords.currentPosOfDims.push(
            {
                key: newFeatures[i], top: 80, bottom: 320, isInverted: false, index: i,
                min: min, max: max, sigDig: 0, currentRangeTop: ranges[1], currentRangeBottom: ranges[0], currentFilterBottom: ranges[0], currentFilterTop: ranges[1]
            }
        );
    }
    const hiddenDims = api.getAllHiddenDimensionNames();

    setYaxis(helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));

    let counter = 0;
    parcoords.features.map((x: { name: string | number; }) => {
        let numberOfDigs = 0
        let values = parcoords.newDataset.map((o: { [x: string]: any; }) => o[x.name]);
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
        utils.addNumberOfDigs(numberOfDigs, parcoords.currentPosOfDims, x.name, 'sigDig');
        utils.addNumberOfDigs(counter, parcoords.currentPosOfDims, x.name, 'recordId');
        counter = counter + 1;
    });

    setHoverLabel(api.getAllVisibleDimensionNames()[0]);
}



const tooltipPath = select('body')
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

const tooltipTest = select('body')
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

const handlePointerEnter = (event: any, d: any) => {
    clearExistingDelay();
    doNotHighlight();

    const data = helper.getAllPointerEventsData(event);

    highlight(data);
    helper.createTooltipForPathLine(data, tooltipTest, event);

    const datasetMap = new Map();
    parcoords.newDataset.forEach((record: { [x: string]: any; }) => {
        datasetMap.set(record[hoverlabel], record);
    });

    data.forEach((item: any) => {
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
    select('#tooltipTest').style('visibility', 'hidden');
    helper.cleanTooltip();
};

select('#pc_svg').on('mouseleave', () => {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    cleanupTimeout = setTimeout(() => {
        doNotHighlight();
        clearExistingDelay();
        tooltipPath.style('visibility', 'hidden');
        select('#tooltipTest').style('visibility', 'hidden');
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

    let contextMenu = select('#parallelcoords')
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
        .attr('class', (d: { [x: string]: string; }) => {
            const keys = Object.keys(d);
            setKey(keys[0]);
            const selected_value = utils.cleanString(d[key]);
            return 'line ' + selected_value;
        })
        .attr('id', (d: { [x: string]: string; }) => {
            return utils.cleanString(d[key]);
        })
        .each(function (d: any) {
            select(this)
                .attr('d', helper.linePath(d, parcoords.newFeatures));
        })
        .style('pointer-events', 'stroke')
        .style('stroke', 'rgba(0, 129, 175, 0.5)')
        .style('stroke-width', '0.12rem')
        .style('fill', 'none')
        .on('pointerenter', handlePointerEnter)
        .on('pointerleave', handlePointerLeaveOrOut)
        .on('pointerout', handlePointerLeaveOrOut)
        .on('mouseenter', handlePointerEnter)
        .on('mouseout', handlePointerLeaveOrOut)
        .on('mouseleave', handlePointerLeaveOrOut)
        .on('click', function (event: { metaKey: any; shiftKey: any; ctrlKey: any; stopPropagation: () => void; }, d: any) {
            const data = helper.getAllPointerEventsData(event);
            const selectedRecords = getSelected();

            if (event.metaKey || event.shiftKey) {
                data.forEach((record: string) => {
                    if (selectedRecords.includes(record)) {
                        setUnselected(record);
                    } else {
                        selectRecord([record]);
                    }
                });
            }
            else if (event.ctrlKey) {
                data.forEach((record: string) => {
                    toggleSelection(record);
                })
            }
            else {
                clearSelection();
                selectRecord(data);
            }
            event.stopPropagation();
        })
        .on('contextmenu', function (event: any, d: any) {
            setContextMenuForActiceRecords(contextMenu, event, d);
        });

    return active;
}

const delay1 = 50;
export const throttleShowValues = utils.throttle(helper.createToolTipForValues, delay1);

function setContextMenuForActiceRecords(contextMenu: any, event: any, d: any):void {
    const container = document.querySelector("#parallelcoords");
    const rect = container.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    contextMenu.style('left', x + 'px')
        .style('top', y + 'px')
        .style('display', 'block')
        .style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.35 + 'rem')
        .style('background-color', 'white').style('margin-left', 0.5 + 'rem')
        .style('cursor', 'pointer')
        .on('click', (event: { stopPropagation: () => void; }) => {
            event.stopPropagation();
        });

    select('#selectRecord')
        .on('click', (event: { stopPropagation: () => void; }) => {
            setSelected(d[hoverlabel]);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#unSelectRecord')
        .on('click', (event: { stopPropagation: () => void; }) => {
            setUnselected(d[hoverlabel]);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#toggleRecord')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event: { stopPropagation: () => void; }) => {
            toggleSelection(d[hoverlabel]);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#addSelection')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event: { stopPropagation: () => void; }) => {
            let selectedRecords = [];
            selectedRecords = getSelected();
            selectedRecords.push(d[hoverlabel]);
            setSelection(selectedRecords);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#removeSelection')
        .on('click', (event: { stopPropagation: () => void; }) => {
            setUnselected(d[hoverlabel]);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });
    selectAll('.contextmenu').style('padding', 0.35 + 'rem');
    event.preventDefault();
}

function setFeatureAxis(svg: any, yAxis: any,
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
        .attr('transform', (d: { name: any; }) => ('translate(' + parcoords.xScales(d.name) + ')'));

    let tooltipValuesLabel = select('body')
        .append('g')
        .style('position', 'absolute')
        .style('visibility', 'hidden');

    featureAxis
        .append('g')
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
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

    let tooltipValues = select('body')
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

    const brushOverlay = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "transparent")
        .style("pointer-events", "none");

    setBrushDown(featureAxis, parcoords, tooltipValues, brushOverlay);

    setBrushUp(featureAxis, parcoords, tooltipValues, brushOverlay);

    setRectToDrag(featureAxis, svg, parcoords, tooltipValuesTop, tooltipValuesDown);

    setMarker(featureAxis);

    context.setContextMenu(featureAxis);

    setInvertIcon(featureAxis, padding);
}

export function showMarker(dimension: string) {
    const cleanDimensionName = utils.cleanString(dimension);
    select('#marker_' + cleanDimensionName).attr('opacity', 1);
}

export function hideMarker(dimension: string) {
    const cleanDimensionName = utils.cleanString(dimension);
    select('#marker_' + cleanDimensionName).attr('opacity', 0);
}

function setDefsForIcons(): void {
    const svgContainer = svg;
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

    defs.append('image')
        .attr('id', 'brush_image_top_active')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowTopActive());

    defs.append('image')
        .attr('id', 'brush_image_bottom_active')
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', 'data:image/svg+xml;,' + icon.getArrowBottomActive());
}

// Hovering

let currentlyHighlightedItems = [];

function highlight(data: any[]) {

    const cleanedItems = data.map((item: string) =>
        utils.cleanString(item).replace(/[.,]/g, '')
    );

    currentlyHighlightedItems = [...cleanedItems];

    cleanedItems.forEach((item: string) => {
        select('#' + item)
            .transition()
            .duration(5)
            .style('stroke', 'rgba(200, 28, 38, 0.7)');
    });
}

function doNotHighlight() {

    if (!currentlyHighlightedItems.length) return;

    currentlyHighlightedItems.forEach(item => {
        const line = select('#' + item);
        if (line.classed('selected')) {
            line.transition()
                .style('stroke', 'rgba(255, 165, 0, 1)');
        }
        else {
            line.transition()
                .style('stroke', 'rgba(0, 129, 175, 0.5)');
        }
    });

    currentlyHighlightedItems = [];
}

// Selecting

function selectRecord(linePaths: any): void {
    for (let i = 0; i < linePaths.length; i++) {
        setSelected(linePaths[i]);
    }
}

function clearSelection(): void {
    const selectedRecords = getSelected();
    selectedRecords.forEach(element => {
        select('#' + utils.cleanString(element))
            .classed('selected', false)
            .transition()
            .style('stroke', 'rgba(0, 129, 175, 0.5)')
    });
}


function setInvertIcon(featureAxis: any, padding: number): void {
    let value = (80 / 1.5).toFixed(4);

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
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
                .attr('id', 'dimension_invert_' + processedDimensionName)
                .text('up')
                .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowDownCursor()), 12)}') 8 8, auto`);
        })
        .on('click', (event: { stopPropagation: () => void; }, d: { name: string; }) => {
            api.invert(d.name);
            event.stopPropagation();
        });
}

function setMarker(featureAxis: any): void {
    featureAxis
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
                .append('g')
                .attr('class', 'marker')
                .append('rect')
                .attr('id', 'marker_' + processedDimensionName)
                .attr('width', 44)
                .attr('height', 305)
                .attr('x', -22)
                .attr('y', 30)
                .attr('fill', 'none')
                .attr('stroke', "rgb(228, 90, 15)")
                .attr('stroke-width', '0.1rem')
                .attr('opacity', '0')
        });
}

// Brushing

function setRectToDrag(featureAxis: any, svg: any, parcoords: {
    xScales: any; yScales: {};
    dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any;
    features: any[]; newDataset: any[];
}, tooltipValuesTop: any,
    tooltipValuesDown: any): void {

    let delta: any;
    featureAxis
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
                .append('g')
                .attr('class', 'rect')
                .append('rect')
                .attr('id', 'rect_' + processedDimensionName)
                .attr('width', 12)
                .attr('height', 240)
                .attr('x', -6)
                .attr('y', 80)
                .attr('fill', 'rgb(255, 255, 0)')
                .attr('opacity', '0.5')
                .style('cursor', 'default')
                .style("touch-action", "none")
                .style("-webkit-user-select", "none")
                .style("user-select", "none")
                .style("pointer-events", "all")
                .on('mousedown.selection', function (event: { preventDefault: () => void; }) {
                    event.preventDefault();
                })
                .call(drag()
                    .on('drag', (event: any, d: any) => {
                        if (parcoords.newFeatures.length > 25) {
                            brush.throttleDragAndBrush(processedDimensionName, d, event, delta,
                                tooltipValuesTop, tooltipValuesDown, window);
                        }
                        else {
                            brush.dragAndBrush(processedDimensionName, d, event, delta,
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

function setBrushUp(featureAxis: any, parcoords: {
    xScales: any; yScales: {}; dragging: {};
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
}, tooltipValues: any, brushOverlay: any): void {

    featureAxis
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
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
                .style('cursor', 'default')
                .style("touch-action", "none")
                .style("-webkit-user-select", "none")
                .style("user-select", "none")
                .style("pointer-events", "all")
                .on('mousedown.selection', function (event: { preventDefault: () => void; }) {
                    event.preventDefault();
                })
                .call(drag()
                    .on('drag', (event: any, d: any) => {
                        brushOverlay.raise().style("pointer-events", "all");
                        if (parcoords.newFeatures.length > 25) {
                            brush.throttleBrushUp(processedDimensionName, event, d, tooltipValues, window);
                        }
                        else {
                            brush.brushUp(processedDimensionName, event, d, tooltipValues, window);
                        }
                    })
                    .on('end', () => {
                        brushOverlay.style("pointer-events", "none");
                        tooltipValues.style('visibility', 'hidden');
                    }));
            });
        
}

function setBrushDown(featureAxis: any, parcoords: {
    xScales: any; yScales: {}; dragging: {};
    dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
}, tooltipValues: any, brushOverlay: any): void {

    featureAxis
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
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
                .style('cursor', 'default')
                .style("touch-action", "none")
                .style("-webkit-user-select", "none")
                .style("user-select", "none")
                .style("pointer-events", "all")
                .on('mousedown.selection', function (event: { preventDefault: () => void; }) {
                    event.preventDefault();
                })
                .call(drag()
                    .on('drag', (event: any, d: any) => {
                        brushOverlay.raise().style("pointer-events", "all");
                        if (parcoords.newFeatures.length > 25) {
                            brush.throttleBrushDown(processedDimensionName, event, d, tooltipValues, window);
                        }
                        else {
                            brush.brushDown(processedDimensionName, event, d, tooltipValues, window);
                        }
                    })
                    .on('end', () => {
                        brushOverlay.style("pointer-events", "none");
                        tooltipValues.style('visibility', 'hidden');
                    }));
        });
}