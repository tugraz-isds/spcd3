import { select }from 'd3-selection';
import * as helper from './helper';
import * as utils from './utils';
import * as api from './helperApiFunc';
import { parcoords, key, padding } from './globals';

export function setActivePathLinesToDownload(svg: any): void {
  svg.append('g')
    .attr('class', 'active')
    .style('opacity', '0.5')
    .style('stroke', 'rgba(0, 129, 175, 0.8)')
    .style('stroke-width', '0.1rem')
    .style('fill', 'none')
    .selectAll('path')
    .data(parcoords.data)
    .enter()
    .append('path')
    .attr('id', (d: { [x: string]: string; }) => {
      return utils.cleanString(d[key]);
    })
    .each(function (d: any) {
      select(this)
      .attr('d', helper.linePath(d, parcoords.newFeatures));
    });

  const records = api.getAllRecords();
  records.forEach(element => {
    const cleanRecord = utils.cleanString(element);
    const isSelected = api.isSelected(cleanRecord);
    if (isSelected) {
      svg.select('#' + cleanRecord)
        .style('stroke', 'rgb(255, 165, 0)')
        .style('opacity', '1');
    }
    const dimNameToCheck = select('#' + cleanRecord).text();
    if (dimNameToCheck != '') {
      svg.select('#' + cleanRecord)
        .style('stroke', 'lightgrey')
        .style('stroke-opacity', '0.4')
    }
  });
}

export function setFeatureAxisToDownload(svg: any, yAxis: any, yScales: any,
  xScales: any): void {
  type Feature = { name: string };
  const orderedFeatures: Feature[] = parcoords.newFeatures.map((name: any) => ({ name }));

  const hiddenDims = api.getAllHiddenDimensionNames();

  let featureAxis = svg.selectAll('g.feature')
    .data(orderedFeatures)
    .enter()
    .append('g')
    .attr('transform', (d: { name: any; }) => ('translate(' + xScales(d.name)) + ')');

  featureAxis
    .append('g')
    .each(function (d: { name: string; }) {
      const processedDimensionName = utils.cleanString(d.name);
      const max = api.getCurrentMaxRange(d.name);
      const min = api.getCurrentMinRange(d.name);
      if (!api.isDimensionCategorical(d.name)) {
        const inversionStatus = api.getInversionStatus(d.name);
        if (inversionStatus === 'ascending') {
          yScales[d.name].domain([min, max]);
          yAxis = helper.setupYAxis(yScales,
          parcoords.newDataset, hiddenDims);
          select(this)
            .attr('id', 'dimension_axis_' + processedDimensionName)
            .call(yAxis[d.name]
            .scale(yScales[d.name]
            .domain(yScales[d.name]
            .domain())));
        }
        else {
          yScales[d.name].domain([min, max]);
          yAxis = helper.setupYAxis(yScales,
          parcoords.newDataset,hiddenDims);
          select(this)
            .attr('id', 'dimension_axis_' + processedDimensionName)
            .call(yAxis[d.name]
            .scale(yScales[d.name]
            .domain(yScales[d.name]
            .domain().reverse())));
        }
      }
      else {
        select(this)
          .attr('id', 'dimension_axis_' + processedDimensionName)
          .call(yAxis[d.name])
      }
    });

    featureAxis
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (80 / 1.7).toFixed(4))
      .text((d: { name: string; }) => d.name.length > 10 ? d.name.substr(0, 10) + '...' : d.name)
      .style('font-size', '0.7rem');

    setBrushDownToDownload(featureAxis);
    setBrushUpToDownload(featureAxis);
    setRectToDragToDownload(featureAxis);
    setInvertIconToDownload(featureAxis);
}

function setBrushDownToDownload(featureAxis: any): void {
  featureAxis
    .each(function (d: { name: string; }) {
      const processedDimensionName = utils.cleanString(d.name);
      const item = parcoords.currentPosOfDims.find((object: { key: any; }) => object.key == d.name);
      select(this)
        .append('g')
        .append('use')
        .attr('id', 'triangle_down_' + processedDimensionName)
        .attr('y', item.top == 80 ? 70 : item.top-10)
        .attr('x', -6)
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', '#brush_image_bottom')
    });
}

function setBrushUpToDownload(featureAxis: any): void {
  featureAxis
    .each(function (d: { name: string; }) {
      const processedDimensionName = utils.cleanString(d.name);
      const item = parcoords.currentPosOfDims.find((object: { key: any; }) => object.key == d.name);
      select(this)
        .append('g')
        .append('use')
        .attr('id', 'triangle_up_' + processedDimensionName)
        .attr('y', item.bottom)
        .attr('x', -6)
        .attr('width', 14)
        .attr('height', 10)
        .attr('href', '#brush_image_top')
    });
}

function setRectToDragToDownload(featureAxis: any): void {
  featureAxis
    .each(function (d: { name: string; }) {
      const processedDimensionName = utils.cleanString(d.name);
      const item = parcoords.currentPosOfDims.find((object: { key: any; }) => object.key == d.name);
    let height = item.bottom - item.top;
    select(this)
      .append('g')
      .append('rect')
      .attr('id', 'rect_' + processedDimensionName)
      .attr('width', 12)
      .attr('height', height)
      .attr('x', -6)
      .attr('y', item.top)
      .attr('fill', 'rgb(255, 255, 0)')
      .attr('opacity', '0.4')
  });
}

function setInvertIconToDownload(featureAxis: any): void {
  let value = (80 / 1.5).toFixed(4);
  featureAxis
    .append('svg')
    .attr('y', value)
    .attr('x', -6)
    .append('use')
    .attr('width', 12)
    .attr('height', 12)
    .attr('y', 0)
    .attr('x', 0)
    .each(function (d: { name: string; }) {
      const processedDimensionName = utils.cleanString(d.name);
      if (api.getInversionStatus(processedDimensionName) == 'descending') {
        select(this)
          .attr('href', '#arrow_image_down')
      }
      else {
        select(this)
          .attr('href', '#arrow_image_up')
      }
    });
}