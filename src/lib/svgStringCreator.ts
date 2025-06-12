import * as d3 from 'd3-selection';
import { format } from 'd3-format';
import * as helper from './helper';
import * as utils from './utils';
import * as pc from './parallelcoordinates';

const formatFloat = format(".4f");

export function setActivePathLinesToDownload(svg: any, parcoords: any, key: string, ): any {

    let active = svg.append('g')
        .attr('class', 'active')
        .selectAll('path')
        .data(parcoords.data)
        .enter()
        .append('path')
        .attr('id', (d) => {
            return d[key];
        })
        .each(function (d) {
            let element = d[key].length > 10 ? d[key].substr(0, 10) + '...' : d[key];
            d[key] = element;
            d3.select(this)
                .attr('d', helper.linePath(d, parcoords.newFeatures, parcoords));
        })
        .style('opacity', '0.5')
        .style('stroke', 'rgb(0, 129, 175)')
        .style('stroke-width', '0.1rem')
        .style('fill', 'none');


    const records = pc.getAllRecords();
    records.forEach(element => {
        const isSelected = pc.isSelected(element);
        if (isSelected) {
            svg.select('#' + element)
            .style('stroke', 'rgb(255, 165, 0)')
            .style('opacity', '1');
        }
    });
    return active;
}

export function setFeatureAxisToDownload(svg: any, yAxis: any, yScales: any, xScales, parcoords: any, padding: any): void {
    
    let featureAxis = svg.selectAll('g.feature')
        .data(parcoords.features)
        .enter()
        .append('g')
        .attr('class', 'dimensions')
        .attr('transform', d => ('translate(' + xScales(d.name)) + ')');

    featureAxis
        .append('g')
        .each(function (d) {
            const processedDimensionName = utils.cleanString(d.name);
            const status = pc.getInversionStatus(processedDimensionName);
            const ranges = pc.getDimensionRange(processedDimensionName);
            console.log(ranges);
            if (status == 'ascending') {
                d3.select(this)
                    .attr('id', 'dimension_axis_' + processedDimensionName)
                    .call(yAxis[processedDimensionName]
                    .scale(yScales[processedDimensionName]
                    .domain(yScales[processedDimensionName]
                    .domain())));
                yScales[processedDimensionName].domain([ranges[1], ranges[0]]);
                yAxis = helper.setupYAxis(parcoords.features, yScales, 
                    parcoords.newDataset);
            }
            else {
                d3.select(this)
                    .attr('id', 'dimension_axis_' + processedDimensionName)
                    .call(yAxis[processedDimensionName]
                    .scale(yScales[processedDimensionName]
                    .domain(yScales[processedDimensionName]
                    .domain().reverse())));
                yScales[processedDimensionName].domain([ranges[0], ranges[1]]);
                yAxis = helper.setupYAxis(parcoords.features, yScales, 
                    parcoords.newDataset);
            }
        });

    featureAxis
        .append('text')
        .attr('class', 'dimension')
        .attr('text-anchor', 'middle')
        .attr('y', (padding/1.7).toFixed(4))
        .text(d => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
        .style('font-size', '0.7rem');
    
    setBrushDownToDownload(featureAxis);
    setBrushUpToDownload(featureAxis);
    setRectToDragToDownload(featureAxis);
    setInvertIconToDownload(featureAxis, padding);
}

function setBrushDownToDownload(featureAxis: any): void {
  featureAxis
      .each(function (d) {
          const processedDimensionName = utils.cleanString(d.name);
          d3.select(this)
              .append('g')
              .attr('class', 'brush_' + processedDimensionName)
              .append('use')
              .attr('id', 'triangle_down_' + processedDimensionName)
              .attr('y', 70)
              .attr('x', -7)
              .attr('width', 14)
              .attr('height', 10)
              .attr('href', '#brush_image_bottom')
      });
}

function setBrushUpToDownload(featureAxis: any): void {
  featureAxis
      .each(function (d) {
          const processedDimensionName = utils.cleanString(d.name);
          d3.select(this)
              .append('g')
              .attr('class', 'brush_' + processedDimensionName)
              .append('use')
              .attr('id', 'triangle_up_' + processedDimensionName)
              .attr('y', 320)
              .attr('x', -7)
              .attr('width', 14)
              .attr('height', 10)
              .attr('href', '#brush_image_top')
      });
}

function setRectToDragToDownload(featureAxis: any): void {
  
  featureAxis
      .each(function (d) {
          const processedDimensionName = utils.cleanString(d.name);
          d3.select(this)
              .append('g')
              .attr('class', 'rect')
              .append('rect')
              .attr('id', 'rect_' + processedDimensionName)
              .attr('width', 12)
              .attr('height', 240)
              .attr('x', -6)
              .attr('y', 80)
              .attr('fill', 'rgb(255, 255, 0)')
              .attr('opacity', '0.4')
      });
}

function setInvertIconToDownload(featureAxis: any, padding: any): void {
  let value = (padding/1.5).toFixed(4);

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