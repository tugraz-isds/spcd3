import * as d3 from 'd3';
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
    let parcoords: {
        xScales: any,
        yScales: {},
        dragging: {},
        dragPosStart: {},
        currentPosOfDims: [],
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

    invert(dimension: any): void {

        let parcoords = window.parcoords;
        let yAxis = window.yAxis;
        if (parcoords.currentPosOfDims == undefined) {
            parcoords.currentPosOfDims = [];
            parcoords.newFeatures.forEach(function(item) {
                parcoords.currentPosOfDims.push({ key: item, top: 70, bottom: 320, isInverted: false });
            });
        }

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

        transition(active).each(function (d) {
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

    getInvertStatus(dimension: any): boolean {
        const invertId = '#dimension_invert_' + helper.cleanString(dimension);
        const element = d3.select(invertId);
        const arrowStatus = element.text();
        return arrowStatus == 'up' ? true : false;
    }

    move(dimension: any, direction: any): void {

        let parcoords = window.parcoords;
        
        let inactive = d3.select('g.inactive').selectAll('path');
        inactive.attr('visibility', 'hidden');
        
        const indexOfDimension = parcoords.newFeatures.indexOf(dimension);

        const neighbour = direction == 'right' ? parcoords.newFeatures[indexOfDimension-1] :
            parcoords.newFeatures[indexOfDimension+1];
        
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

    select(linePaths: any): void {
        for(let i = 0; i < linePaths.length; i++) {
            let selectedLine = helper.cleanLinePathString(linePaths[i]);
            d3.select('.' + selectedLine)
                .transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
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
                
                transition(active).each(function (d) {
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

    transition(g: any): any {
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
            })
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
            if (isNaN(values[0]) !== false) {
                yScales[x.name] = d3.scalePoint()
                    .domain(newDataset.map(o => o[x.name]))
                    .range([padding, height -  padding])
                    .padding(0.2);
            }
            else {
                const max = Math.max(...newDataset.map(o => o[x.name]));
                const min = Math.min(...newDataset.map(o => o[x.name]));
                yScales[x.name] = d3.scaleLinear()
                    .domain([min, max]).nice()
                    .range([height - padding, padding]);
            }
        });
        return yScales;
    }

    setupXScales(width: any, padding: any, features: any): any {
        return d3.scalePoint()
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
            counter = counter + 1;

            if(isNaN(tempValues[0])) {
                let uniqueArray = tempValues.filter(function(item, index, self) {
                    return index === self.indexOf(item);
                })
                if(uniqueArray.length > limit)
                {
                    let filteredArray = tempValues.filter(function(value, index, array) {
                        return index % 3 == 0;
                    });
                    yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(filteredArray);
                }
                else {
                    yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(tempValues);
                }
            }
            else {
                yAxis[key[0]] = d3.axisLeft(key[1]);
            }
        });
        return yAxis;
    }

    resetSVG(): void {
        d3.select('#pc_svg').remove();
    }

    generateSVG(content: any, newFeatures: any): void {
        let ids = [];

        resetSVG();

        prepareParcoordData(content, newFeatures);

        const svg = d3.select('#parallelcoords')
            .append('svg')
            .attr('id', 'pc_svg')
            .attr('viewBox', [0, 0, window.width, window.height])
            .style('overflow', 'auto')
            .attr('font-family', 'Verdana, sans-serif')
            .attr('preserveAspectRatio', 'none');

        let inactive = setInactivePathLines(svg, content, window.parcoords);

        let active = setActivePathLines(svg, content, ids, window.parcoords);

        setFeatureAxis(svg, yAxis, active, inactive, window.parcoords, width, window.padding);

        window.onclick = (event) => {
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
        }
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

        featureAxis
            .append('g')
            .each(function (d) {
                const processedDimensionName = helper.cleanString(d.name);
                d3.select(this)
                    .attr('id', 'dimension_axis_' + processedDimensionName)
                    .call(yAxis[d.name])       
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

        featureAxis
            .append('text')
            .attr('id', 'dimension')
            .attr('text-anchor', 'middle')
            .attr('y', padding / 1.7)
            .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
            .style('font-size', '0.7rem')
            .call(d3.drag()
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
                    .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
                return tooltipFeatures;
            })
            .on('mouseout', function () {
                return tooltipFeatures.style('visibility', 'hidden');
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
                    .call(d3.drag()
                        .on('drag', (event, d) => {
                            brush.dragAndBrush(processedDimensionName, d, svg, event, parcoords, active, delta, 
                                tooltipValuesTop, tooltipValuesDown, window);
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
                    .call(d3.drag().on('drag', (event, d) => {
                        brush.brushUp(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
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
                parcoords.currentPosOfDims.push({ key: d.name, top: 70, bottom: 320, isInverted: false });
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
                    .call(d3.drag()
                        .on('drag', (event, d) => {
                            brush.brushDown(processedDimensionName, event, d, parcoords, active, tooltipValues, window);
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

        window.yAxis = {};
        window.yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);
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
        let lineGenerator = d3.line();
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
                .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
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

    getDimensionPositions(dimension: string):any
    {
        return parcoords.newFeatures.indexOf(dimension);
    }

    getDimensionRange(dimension: string):any {
        return parcoords.yScales[dimension].domain();     
    }

    setDimensionRange(dimension: string, min: number, max: number) {
        parcoords.yScales[dimension].domain([min, max]).nice();
        yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);
        
        // draw active lines
        d3.select('#dimension_axis_' + helper.cleanString(dimension))
            .call(yAxis[dimension]);
        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, parcoords.newFeatures, parcoords) });
        transition(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            }
        );

        // draw inactive lines
        d3.select('g.inactive')
            .selectAll('path')
            .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
            }).transition()
            .delay(5)
            .duration(0)
            .attr('visibility', 'hidden');     
    }

    getNumberOfDimensions():any {
        return parcoords.newFeatures.length;
    }

    getFilter(dimension)
    {
        const invertStatus = getInvertStatus(dimension);
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

    getSelected()
    {

    }
}

export const { invert, setDimensions, generateSVG, setInactivePathLines, setActivePathLines, setFeatureAxis, select, 
    position, onDragStartEventHandler, onDragEventHandler, transition, onDragEndEventHandler, onInvert, prepareData, 
    prepareParcoordData, setupYScales, setupXScales, setupYAxis, resetSVG, linePath, highlight, doNotHighlight, 
    createTooltipForPathLine, getAllPointerEventsData, move, setBrushDown, setBrushUp, setRectToDrag, setAxisLabels, 
    setInvertIcon, getInvertStatus, getDimensionPositions, setFilter, getDimensionRange, getNumberOfDimensions,
    setDimensionRange, getFilter } = new SteerableParcoords();