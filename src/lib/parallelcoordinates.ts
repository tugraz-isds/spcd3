import 'd3-transition';
import { zoom } from 'd3-zoom';
import { select, selectAll } from 'd3-selection';
import * as brush from './brush';
import * as utils from './utils';
import * as helper from './helper';
import * as context from './contextMenu';
import * as icon from './icons/icons';
import * as toolbar from './toolbar';
import * as api from './helperApiFunc';
import { yAxis, parcoords, width, svg, setYaxis, setRefreshData, setSvg, padding, 
    refreshData, setWidth, setHeight, setPadding, setPaddingXaxis, setInitDimension,
    setActive, setYScales, setData, setFeatures, setNewDataset, setNewFeatures,
    setXScales, setHoverLabel, key, hoverlabel, setKey, height } from './globals';

declare const window: any;

//---------- IO Functions ----------

export function drawChart(content: []): void {
    setRefreshData(structuredClone(content));
    deleteChart();

    let newFeatures = content['columns'].reverse();

    setUpParcoordData(content, newFeatures);

    const height = 360;

    let wrapper = select('#parallelcoords');

    if (wrapper === null)
    {
        wrapper = select<HTMLBodyElement, unknown>(document.body)
            .append<HTMLDivElement>("div")
            .attr('id', 'parallelcoords')
            .style('display', 'block')
            .style('width', '100%')
            .style('margin', '0')
            .style('padding', '0')
            .style('text-align', 'left')
            .style('justify-content', 'center')
            .style('align-items', 'center');
    }

    const chartWrapper = wrapper.append('div')
        .attr('id', 'chartWrapper');

    chartWrapper.append('div')
        .attr('id', 'toolbarRow')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('align-items', 'center')
        .style('justify-content', 'flex-start')
        .style('margin-left', '2rem')
        .style('font-size', '0.8vw');

    toolbar.createToolbar(parcoords.newDataset);

    setSvg(chartWrapper.append('svg')
        .attr('id', 'pc_svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('font-family', 'Verdana, sans-serif'));

    const plot = svg.append("g")
        .attr("class", "plot");

    setDefsForIcons();

    setFeatureAxis(plot, yAxis, parcoords, width, padding);

    setActive(setActivePathLines(plot, content, parcoords));

    svg.on("contextmenu", function (event: any) {
            event.stopPropagation();
            event.preventDefault();
        })
        .on("mouseenter", function () {
            helper.cleanTooltip();
        })
        .on("click", function () {
            api.clearSelection();
        })
        .on("mousedown.selection", function (event: any) {
            event.preventDefault();
        });

        /*const zoomBehavior = zoom()
            .scaleExtent([0.5, 20])
            .translateExtent([[0, 0], [width * 3, height * 3]])
            .on("zoom", (event) => {
                plot.attr("transform", event.transform);
            });


        const identity = { k: 1, x: 0, y: 0 };
        svg.call(zoomBehavior)
            .on("dblclick.zoom", null)
            .on("dblclick.reset", (event) => {
                event.preventDefault();
                svg.transition()
                    .duration(400)
                    .call(zoomBehavior.transform, identity);
            });*/

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

// ---------- Needed for Built-In Interactivity Functions ---------- //

function setUpParcoordData(data: any, newFeatures: []): void {

    setPadding(60);
    setPaddingXaxis(60);
    setInitDimension(newFeatures);
    setHeight(400);
  
    if (newFeatures.length <= 6) {
      setWidth(newFeatures.length * 180);
    } else {
      setWidth(newFeatures.length * 100);
    }

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
                key: newFeatures[i], top: 50, bottom: 350, isInverted: false, index: i,
                min: min, max: max, sigDig: 0, currentRangeTop: ranges[1], currentRangeBottom: ranges[0], 
                currentFilterBottom: ranges[0], currentFilterTop: ranges[1]
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

const tooltipLabel = select('body')
    .append('div')
    .attr('id', 'tooltip_label')
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
    helper.createTooltipForLabel(data, tooltipLabel, event);

    const datasetMap = new Map();
    parcoords.newDataset.forEach((record: { [x: string]: any; }) => {
        datasetMap.set(record[hoverlabel], record);
    });

    data.forEach((item: any, i: number) => {
    const rec = datasetMap.get(item);
    if (rec) {
      helper.createToolTipForValues(rec, rec.id ?? String(i));
    }
  });
};

const handlePointerLeaveOrOut = () => {
    doNotHighlight();
    clearExistingDelay();
    select('#tooltip_label').style('visibility', 'hidden');
    helper.cleanTooltip();
};

const handleClick = (event, d) => {
    const data = helper.getAllPointerEventsData(event);
    const selectedRecords = api.getSelected();

    if (event.metaKey || event.shiftKey) {
        data.forEach((record: string) => {
        if (selectedRecords.includes(record)) {
            api.setUnselected(record);
        } else {
            api.setSelected(record);
        }});
    }
    else if (event.ctrlKey) {
        data.forEach((record: string) => {
            api.toggleSelection(record);
        })
    }
    else {
        api.clearSelection();
        api.setSelection(data);
    }
    event.stopPropagation();
}

select('#pc_svg').on('mouseleave', () => {
    if (cleanupTimeout) clearTimeout(cleanupTimeout);
    cleanupTimeout = setTimeout(() => {
        doNotHighlight();
        clearExistingDelay();
        select('#tooltip_label').style('visibility', 'hidden');
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

function setActivePathLines(svg, content, parcoords): any {

    const contextMenu = createContextMenuForRecords();
    // active polylines/paths/records
    return svg.append('g')
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
        .on('click', handleClick)
        .on('contextmenu', function (event: any, d: any) {
            handleRecordContextMenu(contextMenu, event, d);
            select('#contextmenu').style('display', 'none');
        });
}

function createContextMenuForRecords(): any {
    let contextMenu = select('#parallelcoords')
        .append('g')
        .attr('id', 'contextmenuRecords')
        .style('position', 'absolute')
        .style('display', 'none');

    createContextMenuItem(contextMenu, 'selectRecord', 'contextmenu', 'Select Record');
    createContextMenuItem(contextMenu, 'unSelectRecord', 'contextmenu', 'Unselect Record');
    createContextMenuItem(contextMenu, 'toggleRecord', 'contextmenu', 'Toggle Record');
    createContextMenuItem(contextMenu, 'addSelection', 'contextmenu', 'Add to Selection');
    createContextMenuItem(contextMenu, 'removeSelection', 'contextmenu', 'Remove from Selection');
    return contextMenu;
}

function createContextMenuItem(contextMenu, id, className, text)
{
     contextMenu.append('div')
        .attr('id', id)
        .attr('class', className)
        .text(text);
}

function handleRecordContextMenu(contextMenu: any, event: any, d: any): void {
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

    select('#selectRecord').on('click', (event) => {
        api.setSelected(d[hoverlabel]);
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    select('#unSelectRecord').on('click', (event) => {
        api.setUnselected(d[hoverlabel]);
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    select('#toggleRecord').style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            api.toggleSelection(d[hoverlabel]);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#addSelection').style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            let selectedRecords = [];
            selectedRecords = api.getSelected();
            selectedRecords.push(d[hoverlabel]);
            api.setSelection(selectedRecords);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#removeSelection').on('click', (event) => {
        api.setUnselected(d[hoverlabel]);
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    selectAll('.contextmenu').style('padding', 0.35 + 'rem');
    
    event.preventDefault();
}

const delay1 = 50;
export const throttleShowValues = utils.throttle(helper.createToolTipForValues, delay1);

function setFeatureAxis(svg, yAxis, parcoords, width, padding): void {

    let featureAxis = svg.selectAll('g.feature')
        .data(parcoords.features)
        .enter()
        .append('g')
        .attr('class', 'dimensions')
        .attr('transform', (d: { name: any; }) => ('translate(' + parcoords.xScales(d.name) + ')'));

    featureAxis.append('g')
        .each(function (d: { name: string; }) {
            const processedDimensionName = utils.cleanString(d.name);
            select(this)
                .attr('id', 'dimension_axis_' + processedDimensionName)
                .call(yAxis[d.name]);
        });

    /*let tickElements = document.querySelectorAll('g.tick');
    tickElements.forEach((gElement) => {
        let transformValue = gElement.getAttribute('transform');
        let yValue = transformValue.match(/translate\(0,([^\)]+)\)/);
        if (yValue) {
            let originalValue = parseFloat(yValue[1]);
            let shortenedValue = originalValue.toFixed(4);
            gElement.setAttribute('transform', `translate(0,${shortenedValue})`);
        }
    });*/

    const brushOverlay = svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .style("fill", "transparent")
    .style("pointer-events", "none");

    brush.setBrushDown(featureAxis, brushOverlay);

    brush.setBrushUp(featureAxis, brushOverlay);

    brush.setRectToDrag(featureAxis);

    setMarker(featureAxis);

    context.setContextMenu(featureAxis);

    setInvertIcon(featureAxis);
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

    createImage(defs, 'arrow_image_up', 12, 12, icon.getArrowUp());
    createImage(defs, 'arrow_image_down', 12, 12, icon.getArrowDown());
    createImage(defs, 'brush_image_top', 14, 10, icon.getArrowTop());
    createImage(defs, 'brush_image_bottom', 14, 10, icon.getArrowBottom());
    createImage(defs, 'brush_image_top_active', 14, 10, icon.getArrowTopActive());
    createImage(defs, 'brush_image_bottom_active', 14, 10, icon.getArrowBottomActive());
}

function createImage(defs, id, width, height, image): void {
    defs.append('image')
        .attr('id', id)
        .attr('width', width)
        .attr('height', height)
        .attr('href', 'data:image/svg+xml;,' + image);
}

function setInvertIcon(featureAxis): void {
    let value = (50 / 1.3).toFixed(4);

    const svg = featureAxis
        .append('svg')
        .attr('x', -6 - 22)
        .attr('y', Number(value) - 22)
        .attr('width', 44)
        .attr('height', 22)
        .style('overflow', 'visible') 

    svg.append('rect')
        .attr('id', 'invert_hitbox')
        .attr('class', 'hitbox')
        .attr('x', 6)
        .attr('y', Number(value)-33)
        .attr('width', 44)
        .attr('height', 15)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', 'transparent')
        .style('pointer-events', 'all')
        .each(function (d: { name: string }) {
            const processed = utils.cleanString(d.name);
            select(this)
            .attr('id', 'invert_hitbox_' + processed)
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowDownCursor()), 12)}') 8 8, auto`);
        });

    svg.append('use')
       .attr('href', '#arrow_image_up')
       .attr('width', 12)
       .attr('height', 12)
       .attr('x', 22.5)
       .attr('y', Number(value)-33)
       .each(function (d: { name: string }) {
            const processed = utils.cleanString(d.name);
            select(this)
            .attr('id', 'dimension_invert_' + processed)
            .text('up')
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowDownCursor()), 12)}') 8 8, auto`);
        });

    svg.on('click', (event: any, d: { name: string }) => {
        api.invert(d.name);
        event.stopPropagation();
    });
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
        else if (line.classed('colored')) {
          const color = line.property("clusterColor");
          line.transition()
            .style('stroke', color);
        }
        else {
            line.transition()
                .style('stroke', 'rgba(0, 129, 175, 0.5)');
        }
    });

    currentlyHighlightedItems = [];
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