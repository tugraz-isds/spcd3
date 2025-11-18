import { active, parcoords, setHoverLabel, initDimension, setYaxis, yAxis } from './globals';
import * as utils from './utils';
import * as helper from './helper';
import * as brush from './brush';
import * as icon from './icons/icons';
import { select, selectAll } from 'd3-selection';
import { line } from 'd3-shape';
import { interpolatePath } from 'd3-interpolate-path';
import { easeCubic } from 'd3-ease';


//---------- Show and Hide Functions ----------

export function hide(dimension: string): void {
    const newDimensions = parcoords.newFeatures.filter((d: string) => d !== dimension);
    const featureSet = parcoords.features.filter((d: { name: string; }) => d.name !== dimension);

    parcoords.features = featureSet;
    parcoords.newFeatures = newDimensions;

    const oldxScales = parcoords.xScales.copy();
    parcoords.xScales.domain(newDimensions);

    selectAll('.dimensions')
        .filter((d: { name: string; }) => newDimensions.includes(d.name || d))
        .transition()
        .duration(1500)
        .attr('transform', (d: { name: string; }) =>
            'translate(' + helper.position(d.name || d, parcoords.dragging, parcoords.xScales) + ')'
        );

    selectAll('.dimensions')
        .filter((d: { name: string; }) => d.name === dimension)
        .transition()
        .duration(1500)
        .style('opacity', 0)
        .on('end', function () {
            select(this).attr('visibility', 'hidden');
        });

    select('g.active').selectAll('path')
        .transition()
        .duration(1500)
        .attrTween('d', (d: { [x: string]: any; }) => generateLineTween(oldxScales, parcoords.xScales, newDimensions, parcoords.yScales)(d)
        );
}

function generateLineTween(oldXscales: (arg0: string | number) => any, newXscales: (arg0: string | number) => any, newDimensions: any[], yScales: { [x: string]: (arg0: any) => any; }) {
    const path = line().defined((d: null) => d != null);

    return function (d: { [x: string]: any; }) {
        const oldPoints = newDimensions.map((dim: string | number) => [oldXscales(dim), yScales[dim](d[dim])]);
        const newPoints = newDimensions.map((dim: string | number) => [newXscales(dim), yScales[dim](d[dim])]);

        return interpolatePath(path(oldPoints), path(newPoints));
    };
}

export function show(dimension: string): void {
    if (parcoords.newFeatures.includes(dimension)) return;

    const existingIndex = initDimension.indexOf(dimension);
    if (existingIndex !== -1) {
        parcoords.newFeatures.splice(existingIndex, 0, dimension);
        const removedItem = { name: dimension };
        parcoords.features.splice(existingIndex, 0, removedItem);
    }

    parcoords.xScales.domain(parcoords.newFeatures);

    selectAll('.dimensions')
        .filter((d: { name: string; }) => (typeof d === "object" ? d.name : d) === dimension)
        .style('opacity', 0)
        .transition()
        .attr('visibility', 'visible')
        .duration(1500)
        .style('opacity', 1);

    selectAll('.dimensions')
        .filter((d: { name: string; }) => parcoords.newFeatures.includes(
            typeof d === "object" ? d.name : d
        ))
        .transition()
        .duration(1500)
        .attr('transform', (d: { name: string; }) =>
            'translate(' + helper.position(d.name || d, parcoords.dragging, parcoords.xScales) + ')'
        )
        .style('opacity', 1);

    select('g.active').selectAll('path')
        .attr('d', function (d: { [x: string]: any; }) {
            const points = parcoords.newFeatures.map((p: string | number) => {
                const x = parcoords.xScales(p);
                const y = parcoords.yScales[p](d[p]);
                return [x, y];
            });
            return line()(points);
        });
}

//---------- Move Functions ----------

export function moveByOne(dimension: string, direction: string): void {

    const indexOfDimension = parcoords.newFeatures.indexOf(dimension);

    const indexOfNeighbor = direction == 'right' ? indexOfDimension - 1
        : indexOfDimension + 1;

    const neighbour = parcoords.newFeatures[indexOfNeighbor];

    const pos = parcoords.xScales(dimension);
    const posNeighbour = parcoords.xScales(neighbour);

    const distance = parcoords.xScales.step();

    parcoords.dragging[dimension] = direction == 'right' ? pos + distance :
        pos - distance;

    parcoords.dragging[neighbour] = direction == 'right' ? posNeighbour - distance :
        posNeighbour + distance;

    if (direction == 'right') {
        [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension - 1]] =
            [parcoords.newFeatures[indexOfDimension - 1], parcoords.newFeatures[indexOfDimension]];
    }
    else {
        [parcoords.newFeatures[indexOfDimension + 1], parcoords.newFeatures[indexOfDimension]] =
            [parcoords.newFeatures[indexOfDimension], parcoords.newFeatures[indexOfDimension + 1]];
    }

    parcoords.xScales.domain(parcoords.newFeatures);

    let active = select('g.active').selectAll('path');
    let featureAxis = selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', function (d: any) {
            return helper.linePath(d, parcoords.newFeatures);
        })
        .ease(easeCubic);

    featureAxis.transition()
        .duration(1000)
        .attr('transform', function (d: { name: any; }) {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(easeCubic);

    delete parcoords.dragging[dimension];
    delete parcoords.dragging[neighbour];
}

export function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void {
    const indexOfDimensionA = getDimensionPosition(dimensionA);
    const indexOfDimensionB = getDimensionPosition(dimensionB);

    if (toRightOf) {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
                }
            }
        }
    }
    else {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB + 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
            }
        }
    }
}

export function swap(dimensionA: string, dimensionB: string): void {

    const positionA = parcoords.xScales(dimensionA);
    const positionB = parcoords.xScales(dimensionB);

    parcoords.dragging[dimensionA] = positionB;
    parcoords.dragging[dimensionB] = positionA;

    const indexOfDimensionA = parcoords.newFeatures.indexOf(dimensionA);
    const indexOfDimensionB = parcoords.newFeatures.indexOf(dimensionB);

    [parcoords.newFeatures[indexOfDimensionA], parcoords.newFeatures[indexOfDimensionB]] =
        [parcoords.newFeatures[indexOfDimensionB], parcoords.newFeatures[indexOfDimensionA]];

    parcoords.xScales.domain(parcoords.newFeatures);

    let active = select('g.active').selectAll('path');
    let featureAxis = selectAll('.dimensions');

    active.transition()
        .duration(1000)
        .attr('d', (d: any) => {
            return helper.linePath(d, parcoords.newFeatures);
        });

    featureAxis.transition()
        .duration(1000)
        .attr('transform', (d: { name: any; }) => {
            return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
        })
        .ease(easeCubic);

    delete parcoords.dragging[dimensionA];
    delete parcoords.dragging[dimensionB];
}

//---------- Filter Functions ----------

export function getFilter(dimension: string): [number, number] {
    const yScale = parcoords.yScales[dimension];
    const dimensionSettings = parcoords.currentPosOfDims.find((d: { key: string; }) => d.key === dimension);
    if (!dimensionSettings || !yScale || typeof yScale.invert !== 'function') return [0, 0];

    const valueTop = Math.round(yScale.invert(dimensionSettings.top));
    const valueBottom = Math.round(yScale.invert(dimensionSettings.bottom));

    const min = Math.min(valueTop, valueBottom);
    const max = Math.max(valueTop, valueBottom);

    return [min, max];
}

export function setFilter(dimension: string, min: number, max: number): void {
    const filterTop = Math.max(min, max);
    const filterBottom = Math.min(min, max);
    addRange(filterBottom, parcoords.currentPosOfDims, dimension, 'currentFilterBottom');
    addRange(filterTop, parcoords.currentPosOfDims, dimension, 'currentFilterTop');
    brush.filter(dimension, min, max);
}

//---------- Range Functions ----------

export function getDimensionRange(dimension: string): (string | number)[] {
    return parcoords.yScales[dimension].domain();
}

export function setDimensionRange(dimension: string, min: number, max: number): void {
    const inverted = helper.isInverted(dimension);
    const hiddenDims = getAllHiddenDimensionNames();

    if (inverted) {
        parcoords.yScales[dimension].domain([max, min]);
        setYaxis(helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    else {
        parcoords.yScales[dimension].domain([min, max]);
        setYaxis(helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }

    addRange(min, parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(max, parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    select('#dimension_axis_' + utils.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(easeCubic);

    let active = select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d: any) => {
            return helper.linePath(d, parcoords.newFeatures);
        })
        .ease(easeCubic);

    active.each(function (d: any) {
        select(this)
            .transition()
            .duration(1000)
            .attr('d', helper.linePath(d, parcoords.newFeatures))
            .ease(easeCubic);
    });
    setFilterAfterSettingRanges(dimension, inverted);
}

function setFilterAfterSettingRanges(dimension: string, inverted: boolean): void {
    const rect = select('#rect_' + dimension);
    const triDown = select('#triangle_down_' + dimension);
    const triUp = select('#triangle_up_' + dimension);

    const dimensionSettings = parcoords.currentPosOfDims.find((d: { key: string; }) => d.key === dimension);

    const yScale = parcoords.yScales[dimension];

    const newMin = Math.max(dimensionSettings.currentRangeBottom, dimensionSettings.currentFilterBottom);
    const newMax = Math.min(dimensionSettings.currentRangeTop, dimensionSettings.currentFilterTop);

    let top = yScale(newMax);
    let bottom = yScale(newMin);

    if (inverted) {
        [top, bottom] = [bottom, top];
    }

    const rectY = Math.min(top, bottom);
    const rectH = Math.abs(bottom - top);

    const storeBottom = Math.min(newMin, newMax);
    const storeTop = Math.max(newMin, newMax);

    addRange(storeBottom, parcoords.currentPosOfDims, dimension, 'currentFilterBottom');
    addRange(storeTop, parcoords.currentPosOfDims, dimension, 'currentFilterTop');

    rect.transition()
        .duration(300)
        .attr('y', rectY)
        .attr('height', rectH)
        .style('opacity', 0.3);

    triDown.transition()
        .duration(300)
        .attr('y', rectY - 10);

    triUp.transition()
        .duration(300)
        .attr('y', rectY + rectH);
}

export function setDimensionRangeRounded(dimension: string, min: number, max: number): void {
    const inverted = helper.isInverted(dimension);
    const hiddenDims = getAllHiddenDimensionNames();
    if (inverted) {
        parcoords.yScales[dimension].domain([max, min]).nice();
        setYaxis(helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    else {
        parcoords.yScales[dimension].domain([min, max]).nice();
        setYaxis(helper.setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }

    const roundedRanges = parcoords.yScales[dimension].domain();
    addRange(roundedRanges[0], parcoords.currentPosOfDims, dimension, 'currentRangeBottom');
    addRange(roundedRanges[1], parcoords.currentPosOfDims, dimension, 'currentRangeTop');

    select('#dimension_axis_' + utils.cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(easeCubic);

    let active = select('g.active')
        .selectAll('path')
        .transition()
        .duration(1000)
        .attr('d', (d: any) => {
            return helper.linePath(d, parcoords.newFeatures);
        })
        .ease(easeCubic);

    active.each(function (d: any) {
        select(this)
            .transition()
            .duration(1000)
            .attr('d', helper.linePath(d, parcoords.newFeatures))
            .ease(easeCubic);
    });
    setFilterAfterSettingRanges(dimension, inverted);
}

function addRange(value: number, currentPosOfDims: any, dimension: string, key: string): void {
    let newObject = {};
    newObject[key] = Number(value);
    const target = currentPosOfDims.find((obj: { key: string; }) => obj.key == dimension);
    Object.assign(target, newObject);
}

export function getMinValue(dimension: string): number {
    const item = parcoords.currentPosOfDims.find((object: { key: string; }) => object.key == dimension);
    return item.min;
}

export function getMaxValue(dimension: string): number {
    const item = parcoords.currentPosOfDims.find((object: { key: string; }) => object.key == dimension);
    return item.max;
}

export function getCurrentMinRange(dimension: string): number {
    const item = parcoords.currentPosOfDims.find((object: { key: string; }) => object.key == dimension);
    return item.currentRangeBottom;
}

export function getCurrentMaxRange(dimension: string): number {
    const item = parcoords.currentPosOfDims.find((object: { key: string; }) => object.key == dimension);
    return item.currentRangeTop;
}

export function isSelected(record: string): boolean {
    return select('#' + utils.cleanString(record)).classed('selected');
}

export function setDimensionForHovering(dimension: string): void {
    setHoverLabel(dimension);
}

//---------- Invert Functions ----------

export function invertWoTransition(dimension: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select('#invert_hitbox_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select(dimensionId)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())));

    helper.trans(active).each(function (d: any) {
        select(this)
            .attr('d', (d: any) => {
                return helper.linePath(d, parcoords.newFeatures);
            })
    });

    brush.addSettingsForBrushing(dimension, helper.isInverted(dimension));
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, dimension, "isInverted");
    }
}


export function setInversionStatus(dimension: string, status: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = select(invertId);
    const arrow = status === 'ascending' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = status === 'ascending' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(status === 'ascending' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select('#invert_hitbox_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())))
        .ease(easeCubic);


    helper.trans(active).each(function (d: any) {
        select(this)
            .transition()
            .duration(1000)
            .attr('d', (d: any) => {
                return helper.linePath(d, parcoords.newFeatures);
            })
            .ease(easeCubic)
    });

    const filter = getFilter(dimension);
    brush.addSettingsForBrushing(dimension, helper.isInverted(dimension));
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, dimension, "isInverted");
    }
}

export function invert(dimension: string): void {
    const cleanDimensionName = utils.cleanString(dimension);
    const invertId = '#dimension_invert_' + cleanDimensionName;
    const dimensionId = '#dimension_axis_' + cleanDimensionName;
    const textElement = select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === 'down' ? '#arrow_image_up' : '#arrow_image_down';
    const arrowStyle = currentArrowStatus === 'down' ? utils.setSize(icon.getArrowDownCursor(), 12) : utils.setSize(icon.getArrowUpCursor(), 12);
    textElement.text(currentArrowStatus === 'down' ? 'up' : 'down');
    textElement.attr('href', arrow);
    textElement.style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select('#invert_hitbox_' + cleanDimensionName).style('cursor', `url('data:image/svg+xml,${encodeURIComponent(arrowStyle)}') 8 8 , auto`);

    select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension]
            .scale(parcoords.yScales[dimension]
                .domain(parcoords.yScales[dimension]
                    .domain().reverse())))
        .ease(easeCubic);

    helper.trans(active).each(function (d: any) {
        select(this)
            .transition()
            .duration(1000)
            .attr('d', (d: any) => {
                return helper.linePath(d, parcoords.newFeatures);
            })
            .ease(easeCubic)
    });

    const filter = getFilter(dimension);
    brush.addSettingsForBrushing(dimension, helper.isInverted(dimension));
    if (helper.isInverted(dimension)) {
        brush.addInvertStatus(true, dimension, "isInverted");
    }
    else {
        brush.addInvertStatus(false, dimension, "isInverted");
    }
}

//---------- Selection Functions ----------

export function getSelected(): string[] {
    let selected = [];

    const records = getAllRecords();
    for (let i = 0; i < records.length; i++) {
        let isselected = isSelected(records[i]);
        if (isselected) {
            selected.push(records[i]);
        }
    }
    return selected;
}

export function setSelection(records: string[]): void {
    for (let i = 0; i < records.length; i++) {
        let stroke = select('#' + utils.cleanString(records[i])).style('stroke');
        if (stroke !== 'lightgrey') {
            select('#' + utils.cleanString(records[i]))
                .classed('selected', true)
                .transition()
                .style('stroke', 'rgba(255, 165, 0, 1)');
        }
    }
}

export function clearSelection(): void {
    const selectedRecords = getSelected();
    selectedRecords.forEach(element => {
        select('#' + utils.cleanString(element))
            .classed('selected', false)
            .transition()
            .style('stroke', 'rgba(0, 129, 175, 0.5)')
    });
}

export function toggleSelection(record: string): void {
    const selected = isSelected(record);
    if (selected) {
        setUnselected(record);
    }
    else {
        setSelected(record);
    }
}

export function setSelected(record: string): void {
    let selectableLines = [];
    selectableLines.push(record);
    setSelection(selectableLines);
}

export function setUnselected(record: string): void {
    selectAll('#' + utils.cleanString(record))
        .classed('selected', false)
        .transition()
        .style('stroke', 'rgba(0, 129, 175, 0.5)');
}

export function isRecordInactive(record: string): boolean {
    const stroke = select('#' + utils.cleanString(record));
    let node = stroke.node();
    let style = node.style.stroke;
    return style === 'rgba(211, 211, 211, 0.4)' ? true : false;
}

//---------- Selection Functions With IDs ----------

export function setSelectionWithId(recordIds: string[]): void {
    let records: string[] = [];
    for (let i = 0; i < recordIds.length; i++) {
        let record = getRecordWithId(recordIds[i]);
        records.push(record);
    }
    setSelection(records);
}

export function isSelectedWithRecordId(recordId: string): boolean {
    let record = getRecordWithId(recordId);
    return isSelected(record);
}

export function getRecordWithId(recordId: string): string {
    const item = parcoords.currentPosOfDims.find((object: { recordId: string; }) => object.recordId == recordId);
    return item.key;
}

export function toggleSelectionWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    toggleSelection(record);
}

export function setSelectedWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    setSelected(record);
}

export function setUnselectedWithId(recordId: string): void {
    const record = getRecordWithId(recordId);
    setUnselected(record);
}

//---------- Color Records ----------
export function colorRecord(record: string, color: string): void {
    selectAll('#' + utils.cleanString(record))
        .transition()
        .style('stroke', color);
}

export function uncolorRecord(record: string): void {
    selectAll('#' + utils.cleanString(record))
        .transition()
        .style('stroke', 'rgba(0, 129, 175, 0.5)');
}

//---------- Helper Functions ----------

export function getAllRecords(): string[] {
    const selection = active;
    const object = selection._groups;
    const data = [];
    for (let i = 0; i < object[0].length; i++) {
        const items = object.map((item: any[]) => item[i]);
        const keys = Object.keys(items);
        const text = items[keys[0]].id;
        data.push(text);
    }
    return data;
}

export function getAllVisibleDimensionNames(): string[] {
    let listOfDimensions = parcoords.newFeatures.slice();
    return listOfDimensions.reverse();
}

export function getAllDimensionNames(): string[] {
    return parcoords.data['columns'];
}

export function getAllHiddenDimensionNames(): string[] {
    const dimensions = getAllDimensionNames();
    const hiddenDimensions = [];
    for (let i = 0; i < dimensions.length; i++) {
        if (getHiddenStatus(dimensions[i]) == 'hidden') {
            hiddenDimensions.push(dimensions[i]);
        }
    }
    return hiddenDimensions;
}

export function getHiddenStatus(dimension: string): string {
    const index = parcoords.newFeatures.indexOf(dimension);
    if (index != -1) {
        return "shown";
    }
    else {
        return "hidden";
    }
}

export function getInversionStatus(dimension: string): string {
    const invertId = '#dimension_invert_' + utils.cleanString(dimension);
    const element = select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == 'up' ? 'ascending' : 'descending';
}

export function getNumberOfDimensions(): number {
    return parcoords.newFeatures.length;
}

export function getDimensionPosition(dimension: string): number {
    return parcoords.newFeatures.indexOf(dimension);
}

export function isDimensionCategorical(dimension: string): boolean {
    let values = parcoords.newDataset.map((o: { [x: string]: any; }) => o[dimension]);
    if (isNaN(values[0])) {
        return true;
    }
    return false;
}