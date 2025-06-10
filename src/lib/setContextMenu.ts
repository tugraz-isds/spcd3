import 'd3-transition';
import * as d3 from 'd3-selection';
import * as drag from 'd3-drag';
import * as helper from './utils';
import * as temp from './helper';
import * as pc from './parallelcoordinates';
import * as icon from './icons/icons';

export function setContextMenu(featureAxis: any, padding: any, parcoords: { xScales: any; yScales: {}; 
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
            if (pc.getDimensionPosition(d.name) == 0) {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowRight()), 12)}') 8 8, auto`);
            } else if (pc.getDimensionPosition(d.name) == parcoords.newFeatures.length - 1) {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowLeft()), 12)}') 8 8, auto`);
            } else {
                featureAxis
                    .select('.dimension')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(encodeURIComponent(icon.getArrowLeftAndRight()), 12)}') 8 8, auto`);
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
                    pc.hide(dimension);
                    event.stopPropagation();
                });
            
            d3.select('#invertMenu')
                .on('click', (event) => {
                    pc.invert(dimension);
                    event.stopPropagation();
                });
            
            if (!isNaN(values[0])) {
            d3.select('#rangeMenu')
                .style('border-top', '0.08rem lightgrey solid')
                .style('visibility', 'visible')
                .style('color', 'black')
                .on('click', (event) => {
                    console.log(dimension);
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
                        pc.getMinValue(dimension) + ' and ' + 
                        pc.getMaxValue(dimension) + '.');
                    rangeButton.on('click', () => {
                        let min = d3.select('#minRangeValue').node().value;
                        let max = d3.select('#maxRangeValue').node().value;
                        const inverted = temp.isInverted(dimension);
                        let isOk = true;
                        
                        if (inverted) {
                            if (max < pc.getMinValue(dimension) || 
                                min > pc.getMaxValue(dimension)) {
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
                            if (min > pc.getMinValue(dimension) || 
                                max < pc.getMaxValue(dimension)) {
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
                            pc.setDimensionRange(dimension, min, max);
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
                    pc.setDimensionRange(dimension, pc.getMinValue(dimension), pc.getMaxValue(dimension));
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
                    pc.setDimensionRangeRounded(dimension, pc.getMinValue(dimension), pc.getMaxValue(dimension));
                    event.stopPropagation();
                });
            }
            else {
                d3.select('#resetRoundRangeMenu').style('display', 'false')
                .style('color', 'lightgrey');
            }
            if (!isNaN(values[0])) {
                let currentFilters = pc.getFilter(dimension);
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
                            const ranges = pc.getDimensionRange(dimension);
                            const inverted = temp.isInverted(dimension);
                            let isOk = true;
                        
                            if (inverted) {
                                if (min < ranges[1]) {
                                    min = ranges[1];
                                    popupWindowFilterError.text(`Min value is smaller than 
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
                                    popupWindowFilterError.text(`Max value is bigger than 
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
                                    popupWindowFilterError.text(`Min value is smaller than 
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
                                    popupWindowFilterError.text(`Max value is bigger than 
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
                d3.select('#resetfilterMenu').style('display', 'false')
                .style('color', 'lightgrey');
            }
            d3.select('#showAllMenu')
                .style('visibility', 'visible')
                .style('border-top', '0.08rem lightgrey solid')
                .on('click', (event) => {
                    const hiddenDimensions = pc.getAllHiddenDimensionNames();
                    for(let i = 0; i < hiddenDimensions.length; i++) {
                        pc.show(hiddenDimensions[i]);
                    }
                    event.stopPropagation();
                });
            d3.selectAll('.contextmenu').style('padding', 0.35 + 'rem');
            event.preventDefault();
        });
}

let scrollXPos;
let timer;
const paddingXaxis = 75;

function onDragStartEventHandler(parcoords: any): any {
    {
        return function onDragStart (d)
        {
            this.__origin__ = parcoords.xScales((d.subject).name);
            parcoords.dragging[(d.subject).name] = this.__origin__;
            parcoords.dragPosStart[(d.subject).name] = this.__origin__;
            const element = document.getElementById("parallelcoords");
            scrollXPos = element.scrollLeft;
        }
    }
}

function onDragEventHandler(parcoords: any, active: any, featureAxis: any, width: any): any {
    {
        return function onDrag(d) {
            
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(() => {scroll(parcoords, d), 100});
            
            parcoords.dragging[(d.subject).name] = Math.min(width-paddingXaxis, 
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
            const distance = (width-80)/parcoords.newFeatures.length;
            const init = parcoords.dragPosStart[(d.subject).name];

            if (parcoords.dragPosStart[(d.subject).name] > parcoords.dragging[(d.subject).name]) {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + temp.position(d.name, init-distance, parcoords.xScales) + ')';
                })
            }
            else {
                featureAxis.attr('transform', (d) => {
                    return 'translate(' + temp.position(d.name, init+distance, parcoords.xScales) + ')';
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
    if(parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).name] &&
             parcoords.dragging[(d.subject).name] > window.innerWidth - 20) {
                element.scrollLeft += 5;
            }
            else if (scrollXPos + 20 > parcoords.dragging[(d.subject).name]) {
                element.scrollLeft -= 5;
            }
}