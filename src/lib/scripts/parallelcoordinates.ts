import * as d3 from 'd3';
import * as base64 from './base64Arrows';
import * as brush from './brush';

export default class SteerableParcoords {

    setDimensions(newDimension): void
    {
        return newDimension.reverse();
    }

    invertD(dimension, parcoords, yAxis) {
        let cleanDimension = dimension.replace(/ /g,'_');
        cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
        const invert_id = '#dimension_invert_' + cleanDimension;
        const dimension_id = '#dimension_axis_' + cleanDimension;
        const textElement = d3.select(invert_id);
        const currentText = textElement.text();
        const arrow = currentText === 'down' ? base64.getArrowUpBase64() : base64.getArrowDownBase64();
        const arrowStyle = currentText === 'down' ? base64.getArrowDownBase64() : base64.getArrowUpBase64();
        textElement.text(currentText === 'down' ? 'up' : 'down');
        textElement.attr('href', 'data:image/svg+xml;base64,' + arrow)
        textElement.style('cursor', `url('data:image/svg+xml;base64,${arrowStyle}') 8 8 , auto`);

        d3.select(dimension_id)
        .call(yAxis[dimension]
        .scale(parcoords.yScales[dimension]
        .domain(parcoords.yScales[dimension]
        .domain().reverse())))
        .transition();

        // force update lines
        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, parcoords.newFeatures, parcoords) });

        transition(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))});

        let height = d3.select("#rect_" + dimension).node().getBoundingClientRect().height;
        let y_top = d3.select("#rect_" + dimension).attr("y");
        let y_bottom = Number(y_top) + Number(height);

        if(y_top > 80 && y_bottom < 320) {
            let distance_bottom = 320 - d3.select("#triangle_down_" + dimension).attr("y");
            d3.select("#rect_" + dimension).attr("y", 80 + distance_bottom);
            d3.select("#triangle_up_" + dimension).attr("y", 70 + distance_bottom);
            d3.select("#triangle_down_" + dimension).attr("y", 80 + distance_bottom + Number(height));
        }
        else if (y_top > 80 && y_bottom >= 320) {
            d3.select("#rect_" + dimension).attr("y", 80);
            d3.select("#rect_" + dimension).attr("height", 240-(y_top-80));
            d3.select("#triangle_up_" + dimension).attr("y", 70);
            d3.select("#triangle_down_" + dimension).attr("y", 320-(y_top-80));
        }
        else if (y_top <= 80 && y_bottom < 320) {
            d3.select("#rect_" + dimension).attr("y", 320-height);
            d3.select("#rect_" + dimension).attr("height", 240 - (320 - y_bottom));
            d3.select("#triangle_up_" + dimension).attr("y", 80 + (320 - y_bottom)-10);
            d3.select("#triangle_down_" + dimension).attr("y", 320);
        }

        d3.select('g.inactive')
        .selectAll('path')
        .each(function (d) {
        d3.select(this)
            .attr('d', linePath(d, parcoords.newFeatures, parcoords))})
        .transition()
        .delay(5)
        .duration(0)
        .attr('visibility', 'hidden');      
    }

    onInvert(parcoords, yAxis) {
        {
            return function invertDim(event, d) {
                invertD(d.name, parcoords, yAxis);
            };
        }
    }

    getInversionStatus(dimension)
    {

    }

    move(dimension, direction, parcoords)
    { 
        let inactive = d3.select('g.inactive').selectAll('path');
        inactive.attr('visibility', 'hidden');
        
        let indexOfDimension = parcoords.newFeatures.indexOf(dimension);

        let neighbour;
        if (direction == 'right') {
            neighbour = parcoords.newFeatures[indexOfDimension-1];
        }
        else {
            neighbour = parcoords.newFeatures[indexOfDimension+1];
        }
        
        let active = d3.select('g.active').selectAll('path');
        let featureAxisG = d3.selectAll('#feature');
        
        let width = parcoords.newFeatures.length * 80;
        let pos = parcoords.xScales(dimension);
        let posNeighbour = parcoords.xScales(neighbour);

        let distance = (width-80)/parcoords.newFeatures.length;

        if (direction == 'right') {
            parcoords.dragging[dimension] = pos + distance;
            parcoords.dragging[neighbour] = posNeighbour - distance;
        }
        else {
            parcoords.dragging[dimension] = pos - distance;
            parcoords.dragging[neighbour] = posNeighbour + distance;
        }
            
        if (direction == 'right') {
            [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension-1]] = 
            [parcoords.newFeatures[indexOfDimension-1], parcoords.newFeatures[indexOfDimension]];
        }
        else {
            [parcoords.newFeatures[indexOfDimension+1], parcoords.newFeatures[indexOfDimension]] = 
            [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension+1]];
        }
        
        parcoords.xScales.domain(parcoords.newFeatures);

        active.each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, parcoords.newFeatures, parcoords))
        });

        featureAxisG.attr('transform', (d) => {
            return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        });
    }

    getDimensionPositions()
    {

    }

    getFilter(dimension)
    {

    }

    setFilter(dimension)
    {

    }

    getSelected()
    {

    }

    select(data)
    {
        for(let i = 0; i < data.length; i++) {
            let selected_value = data[i].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
            d3.select('.' + selected_value)
                .transition()
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1')
        }
    }

    onDragStartEventHandler(parcoords, inactive)
    {
        {
            return function onDragStart (d)
            {
                this.__origin__ = parcoords.xScales((d.subject).name);
                parcoords.dragging[(d.subject).name] = this.__origin__;
                inactive.attr('visibility', 'hidden');
            }
        }
    }

    onDragEventHandler(parcoords, active, featureAxisG, width) {
        {
            return function onDrag(d) {
                parcoords.dragging[(d.subject).name] = Math.min(width-80, Math.max(80, this.__origin__ += d.x));

                active.each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, parcoords.newFeatures, parcoords))
                });

                parcoords.newFeatures.sort((a, b) => {
                    return position(b, parcoords.dragging, parcoords.xScales) - position(a, parcoords.dragging, parcoords.xScales) - 1;
                });
            
                parcoords.xScales.domain(parcoords.newFeatures);
               
                featureAxisG.attr('transform', (d) => {
                    return 'translate(' + position(d.name, parcoords.dragging, parcoords.xScales) + ')';
                });
            }
        }
    }

    onDragEndEventHandler(parcoords, inactive, active) {
        {
            return function onDragEnd(d) {
                delete this.__origin__;
                delete parcoords.dragging[(d.subject).name];
                //transition(d3.select(this)).attr('transform', d => ('translate(' + xScales(d.name)  + ')'));
                transition(active).each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, parcoords.newFeatures, parcoords))
                })
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

    transition(g) {
        return g.transition().duration(50);
    }

    position(d, dragging, xScales) {
        let v = dragging[d];  
        return v == null ? xScales(d) : v;
    }


    prepareData(data, newFeatures)
    {
        let newDataset = [];
        data.forEach(obj => {
            var newdata = {};
            newFeatures.forEach(feature => {
                newdata[feature] = obj[feature];
            })
            newDataset.push(newdata);
        })
        let features = [];
        Object.keys(newDataset[0]).forEach(element => features.push({ 'name': element }));
        return [features, newDataset];
    }

    setupYScales(height, padding, features, newDataset)
    {
        let yScales = {};
        features.map(x => {
            const testValue = newDataset.map(o => o[x.name]);
            if (isNaN(testValue[0]) !== false) {
                yScales[x.name] = d3.scalePoint()
                    .domain(newDataset.map(o => o[x.name]))
                    .range([padding, height -  padding])
                    .padding(0.2);
            }
            else {
                const max = Math.max(...newDataset.map(o => o[x.name]));
                const min = Math.min(...newDataset.map(o => o[x.name]));
                yScales[x.name] = d3.scaleLinear()
                    .domain([0, max]).nice()
                    .range([height - padding, padding]);
            }
        });
        return yScales;
    }

    setupXScales(width, padding, features)
    {
        return d3.scalePoint()
            .domain(features.map(x => x.name))
            .range([width - padding, padding]);
    }

    setupYAxis(features :any[], yScales, newDataset)
    {
        let counter = 0;
        const limit = 30;
        let yAxis = {};
        Object.entries(yScales).map(key => {
            let temp_var_features = Array.from(features.values()).map(c => c.name);
            let temp_var_values = newDataset.map(o => o[temp_var_features[counter]]);
            counter = counter + 1;

            if(isNaN(temp_var_values[0])) {
                var unique_arr = temp_var_values.filter(function(elem, index, self) {
                    return index === self.indexOf(elem);
                })
                if(unique_arr.length > limit)
                {
                    var filtered_arr = temp_var_values.filter(function(value, index, array) {
                        return index % 3 == 0;
                    });
                    yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(filtered_arr);
                }
                else {
                    yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(temp_var_values);
                }
            }
            else {
                yAxis[key[0]] = d3.axisLeft(key[1]);
            }
        });
        return yAxis;
    }

    resetSVG() {
        d3.select('#pc_svg').remove();
    }

    // TODO refactor
    generateSVG(content, newFeatures) {

        resetSVG();

        var { width, height, parcoords, active, ids, selected_path, yAxis, currentPosOfDims, padding } = initDataPrep(newFeatures, content);

        const svg = d3.select('#parallelcoords')
            .append('svg')
            .attr('id', 'pc_svg')
            .attr('viewBox', [0, 0, width, height])
            .attr('width', width)
            .attr('height', height)
            .attr('font-family', 'Verdana, sans-serif')
            .attr('preserveAspectRatio', 'none');

        let tooltip_path = d3.select('#parallelcoords')
            .append('g')
            .style('position', 'absolute')
            .style('visibility', 'hidden');

        let inactive = svg.append('g')
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
                    .attr('d', linePath(d, newFeatures, parcoords))
            });

        active = svg.append('g')
            .attr('class', 'active')
            .selectAll('path')
            .data(content)
            .enter()
            .append('path')
            .attr('class', (d) => {
                const keys = Object.keys(d);
                const first_key = keys[0];
                const selected_value = d[first_key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
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
                    .attr('d', linePath(d, newFeatures, parcoords))
            })
            .style('opacity', '0.7')
            .style('pointer-events', 'stroke')
            .style('stroke', 'rgb(0, 129, 175)')
            .style('stroke-width', '0.1rem')
            .style('fill', 'none')
            .on('pointerenter', (event, d) => {
                const data = getAllPointerEventsData(event);
                selected_path = highlight(data);
                createTooltipForPathLine(data, tooltip_path, event);
            })
            .on('pointerleave', (event, d) => {
                doNotHighlight(event, d, selected_path);
                return tooltip_path.style('visibility', 'hidden');
            })
            .on('pointerout', (event, d) => {
                doNotHighlight(event, d, selected_path);
                return tooltip_path.style('visibility', 'hidden');
            })
            .on('click', (event, d) => {
                const data = getAllPointerEventsData(event);
                select(data);
            });

        let featureAxisG = svg.selectAll('g.feature')
            .data(parcoords.features)
            .enter()
            .append('g')
            .attr('class', 'feature')
            .attr('id', 'feature')
            .attr('transform', d => ('translate(' + parcoords.xScales(d.name) + ')'));

        featureAxisG
            .append('g')
            .each(function (d) {
                let cleanString = d.name.replace(/ /g, '_');
                cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .attr('id', 'dimension_axis_' + cleanString)
                    .call(yAxis[d.name])
            });

        featureAxisG
            .each(function (d) {
                let cleanDimension = d.name.replace(/ /g, '_');
                cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                currentPosOfDims.push({key: d.name, top: 70, bottom: 320})
                d3.select(this)
                    .append('g')
                        .attr('class', 'brush_' + cleanDimension)
                    .append('svg:image')
                        .attr('id', 'triangle_up_' + cleanDimension)
                        .attr('y', 70)
                        .attr('x', -5)
                        .attr('width', 10)
                        .attr('height', 12)
                        .attr('href', 'data:image/svg+xml;base64,' + base64.getArrowBottomBase64())
                        .attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowBottomCursorBase64()}') 8 8 , auto`)
                    .call(d3.drag()
                        .on('drag', (event, d) => {
                            brush.brushDown(cleanDimension, event, d, parcoords, active, currentPosOfDims);
                        }))
                });

        featureAxisG
            .each(function (d) {
                let cleanDimension = d.name.replace(/ /g, '_');
                cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .append('g')
                        .attr('class', 'brush_' + cleanDimension)
                    .append('svg:image')
                        .attr('id', 'triangle_down_' + cleanDimension)
                        .attr('y', 320)
                        .attr('x', -5)
                        .attr('width', 10)
                        .attr('height', 12)
                        .attr('href', 'data:image/svg+xml;base64,' + base64.getArrowTopBase64())
                        .attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowTopCursorBase64()}') 8 8 , auto`)
                    .call(d3.drag().on('drag', (event, d) => {
                        brush.brushUp(cleanDimension, event, d, parcoords, active, currentPosOfDims);
                    }))
                });
       
        let deltaY;
        featureAxisG
            .each(function (d) {
                let cleanDimension = d.name.replace(/ /g, '_');
                cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .append('g')
                    .attr('class', 'rect')
                    .append('rect')
                    .attr('id', 'rect_' + cleanDimension)
                    .attr('width', 12)
                    .attr('height', 240)
                    .attr('x', -6)
                    .attr('y', 80)
                    .attr('fill',  'rgb(255, 255, 0, 0.4)')
                    .call(d3.drag()
                        .on('drag', (event, d) => {
                            brush.dragAndBrush(cleanDimension, d, svg, event, parcoords, active, deltaY, currentPosOfDims);
                        })
                        .on('start', (event, d) => {
                            var current = d3.select("#rect_" + cleanDimension);
                            deltaY = current.attr("y") - event.y;
                        }))
                });

        let tooltip_dim = d3.select('#parallelcoords')
            .append('g')
            .style('position', 'absolute')
            .style('visibility', 'hidden');

        featureAxisG
            .append('text')
            .attr('id', 'dimension')
            .attr('text-anchor', 'middle')
            .attr('y', padding / 1.7)
            .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
            .style('font-size', '0.7rem')
            .call(d3.drag()
                .on('start', onDragStartEventHandler(parcoords, inactive))
                .on('drag', onDragEventHandler(parcoords, active, featureAxisG, width))
                .on('end', onDragEndEventHandler(parcoords, inactive, active))
            )
            .on('mouseover', function () {
                return tooltip_dim.style('visibility', 'visible');
            })
            .on('mousemove', (event, d) => {
                let screenwidth = width - 120;
                if (screenwidth > screen.width) {
                    screenwidth = screen.width - 130;
                }
                if (event.clientX > screenwidth) {
                    featureAxisG
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml;base64,${base64.getArrowRightBase64()}') 8 8 , auto`);
                } else if (event.clientX <= 100) {
                    featureAxisG
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml;base64,${base64.getArrowLeftBase64()}') 8 8 , auto`);
                        
                } else {
                    featureAxisG
                        .select('#dimension')
                        .style('cursor', `url('data:image/svg+xml;base64,${base64.getArrowLeftAndRightBase64()}') 8 8 , auto`);
                }

                tooltip_dim.text(d.name);
                tooltip_dim.style('top', 13.6 + 'rem').style('left', event.clientX + 'px');
                tooltip_dim.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
                    .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
                    .style('padding', 0.12 + 'rem')
                    .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
                return tooltip_dim;
            })
            .on('mouseout', function () {
                return tooltip_dim.style('visibility', 'hidden');
            });

        featureAxisG
            .append('svg')
            .attr('y', padding / 1.5)
            .attr('x', -6)
            .append('image')
            .attr('width', 12)
            .attr('height', 12)
            .attr('href', 'data:image/svg+xml;base64,' + base64.getArrowDownBase64())
            .each(function (d) {
                let cleanString = d.name.replace(/ /g, '_');
                cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .attr('id', 'dimension_invert_' + cleanString)
                    .text('down')
                    .style('cursor', `url('data:image/svg+xml;base64,${base64.getArrowUpBase64()}') 8 8, auto`)
            })
            .on('click', onInvert(parcoords, yAxis));

        window.onclick = (event) => {
            if (!(event.ctrlKey || event.metaKey)) {
                if (!(event.target.id.includes('dimension_invert_'))) {
                    for (let i = 0; i < ids.length; i++) {
                        if (d3.select('.' + ids[i]).style('stroke') !== 'lightgrey') {
                            d3.select('.' + ids[i]).style('stroke', 'rgb(0, 129, 175, 0.7)').style('pointer-events', 'stroke')
                        }
                    }
                }
            }
        }
    }

    initDataPrep(newFeatures: any, content: any) {
        const padding = 80;
        const width = newFeatures.length * padding;
        const height = 400;
        let ids = [];
        let selected_path = null;
        let active = null;
        let currentPosOfDims = [];

        let dataset = prepareData(content, newFeatures);

        let parcoords = {
            xScales: setupXScales(width, padding, dataset[0]),
            yScales: setupYScales(height, padding, dataset[0], dataset[1]),
            dragging: {},
            newFeatures: newFeatures,
            features: dataset[0],
            newDataset: dataset[1],
            datasetForBrushing: dataset[1],
        };

        let yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);
        return { width, height, parcoords, active, ids, selected_path, yAxis, currentPosOfDims, padding };
    }

    linePath(d, newFeatures, parcoords) {
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

    highlight(data) {
        let selected_path = '';
        let data_wo_sc = [];
        for(let i = 0; i < data.length; i++) {
            let temp = data[i].replaceAll(/[.,]/g, '');
            data_wo_sc.push(temp);
        }

        if (data_wo_sc.length !== 0) {
            let temp_text = data_wo_sc.toString();
            temp_text = temp_text.replaceAll(',', ',.');
            temp_text = temp_text.replace(/[*\- 0123456789%&'\[{()}\]]/g, '');
            selected_path = temp_text;
            data_wo_sc = temp_text.split(',.');

            let new_temp_text = [];
            for(let i = 0; i < data_wo_sc.length; i++) {
                let isOrange = d3.select('.' + data_wo_sc[i].replace(/,./g, '')).style('stroke');
                if(isOrange !== 'rgb(255, 165, 0)') {
                    new_temp_text.push(data_wo_sc[i].replace(/,./g, ''));
                }
                else {
                    // do nothing
                }
            }

            selected_path = new_temp_text.join(',.');

            if(selected_path) {
                d3.selectAll('.' + selected_path)
                    .transition().duration(5)
                    .style('opacity', '0.7')
                    .style('stroke', 'rgb(200, 28, 38)');
            }
        }
        return selected_path;
    }

    doNotHighlight(event, i, selected_path) {
        if(selected_path !== '') {
            let temp_text = selected_path.split(',.');
            let new_temp_text = [];
            for(let i = 0; i < temp_text.length; i++) {
                let isOrange = d3.select('.' + temp_text[i]).style('stroke');

                if(isOrange !== 'rgb(255, 165, 0)') {
                    new_temp_text.push(temp_text[i]);
                }
                else {
                    // do nothing
                }
            }

            selected_path = new_temp_text.join(',.');

            if(selected_path) {
                d3.selectAll('.' + selected_path)
                    .transition()
                    .style('opacity', '0.7')
                    .style('stroke', 'rgb(0, 129, 175)');
            }
        }
    }

    createTooltipForPathLine(tooltip_text, tooltip_path, event) {
        if (tooltip_text.length !== 0) {
            let temp_text = tooltip_text.toString();
            temp_text = temp_text.split(',').join('\r\n');
            tooltip_path.text(temp_text);
            tooltip_path.style('visibility', 'visible');
            tooltip_path.style('top', event.clientY + 'px').style('left', event.clientX + 'px');
            tooltip_path.style('font-size', '0.75rem').style('border', 0.08 + 'rem solid gray')
                .style('border-radius', 0.1 + 'rem').style('margin', 0.5 + 'rem')
                .style('padding', 0.12 + 'rem').style('white-space', 'pre-line')
                .style('background-color', 'LightGray').style('margin-left', 0.5 + 'rem');
            return tooltip_path;
        }
    }

    getAllPointerEventsData(event) {
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
}

export const { invertD, setDimensions, generateSVG, select, position, onDragStartEventHandler, onDragEventHandler, transition, 
    onDragEndEventHandler, onInvert, prepareData, initDataPrep, setupYScales, setupXScales, setupYAxis, resetSVG, linePath, highlight, 
    doNotHighlight, createTooltipForPathLine, getAllPointerEventsData, move  } = new SteerableParcoords();
