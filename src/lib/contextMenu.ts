import 'd3-transition';
import * as d3 from 'd3-selection';
import * as drag from 'd3-drag';
import * as utils from './utils';
import * as temp from './helper';
import * as pc from './parallelcoordinates';
import * as icon from './icons/icons';

export function setContextMenu(featureAxis: any, padding: any, parcoords: {
    xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]
}, active: any, width: any): void {

    createContextMenu()
    createModalToSetRange();
    createModalToFilter();

    let tooltipFeatures = d3.select('body')
        .append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('visibility', 'hidden');

    featureAxis
        .append('text')
        .attr('class', 'dimension')
        .attr('text-anchor', 'middle')
        .attr('y', (padding / 1.7).toFixed(4))
        .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
        .style('font-size', '0.7rem')
        .call(drag.drag()
            .on('start', onDragStartEventHandler(parcoords))
            .on('drag', onDragEventHandler(parcoords, featureAxis, active,
                width))
            .on('end', onDragEndEventHandler(parcoords, featureAxis, active))
        )
        .on('mouseover', function () {
            return tooltipFeatures.style('visibility', 'visible');
        })
        .on('mousemove', (event, d) => {
            setCursorForDimensions(d, featureAxis, parcoords, event);
            const [x, y] = utils.getMouseCoords(event);
            tooltipFeatures.text(d.name);
            tooltipFeatures
                .style("left", x / 16 + 'rem')
                .style("top", y / 16 + 'rem')
                .style('font-size', '0.75rem')
                .style('border', 0.08 + 'rem solid gray')
                .style('border-radius', 0.1 + 'rem')
                .style('margin', 0.5 + 'rem')
                .style('padding', 0.12 + 'rem')
                .style('background-color', 'lightgrey')
                .style('margin-left', 0.5 + 'rem');
            return tooltipFeatures;
        })
        .on('mouseout', function () {
            return tooltipFeatures.style('visibility', 'hidden');
        })
        .on('contextmenu', function (event, d) {
            const dimension = d.name;
            const values = parcoords.newDataset.map(o => o[dimension]);

            styleContextMenu(event);
            hideDimensionMenu(dimension);
            invertDimensionMenu(dimension);
            setRangeMenu(values, dimension);
            resetRangeMenu(values, dimension);
            resetRoundRangeMenu(values, dimension);
            filterMenu(values, dimension);
            resetFilterMenu(values, dimension);
            showAllMenu();
            event.preventDefault();
        });
}

let scrollXPos;
let timer;
const paddingXaxis = 75;

function showAllMenu() {
    d3.select('#showAllMenu')
        .style('visibility', 'visible')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            const hiddenDimensions = pc.getAllHiddenDimensionNames();
            for (let i = 0; i < hiddenDimensions.length; i++) {
                pc.show(hiddenDimensions[i]);
            }
            event.stopPropagation();
        });
}

function resetFilterMenu(values: any[], dimension: any) {
    if (!isNaN(values[0])) {
        d3.select('#resetfilterMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event) => {
                const range = pc.getDimensionRange(dimension);
                if (temp.isInverted(dimension)) {
                    pc.setFilter(dimension, range[1], range[0]);
                }
                else {
                    pc.setFilter(dimension, range[1], range[0]);
                }
                event.stopPropagation();
            });
    }
    else {
        d3.select('#resetfilterMenu')
            .style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function filterMenu(values: any[], dimension: any) {
    if (!isNaN(values[0])) {
        let currentFilters = pc.getFilter(dimension);
        d3.select('#maxFilterValue').property('value', currentFilters[0]);
        d3.select('#minFilterValue').property('value', currentFilters[1]);
        d3.select('#filterMenu')
            .style('border-top', '0.08rem lightgrey solid')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event) => {
                d3.select('#modalOverlayFilter').style('display', 'block');
                d3.select('#modalFilter').style('display', 'block');
                d3.select('#contextmenu').style('display', 'none');
                const newText1 = dimension.length > 25 ? dimension.substr(0, 25) + '...' : dimension;
                d3.select('#headerDimensionFilter').text(newText1);
                d3.select('#buttonFilter').on('click', () => {
                    let min = d3.select('#minFilterValue').node().value;
                    let max = d3.select('#maxFilterValue').node().value;
                    const ranges = pc.getDimensionRange(dimension);
                    const inverted = temp.isInverted(dimension);
                    let isOk = true;

                    if (inverted) {
                        if (min < ranges[1]) {
                            min = ranges[1];
                            d3.select('#errorFilter').text(`Min value is smaller than 
                                    ${pc.getMinValue(dimension)}, filter is set to min.`)
                                .style('display', 'block')
                                .style('padding-left', 0.5 + 'rem')
                                .style('padding-top', 0.5 + 'rem')
                                .style('color', 'red')
                                .style('font-size', 'x-small');
                            isOk = false;
                        }
                        if (max > ranges[0]) {
                            max = ranges[0];
                            d3.select('#errorFilter').text(`Max value is bigger than 
                                    ${pc.getMaxValue(dimension)}, filter is set to max.`)
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
                            d3.select('#errorFilter').text(`Min value is smaller than 
                                    ${pc.getMinValue(dimension)}, filter is set to min.`)
                                .style('display', 'block')
                                .style('padding-left', 0.5 + 'rem')
                                .style('padding-top', 0.5 + 'rem')
                                .style('color', 'red')
                                .style('font-size', 'x-small');
                            isOk = false;
                        }
                        if (max > ranges[1]) {
                            max = ranges[1];
                            d3.select('#errorFilter').text(`Max value is bigger than 
                                    ${pc.getMaxValue(dimension)}, filter is set to max.`)
                                .style('display', 'block')
                                .style('padding-left', 0.5 + 'rem')
                                .style('padding-top', 0.5 + 'rem')
                                .style('color', 'red')
                                .style('font-size', 'x-small');
                            isOk = false;
                        }
                    }
                    if (inverted) {
                        pc.setFilter(dimension, min, max);
                    }
                    else {
                        pc.setFilter(dimension, max, min);
                    }
                    if (isOk) {
                        d3.select('#errorFilter').style('display', 'none');
                        d3.select('#modalFilter').style('display', 'none');
                        d3.select('#modalOverlayFilter').style('display', 'none');
                    }
                });
                d3.select('#maxFilterValue').on('keypress', (event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonFilter").click();
                    }
                });
                d3.select('#minFilterValue').on('keypress', (event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonFilter").click();
                    }
                });
                d3.select('#closeButtonFilter').on('click', () => {
                    d3.select('#errorFilter').style('display', 'none');
                    d3.select('#modalFilter').style('display', 'none');
                    d3.select('#modalOverlayFilter').style('display', 'none');
                });
                event.stopPropagation();
            });
    }
    else {
        d3.select('#filterMenu').style('display', 'false')
            .style('color', 'lightgrey')
            .style('border-top', '0.08rem lightgrey solid');
    }
}

function resetRoundRangeMenu(values: any[], dimension: any) {
    if (!isNaN(values[0])) {
        d3.select('#resetRoundRangeMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event) => {
                pc.setDimensionRangeRounded(dimension, pc.getMinValue(dimension), pc.getMaxValue(dimension));
                event.stopPropagation();
            });
    }
    else {
        d3.select('#resetRoundRangeMenu')
            .style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function resetRangeMenu(values: any[], dimension: any) {
    if (!isNaN(values[0])) {
        d3.select('#resetRangeMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event) => {
                pc.setDimensionRange(dimension, pc.getMinValue(dimension), pc.getMaxValue(dimension));
                event.stopPropagation();
            });
    }
    else {
        d3.select('#resetRangeMenu').style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function setRangeMenu(values: any[], dimension: any) {
    if (!isNaN(values[0])) {
        d3.select('#rangeMenu')
            .style('border-top', '0.08rem lightgrey solid')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event) => {
                let minRange = pc.getCurrentMinRange(dimension);
                let maxRange = pc.getCurrentMaxRange(dimension);
                var resultMin = (minRange - Math.floor(minRange)) !== 0;
                var resultMax = (maxRange - Math.floor(maxRange)) !== 0;
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
                d3.select('#minRangeValue').property('value', minValue);
                d3.select('#maxRangeValue').property('value', maxValue);
                d3.select('#contextmenu').style('display', 'none');
                d3.select('#modalOverlaySetRange').style('display', 'block');
                d3.select('#modalSetRange').style('display', 'block');
                const newText = dimension.length > 25 ? dimension.substr(0, 25) + '...' : dimension;
                d3.select('#headerDimensionRange').text(newText);
                d3.select('#infoRange').text('The current range of ' + dimension + ' is between ' +
                    minValue + ' and ' +
                    maxValue + '.');
                d3.select('#infoRange2').text('The original range of ' + dimension + ' is between ' +
                    pc.getMinValue(dimension) + ' and ' +
                    pc.getMaxValue(dimension) + '.');
                d3.select('#buttonRange').on('click', () => {
                    let min = d3.select('#minRangeValue').node().value;
                    let max = d3.select('#maxRangeValue').node().value;
                    const inverted = temp.isInverted(dimension);
                    let isOk = true;

                    if (inverted) {
                        if (max < pc.getMinValue(dimension) ||
                            min > pc.getMaxValue(dimension)) {
                            d3.select('#errorRange').text(`The range has to be bigger than 
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
                        if (min > pc.getMinValue(dimension) ||
                            max < pc.getMaxValue(dimension)) {
                            d3.select('#errorRange').text(`The range has to be bigger than 
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
                        d3.select('#errorRange').style('display', 'none');
                        pc.setDimensionRange(dimension, min, max);
                        d3.select('#modalSetRange').style('display', 'none');
                        d3.select('#modalOverlaySetRange').style('display', 'none');
                    }

                });
                d3.select('#maxRangeValue').on('keypress', (event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonRange").click();
                    }
                });
                d3.select('#minRangeValue').on('keypress', (event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonRange").click();
                    }
                });
                d3.select('#closeButtonRange').on('click', () => {
                    d3.select('#modalSetRange').style('display', 'none');
                    d3.select('#modalOverlaySetRange').style('display', 'none');
                });
                event.stopPropagation();
            });
    }
    else {
        d3.select('#rangeMenu').style('display', 'false')
            .style('color', 'lightgrey')
            .style('border-top', '0.08rem lightgrey solid');
    }
}

function invertDimensionMenu(dimension: any) {
    d3.select('#invertMenu')
        .on('click', (event) => {
            pc.invert(dimension);
            event.stopPropagation();
        });
}

function hideDimensionMenu(dimension: any) {
    d3.select('#hideMenu')
        .on('click', (event) => {
            pc.hide(dimension);
            event.stopPropagation();
        });
}

function styleContextMenu(event: any) {
    d3.select('#contextmenu')
        .style('left', event.clientX / 16 + 'rem')
        .style('top', 13.6 + 'rem')
        .style('display', 'block')
        .style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.3 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.35 + 'rem')
        .style('background-color', 'white').style('margin-left', 0.5 + 'rem')
        .style('cursor', 'pointer').style('minWidth', 15 + 'rem')
        .on('click', (event) => {
            event.stopPropagation();
        });
    d3.selectAll('.contextmenu').style('padding', 0.35 + 'rem');
}

function setCursorForDimensions(d: any, featureAxis: any, parcoords: {
    xScales: any;
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[];
    newFeatures: any; features: any[]; newDataset: any[];
}, event: any) {
    if (pc.getDimensionPosition(d.name) == 0) {
        featureAxis
            .select('.dimension')
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowRight()), 12)}') 8 8, auto`);
    } else if
        (pc.getDimensionPosition(d.name) == parcoords.newFeatures.length - 1) {
        featureAxis
            .select('.dimension')
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowLeft()), 12)}') 8 8, auto`);
    } else {
        featureAxis
            .select('.dimension')
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowLeftAndRight()), 12)}') 8 8, auto`);
    }
}

function onDragStartEventHandler(parcoords: any): any {
    {
        return function onDragStart(d) {
            this.__origin__ = parcoords.xScales((d.subject).name);
            parcoords.dragging[(d.subject).name] = this.__origin__;
            parcoords.dragPosStart[(d.subject).name] = this.__origin__;
            const element = document.getElementById("parallelcoords");
            scrollXPos = element.scrollLeft;
        }
    }
}

function onDragEventHandler(parcoords: any, featureAxis: any, active: any,
    width: any): any {
    {
        return function onDrag(d) {

            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(() => { scroll(parcoords, d), 100 });

            parcoords.dragging[(d.subject).name] = Math.min(width - paddingXaxis,
                Math.max(paddingXaxis, this.__origin__ += d.x));

            active.each(function (d) {
                d3.select(this)
                    .attr('d', temp.linePath(d, parcoords.newFeatures, parcoords))
            });

            parcoords.newFeatures.sort((a, b) => {
                return temp.position(b, parcoords.dragging, parcoords.xScales)
                    - temp.position(a, parcoords.dragging, parcoords.xScales) - 1;
            });

            parcoords.xScales.domain(parcoords.newFeatures);

            featureAxis.attr('transform', (d) => {
                return 'translate(' + temp.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
            });
        }
    }
}

function onDragEndEventHandler(parcoords: any, featureAxis: any, active: any): any {
    {
        return function onDragEnd(d) {
            const width = parcoords.width;
            const distance = (width - 80) / parcoords.newFeatures.length;
            const init = parcoords.dragPosStart[(d.subject).name];

            if (parcoords.dragPosStart[(d.subject).name] > parcoords.dragging[(d.subject).name]) {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + temp.position(d.name, init - distance, parcoords.xScales) + ')';
                })
            }
            else {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + temp.position(d.name, init + distance, parcoords.xScales) + ')';
                })
            }
            delete this.__origin__;
            delete parcoords.dragging[(d.subject).name];
            delete parcoords.dragPosStart[(d.subject).name];

            temp.trans(active).each(function (d) {
                d3.select(this)
                    .attr('d', temp.linePath(d, parcoords.newFeatures, parcoords))
            });
        };
    }
}

function scroll(parcoords, d) {
    const element = document.getElementById("parallelcoords");
    if (parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).name]) {
        element.scrollLeft += 5;
    }
    else if (scrollXPos + 20 > parcoords.dragging[(d.subject).name]) {
        element.scrollLeft -= 5;
    }
}

function createContextMenu() {
    let contextMenu = d3.select('#parallelcoords')
        .append('g')
        .attr('id', 'contextmenu')
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
}

function createModalToSetRange() {

    d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'modalOverlaySetRange')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100vw')
        .style('height', '100vh')
        .style('background-color', 'rgba(0, 0, 0, 0.5)')
        .style('display', 'none')
        .style('z-index', '999');

    d3.select('#modalOverlaySetRange').on('click', () => {
        d3.select('#modalSetRange').style('display', 'none');
        d3.select('#modalOverlaySetRange').style('display', 'none');
    });

    const modalSetRange = d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'modalSetRange')
        .style('position', 'fixed')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('z-index', '1000')
        .style('background-color', 'white')
        .style('padding', '1rem')
        .style('border-radius', '0.5rem')
        .style('box-shadow', '0 0.25rem 0.625rem rgba(0,0,0,0.2)')
        .style('display', 'none');

    createModalTitle(modalSetRange, 'Set Range for ');
    createCloseButton(modalSetRange, 'closeButtonRange');
    createHeader(modalSetRange, 'headerDimensionRange');
    createInfoMessage(modalSetRange, 'infoRange');
    createInfoMessage(modalSetRange, 'infoRange2');
    createInputFieldWithLabel(modalSetRange, 'Min', 'minRangeValue');
    createInputFieldWithLabel(modalSetRange, 'Max', 'maxRangeValue');
    createButton(modalSetRange, 'buttonRange');
    createErrorMessage(modalSetRange, 'errorRange');
}

function createModalToFilter() {

    d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'modalOverlayFilter')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('width', '100vw')
        .style('height', '100vh')
        .style('background-color', 'rgba(0, 0, 0, 0.5)')
        .style('display', 'none')
        .style('z-index', '999');

    d3.select('#modalOverlayFilter').on('click', () => {
        d3.select('#modalFilter').style('display', 'none');
        d3.select('#modalOverlayFilter').style('display', 'none');
    });

    const modalFilter = d3.select('#parallelcoords')
        .append('div')
        .attr('id', 'modalFilter')
        .style('position', 'fixed')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('z-index', '1000')
        .style('background-color', 'white')
        .style('padding', '1rem')
        .style('border-radius', '0.5rem')
        .style('box-shadow', '0 0.25rem 0.625rem rgba(0,0,0,0.2)')
        .style('display', 'none');

    createModalTitle(modalFilter, 'Set Filter for ');
    createCloseButton(modalFilter, 'closeButtonFilter');
    createHeader(modalFilter, 'headerDimensionFilter');
    createInputFieldWithLabel(modalFilter, 'Min', 'minFilterValue');
    createInputFieldWithLabel(modalFilter, 'Max', 'maxFilterValue');
    createButton(modalFilter, 'buttonFilter');
    createErrorMessage(modalFilter, 'errorFilter');
}

function createModalTitle(modal: any, modalTitel: string) {
    const title = document.createElement('div');
    title.textContent = modalTitel;
    title.style.paddingLeft = '0.5rem';
    title.style.fontSize = 'large';
    modal.append(() => title);
}

function createHeader(modal: any, id: string) {
    const header = document.createElement('div');
    header.id = id;
    header.style.paddingLeft = '0.5rem';
    header.style.fontSize = 'large';
    modal.append(() => header);
}

function createInfoMessage(modal: any, id: string) {
    const infoMessage = document.createElement('div');
    infoMessage.id = id;
    infoMessage.style.color = 'grey';
    infoMessage.style.fontSize = 'smaller';
    infoMessage.style.paddingLeft = '0.5rem';
    infoMessage.style.paddingBottom = '0.5rem';
    infoMessage.style.paddingTop = '1rem';
    modal.append(() => infoMessage);
}

function createInputFieldWithLabel(modal: any, text: string, inputId: string) {
    const label = document.createElement('label');
    label.textContent = text;
    label.style.padding = '0.5rem';
    modal.append(() => label);

    const input = document.createElement('input');
    input.id = inputId;
    input.style.width = '2.5rem';
    modal.append(() => input);
}

function createButton(modal: any, id: string) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = 'Save';
    button.style.marginLeft = '0.5rem';
    button.style.marginTop = '1rem';
    button.style.width = '6.2rem';
    modal.append(() => button);
}

function createCloseButton(modal: any, id: string) {
    const closeButton = document.createElement('span');
    closeButton.id = id;
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0.625rem';
    closeButton.style.right = '0.938rem';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '1.25rem';
    modal.append(() => closeButton);
}

function createErrorMessage(modal: any, id: string) {
    const errorMessage = document.createElement('div');
    errorMessage.id = id;
    errorMessage.style.position = 'absolute';
    errorMessage.style.display = 'none';
    modal.append(() => errorMessage);
}