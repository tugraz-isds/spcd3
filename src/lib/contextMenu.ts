import 'd3-transition';
import { select, selectAll } from 'd3-selection';
import { drag } from 'd3-drag';
import * as utils from './utils';
import * as temp from './helper';
import * as api from './helperApiFunc';
import * as icon from './icons/icons';

export function setContextMenu(featureAxis: any, padding: any, parcoords: {
    xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any
}, width: number): void {

    createContextMenu()
    createModalToSetRange();
    createModalToFilter();

    let tooltipFeatures = select('body')
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
        .text((d: { name: string; }) => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
        .style('font-size', '0.7rem')
        .call(drag()
            .on('start', onDragStartEventHandler(parcoords))
            .on('drag', onDragEventHandler(parcoords, featureAxis, width))
            .on('end', onDragEndEventHandler(parcoords, featureAxis))
        )
        .on('mouseover', function () {
            return tooltipFeatures.style('visibility', 'visible');
        })
        .on('mousemove', (event: { clientX: number; clientY: number; }, d: { name: any; }) => {
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
        .on('contextmenu', function (event: { preventDefault: () => void; }, d: { name: any; }) {
            const dimension = d.name;
            const values = parcoords.newDataset.map((o: { [x: string]: any; }) => o[dimension]);

            styleContextMenu(event);
            hideDimensionMenu(dimension);
            invertDimensionMenu(dimension);
            setRangeMenu(values, dimension);
            resetRangeMenu(values, dimension);
            resetRoundRangeMenu(values, dimension);
            filterMenu(values, dimension);
            resetFilterMenu(values, dimension);
            showAllMenu();
            copyDimensionName(dimension);
            event.preventDefault();
        });
}

let scrollXPos: number;
let timer: string | number | NodeJS.Timeout;
const paddingXaxis = 60;

function copyDimensionName(dimension: string): void {
    select('#copyDimensionName')
        .style('visibility', 'visible')
        .on('click', async (event: { stopPropagation: () => void; }) => {
            await navigator.clipboard.writeText(dimension)
            select('#contextmenu').style('display', 'none');
            event.stopPropagation();
        });
}

function showAllMenu(): void {
    select('#showAllMenu')
        .style('visibility', 'visible')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event: { stopPropagation: () => void; }) => {
            const hiddenDimensions = api.getAllHiddenDimensionNames();
            for (let i = 0; i < hiddenDimensions.length; i++) {
                api.show(hiddenDimensions[i]);
                select('#contextmenu').style('display', 'none');
            }
            event.stopPropagation();
        });
}

function resetFilterMenu(values: any[], dimension: string): void {
    if (!isNaN(values[0])) {
        select('#resetfilterMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event: { stopPropagation: () => void; }) => {
                const range = api.getDimensionRange(dimension);
                const inverted = temp.isInverted(dimension);
                if (inverted) {
                    api.setFilter(dimension, Number(range[0]), Number(range[1]));
                }
                else {
                    api.setFilter(dimension, Number(range[1]), Number(range[0]));
                }

                select('#contextmenu').style('display', 'none');
                event.stopPropagation();
            });
    }
    else {
        select('#resetfilterMenu')
            .style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function filterMenu(values: any[], dimension: string): void {
    if (!isNaN(values[0])) {
        let currentFilters = api.getFilter(dimension);
        const inverted = temp.isInverted(dimension);
        select('#minFilterValue').property('value', currentFilters[0]);
        select('#maxFilterValue').property('value', currentFilters[1]);
        select('#filterMenu')
            .style('border-top', '0.08rem lightgrey solid')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event: { stopPropagation: () => void; }) => {
                select('#modalOverlayFilter').style('display', 'block');
                select('#modalFilter').style('display', 'block');
                select('#contextmenu').style('display', 'none');
                const header = dimension.length > 25 ? dimension.substr(0, 25) + '...' : dimension;
                select('#headerDimensionFilter').text(header);
                select('#buttonFilter').on('click', () => {
                    let min = Number(select('#minFilterValue').node().value);
                    let max = Number(select('#maxFilterValue').node().value);
                    const ranges = api.getDimensionRange(dimension);

                    let isOk = false;

                    let errorMessage = select('#errorFilter')
                        .style('display', 'block')
                        .style('padding-left', 0.5 + 'rem')
                        .style('padding-top', 0.5 + 'rem')
                        .style('color', 'red')
                        .style('font-size', 'x-small');

                    const minRange = Number(inverted ? ranges[1] : ranges[0]);
                    const maxRange = Number(inverted ? ranges[0] : ranges[1]);

                    if (max < min) {
                        max = maxRange;
                        errorMessage.text(`Max value is smaller than min value, filter is set to min.`);
                    }
                    else if (min < minRange) {
                        min = minRange;
                        errorMessage.text(`Min value is smaller than ${api.getMinValue(dimension)}, filter is set to min.`);
                    }
                    else if (min > maxRange) {
                        min = maxRange;
                        errorMessage.text(`Min value is bigger than max range value, filter is set to max.`);
                    }
                    else if (max > maxRange) {
                        max = maxRange;
                        errorMessage.text(`Max value is bigger than ${api.getMaxValue(dimension)}, filter is set to max.`);
                    }
                    else if (max < minRange) {
                        max = minRange;
                        select('#errorFilter').text(`Max value is smaller than min range value, filter is set to min.`);
                    }
                    else {
                        isOk = true;
                    }
                    api.setFilter(dimension, max, min);

                    if (isOk) {
                        select('#errorFilter').style('display', 'none');
                        select('#modalFilter').style('display', 'none');
                        select('#modalOverlayFilter').style('display', 'none');
                    }
                });
                select('#maxFilterValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonFilter").click();
                    }
                });
                select('#minFilterValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonFilter").click();
                    }
                });
                select('#closeButtonFilter').on('click', () => {
                    select('#errorFilter').style('display', 'none');
                    select('#modalFilter').style('display', 'none');
                    select('#modalOverlayFilter').style('display', 'none');
                });
                select('#contextmenu').style('display', 'none');
                event.stopPropagation();
            });
    }
    else {
        select('#filterMenu').style('display', 'false')
            .style('color', 'lightgrey')
            .style('border-top', '0.08rem lightgrey solid');
    }
}

function resetRoundRangeMenu(values: any[], dimension: string): void {
    if (!isNaN(values[0])) {
        select('#resetRoundRangeMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event: { stopPropagation: () => void; }) => {
                api.setDimensionRangeRounded(dimension, api.getMinValue(dimension), api.getMaxValue(dimension));
                select('#contextmenu').style('display', 'none');
                event.stopPropagation();
            });
    }
    else {
        select('#resetRoundRangeMenu')
            .style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function resetRangeMenu(values: any[], dimension: string): void {
    if (!isNaN(values[0])) {
        select('#resetRangeMenu')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event: { stopPropagation: () => void; }) => {
                api.setDimensionRange(dimension, api.getMinValue(dimension), api.getMaxValue(dimension));
                select('#contextmenu').style('display', 'none');
                event.stopPropagation();
            });
    }
    else {
        select('#resetRangeMenu').style('display', 'false')
            .style('color', 'lightgrey');
    }
}

function setRangeMenu(values: any[], dimension: string): void {
    if (!isNaN(values[0])) {
        select('#rangeMenu')
            .style('border-top', '0.08rem lightgrey solid')
            .style('visibility', 'visible')
            .style('color', 'black')
            .on('click', (event: { stopPropagation: () => void; }) => {
                let minRange = api.getCurrentMinRange(dimension);
                let maxRange = api.getCurrentMaxRange(dimension);
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
                select('#minRangeValue').property('value', minValue);
                select('#maxRangeValue').property('value', maxValue);
                select('#contextmenu').style('display', 'none');
                select('#modalOverlaySetRange').style('display', 'block');
                select('#modalSetRange').style('display', 'block');
                const newText = dimension.length > 25 ? dimension.substr(0, 25) + '...' : dimension;
                select('#headerDimensionRange').text(newText);
                select('#infoRange').text('The current range of ' + dimension + ' is between ' +
                    minValue + ' and ' +
                    maxValue + '.');
                select('#infoRange2').text('The original range of ' + dimension + ' is between ' +
                    api.getMinValue(dimension) + ' and ' +
                    api.getMaxValue(dimension) + '.');
                select('#buttonRange').on('click', () => {
                    let min = select('#minRangeValue').node().value;
                    let max = select('#maxRangeValue').node().value;
                    const inverted = temp.isInverted(dimension);
                    let isOk = true;

                    if (inverted) {
                        if (max < api.getMinValue(dimension) ||
                            min > api.getMaxValue(dimension)) {
                            select('#errorRange').text(`The range has to be bigger than 
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
                        if (min > api.getMinValue(dimension) ||
                            max < api.getMaxValue(dimension)) {
                            select('#errorRange').text(`The range has to be bigger than 
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
                        select('#errorRange').style('display', 'none');
                        api.setDimensionRange(dimension, min, max);
                        select('#modalSetRange').style('display', 'none');
                        select('#modalOverlaySetRange').style('display', 'none');
                    }

                });
                select('#maxRangeValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonRange").click();
                    }
                });
                select('#minRangeValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        document.getElementById("buttonRange").click();
                    }
                });
                select('#closeButtonRange').on('click', () => {
                    select('#modalSetRange').style('display', 'none');
                    select('#modalOverlaySetRange').style('display', 'none');
                });
                select('#contextmenu').style('display', 'none');
                event.stopPropagation();
            });
    }
    else {
        select('#rangeMenu').style('display', 'false')
            .style('color', 'lightgrey')
            .style('border-top', '0.08rem lightgrey solid');
    }
}

function invertDimensionMenu(dimension: string): void {
    select('#invertMenu')
        .on('click', (event: { stopPropagation: () => void; }) => {
            api.invert(dimension);
            select('#contextmenu').style('display', 'none');
            event.stopPropagation();
        });
}

function hideDimensionMenu(dimension: string): void {
    select('#hideMenu')
        .style('border-top', '0.08rem lightgrey solid')
        .on('click', (event: { stopPropagation: () => void; }) => {
            api.hide(dimension);
            select('#contextmenu').style('display', 'none');
            event.stopPropagation();
        });
}

function styleContextMenu(event: any): void {
    const container = document.querySelector("#parallelcoords");
    const rect = container.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    select('#contextmenu')
        .style('left', x + 'px')
        .style('top', y + 'px')
        .style('display', 'block')
        .style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
        .style('border-radius', 0.3 + 'rem').style('margin', 0.5 + 'rem')
        .style('padding', 0.35 + 'rem')
        .style('background-color', 'white').style('margin-left', 0.5 + 'rem')
        .style('cursor', 'pointer').style('minWidth', 15 + 'rem')
        .on('click', (event: { stopPropagation: () => void; }) => {
            event.stopPropagation();
        });
    selectAll('.contextmenu').style('padding', 0.35 + 'rem');
}

function setCursorForDimensions(d: any, featureAxis: any, parcoords: {
    xScales: any;
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[];
    newFeatures: any; features: any[]; newDataset: any[];
}, event: any): void {
    if (api.getDimensionPosition(d.name) == 0) {
        featureAxis
            .select('.dimension')
            .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowRight()), 12)}') 8 8, auto`);
    } else if
        (api.getDimensionPosition(d.name) == parcoords.newFeatures.length - 1) {
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
        return function onDragStart(d: { subject: any; }) {
            this.__origin__ = parcoords.xScales((d.subject).name);
            parcoords.dragging[(d.subject).name] = this.__origin__;
            parcoords.dragPosStart[(d.subject).name] = this.__origin__;
            const element = document.getElementById("parallelcoords");
            scrollXPos = element.scrollLeft;
        }
    }
}

function onDragEventHandler(parcoords: any, featureAxis: any, width: number): any {
    {
        return function onDrag(d: { subject: any; x: any; }) {

            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(() => { scroll(parcoords, d), 100 });

            parcoords.dragging[(d.subject).name] = Math.min(width - paddingXaxis,
                Math.max(paddingXaxis, this.__origin__ += d.x));

            let active = select('g.active').selectAll('path');
            active.each(function (d: any) {
                select(this)
                    .attr('d', temp.linePath(d, parcoords.newFeatures))
            });

            parcoords.newFeatures.sort((a: any, b: any) => {
                return temp.position(b, parcoords.dragging, parcoords.xScales)
                    - temp.position(a, parcoords.dragging, parcoords.xScales) - 1;
            });

            parcoords.xScales.domain(parcoords.newFeatures);

            featureAxis.attr('transform', (d: { name: any; }) => {
                return 'translate(' + temp.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
            });
        }
    }
}

function onDragEndEventHandler(parcoords: any, featureAxis: any): any {
    {
        return function onDragEnd(d: { subject: any; }) {
            const width = parcoords.width;
            const distance = (width - 80) / parcoords.newFeatures.length;
            const init = parcoords.dragPosStart[(d.subject).name];

            if (parcoords.dragPosStart[(d.subject).name] > parcoords.dragging[(d.subject).name]) {
                featureAxis.attr('transform', (d: { name: any; }) => {
                    return 'translate(' + temp.position(d.name, init - distance, parcoords.xScales) + ')';
                })
            }
            else {
                featureAxis.attr('transform', (d: { name: any; }) => {
                    return 'translate(' + temp.position(d.name, init + distance, parcoords.xScales) + ')';
                })
            }
            delete this.__origin__;
            delete parcoords.dragging[(d.subject).name];
            delete parcoords.dragPosStart[(d.subject).name];

            let active = select('g.active').selectAll('path');

            temp.trans(active).each(function (d: any) {
                select(this)
                    .attr('d', temp.linePath(d, parcoords.newFeatures))
            });
        };
    }
}

function scroll(parcoords: { dragPosStart: { [x: string]: number; }; dragging: { [x: string]: number; }; }, d: { subject: any; }) {
    const element = document.getElementById("parallelcoords");
    if (parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).name]) {
        element.scrollLeft += 5;
    }
    else if (scrollXPos + 20 > parcoords.dragging[(d.subject).name]) {
        element.scrollLeft -= 5;
    }
}

function createContextMenu(): void {
    let contextMenu = select('#parallelcoords')
        .append('g')
        .attr('id', 'contextmenu')
        .style('position', 'absolute')
        .style('display', 'none');

    contextMenu.append('div')
        .attr('id', 'copyDimensionName')
        .attr('class', 'contextmenu')
        .text('Copy Name')
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

function createModalToSetRange(): void {

    select('body')
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

    select('#modalOverlaySetRange').on('click', () => {
        select('#modalSetRange').style('display', 'none');
        select('#modalOverlaySetRange').style('display', 'none');
    });

    const modalSetRange = select('body')
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

function createModalToFilter(): void {

    select('body')
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

    select('#modalOverlayFilter').on('click', () => {
        select('#modalFilter').style('display', 'none');
        select('#modalOverlayFilter').style('display', 'none');
    });

    const modalFilter = select('body')
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

function createModalTitle(modal: any, modalTitel: string): void {
    const title = document.createElement('div');
    title.textContent = modalTitel;
    title.style.paddingLeft = '0.5rem';
    title.style.fontSize = 'large';
    modal.append(() => title);
}

function createHeader(modal: any, id: string): void {
    const header = document.createElement('div');
    header.id = id;
    header.style.paddingLeft = '0.5rem';
    header.style.fontSize = 'large';
    modal.append(() => header);
}

function createInfoMessage(modal: any, id: string): void {
    const infoMessage = document.createElement('div');
    infoMessage.id = id;
    infoMessage.style.color = 'grey';
    infoMessage.style.fontSize = 'smaller';
    infoMessage.style.paddingLeft = '0.5rem';
    infoMessage.style.paddingBottom = '0.5rem';
    infoMessage.style.paddingTop = '1rem';
    modal.append(() => infoMessage);
}

function createInputFieldWithLabel(modal: any, text: string, inputId: string): void {
    const label = document.createElement('label');
    label.textContent = text;
    label.style.padding = '0.5rem';
    modal.append(() => label);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = inputId;
    input.style.width = '3rem';
    input.style.border = '0.1rem solid lightgrey';
    input.style.borderRadius = "5%";
    modal.append(() => input);
}

function createButton(modal: any, id: string): void {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = 'Save';
    button.style.marginLeft = '0.5rem';
    button.style.marginTop = '1rem';
    button.style.width = '6.2rem';
    modal.append(() => button);
}

function createCloseButton(modal: any, id: string): void {
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

function createErrorMessage(modal: any, id: string): void {
    const errorMessage = document.createElement('div');
    errorMessage.id = id;
    errorMessage.style.position = 'relative';
    errorMessage.style.display = 'none';
    modal.append(() => errorMessage);
}