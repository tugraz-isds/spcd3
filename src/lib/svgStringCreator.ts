import * as d3 from 'd3-selection';
import { format } from 'd3-format';
import * as helper from './helper';
import * as utils from './utils';
import * as pc from './parallelcoordinates';

const formatFloat = format(".4f");

export function setActivePathLinesToDownload(svg: any, parcoords: any, key: string,) {

    svg.append('g')
        .attr('class', 'active')
        .style('opacity', '0.5')
        .style('stroke', 'rgb(0, 129, 175)')
        .style('stroke-width', '0.1rem')
        .style('fill', 'none')
        .selectAll('path')
        .data(parcoords.data)
        .enter()
        .append('path')
        .attr('id', (d) => {
            return utils.cleanString(d[key]);
        })
        .each(function (d) {
            d3.select(this)
                .attr('d', helper.linePath(d, parcoords.newFeatures, parcoords));
        });

    const records = pc.getAllRecords();
    records.forEach(element => {
        const cleanRecord = utils.cleanString(element);
        const isSelected = pc.isSelected(cleanRecord);
        if (isSelected) {
            svg.select('#' + cleanRecord)
                .style('stroke', 'rgb(255, 165, 0)')
                .style('opacity', '1');
        }
        const dimNameToCheck = d3.select('#' + cleanRecord).text();
        if (dimNameToCheck != '') {
            svg.select('#' + cleanRecord)
                .style('stroke', 'lightgrey')
                .style('stroke-opacity', '0.4')
        }
    });
}

export function setFeatureAxisToDownload(svg: any, yAxis: any, yScales: any,
    parcoords: any, padding: any): void {

    let featureAxis = svg.selectAll('g.feature')
        .data(parcoords.features)
        .enter()
        .append('g')
        .attr('transform', d => ('translate(' + parcoords.xScales(d.name)) + ')');

    featureAxis
        .append('g')
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            const ranges = pc.getDimensionRange(d.name);
            if (!pc.isDimensionCategorical(d.name)) {
                const status = pc.getInversionStatus(d.name);
                if (status == 'ascending') {
                    yScales[d.name].domain([ranges[0], ranges[1]]);
                    yAxis = helper.setupYAxis(parcoords.features, yScales,
                        parcoords.newDataset);
                    d3.select(this)
                        .attr('id', 'dimension_axis_' + processedDimensionName)
                        .call(yAxis[d.name]
                            .scale(yScales[d.name]
                                .domain(yScales[d.name]
                                    .domain())));
                }
                else {
                    yScales[d.name].domain([ranges[1], ranges[0]]);
                    yAxis = helper.setupYAxis(parcoords.features, yScales,
                        parcoords.newDataset);
                    d3.select(this)
                        .attr('id', 'dimension_axis_' + processedDimensionName)
                        .call(yAxis[d.name]
                            .scale(yScales[d.name]
                                .domain(yScales[d.name]
                                    .domain().reverse())));
                }
            }
            else {
                d3.select(this)
                    .attr('id', 'dimension_axis_' + processedDimensionName)
                    .call(yAxis[d.name])
            }
        });

    featureAxis
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', (padding / 1.7).toFixed(4))
        .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
        .style('font-size', '0.7rem');

    setBrushDownToDownload(featureAxis, parcoords);
    setBrushUpToDownload(featureAxis, parcoords);
    setRectToDragToDownload(featureAxis, parcoords);
    setInvertIconToDownload(featureAxis, padding);
}

function setBrushDownToDownload(featureAxis: any, parcoords: any): void {

    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
            d3.select(this)
                .append('g')
                .append('use')
                .attr('id', 'triangle_down_' + processedDimensionName)
                .attr('y', item.top == 80 ? 70 : item.top)
                .attr('x', -6)
                .attr('width', 14)
                .attr('height', 10)
                .attr('href', '#brush_image_bottom')
        });
}

function setBrushUpToDownload(featureAxis: any, parcoords: any): void {

    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
            d3.select(this)
                .append('g')
                .append('use')
                .attr('id', 'triangle_up_' + processedDimensionName)
                .attr('y', item.top != 80 && item.bottom != 320 ? item.bottom + 10 : item.bottom)
                .attr('x', -6)
                .attr('width', 14)
                .attr('height', 10)
                .attr('href', '#brush_image_top')
        });
}

function setRectToDragToDownload(featureAxis: any, parcoords: any): void {

    featureAxis
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
            let height = item.bottom - item.top;
            if (item.top != 80 && item.bottom == 320) height = height - 10;
            d3.select(this)
                .append('g')
                .append('rect')
                .attr('id', 'rect_' + processedDimensionName)
                .attr('width', 12)
                .attr('height', height)
                .attr('x', -6)
                .attr('y', item.top != 80 && item.bottom != 320 || item.top != 80 ? item.top + 10 : item.top)
                .attr('fill', 'rgb(255, 255, 0)')
                .attr('opacity', '0.4')
        });
}

function setInvertIconToDownload(featureAxis: any, padding: any): void {

    let value = (padding / 1.5).toFixed(4);

    featureAxis
        .append('svg')
        .attr('y', value)
        .attr('x', -6)
        .append('use')
        .attr('width', 12)
        .attr('height', 12)
        .attr('y', 0)
        .attr('x', 0)
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            if (pc.getInversionStatus(processedDimensionName) == 'descending') {
                d3.select(this)
                    .attr('href', '#arrow_image_down')
            }
            else {
                d3.select(this)
                    .attr('href', '#arrow_image_up')
            }
        });
}