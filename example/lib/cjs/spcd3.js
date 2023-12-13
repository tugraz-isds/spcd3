// SPCD3 version 1.0.0 CommonJS
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class SteerableParcoords {
    data;
    newFeatures;
    width;
    height;
    padding;
    brushWidth;
    filters;
    features;
    xScales;
    dragging;
    featureAxisG;
    yScales;
    active;
    inactive;
    newDataset;
    yBrushes;
    yAxis;
    selected_path;
    constructor(data, newFeatures) {
        if (data) {
            this.data = data;
        }
        if (newFeatures) {
            this.newFeatures = newFeatures;
        }
    }
    removeDuplicateColumnNames(value) {
        let complete_arr = value.split(/\r?\n/);
        let column_string = d3.csvParse(complete_arr[0]);
        let n = 0;
        const unique = arr => arr.map((s => v => !s.has(v) && s.add(v) ? v : `${v}(${n += 1})`)(new Set));
        let column_string_wo_dup = unique(column_string["columns"]).toString();
        complete_arr[0] = column_string_wo_dup;
        return complete_arr.join('\r\n');
    }
    checkIfDuplicatesExists(value) {
        return new Set(value).size !== value.length;
    }
    loadCSV(csv) {
        let complete_arr = csv.split(/\r?\n/);
        if (this.checkIfDuplicatesExists(complete_arr[0])) {
            csv = this.removeDuplicateColumnNames(csv);
        }
        let tmp_data = d3.csvParse(csv);
        this.data = tmp_data.sort((a, b) => a.Name > b.Name ? 1 : -1);
    }
    //not happy with this, but at the moment we need it
    getData() {
        return this.data;
    }
    setDimensions(newDimension) {
        this.newFeatures = newDimension;
        this.newFeatures.reverse();
    }
    invert(dimension) {
        let cleanDimension = dimension.replace(/ /g, "_");
        cleanDimension = cleanDimension.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
        const invert_id = "#dimension_invert_" + cleanDimension;
        const dimension_id = "#dimension_axis_" + cleanDimension;
        const textElement = d3.select(invert_id);
        const currentText = textElement.text();
        const newText = currentText === '\u2193' ? '\u2191' : '\u2193';
        const arrowStyle = currentText === '\u2193' ? 's-resize' : 'n-resize';
        textElement.text(newText);
        textElement.style('cursor', arrowStyle);
        d3.select(dimension_id).call(this.yAxis[dimension].scale(this.yScales[dimension].domain(this.yScales[dimension].domain().reverse())))
            .transition();
        // force update lines
        this.active.attr('d', this.linePath.bind(this));
        delete textElement.__origin__;
        delete this.active[dimension];
        this.transition(this.active).attr('d', this.linePath.bind(this));
        this.inactive.attr('d', this.linePath.bind(this))
            .transition()
            .delay(5)
            .duration(0)
            .attr("visibility", null);
    }
    getInversionStatus(dimension) {
    }
    move(dimension, toRightOf, A) {
    }
    getDimensionPositions() {
    }
    getFilter(dimension) {
    }
    setFilter(dimension) {
    }
    getSelected() {
    }
    select(event, d) {
        this.selected_path = "";
        const keys = Object.keys(d);
        const first_key = keys[0];
        let selected_value = d[first_key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
        const current_color_line = d3.select("." + selected_value).style('stroke');
        if (current_color_line === "rgb(255, 165, 0)") {
            d3.select("." + selected_value)
                .transition()
                .style("stroke", "rgb(0, 129, 175)")
                .style("opacity", "0.2");
        }
        else {
            d3.select("." + selected_value)
                .transition()
                .style("stroke", "rgb(255, 165, 0)")
                .style("opacity", "1");
        }
    }
    saveAsSVG() {
    }
    position(d, parcoords) {
        var v = parcoords.dragging[d];
        return v == null ? parcoords.xScales(d) : v;
    }
    onDragStartEventHandler(parcoords) {
        {
            return function onDragStart(d) {
                this.__origin__ = parcoords.xScales((d.subject).name);
                parcoords.dragging[(d.subject).name] = this.__origin__;
                parcoords.inactive.attr("visibility", "hidden");
            };
        }
    }
    onDragEventHandler(parcoords) {
        {
            return function onDrag(d) {
                if (parcoords.xScales((d.subject).name) > 80) {
                    parcoords.dragging[(d.subject).name] = Math.min(parcoords.width, Math.max(0, this.__origin__ += d.dx));
                    parcoords.active.attr('d', parcoords.linePath.bind(parcoords));
                    parcoords.newFeatures.sort((a, b) => {
                        return parcoords.position(b, parcoords) - parcoords.position(a, parcoords);
                    });
                    parcoords.xScales.domain(parcoords.newFeatures);
                    parcoords.featureAxisG.attr("transform", (d) => {
                        return "translate(" + parcoords.position(d.name, parcoords) + ")";
                    });
                }
            };
        }
    }
    transition(g) {
        return g.transition().duration(50);
    }
    onDragEndEventHandler(parcoords) {
        {
            return function onDragEnd(d) {
                delete this.__origin__;
                delete parcoords.dragging[(d.subject).name];
                parcoords.transition(d3.select(this)).attr('transform', d => ('translate(' + parcoords.xScales(d.name) + ')'));
                parcoords.transition(parcoords.active).attr('d', parcoords.linePath.bind(parcoords));
                parcoords.inactive.attr('d', parcoords.linePath.bind(parcoords))
                    .transition()
                    .delay(5)
                    .duration(0)
                    .attr("visibility", null);
            };
        }
    }
    onInvert(parcoords) {
        {
            return function invert(event, d) {
                parcoords.invert(d.name);
            };
        }
    }
    prepareData() {
        this.data.forEach(obj => {
            var newdata = {};
            this.newFeatures.forEach(feature => {
                newdata[feature] = obj[feature];
            });
            this.newDataset.push(newdata);
        });
        Object.keys(this.newDataset[0]).forEach(element => this.features.push({ 'name': element }));
    }
    setupScales() {
        this.features.map(x => {
            const testValue = this.newDataset.map(o => o[x.name]);
            if (isNaN(testValue[0]) !== false) {
                this.yScales[x.name] = d3.scalePoint()
                    .domain(this.newDataset.map(o => o[x.name]))
                    .range([this.padding, this.height - this.padding])
                    .padding(0.2);
            }
            else {
                var max = Math.max(...this.newDataset.map(o => o[x.name]));
                var min = Math.min(...this.newDataset.map(o => o[x.name]));
                this.yScales[x.name] = d3.scaleLinear()
                    .domain([min, max]).nice()
                    .range([this.height - this.padding, this.padding]);
            }
        });
        this.xScales = d3.scalePoint()
            .domain(this.features.map(x => x.name))
            .range([this.width - this.padding, this.padding]);
    }
    setupYAxis() {
        let counter = 0;
        const limit = 30;
        Object.entries(this.yScales).map(key => {
            let temp_var_features = Array.from(this.features.values()).map(c => c.name);
            let temp_var_values = this.newDataset.map(o => o[temp_var_features[counter]]);
            counter = counter + 1;
            if (isNaN(temp_var_values[0])) {
                var unique_arr = temp_var_values.filter(function (elem, index, self) {
                    return index === self.indexOf(elem);
                });
                if (unique_arr.length > limit) {
                    var filtered_arr = temp_var_values.filter(function (value, index, array) {
                        return index % 3 == 0;
                    });
                    this.yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(filtered_arr);
                }
                else {
                    this.yAxis[key[0]] = d3.axisLeft(key[1]).tickValues(temp_var_values);
                }
            }
            else {
                this.yAxis[key[0]] = d3.axisLeft(key[1]);
            }
        });
        return this.yAxis;
    }
    setupBrush() {
        Object.entries(this.yScales).map(x => {
            let extent = [[-(this.brushWidth / 2), this.padding - 1],
                [this.brushWidth / 2, this.height - this.padding]];
            this.yBrushes[x[0]] = d3.brushY()
                .extent(extent)
                .on('brush', this.onBrushEventHandler(this))
                .on('end', this.onBrushEventHandler(this));
        });
        return this.yBrushes;
    }
    onBrushEventHandler(parcoords) {
        {
            return function brushEventHandler(event, features) {
                if (event.sourceEvent && event.sourceEvent.type === 'zoom')
                    return;
                if (parcoords.features === 'Name') {
                    return;
                }
                if (event.selection != null) {
                    const remappedSelection = event.selection.map((x) => {
                        const scale = parcoords.yScales[features.name]; // Get the appropriate scale based on features
                        return scale.invert(x); // Remap the selection value
                    });
                    parcoords.filters[features.name] = remappedSelection;
                }
                else {
                    if (features.name in parcoords.filters)
                        delete (parcoords.filters[features.name]);
                }
                parcoords.applyFilters();
            };
        }
    }
    applyFilters() {
        d3.select('g.active').selectAll('path')
            .style('display', d => (this.selected(d) ? null : 'none'));
    }
    selected(d) {
        const tempFilters = Object.entries(this.filters);
        return tempFilters.every(f => {
            return f[1][1] <= d[f[0]] && d[f[0]] <= f[1][0];
        });
    }
    initContent() {
        this.width = this.newFeatures.length * 80;
        this.height = 400;
        this.padding = 80;
        this.brushWidth = 20;
        this.filters = {};
        this.features = [];
        this.xScales = null;
        this.dragging = {};
        this.featureAxisG = null;
        this.yScales = {};
        this.active = null;
        this.inactive = null;
        this.newDataset = [];
        this.yBrushes = {};
        this.yAxis = {};
        d3.select("svg").remove();
    }
    // TODO refactor
    generateSVG() {
        this.initContent();
        this.prepareData();
        this.setupScales();
        let yaxis = this.setupYAxis();
        let brushes = this.setupBrush();
        let tooltip_path = d3.select('#parallelcoords')
            .append('g')
            .style("position", "absolute")
            .style("visibility", "hidden");
        const svg = d3.select("#parallelcoords")
            .append('svg')
            .attr("viewBox", [0, 0, this.width, this.height])
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("font-family", "Verdana, sans-serif")
            .attr("style", "width: 75rem; max-height: 25rem")
            .attr("style", "overflow-x: auto")
            .attr("style", "overflow-y: hidden")
            .attr("preserveAspectRatio", "none");
        this.inactive = svg.append('g')
            .attr('class', 'inactive')
            .selectAll('path')
            .data(this.data)
            .enter()
            .append('path')
            .style("pointer-events", "none")
            .style("fill", "none")
            .style("stroke", "lightgrey")
            .style("stroke-opacity", "0.4")
            .attr('d', this.linePath.bind(this));
        this.active = svg.append('g')
            .attr('class', 'active')
            .selectAll('path')
            .data(this.data)
            .enter()
            .append('path')
            .attr("class", function (d) {
            const keys = Object.keys(d);
            const first_key = keys[0];
            const selected_value = d[first_key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
            return "line " + selected_value;
        })
            .attr("id", function (d) {
            const keys = Object.keys(d);
            const first_key = keys[0];
            return d[first_key];
        })
            .attr('d', this.linePath.bind(this))
            .style("opacity", "0.4")
            .style("pointer-events", "stroke")
            .style("stroke", "rgb(0, 129, 175)")
            .style("stroke-width", "0.1rem")
            .style("fill", "none")
            .on("pointerenter", (event, d) => {
            const data = this.getAllPointerEventsData(event);
            this.highlight(data);
            this.createTooltipForPathLine(data, tooltip_path, event);
        })
            .on("pointerleave", (event, d) => {
            this.doNotHighlight(event, d);
            return tooltip_path.style("visibility", "hidden");
        })
            .on("pointerout", (event, d) => {
            this.doNotHighlight(event, d);
            return tooltip_path.style("visibility", "hidden");
        })
            .on("click", (event, d) => {
            this.select(event, d);
        });
        this.featureAxisG = svg.selectAll('g.feature')
            .data(this.features)
            .enter()
            .append('g')
            .attr('class', 'feature')
            .attr('transform', d => ('translate(' + this.xScales(d.name) + ')'))
            .call(d3.drag()
            .on("start", this.onDragStartEventHandler(this))
            .on("drag", this.onDragEventHandler(this))
            .on("end", this.onDragEndEventHandler(this)));
        this.featureAxisG
            .append('g')
            .each(function (d) {
            let cleanString = d.name.replace(/ /g, "_");
            cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
            d3.select(this)
                .attr('id', 'dimension_axis_' + cleanString)
                .call(yaxis[d.name])
                .attr("fill", "rgb(255, 255, 0, 0.5)");
        });
        this.featureAxisG
            .each(function (d) {
            d3.select(this)
                .append('g')
                .attr('class', 'brush')
                .call(brushes[d.name]);
        });
        var tooltip_dim = d3.select('#parallelcoords')
            .append('g')
            .style("position", "absolute")
            .style("visibility", "hidden");
        this.featureAxisG
            .append("text")
            .attr("id", "dimension")
            .attr("text-anchor", "middle")
            .attr('y', this.padding / 1.7)
            .text(d => d.name.length > 10 ? d.name.substr(0, 10) + "..." : d.name)
            .style("font-size", "0.7rem")
            .on("mouseover", function () { return tooltip_dim.style("visibility", "visible"); })
            .on("mousemove", (event, d) => {
            if (event.clientX > 140) {
                this.featureAxisG
                    .select("#dimension")
                    .style("cursor", "ew-resize");
            }
            else {
                this.featureAxisG
                    .select("#dimension")
                    .style("cursor", "auto");
            }
            tooltip_dim.text(d.name);
            tooltip_dim.style("top", 13.6 + "rem").style("left", event.clientX + "px");
            tooltip_dim.style("font-size", "0.75rem").style("border", 0.08 + "rem solid gray")
                .style("border-radius", 0.1 + "rem").style("margin", 0.5 + "rem")
                .style("padding", 0.12 + "rem")
                .style("background-color", "LightGray").style("margin-left", 0.5 + "rem");
            return tooltip_dim;
        })
            .on("mouseout", function () { return tooltip_dim.style("visibility", "hidden"); });
        this.featureAxisG
            .append("text")
            .attr("text-anchor", "middle")
            .attr('y', this.padding / 1.2)
            .each(function (d) {
            let cleanString = d.name.replace(/ /g, "_");
            cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
            //d3.xml("arrow.svg").then(data => {
            d3.select(this)
                .attr('id', 'dimension_invert_' + cleanString)
                .text('\u2193')
                .style('cursor', 'n-resize');
            //.node().append(data.documentElement)})
        })
            .on("click", this.onInvert(this));
        /*d3.xml("arrow.svg")
            .then(data => {
              d3.select("svg").node().append(data.documentElement)
            });*/
    }
    linePath(d) {
        var lineGenerator = d3.line();
        const tempdata = Object.entries(d).filter(x => x[0]);
        let points = [];
        this.newFeatures.map(newfeature => {
            tempdata.map(x => {
                if (newfeature === x[0]) {
                    points.push([this.xScales(newfeature), this.yScales[newfeature](x[1])]);
                }
            });
        });
        return (lineGenerator(points));
    }
    highlight(data) {
        if (data.length !== 0) {
            let temp_text = data.toString();
            temp_text = temp_text.replaceAll(",", ",.");
            temp_text = temp_text.replace(/[*\- 0123456789%&'\[{()}\]]/g, '');
            this.selected_path = temp_text;
            temp_text = temp_text.split(",.");
            let new_temp_text = [];
            for (let i = 0; i < temp_text.length; i++) {
                let isOrange = d3.select("." + temp_text[i].replace(/,./g, "")).style("stroke");
                if (isOrange !== "rgb(255, 165, 0)") {
                    new_temp_text.push(temp_text[i].replace(/,./g, ""));
                }
            }
            this.selected_path = new_temp_text.join(",.");
            if (this.selected_path) {
                d3.selectAll("." + this.selected_path)
                    .transition().duration(5)
                    .style("opacity", "1")
                    .style("stroke", "rgb(200, 28, 38)");
            }
        }
    }
    doNotHighlight(event, i) {
        if (this.selected_path !== "") {
            let temp_text = this.selected_path.split(",.");
            let new_temp_text = [];
            for (let i = 0; i < temp_text.length; i++) {
                let isOrange = d3.select("." + temp_text[i]).style("stroke");
                if (isOrange !== "rgb(255, 165, 0)") {
                    new_temp_text.push(temp_text[i]);
                }
            }
            this.selected_path = new_temp_text.join(",.");
            if (this.selected_path) {
                d3.selectAll("." + this.selected_path)
                    .transition()
                    .style("opacity", "0.2")
                    .style("stroke", "rgb(0, 129, 175)");
            }
        }
        this.selected_path = "";
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

exports.SteerableParcoords = SteerableParcoords;
//# sourceMappingURL=spcd3.js.map
