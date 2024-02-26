import 'd3-transition';
import * as d3 from 'd3-selection';
import * as drag from 'd3-drag';
import * as path from 'd3-shape';
import * as axis from 'd3-axis';
import * as scale from 'd3-scale';
import * as brush from './brush';
import * as helper from './helper';
import * as icon from './icons';
import * as svgToTinyDataUri from 'mini-svg-data-uri';

declare global {
    let padding: any;
    let width: any;
    let height: any;
    let dataset: any;
    let yAxis: {};
    let scrollXPos: any;
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
}

declare const window: any;

export default class SteerableParcoords {

    setDimensions(newDimension: any): void {
        return newDimension.reverse();
    }

    getIndex(key: any, currentPosOfDims: any):boolean {
        const item = currentPosOfDims.find((object) => object.key == key);
        return item.index;
    }

    show(dimension: string): any {
        const tempFeatures = parcoords.newFeatures.slice();
        const isShown = getHiddenStatus(dimension);
        const temp = parcoords.currentPosOfDims;
        const index = getIndex(dimension, parcoords.currentPosOfDims);
        window.selected = getSelected();
        if (isShown == "hidden") {
            tempFeatures.splice(index, 0, dimension);
            generateSVG(parcoords.data, tempFeatures);

            window.parcoords.currentPosOfDims = temp;

            window.parcoords.currentPosOfDims.forEach(function (item) {
                if (item.isInverted) {
                    invert(item.key);
                }
                if (item.top != 80 || item.bottom != 320) {
                    brush.filterWithCoords(item.top, item.bottom, parcoords.currentPosOfDims, item.key);
                }
            });

            setSelection(window.selected);
        }  
    }

    hide(dimension: string): any {
        d3.select('#contextmenu').style('display', 'none');
        const tempFeatures = parcoords.newFeatures.slice();
        const isShown = getHiddenStatus(dimension);
        const temp = parcoords.currentPosOfDims;
        window.selected = getSelected();
        if (isShown == "shown") {
            tempFeatures.splice(tempFeatures.indexOf(dimension), 1);
            generateSVG(parcoords.data, tempFeatures);

            window.parcoords.currentPosOfDims = temp;
        
            window.parcoords.currentPosOfDims.forEach(function (item) {
                if (item.isInverted) {
                    invert(item.key);
                }
                if (item.top != 80 || item.bottom != 320) {
                    brush.filterWithCoords(item.top, item.bottom, parcoords.currentPosOfDims, item.key);
                }
            });

            setSelection(window.selected);
        }
    }

    getHiddenStatus(dimension: string): string {
        const index = parcoords.newFeatures.indexOf(dimension);
        if (index != -1) {
            return "shown";
        }
        else {
            return "hidden";
        }
    }

    invert(dimension: any): void {

        const processedDimensionName = helper.cleanString(dimension);
        const invertId = '#dimension_invert_' + processedDimensionName;
        const dimensionId = '#dimension_axis_' + processedDimensionName;
        const textElement = d3.select(invertId);
        const currentArrowStatus = textElement.text();
        const arrow = currentArrowStatus === 'down' ? icon.getArrowUp() : icon.getArrowDown();
        const arrowStyle = currentArrowStatus === 'down' ? helper.setSize(icon.getArrowDown(), 12) : helper.setSize(icon.getArrowUp(), 12);
        textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
        textElement.attr('href', svgToTinyDataUri.default(arrow));
        textElement.style('cursor', `url('data:image/svg+xml,${arrowStyle}') 8 8 , auto`);

        d3.select(dimensionId)
            .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
            .domain(parcoords.yScales[dimension]
            .domain().reverse())))
            .transition();

        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, parcoords.newFeatures, parcoords) });

        trans(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))});

        brush.addSettingsForBrushing(dimension, parcoords);

        d3.select('g.inactive')
            .selectAll('path')
            .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            })
            .transition()
            .delay(5)
            .duration(0)
            .attr('visibility', 'hidden');      
    }

    onInvert(): any {
        {
            return function invertDim(event, d) {
                invert(d.name);
            };
        }
    }

    getInversionStatus(dimension: any): string {
        const invertId = '#dimension_invert_' + helper.cleanString(dimension);
        const element = d3.select(invertId);
        const arrowStatus = element.text();
        return arrowStatus == 'up' ? 'ascending' : 'descending';
    }

    setInversionStatus(dimension: any, mode: string): void {
        const processedDimensionName = helper.cleanString(dimension);
        const invertId = '#dimension_invert_' + processedDimensionName;
        const dimensionId = '#dimension_axis_' + processedDimensionName;
        const textElement = d3.select(invertId);
        const arrow = mode === 'ascending' ? icon.getArrowUp() : icon.getArrowDown();
        const arrowStyle = mode === 'ascending' ? helper.setSize(icon.getArrowDown(), 12) : helper.setSize(icon.getArrowUp(), 12);
        textElement.text(mode === 'ascending' ? 'up' : 'down');
        textElement.attr('href', svgToTinyDataUri.default(arrow));
        textElement.style('cursor', `url('data:image/svg+xml,${arrowStyle}') 8 8 , auto`);

        d3.select(dimensionId)
            .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
            .domain(parcoords.yScales[dimension]
            .domain().reverse())))
            .transition();

        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, parcoords.newFeatures, parcoords) });

        trans(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))});

        brush.addSettingsForBrushing(dimension, parcoords);

        d3.select('g.inactive')
            .selectAll('path')
            .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            })
            .transition()
            .delay(5)
            .duration(0)
            .attr('visibility', 'hidden'); 
    }

    isInverted(dimension: any): boolean {
        const invertId = '#dimension_invert_' + helper.cleanString(dimension);
        const element = d3.select(invertId);
        const arrowStatus = element.text();
        return arrowStatus == 'up' ? true : false;
    }

    moveByOne(dimension: any, direction: any): void {

        let parcoords = window.parcoords;
        
        let inactive = d3.select('g.inactive').selectAll('path');
        inactive.attr('visibility', 'hidden');
        
        const indexOfDimension = parcoords.newFeatures.indexOf(dimension);

        const indexOfNeighbor = direction == 'right' ? indexOfDimension - 1 
                : indexOfDimension + 1;

        const neighbour = parcoords.newFeatures[indexOfNeighbor];
        
        const width = window.width;
        const pos = parcoords.xScales(dimension);
        const posNeighbour = parcoords.xScales(neighbour);

        const distance = (width-80)/parcoords.newFeatures.length;

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
        let featureAxis = d3.selectAll('#feature');

        active.each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
        });

        featureAxis.attr('transform', (d) => {
            return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        });

        delete parcoords.dragging[dimension];
        delete parcoords.dragging[neighbour];
    }

    move(dimensionA, toRightOf, dimensionB) {
        let parcoords = window.parcoords;
            
        const indexOfDimensionA = getDimensionPositions(dimensionA);
        const indexOfDimensionB = getDimensionPositions(dimensionB);

        if (toRightOf == 'toRightOf') {
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

    swap(dimensionA, dimensionB) {
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

        let inactive = d3.select('g.inactive').selectAll('path');
        inactive.attr('visibility', 'hidden');

        let active = d3.select('g.active').selectAll('path');
        let featureAxis = d3.selectAll('#feature');

        active.each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
        });

        featureAxis.attr('transform', (d) => {
            return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        });

        delete parcoords.dragging[dimensionA];
        delete parcoords.dragging[dimensionB];
    }

    onDragStartEventHandler(parcoords: any, inactive: any): any {
        {
            return function onDragStart (d)
            {
                this.__origin__ = parcoords.xScales((d.subject).name);
                parcoords.dragging[(d.subject).name] = this.__origin__;
                parcoords.dragPosStart[(d.subject).name] = this.__origin__;
                inactive.attr('visibility', 'hidden');
                const element = document.getElementById("parallelcoords");
                window.scrollXPos = element.scrollLeft;
            }
        }
    }

    onDragEventHandler(parcoords: any, active: any, featureAxis: any, width: any): any {
        {
            return function onDrag(d) {
                const element = document.getElementById("parallelcoords");
                if(parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).name] &&
                    parcoords.dragging[(d.subject).name] + 50 > window.innerWidth) {
                    element.scrollLeft += 10;
                }
                else if (window.scrollXPos > parcoords.dragging[(d.subject).name] - 50) {
                    element.scrollLeft -= 10;
                }

                parcoords.dragging[(d.subject).name] = Math.min(width-80, 
                    Math.max(80, this.__origin__ += d.x));

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

    onDragEndEventHandler(parcoords: any, featureAxis: any, inactive: any, active: any): any {
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

                inactive.each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, parcoords.newFeatures, parcoords))})
                    .transition()
                    .delay(5)
                    .duration(0)
                    .attr('visibility', 'hidden');
            };
        }
    }

    trans(g: any): any {
        return g.transition().duration(50);
    }

    position(dimensionName: any, dragging: any, xScales: any): any {
        const value = dragging[dimensionName];  
        return value == null ? xScales(dimensionName) : value;
    }

    prepareData(data: any, newFeatures: any): any {
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

    setupYScales(height: any, padding: any, features: any, newDataset: any): any {
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
                    .range([padding, height -  padding])
                    .padding(0.2);
            }
            else {
                const max = Math.max(...newDataset.map(o => o[x.name]));
                const min = Math.min(...newDataset.map(o => o[x.name]));
                yScales[x.name] = scale.scaleLinear()
                    .domain([min, max]).nice()
                    .range([height - padding, padding]);
            }
        });
        return yScales;
    }

    setupXScales(width: any, padding: any, features: any): any {
        return scale.scalePoint()
            .domain(features.map(x => x.name))
            .range([width - padding, padding]);
    }

    setupYAxis(features :any[], yScales: any, newDataset: any): any {
        
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
                        return index % 3 == 0;
                    });
                    yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(filteredArray);
                }
                else {
                    yAxis[key[0]] = axis.axisLeft(key[1]).tickValues(labels);
                }
            }
            else {
                yAxis[key[0]] = axis.axisLeft(key[1]);
            }
        });
        return yAxis;
    }

    resetSVG(): void {
        d3.select('#pc_svg').remove();
        d3.select('#contextmenu').remove();
        d3.select('#popupFilter').remove();
        d3.select('#popupRange').remove();
    }

    generateSVG(content: any, newFeatures: any): void {
        let ids = [];

        resetSVG();

        prepareParcoordData(content, newFeatures);

        const svg = d3.select('#parallelcoords')
            .append('svg')
            .attr('id', 'pc_svg')
            .attr('viewBox', [0, 0, window.width, window.height])
            .attr('font-family', 'Verdana, sans-serif')
            .on('click', (event) => {
                if (!(event.ctrlKey || event.metaKey)) {
                    if (!(event.target.id.includes('dimension_invert_'))) {
                        for (let i = 0; i < ids.length; i++) {
                            if (d3.select('.' + ids[i]).style('stroke') !== 'lightgrey') {
                                d3.select('.' + ids[i]).style('stroke', 'rgb(0, 129, 175)')
                                .style('pointer-events', 'stroke').style('opacity', '0.7');
                            }
                        }
                    }
                }
            });
        
        window.onclick = () => {
            d3.select('#contextmenu').style('display', 'none');
        }

        let inactive = setInactivePathLines(svg, content, window.parcoords);

        let active = setActivePathLines(svg, content, ids, window.parcoords);

        setFeatureAxis(svg, yAxis, active, inactive, window.parcoords, width, window.padding);
    }

    setActivePathLines(svg: any, content: any, ids: any[], 
        parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}; 
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[];
        }): any {

        let selectedPath: any;
        
        let tooltipPath = d3.select('#parallelcoords')
            .append('g')
            .style('position', 'absolute')
            .style('visibility', 'hidden');

        let active = svg.append('g')
            .attr('class', 'active')
            .selectAll('path')
            .data(content)
            .enter()
            .append('path')
            .attr('class', (d) => {
                const keys = Object.keys(d);
                const first_key = keys[0];
                const selected_value = helper.cleanLinePathString(d[first_key]);
                ids.push(selected_value);
                return 'line ' + selected_value;
            })
            .attr('id', (d) => {
                const keys = Object.keys(d);
                const first_key = keys[0];
                return d[first_key];
            })
            .each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, parcoords.newFeatures, parcoords));
            })
            .style('opacity', '0.7')
            .style('pointer-events', 'stroke')
            .style('stroke', 'rgb(0, 129, 175)')
            .style('stroke-width', '0.1rem')
            .style('fill', 'none')
            .on('pointerenter', (event, d) => {
                const data = getAllPointerEventsData(event);
                selectedPath = highlight(data);
                createTooltipForPathLine(data, tooltipPath, event);
            })
            .on('pointerleave', () => {
                doNotHighlight(selectedPath);
                return tooltipPath.style('visibility', 'hidden');
            })
            .on('pointerout', () => {
                doNotHighlight(selectedPath);
                return tooltipPath.style('visibility', 'hidden');
            })
            .on('click', (event, d) => {
                const data = getAllPointerEventsData(event);
                select(data);
            });

        return active;
    }

    setFeatureAxis(svg: any, yAxis: any, active: any, inactive: any,
        parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}; 
        currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; }, 
        width: any, padding: any): void {

        let featureAxis = svg.selectAll('g.feature')
            .data(parcoords.features)
            .enter()
            .append('g')
            .attr('class', 'feature')
            .attr('id', 'feature')
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
                    .on('mouseover', function (event, d) {
                        tooltipValuesLabel.text('');
                        tooltipValuesLabel.style('top', event.clientY + 'px').style('left', event.clientX + 'px');
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

        setAxisLabels(featureAxis, padding, parcoords, inactive, active, width);

        setInvertIcon(featureAxis, padding, parcoords, yAxis);
    }

    setInvertIcon(featureAxis: any, padding: any, parcoords: { xScales: any; yScales: {};
        dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
        features: any[]; newDataset: any[];}, yAxis: any): void {

        featureAxis
            .append('svg')
            .attr('y', padding / 1.5)
            .attr('x', -6)
            .append('image')
            .attr('width', 12)
            .attr('height', 12)
            .attr('href', svgToTinyDataUri.default(icon.getArrowDown()))
            .each(function (d) {
                const processedDimensionName = helper.cleanString(d.name);
                d3.select(this)
                    .attr('id', 'dimension_invert_' + processedDimensionName)
                    .text('down')
                    .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowUp(), 12)}') 8 8, auto`);
            })
            .on('click', onInvert());
    }

    setAxisLabels(featureAxis: any, padding: any, parcoords: { xScales: any; yScales: {}; 
        dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
        features: any[]; newDataset: any[]}, inactive: any, active: any, width: any): void {
        
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
        let closeButtonRange = popupWindowRange.append('a').text('x').style('position', 'absolute').style('right', 0 + 'rem')
        .style('top', 2 + 'rem').style('width', 2.5 + 'rem').style('height', 2.5 + 'rem')
        .style('opacity', 0.3).style('background-color', 'transparent').style('cursor', 'pointer');
        let headerDimensionRange = popupWindowRange.append('div').style('padding-left', 0.5 + 'rem').style('font-size', 'large');
        let infoRange = popupWindowRange.append('div').style('color', 'grey').style('font-size', 'smaller')
        .style('padding-left', 0.5 + 'rem').style('padding-bottom', 0.5 + 'rem').style('padding-top', 1 + 'rem');
        popupWindowRange.append('label').text('Min').style('padding', 0.5 + 'rem');
        let inputMinRange = popupWindowRange.append('input').attr('id', 'minRangeValue').style('width', 2 + 'rem');
        popupWindowRange.append('label').text('Max').style('padding', 0.5 + 'rem');
        let inputMaxRange = popupWindowRange.append('input').attr('id', 'maxRangeValue').style('width', 2 + 'rem');
        let rangeButton = popupWindowRange.append('button').text('Save').style('margin-left', 0.5 + 'rem')
        .style('width', 6.2 + 'rem').style('margin-top', 1 + 'rem').attr('id', 'rangeButton');
        let resetRangeButton = popupWindowRange.append('button').text('Reset to Original Range').style('margin-left', 0.5 + 'rem')
        .style('width', 16 + 'rem').style('margin-top', 1 + 'rem').attr('id', 'resetRangeButton');

        let popupWindowRangeError = popupWindowRange
            .append('div')
            .style('position', 'absolute')
            .style('display', 'none');
        
        let popupWindowFilter = d3.select('#parallelcoords')
            .append('div')
            .attr('id', 'popupFilter')
            .style('position', 'absolute')
            .style('display', 'none')

        popupWindowFilter.append('h3').text('Set Filter for ').style('padding-left', 0.5 + 'rem');
        let headerDimensionFilter = popupWindowFilter.append('h4').style('padding-left', 0.5 + 'rem');
        let closeButtonFilter = popupWindowFilter.append('a').text('x').style('position', 'absolute').style('right', 0 + 'rem')
        .style('top', 2 + 'rem').style('width', 2.5 + 'rem').style('height', 2.5 + 'rem')
        .style('opacity', 0.3).style('background-color', 'transparent').style('cursor', 'pointer');
        popupWindowFilter.append('label').text('Min').style('padding', 0.5 + 'rem');
        let inputMinFilter = popupWindowFilter.append('input').attr('id', 'minFilterValue').style('width', 2 + 'rem');
        popupWindowFilter.append('label').text('Max').style('padding', 0.5 + 'rem');
        let inputMaxFilter = popupWindowFilter.append('input').attr('id', 'maxFilterValue').style('width', 2 + 'rem');
        let filterButton = popupWindowFilter.append('button').text('Save').style('margin-left', 0.5 + 'rem')
        .style('width', 4 + 'rem').style('margin-top', 1 + 'rem').attr('id', 'filterButton');
        
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
            .text('Set Range');
        contextMenu.append('div')
            .attr('id', 'filterMenu')
            .attr('class', 'contextmenu')
            .text('Set Filter');
        contextMenu.append('div')
            .attr('id', 'resetfilterMenu')
            .attr('class', 'contextmenu')
            .text('Reset Filter')
        
        featureAxis
            .append('text')
            .attr('id', 'dimension')
            .attr('text-anchor', 'middle')
            .attr('y', padding / 1.7)
            .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
            .style('font-size', '0.7rem')
            .call(drag.drag()
                .on('start', onDragStartEventHandler(parcoords, inactive))
                .on('drag', onDragEventHandler(parcoords, active, featureAxis, width))
                .on('end', onDragEndEventHandler(parcoords, featureAxis, inactive, active))
            )
            .on('mouseover', function () {
                return tooltipFeatures.style('visibility', 'visible');
            })
            .on('mousemove', (event, d) => {
                if (getDimensionPositions(d.name) == 0) {
                    featureAxis
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowRight(), 12)}') 8 8, auto`);
                } else if (getDimensionPositions(d.name) == parcoords.newFeatures.length - 1) {
                    featureAxis
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowLeft(), 12)}') 8 8, auto`);
                } else {
                    featureAxis
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml,${helper.setSize(icon.getArrowLeftAndRight(), 12)}') 8 8, auto`);
                }

                tooltipFeatures.text(d.name);
                tooltipFeatures.style('top', 13.6 + 'rem').style('left', event.clientX + 'px');
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
                contextMenu.style('left', event.clientX + 'px')
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
                
                d3.select('#rangeMenu')
                    .style('border-top', '0.08rem lightgrey solid')
                    .on('click', (event) => {
                        popupWindowRange.style('display', 'block')
                                .style('width', 17 + 'rem')
                                .style('height', 12 + 'rem')
                                .style('background', 'white')
                                .style('border', '1px solid black')
                                .style('border-radius', 0.25 + 'rem')
                                .style('padding', 1 + 'rem')
                                .style('margin', 'auto')
                                .style('top', 0)
                                .style('right', 0)
                                .style('bottom', 0)
                                .style('left', 0)
                                .style('z-index', 10);
                        headerDimensionRange.text(dimension);
                        infoRange.text('The original range of ' + dimension + ' is between ' + 
                        getMinRange(dimension, window.parcoords.currentPosOfDims) + ' and ' + 
                        getMaxRange(dimension, window.parcoords.currentPosOfDims) + '.');
                        rangeButton.on('click', () => {
                            let min = d3.select('#minRangeValue').node().value;
                            let max = d3.select('#maxRangeValue').node().value;
                            const ranges = getDimensionRange(dimension);
                            const inverted = isInverted(dimension);
                            let isOk = true;
                            
                            if (inverted) {
                                if (max < ranges[0] || min > ranges[1]) {
                                    popupWindowRangeError.text(`The range has to be bigger than 
                                    ${getMinRange(dimension, window.parcoords.currentPosOfDims)} and 
                                    ${getMaxRange(dimension, window.parcoords.currentPosOfDims)}.`)
                                    .style('display', 'block')
                                    .style('padding-left', 0.5 + 'rem')
                                    .style('padding-top', 0.5 + 'rem')
                                    .style('color', 'red')
                                    .style('font-size', 'x-small');
                                    isOk = false;
                                }
                            }
                            else {
                                if (min > ranges[0] || max < ranges[1]) {
                                    popupWindowRangeError.text(`The range has to be bigger than 
                                    ${getMinRange(dimension, window.parcoords.currentPosOfDims)} and 
                                    ${getMaxRange(dimension, window.parcoords.currentPosOfDims)}.`)
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
                                document.getElementById("rangeButton").click();
                            }
                        });
                        inputMinRange.on('keypress', (event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                document.getElementById("rangeButton").click();
                            }
                        });
                        resetRangeButton.on('click', () => {
                            setDimensionRange(dimension, getMinRange(dimension, window.parcoords.currentPosOfDims), 
                            getMaxRange(dimension, window.parcoords.currentPosOfDims));
                            popupWindowRange.style('display', 'none');
                        });
                        closeButtonRange.on('click', () => {
                            popupWindowRange.style('display', 'none');
                        });
                        event.stopPropagation();
                    });
                
                d3.select('#filterMenu')
                    .style('border-top', '0.08rem lightgrey solid')
                    .on('click', (event) => {
                        popupWindowFilter.style('display', 'block')
                                .style('width', 16 + 'rem')
                                .style('height', 14 + 'rem')
                                .style('background', 'white')
                                .style('border', '1px solid black')
                                .style('border-radius', 0.25 + 'rem')
                                .style('padding', 1 + 'rem')
                                .style('margin', 'auto')
                                .style('top', 0)
                                .style('right', 0)
                                .style('bottom', 0)
                                .style('left', 0)
                                .style('z-index', 10);
                        headerDimensionFilter.text(dimension);
                        filterButton.on('click', () => {
                            let min = d3.select('#minFilterValue').node().value;
                            let max = d3.select('#maxFilterValue').node().value;
                            const ranges = getDimensionRange(dimension);
                            const inverted = isInverted(dimension);
                            let isOk = true;
                            
                            if (inverted) {
                                if (min < ranges[1]) {
                                    min = ranges[1];
                                }
                                if (max > ranges[0]) {
                                    max = ranges[0];
                                }
                            }
                            else {
                                if (min < ranges[0]) {
                                    min = ranges[0];
                                }
                                if (max > ranges[1]) {
                                    max = ranges[1];
                                }
                            }
                            
                            if (isOk) {
                                if (inverted) {
                                    setFilter(dimension, min, max);
                                }
                                else {
                                    setFilter(dimension, max, min);
                                }
                            }
                            popupWindowFilter.style('display', 'none');
                        });
                        inputMaxFilter.on('keypress', (event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                document.getElementById("filterButton").click();
                            }
                        });
                        inputMinFilter.on('keypress', (event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                document.getElementById("filterButton").click();
                            }
                        });
                        closeButtonFilter.on('click', () => {
                            popupWindowFilter.style('display', 'none');
                        });
                        event.stopPropagation();
                    });
                
                d3.select('#resetfilterMenu')
                    .on('click', (event) => {
                        const range = getDimensionRange(dimension);
                        if (isInverted(dimension)) {
                            setFilter(dimension, range[0], range[1]);
                        }
                        else {
                            setFilter(dimension, range[1], range[0]);
                        }
                        event.stopPropagation();
                    });
                
                d3.selectAll('.contextmenu').style('padding', 0.35 + 'rem');
                event.preventDefault();
            });
    }

    setRectToDrag(featureAxis: any, svg: any, parcoords: { xScales: any; yScales: {}; 
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
                    .attr('fill', 'rgb(255, 255, 0, 0.4)')
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

    getMinRange(key: any, currentPosOfDims: any): number {
        const item = currentPosOfDims.find((object) => object.key == key);
        return item.min;
    }

    getMaxRange(key: any, currentPosOfDims: any): number {
        const item = currentPosOfDims.find((object) => object.key == key);
        return item.max;
    }

    setBrushUp(featureAxis: any, parcoords: { xScales: any; yScales: {}; dragging: {}; 
        dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; 
        newDataset: any[];}, active: any, tooltipValues: any): void {
        
        featureAxis
            .each(function (d) {
                const processedDimensionName = helper.cleanString(d.name);
                d3.select(this)
                    .append('g')
                    .attr('class', 'brush_' + processedDimensionName)
                    .append('svg:image')
                    .attr('id', 'triangle_up_' + processedDimensionName)
                    .attr('y', 320)
                    .attr('x', -7)
                    .attr('width', 14)
                    .attr('height', 10)
                    .attr('href', svgToTinyDataUri.default(icon.getArrowTop()))
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

    setBrushDown(featureAxisG: any, parcoords: { xScales: any; yScales: {}; dragging: {}; 
        dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; features: any[]; 
        newDataset: any[];}, active: any, tooltipValues: any): void {
        
        featureAxisG
            .each(function (d) {
                const processedDimensionName = helper.cleanString(d.name);
                d3.select(this)
                    .append('g')
                    .attr('class', 'brush_' + processedDimensionName)
                    .append('svg:image')
                    .attr('id', 'triangle_down_' + processedDimensionName)
                    .attr('y', 70)
                    .attr('x', -7)
                    .attr('width', 14)
                    .attr('height', 10)
                    .attr('href', svgToTinyDataUri.default(icon.getArrowBottom()))
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

    prepareParcoordData(data: any, newFeatures: any): any {
        
        window.padding = 80;
        window.width = newFeatures.length * 80;
        window.height = 400;

        let dataset = prepareData(data, newFeatures);

        window.parcoords = {};
        window.parcoords.xScales = setupXScales(window.width, window.padding, dataset[0]);
        window.parcoords.yScales = setupYScales(window.height, window.padding, dataset[0], dataset[1]);
        window.parcoords.dragging = {};
        window.parcoords.dragPosStart = {};
        window.parcoords.currentPosOfDims = [];
        window.parcoords.newFeatures = newFeatures;
        window.parcoords.features = dataset[0];
        window.parcoords.newDataset = dataset[1];
        window.parcoords.data = data;

        for(let i = 0; i < newFeatures.length; i++) {
            const max = Math.max(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
            const min = Math.min(...window.parcoords.newDataset.map(o => o[newFeatures[i]]));
            window.parcoords.currentPosOfDims.push(
                { key: newFeatures[i], top: 80, bottom: 320, isInverted: false, index: i ,
                     min: min, max: max, sigDig: 0 }
            );
        }

        window.yAxis = {};
        window.yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);

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
        });
    }

    setInactivePathLines(svg: any, content: any, parcoords: { xScales: any; 
        yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[];
        newFeatures: any; features: any[]; newDataset: any[];}): void {
        
        return svg.append('g')
            .attr('class', 'inactive')
            .selectAll('path')
            .data(content)
            .enter()
            .append('path')
            .style('pointer-events', 'none')
            .style('fill', 'none')
            .style('stroke', 'lightgrey')
            .style('stroke-opacity', '0.4')
            .each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, parcoords.newFeatures, parcoords));
            });
    }

    linePath(d: any, newFeatures: any, parcoords: any): any {
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

    highlight(data: any): any {
        let selectedPath = '';
        let dataWoSpecialC = [];
        for(let i = 0; i < data.length; i++) {
            let temp = data[i].replaceAll(/[.,]/g, '');
            dataWoSpecialC.push(temp);
        }

        if (dataWoSpecialC.length !== 0) {
            let tempText = dataWoSpecialC.toString();
            tempText = tempText.replaceAll(',', ',.');
            tempText = helper.cleanLinePathArrayString(tempText);
            selectedPath = tempText;
            dataWoSpecialC = tempText.split(',.');

            let newTempText = [];
            for(let i = 0; i < dataWoSpecialC.length; i++) {
                let isOrange = d3.select('.' + dataWoSpecialC[i].replace(/,./g, '')).style('stroke');
                if(isOrange !== 'rgb(255, 165, 0)') {
                    newTempText.push(dataWoSpecialC[i].replace(/,./g, ''));
                }
                else {
                    // do nothing
                }
            }

            selectedPath = newTempText.join(',.');

            if(selectedPath) {
                d3.selectAll('.' + selectedPath)
                    .transition().duration(5)
                    .style('opacity', '0.7')
                    .style('stroke', 'rgb(200, 28, 38)');
            }
        }
        return selectedPath;
    }

    doNotHighlight(selectedPath: any): void {
        if(selectedPath !== '') {
            let tempText = selectedPath.split(',.');
            let newTempText = [];
            for(let i = 0; i < tempText.length; i++) {
                let isOrange = d3.select('.' + tempText[i]).style('stroke');

                if(isOrange !== 'rgb(255, 165, 0)') {
                    newTempText.push(tempText[i]);
                }
                else {
                    // do nothing
                }
            }

            selectedPath = newTempText.join(',.');

            if(selectedPath) {
                d3.selectAll('.' + selectedPath)
                    .transition()
                    .style('opacity', '0.7')
                    .style('stroke', 'rgb(0, 129, 175)');
            }
        }
    }

    createTooltipForPathLine(tooltipText: any, tooltipPath: any, event: any): any {
        if (tooltipText.length !== 0) {
            let tempText = tooltipText.toString();
            tempText = tempText.split(',').join('\r\n');
            tooltipPath.text(tempText);
            tooltipPath.style('visibility', 'visible');
            tooltipPath.style('top', event.clientY + 'px').style('left', event.clientX + 'px');
            tooltipPath.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
                .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
                .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
                .style('background-color', 'lightgrey').style('margin-left', 0.5 + 'rem');
            return tooltipPath;
        }
    }

    getAllPointerEventsData(event: any): any {
        const selection = d3.selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter('path');
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

    getAllDimensions(): any {
        let listOfDimensions = parcoords.newFeatures.slice();
        return listOfDimensions.reverse();
    }

    getNumberOfDimensions(): any {
        return parcoords.newFeatures.length;
    }

    getDimensionPositions(dimension: string): any {
        return parcoords.newFeatures.indexOf(dimension);
    }

    getDimensionPosition(dimension: string): number {
        let listOfDimensions = parcoords.newFeatures.slice();
        let reverseListOfDimension = listOfDimensions.reverse();
        return reverseListOfDimension.indexOf(dimension);
    }

    setDimensionPosition(dimension: string, position: number): any {
        const dimensionListCopy = parcoords.newFeatures.slice();
        const dimensionListInOrder = dimensionListCopy.reverse();
        const dimensionToMove = dimensionListInOrder[position];
        const dimensionPositionA = getDimensionPositions(dimension);
        const dimensionPositionB = getDimensionPositions(dimensionToMove);
        if (dimensionPositionA > dimensionPositionB) {
            move(dimension, 'toRightOf', dimensionToMove);
        }
        else {
            move(dimension, 'toLeftOf', dimensionToMove);
        }
    }

    getDimensionRange(dimension: string): any {
        return parcoords.yScales[dimension].domain();     
    }

    setDimensionRange(dimension: string, min: number, max: number): any {
        const inverted = isInverted(dimension);
        if (inverted) {
            window.parcoords.yScales[dimension].domain([max, min]);
            window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
                window.parcoords.newDataset);
        }
        else {
            window.parcoords.yScales[dimension].domain([min, max]);
            window.yAxis = setupYAxis(window.parcoords.features, window.parcoords.yScales, 
                window.parcoords.newDataset);
        }
       
        // draw active lines
        d3.select('#dimension_axis_' + helper.cleanString(dimension))
            .call(yAxis[dimension]).transition();
        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, window.parcoords.newFeatures, window.parcoords) });
        trans(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, window.parcoords.newFeatures, window.parcoords))
            }
        );

        // draw inactive lines
        d3.select('g.inactive')
            .selectAll('path')
            .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, window.parcoords.newFeatures, window.parcoords))
            }).transition()
            .delay(5)
            .duration(0)
            .attr('visibility', 'hidden');     
    }

    getFilter(dimension)
    {
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

    setFilter(dimension, topValue, bottomValue)
    {
        brush.filter(dimension, topValue, bottomValue, parcoords);
    }

    select(linePaths: any): void {
        for(let i = 0; i < linePaths.length; i++) {
            let selectedLine = helper.cleanLinePathString(linePaths[i]);
            d3.select('.' + selectedLine)
                .transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
    }

    getSelected(): any {
        let selected = [];
        d3.select('g.active').selectAll('path')
            .each(function(d) {
                const isSeletedLine = d3.select(this).style('stroke');
                if (isSeletedLine == 'rgb(255, 165, 0)') {
                    const keys = Object.keys(d);
                    const first_key = keys[0];
                    selected.push(d[first_key]);
                }
        });
        return selected;
    }

    setSelection(records: any): void {
        for(let i = 0; i < records.length; i++) {
            let selectedLine = helper.cleanLinePathString(records[i]);
            d3.select('.' + selectedLine)
                .transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
    }

    isSelected(record: any): boolean {
        let cleanedRecord = helper.cleanLinePathString(record);
        const path = d3.select('.' + cleanedRecord).style('stroke');
        if (path == 'rgb(255, 165, 0)') {
            return true;
        }
        else {
            return false;
        }
    }

    toggleSelection(record: any): void {
        const selected = isSelected(record);
        if (selected) {
            setUnselected(record);
        }
        else {
            setSelected(record);
        }
    }

    setSelected(record: any): void {
        const path = helper.cleanLinePathString(record);
        d3.select('.' + path)
            .transition()
            .style('stroke', 'rgb(255, 165, 0)')
            .style('opacity', '1');
    }

    setUnselected(record: any): void {
        const path = helper.cleanLinePathString(record);
        d3.select('.' + path)
            .transition()
            .style('stroke', 'rgb(0, 129, 175)')
            .style('pointer-events', 'stroke')
            .style('opacity', '0.7');
    }
}

export const { invert, isInverted, setDimensions, generateSVG, setInactivePathLines, setActivePathLines, setFeatureAxis, select, 
    position, onDragStartEventHandler, onDragEventHandler, trans, onDragEndEventHandler, onInvert, prepareData, 
    prepareParcoordData, setupYScales, setupXScales, setupYAxis, resetSVG, linePath, highlight, doNotHighlight, 
    createTooltipForPathLine, getAllPointerEventsData, moveByOne, move, swap, setBrushDown, setBrushUp, setRectToDrag, setAxisLabels, 
    setInvertIcon, getInversionStatus, setInversionStatus, getDimensionPositions, setFilter, getDimensionRange, getNumberOfDimensions,
    setDimensionRange, getFilter, getSelected, setSelection, isSelected, toggleSelection, setSelected,  setUnselected, getAllDimensions, 
    getDimensionPosition, setDimensionPosition, getHiddenStatus, show, hide, getIndex, getMinRange, getMaxRange } = new SteerableParcoords();