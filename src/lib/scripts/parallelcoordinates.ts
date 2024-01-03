import * as d3 from 'd3';

export default class SteerableParcoords {

    removeDuplicateColumnNames(value :string) {
        let complete_arr = value.split(/\r?\n/);
        let column_string = d3.csvParse(complete_arr[0]);
        let n = 0;
        const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n+=1})`)(new Set));
        complete_arr[0] = unique(column_string["columns"]).toString();
        return complete_arr.join('\r\n');
    }

    checkIfDuplicatesExists(value :string) {
        return new Set(value).size !== value.length
    }

    loadCSV(csv :string)
    {
        let complete_arr = csv.split(/\r?\n/);
        if (checkIfDuplicatesExists(complete_arr[0]))
        {
            csv = removeDuplicateColumnNames(csv);
        }
        let tmp_data = d3.csvParse(csv);
        return tmp_data.sort((a,b) => a.Name > b.Name ? 1 : -1);
    }

    setDimensions(newDimension): void
    {
        return newDimension.reverse();
    }

    invert(dimension, newFeatures, xScales, yScales, yAxis) {
        let cleanDimension = dimension.replace(/ /g,"_");
        cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
        const invert_id = "#dimension_invert_" + cleanDimension;
        const dimension_id = "#dimension_axis_" + cleanDimension;
        const textElement = d3.select(invert_id);
        const currentText = textElement.text();
        const newPath = currentText === 'down' ? 'M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 z' :
            'M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 z';
        const arrowStyle = currentText === 'down' ? 'url("./svg/arrow_down.svg") 8 8, auto' :
            'url("./svg/arrow_up.svg") 8 8, auto';
        textElement.text(currentText === 'down' ? 'up' : 'down');
        textElement.attr("d", newPath)
        textElement.style('cursor', arrowStyle);

        d3.select(dimension_id).call(yAxis[dimension].scale(yScales[dimension].domain(yScales[dimension]
            .domain().reverse())))
            .transition();

        // force update lines
        let active = d3.select('g.active')
            .selectAll('path')
            .attr('d', (d) => { linePath(d, newFeatures, xScales, yScales) });
        delete textElement.__origin__;
        delete active[dimension];

        transition(active).each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, newFeatures, xScales, yScales))});

        d3.select('g.inactive')
            .selectAll('path')
            .each(function (d) {
            d3.select(this)
                .attr('d', linePath(d, newFeatures, xScales, yScales))})
            .transition()
            .delay(5)
            .duration(0)
            .attr("visibility", null);
    }

    getInversionStatus(dimension)
    {

    }

    move(dimension, toRightOf, A)
    {

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
            d3.select("." + selected_value)
                .transition()
                .style("stroke", "rgb(255, 165, 0)")
                .style("opacity", "1")
        }
    }

    saveAsSVG()
    {

    }

    position(d, dragging, xScales) {
        var v = dragging[d];
        return v == null ? xScales(d) : v;
    }

    onDragStartEventHandler(xScales, inactive, dragging)
    {
        {
            return function onDragStart (d)
            {
                this.__origin__ = xScales((d.subject).name);
                dragging[(d.subject).name] = this.__origin__;
                inactive.attr("visibility", "hidden");
            }
        }
    }

    onDragEventHandler(newFeatures, xScales, yScales, dragging, active, featureAxisG, width) {
        {
            return function onDrag(d) {
                dragging[(d.subject).name] = Math.min(width - 79, Math.max(79, this.__origin__ += d.dx));
                active.each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, newFeatures, xScales, yScales))
                })
                newFeatures.sort((a, b) => {
                    return position(b, dragging, xScales) - position(a, dragging, xScales);
                });
                xScales.domain(newFeatures);
                featureAxisG.attr("transform", (d) => {
                    return "translate(" + position(d.name, dragging, xScales) + ")";
                });
            };
        }
    }

    transition(g) {
        return g.transition().duration(50);
    }

    onDragEndEventHandler(newFeatures, xScales, yScales, dragging, inactive, active) {
        {
            return function onDragEnd(d) {
                delete this.__origin__;
                delete dragging[(d.subject).name];
                //transition(d3.select(this)).attr('transform', d => ('translate(' + parcoords.xScales(d.name)  + ')'));
                transition(active).each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, newFeatures, xScales, yScales))
                })
                inactive.each(function (d) {
                    d3.select(this)
                        .attr('d', linePath(d, newFeatures, xScales, yScales))})
                    .transition()
                    .delay(5)
                    .duration(0)
                    .attr("visibility", null);
            };
        }
    }

    onInvert(newFeatures, xScales, yScales, yAxis) {
        {
            return function invertDim(event, d) {
                invert(d.name, newFeatures, xScales, yScales, yAxis);
            };
        }
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

    setupBrush(yScales)
    {
        let yBrushes = {};
        let filters = {};
        const height = 400;
        const padding = 80;
        const brushWidth = 20;
        Object.entries(yScales).map(x => {
            let extent = [[-(brushWidth / 2), padding - 1],
                [brushWidth / 2, height - padding]];

            yBrushes[x[0]] = d3.brushY()
                .extent(extent)
                .on('start', onBrushEventHandler(filters, yScales))
                .on('brush', onBrushEventHandler(filters, yScales))
        });
        return yBrushes;
    }

    onBrushEventHandler(filters, yScales) {
        {
            return function brushEventHandler(event,features) {
                if (event.sourceEvent && event.sourceEvent.type === 'zoom') {
                    return;
                }

                if (event.selection !== null) {
                    filters[features.name] = event.selection.map((x) => {
                        const scale = yScales[features.name];// Get the appropriate scale based on features
                        return scale.invert(x); // Remap the selection value
                    });
                } else {

                }
                applyFilters(filters);
                delete (filters[features.name]);
            };
        }
    }

    applyFilters(filters) {
        d3.select('g.active').selectAll('path')
            .style('display', d => (selected(d, filters) ? null : 'none'));
    }

    selected(d, filters) {
        const tempFilters = Object.entries(filters)
        return tempFilters.every(f => {
            if (f[1][1] === 0 && f[1][0] === 0) {
                return true;
            }
            return f[1][1] <= d[f[0]] && d[f[0]] <= f[1][0];
        });
    }

     resetSVG() {
        d3.select("pc_svg").remove();
    }

    // TODO refactor
    generateSVG(content, newFeatures) {
        const padding = 80;
        const width = newFeatures.length * padding;
        const height = 400;
        let featureAxisG = null;
        let active = null;
        let inactive = null;
        let ids = [];
        let selected_path = null;
        let dragging = {};

        let dataset = prepareData(content, newFeatures);
        let features = dataset[0];
        let newDataset = dataset[1];
        let yScales = setupYScales(height, padding, features, newDataset);
        let xScales = setupXScales(width, padding, features);
        let yAxis = setupYAxis(features, yScales, newDataset);
        let brushes = setupBrush(yScales);
        let tooltip_path = d3.select('#parallelcoords')
            .append('g')
            .style("position", "absolute")
            .style("visibility", "hidden");

        const svg = d3.select("#parallelcoords")
            .append('svg')
            .attr("id", "pc_svg")
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("font-family", "Verdana, sans-serif")
            .attr("style", "width: 75rem; max-height: 25rem")
            .attr("style", "overflow-x: auto")
            .attr("style", "overflow-y: hidden")
            .attr("preserveAspectRatio", "none");

        inactive = svg.append('g')
            .attr('class', 'inactive')
            .selectAll('path')
            .data(content)
            .enter()
            .append('path')
            .style("pointer-events", "none")
            .style("fill", "none")
            .style("stroke", "lightgrey")
            .style("stroke-opacity", "0.4")
            .each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, newFeatures, xScales, yScales))
            });

        active = svg.append('g')
            .attr('class', 'active')
            .selectAll('path')
            .data(content)
            .enter()
            .append('path')
            .attr("class", (d)=> {
                const keys = Object.keys(d);
                const first_key = keys[0];
                const selected_value = d[first_key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
                ids.push(selected_value);
                return "line " + selected_value
            })
            .attr("id", (d) => {
                const keys = Object.keys(d);
                const first_key = keys[0];
                return d[first_key];
            })
            .each(function (d) {
                d3.select(this)
                    .attr('d', linePath(d, newFeatures, xScales, yScales))
            })
            .style("opacity", "0.4")
            .style("pointer-events", "stroke")
            .style("stroke", "rgb(0, 129, 175)")
            .style("stroke-width", "0.1rem")
            .style("fill", "none")
            .on("pointerenter", (event, d) => {
                const data = getAllPointerEventsData(event);
                selected_path = highlight(data);
                createTooltipForPathLine(data, tooltip_path, event);
            })
            .on("pointerleave", (event, d) => {
                doNotHighlight(event, d, selected_path);
                return tooltip_path.style("visibility", "hidden");
            })
            .on("pointerout", (event, d) => {
                doNotHighlight(event, d, selected_path);
                return tooltip_path.style("visibility", "hidden");
            })
            .on("click", (event, d) => {
                const data = getAllPointerEventsData(event);
                select(data);
            });

        featureAxisG = svg.selectAll('g.feature')
            .data(features)
            .enter()
            .append('g')
            .attr('class', 'feature')
            .attr('id', 'feature')
            .attr('transform', d => ('translate(' + xScales(d.name) + ')'));

        featureAxisG
            .append('g')
            .each(function (d) {
                let cleanString = d.name.replace(/ /g,"_");
                cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .attr('id', 'dimension_axis_' + cleanString)
                    .call(yAxis[d.name])
                    .attr("fill", "rgb(255, 255, 0, 0.5)")
            });

        featureAxisG
            .each(function (d) {
                d3.select(this)
                    .append('g')
                    .attr('class', 'brush')
                    .call(brushes[d.name])
            });

        var tooltip_dim = d3.select('#parallelcoords')
            .append('g')
            .style("position", "absolute")
            .style("visibility", "hidden");

        featureAxisG
            .append("text")
            .attr("id", "dimension")
            .attr("text-anchor", "middle")
            .attr('y', padding / 1.7)
            .text(d => d.name.length > 10 ? d.name.substr(0, 10) + "..." : d.name)
            .style("font-size", "0.7rem")
            .call(d3.drag()
                .on("start", onDragStartEventHandler(xScales, inactive, dragging))
                .on("drag", onDragEventHandler(newFeatures, xScales, yScales, dragging, active, featureAxisG, width))
                .on("end", onDragEndEventHandler(newFeatures, xScales, yScales, dragging, inactive, active))
            )
            .on("mouseover", function(){return tooltip_dim.style("visibility", "visible");})
            .on("mousemove", (event, d) => {
                if(event.clientX > width - 120)
                {
                    featureAxisG
                        .select("#dimension")
                        .style("cursor", "w-resize");
                }
                else if (event.clientX <= 100)
                {
                    featureAxisG
                        .select("#dimension")
                        .style("cursor", "e-resize");
                }
                else {
                    featureAxisG
                        .select("#dimension")
                        .style("cursor", "ew-resize");
                }
                tooltip_dim.text(d.name);
                tooltip_dim.style("top", 13.6 + "rem").style("left", event.clientX + "px");
                tooltip_dim.style("font-size", "0.75rem").style("border", 0.08 + "rem solid gray")
                    .style("border-radius", 0.1 + "rem").style("margin", 0.5 + "rem")
                    .style("padding", 0.12 + "rem")
                    .style("background-color", "LightGray").style("margin-left", 0.5 + "rem");
                return tooltip_dim;
            })
            .on("mouseout", function(){return tooltip_dim.style("visibility", "hidden");});

        featureAxisG
            .append("svg")
            .attr('y', padding/1.4)
            .attr('x', -3)
            .append("path")
            .attr("d", "M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 z")
            .each(function (d) {
                let cleanString = d.name.replace(/ /g,"_");
                cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
                d3.select(this)
                    .attr('id', 'dimension_invert_' + cleanString)
                    .text('down')
                    .style('cursor', 'url("./svg/arrow_up.svg") 8 8, auto')
            })
            .on("click", onInvert(newFeatures, xScales, yScales, yAxis));

        window.onclick = (event) => {
            if (!(event.ctrlKey || event.metaKey)) {
                for (let i = 0; i < ids.length; i++) {
                    d3.select('.' + ids[i]).style("stroke", "rgb(0, 129, 175)")
                }
            }
        }
    }
    linePath(d, newFeatures, xScales, yScales) {
        var lineGenerator = d3.line();
        const tempdata = Object.entries(d).filter(x => x[0]);
        let points = [];

        newFeatures.map(newfeature => {
            tempdata.map(x => {
                if (newfeature === x[0]) {
                    points.push([xScales(newfeature), yScales[newfeature](x[1])]);
                }
            })
        })
        return (lineGenerator(points));
    }

    highlight(data) {
        let selected_path;
        if (data.length !== 0) {
            let temp_text = data.toString();
            temp_text = temp_text.replaceAll(",", ",.");
            temp_text = temp_text.replace(/[*\- 0123456789%&'\[{()}\]]/g, '');
            selected_path = temp_text;
            temp_text = temp_text.split(",.");

            let new_temp_text = [];
            for(let i = 0; i < temp_text.length; i++) {
                let isOrange = d3.select("." + temp_text[i].replace(/,./g, "")).style("stroke");
                if(isOrange !== "rgb(255, 165, 0)") {
                    new_temp_text.push(temp_text[i].replace(/,./g, ""));
                }
                else {
                    // do nothing
                }
            }

            selected_path = new_temp_text.join(",.");

            if(selected_path) {
                d3.selectAll("." + selected_path)
                    .transition().duration(5)
                    .style("opacity", "1")
                    .style("stroke", "rgb(200, 28, 38)");
            }
        }
        return selected_path;
    }

    doNotHighlight(event, i, selected_path) {
        if(selected_path !== "") {
            let temp_text = selected_path.split(",.");
            let new_temp_text = [];
            for(let i = 0; i < temp_text.length; i++) {
                let isOrange = d3.select("." + temp_text[i]).style("stroke");

                if(isOrange !== "rgb(255, 165, 0)") {
                    new_temp_text.push(temp_text[i]);
                }
                else {
                    // do nothing
                }
            }

            selected_path = new_temp_text.join(",.");

            if(selected_path) {
                d3.selectAll("." + selected_path)
                    .transition()
                    .style("opacity", "0.2")
                    .style("stroke", "rgb(0, 129, 175)");
            }
        }
    }

    createTooltipForPathLine(tooltip_text, tooltip_path, event) {
        if (tooltip_text.length !== 0) {
            let temp_text = tooltip_text.toString();
            temp_text = temp_text.split(',').join("\r\n");
            tooltip_path.text(temp_text);
            tooltip_path.style("visibility", "visible");
            tooltip_path.style("top", event.clientY + "px").style("left", event.clientX + "px");
            tooltip_path.style("font-size", "0.75rem").style("border", 0.08 + "rem solid gray")
                .style("border-radius", 0.1 + "rem").style("margin", 0.5 + "rem")
                .style("padding", 0.12 + "rem").style("white-space", "pre-line")
                .style("background-color", "LightGray").style("margin-left", 0.5 + "rem");
            return tooltip_path;
        }
    }

    getAllPointerEventsData(event) {
        const selection = d3.selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter("path");
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

export const { loadCSV, invert, setDimensions, generateSVG, removeDuplicateColumnNames, checkIfDuplicatesExists, select,
    position, onDragStartEventHandler, onDragEventHandler, transition, onDragEndEventHandler, onInvert, prepareData,
    setupYScales, setupXScales, setupYAxis, setupBrush, onBrushEventHandler, applyFilters, selected, resetSVG, linePath, highlight,
    doNotHighlight, createTooltipForPathLine, getAllPointerEventsData } = new SteerableParcoords();
