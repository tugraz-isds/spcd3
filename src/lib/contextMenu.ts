import 'd3-transition';
import { select, selectAll } from 'd3-selection';
import { drag } from 'd3-drag';
import * as utils from './utils';
import * as helper from './helper';
import * as api from './helperApiFunc';
import * as icon from './icons/icons';
import { parcoords, active, width, paddingXaxis, hoverlabel } from './globals';

let scrollXPos: number;
let timer: string | number | NodeJS.Timeout;

export function setContextMenu(featureAxis: any): void {
  createContextMenu()
  createModalToSetRange();
  createModalToFilter();
  setToolTipsOnFeatureAxis(featureAxis);

  featureAxis
    .on('contextmenu', function (event: { preventDefault: () => void; }, 
      d: { name: any; }) {
      const dimension = d.name;
      styleContextMenu(event);
      hideDimensionMenu(dimension);
      invertDimensionMenu(dimension);
      setRangeMenu(dimension);
      resetRangeMenu(dimension);
      resetRoundRangeMenu(dimension);
      filterMenu(dimension);
      resetFilterMenu(dimension);
      showAllMenu();
      copyDimensionName(dimension);
      select('#contextmenuRecords').style('display', 'none');
      event.preventDefault();
    });
}

function setToolTipsOnFeatureAxis(featureAxis: any): void {
  let tooltipFeatures = select('body')
    .append('div')
    .attr('id', 'tooltip')
    .attr('class', 'tooltip-dimension');

  featureAxis
    .append('text')
    .attr('class', 'dimension')
    .attr('text-anchor', 'middle')
    .attr('y', 18)
    .text((d: { name: string; }) => d.name.length > 10 ? 
      d.name.substr(0, 10) + '...' : d.name)
    .style('font-size', '0.7rem')
    .call(drag()
      .on('start', onDragStartEventHandler())
      .on('drag', onDragEventHandler(featureAxis))
      .on('end', onDragEndEventHandler(featureAxis))
    )
    .on('mouseover', function () {
      return tooltipFeatures.style('visibility', 'visible');
    })
    .on('mousemove', (event: { clientX: number; clientY: number; }, 
      d: { name: any; }) => {
      setCursorForDimensions(d, featureAxis);
      const [x, y] = utils.getMouseCoords(event);
      tooltipFeatures.text(d.name);
      tooltipFeatures
        .style("left", x / 16 + 'rem')
        .style("top", y / 16 + 'rem');
        return tooltipFeatures;
    })
    .on('mouseout', function () {
      return tooltipFeatures.style('visibility', 'hidden');
    });
}

function copyDimensionName(dimension: string): void {
  select('#copyDimensionName')
    .style('visibility', 'visible')
    .on('click', async (event: { stopPropagation: () => void; }) => {
      await navigator.clipboard.writeText(dimension)
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
}

function showAllMenu(): void {
  select('#showAllMenu')
    .style('visibility', 'visible')
    .style('border-top', '0.08rem lightgrey solid')
    .on('click', (event: { stopPropagation: () => void; }) => {
      const hiddenDimensions = api.getAllHiddenDimensionNames();
      for (let i = 0; i < hiddenDimensions.length; i++) {
        api.show(hiddenDimensions[i]);
      }
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
}

function resetFilterMenu(dimension: string): void {
  if (api.isDimensionCategorical(dimension)) {
    select('#resetfilterMenu').style('color', 'lightgrey');
    return;
  }
  
  select('#resetfilterMenu')
    .style('visibility', 'visible')
    .style('color', 'black')
    .on('click', (event: { stopPropagation: () => void; }) => {
      const range = api.getDimensionRange(dimension);
      const inverted = helper.isInverted(dimension);
      if (inverted) {
        api.setFilter(dimension, Number(range[0]), Number(range[1]));
      }
      else {
        api.setFilter(dimension, Number(range[1]), Number(range[0]));
      }
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
  });
}

function filterMenu(dimension: string): void {
  let filterMenu = select('#filterMenu');

  filterMenu.style('border-top', '0.08rem lightgrey solid');

  if (api.isDimensionCategorical(dimension)) {
    filterMenu.style('color', 'lightgrey');
      return;
  }
        
  let currentFilters = api.getFilter(dimension);
  let minFilterValue = select('#minFilterValue');
  let maxFilterValue = select('#maxFilterValue');
  minFilterValue.property('value', currentFilters[0]);
  maxFilterValue.property('value', currentFilters[1]);

  minFilterValue.on('keypress', (event: { key: string; preventDefault: () => 
    void; }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("buttonFilter").click();
      }
  });

  maxFilterValue.on('keypress', (event: { key: string; preventDefault: () => 
    void; }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("buttonFilter").click();
      }
  });

  filterMenu.style('visibility', 'visible')
    .style('color', 'black');

  filterMenu.on('click', (event: { stopPropagation: () => void; }) => {
      select('#modalOverlayFilter').style('display', 'block');
      select('#modalFilter').style('display', 'block');
      select('#contextmenu').style('display', 'none');
      const header = dimension.length > 25 ? dimension.substr(0, 25) + '...' : 
      dimension;
      select('#headerDimensionFilter').text(header);
      select('#closeButtonFilter').on('click', () => {
        select('#errorFilter').style('display', 'none');
        select('#modalFilter').style('display', 'none');
        select('#modalOverlayFilter').style('display', 'none');
      });
      
      select('#buttonFilter').on('click', () => {
        handleFilterButton(dimension);
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
  })
}

function handleFilterButton(dimension: string): void {
  let isOk = false;
  let minFilterValue = select('#minFilterValue');
  let maxFilterValue = select('#maxFilterValue');
  let errorMessage = select('#errorFilter').style('display', 'block');
  let min = Number(minFilterValue.node().value);
  let max = Number(maxFilterValue.node().value);
          
  const inverted = helper.isInverted(dimension);
  const ranges = api.getDimensionRange(dimension);
  const minRange = Number(inverted ? ranges[1] : ranges[0]);
  const maxRange = Number(inverted ? ranges[0] : ranges[1]);

  select('#infoFilter').text(`Set a filter between ${minRange} and ${maxRange}.`);

  if (max < min) {
    max = maxRange;
    errorMessage.text(`Max value is smaller than min value, filter is set to 
      min.`);
  }
  else if (min < minRange) {
    min = minRange;
    errorMessage.text(`Min value is smaller than ${api.getMinValue(dimension)},
     filter is set to min.`);
  }
  else if (min > maxRange) {
    min = maxRange;
    errorMessage.text(`Min value is bigger than max range value, filter is set
      to max.`);
  }
  else if (max > maxRange) {
    max = maxRange;
    errorMessage.text(`Max value is bigger than ${api.getMaxValue(dimension)},
     filter is set to max.`);
  }
  else if (max < minRange) {
    max = minRange;
    errorMessage.text(`Max value is smaller than min range value, 
      filter is set to min.`);
  }
  else {
    isOk = true;
  }
  api.setFilter(dimension, max, min);

  if (isOk) {
    select('#errorFilter').style('display', 'none');
    select('#modalFilter').style('display', 'none');
    select('#modalOverlayFilter').style('display', 'none');
  }
}

function resetRoundRangeMenu(dimension: string): void {
  if (api.isDimensionCategorical(dimension)) {
    select('#resetRoundRangeMenu')
      .style('color', 'lightgrey');
    return;
  }

  select('#resetRoundRangeMenu')
    .style('visibility', 'visible')
    .style('color', 'black')
    .on('click', (event: { stopPropagation: () => void; }) => {
      api.setDimensionRangeRounded(dimension, api.getMinValue(dimension), api.
      getMaxValue(dimension));
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
}

function resetRangeMenu(dimension: string): void {
    if (api.isDimensionCategorical(dimension)) {
      select('#resetRangeMenu')
        .style('display', 'false')
        .style('color', 'lightgrey');
      return;
    }
        
    select('#resetRangeMenu')
      .style('visibility', 'visible')
      .style('color', 'black')
      .on('click', (event: { stopPropagation: () => void; }) => {
        api.setDimensionRange(dimension, api.getMinValue(dimension), api.getMaxValue(dimension));
        select('#contextmenu').style('display', 'none');
        event.stopPropagation();
    });
}

function setRangeMenu(dimension: string): void {
  let rangeMenu = select('#rangeMenu');
  rangeMenu.style('border-top', '0.08rem lightgrey solid');

  if (api.isDimensionCategorical(dimension)) {
    rangeMenu.style('color', 'lightgrey')
    return;
  }
        
  rangeMenu.style('visibility', 'visible')
    .style('color', 'black');
  
  rangeMenu.on('click', (event: { stopPropagation: () => void; }) => {
      handleRangeButton(dimension);     
      select('#closeButtonRange').on('click', () => {
      select('#modalSetRange').style('display', 'none');
      select('#errorRange').style('display', 'none');
      select('#modalOverlaySetRange').style('display', 'none');
    });
    select('#contextmenu').style('display', 'none');
    event.stopPropagation();
  });
}

function handleRangeButton(dimension: string): void {
  let minRange = api.getCurrentMinRange(dimension);
  let maxRange = api.getCurrentMaxRange(dimension);
  let resultMin = (minRange - Math.floor(minRange)) !== 0;
  let resultMax = (maxRange - Math.floor(maxRange)) !== 0;
  let minValue = String(minRange);
  let maxValue = String(maxRange);
  let errorMessage = select('#errorRange');
  if (resultMin && !resultMax) {
    const count = minValue.split('.')[1].length;
    maxValue = maxRange.toFixed(count);
  }
  else if (!resultMin && resultMax) {
    const count = maxValue.split('.')[1].length;
    minValue = minRange.toFixed(count);
  }
  select('#minRangeValue').property('value', minValue);
  select('#maxRangeValue').property('value', maxValue);
  select('#contextmenu').style('display', 'none');
  select('#modalOverlaySetRange').style('display', 'block');
  select('#modalSetRange').style('display', 'block');
  const newText = dimension.length > 25 ? dimension.substr(0, 25) + '...' : 
  dimension;
  select('#headerDimensionRange').text(newText);
  select('#infoRange3').text('Range values must be below the minimum and above the maximum data value.');
  select('#infoRange').text('The current range of ' + dimension + ' is between ' + minValue + ' and ' + maxValue + '.');
  select('#infoRange2').text('The original range of ' + dimension + ' is between ' + api.getMinValue(dimension) + ' and ' + api.getMaxValue(dimension) + '.');
  select('#buttonRange').on('click', () => {
  let min = select('#minRangeValue').node().value;
  let max = select('#maxRangeValue').node().value;
  const inverted = helper.isInverted(dimension);
  let isOk = true;

  if (inverted) {
    if (max < api.getMinValue(dimension) ||
      min > api.getMaxValue(dimension)) {
        errorMessage.text(`The range has to be bigger than ${minValue} and smaller than ${maxValue}.`)
        isOk = false;
    }
  }
  else {
    if (min > api.getMinValue(dimension) ||
        max < api.getMaxValue(dimension)) {
          errorMessage.text(`The range has to be smaller than ${minValue} and bigger than ${maxValue}.`)
          isOk = false;
    }
  }
  if (isOk) {
      api.setDimensionRange(dimension, min, max);
      errorMessage.style('display', 'none');
      select('#modalSetRange').style('display', 'none');
      select('#modalOverlaySetRange').style('display', 'none');
  }
  else {
      errorMessage.style('display', 'block');
  }
  });
  select('#maxRangeValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("buttonRange").click();
      }
  });
  select('#minRangeValue').on('keypress', (event: { key: string; preventDefault: () => void; }) => {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("buttonRange").click();
      }
  });
}

function invertDimensionMenu(dimension: string): void {
  select('#invertMenu')
    .on('click', (event: { stopPropagation: () => void; }) => {
      api.invert(dimension);
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
}

function hideDimensionMenu(dimension: string): void {
  select('#hideMenu')
    .style('border-top', '0.08rem lightgrey solid')
    .on('click', (event: { stopPropagation: () => void; }) => {
      api.hide(dimension);
      select('#contextmenu').style('display', 'none');
      event.stopPropagation();
    });
}

function styleContextMenu(event: any): void {
  const container = document.querySelector("#parallelcoords");
  const rect = container.getBoundingClientRect();
  const x = (event.clientX - rect.left);
  const y = (event.clientY - rect.top);
  select('#contextmenu')
    .style('left', x + 'px')
    .style('top', y + 'px')
    .style('display', 'block')
    .on('click', (event: { stopPropagation: () => void; }) => {
      event.stopPropagation();
    });
    selectAll('.contextmenu').style('padding', 0.35 + 'rem');
}

function setCursorForDimensions(d: any, featureAxis: any): void {
  if (api.getDimensionPosition(d.name) == 0) {
    featureAxis
      .select('.dimension')
      .style('cursor', `url('data:image/svg+xml,${utils.setSize(encodeURIComponent(icon.getArrowRight()), 12)}') 8 8, auto`);
  } else if
    (api.getDimensionPosition(d.name) == parcoords.newFeatures.length - 1) {
      featureAxis
        .select('.dimension')
        .style('cursor', `url('data:image/svg+xml,${utils.setSize
        (encodeURIComponent(icon.getArrowLeft()), 12)}') 8 8, auto`);
  } else {
      featureAxis
        .select('.dimension')
        .style('cursor', `url('data:image/svg+xml,${utils.setSize
        (encodeURIComponent(icon.getArrowLeftAndRight()), 12)}') 8 8, auto`);
  }
}

function onDragStartEventHandler(): any {
  {
    return function onDragStart(d: { subject: any; }) {
      this.__origin__ = parcoords.xScales((d.subject).name);
      parcoords.dragging[(d.subject).name] = this.__origin__;
      parcoords.dragPosStart[(d.subject).name] = this.__origin__;
      const element = document.getElementById("parallelcoords");
      scrollXPos = element.scrollLeft;
    }
  }
}

function onDragEventHandler(featureAxis: any): any {
  {
    return function onDrag(d: { subject: any; x: any; }) {

      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      timer = setInterval(() => { scroll(d), 100 });

      parcoords.dragging[(d.subject).name] = Math.min(width - paddingXaxis, 
        Math.max(paddingXaxis, this.__origin__ += d.x));

      active.each(function (d: any) {
        select(this)
        .attr('d', helper.linePath(d, parcoords.newFeatures))
      });

      let hitarea_active = selectAll('path.hitarea');

      hitarea_active.each(function (d: any) {
        select(this)
        .attr('d', helper.linePath(d, parcoords.newFeatures))
      });

      parcoords.newFeatures.sort((a: any, b: any) => {
        return helper.position(b, parcoords.dragging, parcoords.xScales)
          - helper.position(a, parcoords.dragging, parcoords.xScales) - 1;
      });

      parcoords.xScales.domain(parcoords.newFeatures);

      featureAxis.attr('transform', (d: { name: any; }) => {
        return 'translate(' + helper.position(d.name, parcoords.dragging, parcoords.xScales) + ')';
      });
    }
  }
}

function onDragEndEventHandler(featureAxis: any): any {
  {
    return function onDragEnd(d: { subject: any; }) {
      const distance = (width - 80) / parcoords.newFeatures.length;
      const init = parcoords.dragPosStart[(d.subject).name];

      if (parcoords.dragPosStart[(d.subject).name] > parcoords.dragging[(d.
        subject).name]) {
        featureAxis.attr('transform', (d: { name: any; }) => {
          return 'translate(' + helper.position(d.name, init - distance, parcoords.xScales) + ')';
        })
      }
      else {
        featureAxis.attr('transform', (d: { name: any; }) => {
          return 'translate(' + helper.position(d.name, init - distance, parcoords.xScales) + ')';
        })
      }
      delete this.__origin__;
      delete parcoords.dragging[(d.subject).name];
      delete parcoords.dragPosStart[(d.subject).name];

      helper.trans(active).each(function (d: any) {
        select(this)
          .attr('d', helper.linePath(d, parcoords.newFeatures))
      });

      helper.cleanTooltipSelect();
      var selectedRecords = api.getSelected();
      selectedRecords.forEach(record => {
        const path = parcoords.newDataset.find(d => d[hoverlabel] === record);
        if (!api.isRecordInactive(record)) {
          helper.createToolTipForValues(path, true);
        } 
      });
    };
  }
}

function scroll(d: { subject: any; }): void {
  const element = document.getElementById("parallelcoords");
  if (parcoords.dragPosStart[(d.subject).name] < parcoords.dragging[(d.subject).
    name]) {
    element.scrollLeft += 5;
  }
  else if (scrollXPos + 20 > parcoords.dragging[(d.subject).name]) {
    element.scrollLeft -= 5;
  }
}

function createContextMenu(): void {
  let contextMenu = select('#parallelcoords')
    .append('g')
    .attr('class', 'contextmenu-dimensions')
    .attr('id', 'contextmenu')
    .style('position', 'absolute')
    .style('display', 'none');

  contextMenu.append('div')
    .attr('id', 'copyDimensionName')
    .attr('class', 'contextmenu')
    .attr('title', 'Copy name of dimension')
    .text('Copy Name')
  contextMenu.append('div')
    .attr('id', 'hideMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Hide dimension')
    .text('Hide');
  contextMenu.append('div')
    .attr('id', 'invertMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Invert dimension')
    .text('Invert');
  contextMenu.append('div')
    .attr('id', 'rangeMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Set range on a dimension')
    .text('Set Range...');
  contextMenu.append('div')
    .attr('id', 'resetRangeMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Set range on a dimension from data')
    .text('Set Range from Data');
  contextMenu.append('div')
    .attr('id', 'resetRoundRangeMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Set rounded range on a dimension from data')
    .text('Set Rounded Range from Data');
  contextMenu.append('div')
    .attr('id', 'filterMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Set filter on a dimension')
    .text('Set Filter...');
  contextMenu.append('div')
    .attr('id', 'resetfilterMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Reset filter on a dimension')
    .text('Reset Filter');
  contextMenu.append('div')
    .attr('id', 'showAllMenu')
    .attr('class', 'contextmenu')
    .attr('title', 'Show all dimensions')
    .text('Show All Dimensions');
}

function createModalToSetRange(): void {
  select('body')
    .append('div')
    .attr('class', 'modal-overlay')
    .attr('id', 'modalOverlaySetRange');

  select('#modalOverlaySetRange').on('click', () => {
    select('#modalSetRange').style('display', 'none');
    select('#modalOverlaySetRange').style('display', 'none');
  });

  const modalSetRange = select('body')
    .append('div')
    .attr('class', 'modal')
    .attr('id', 'modalSetRange')
    .style('display', 'none');

  createModalTitle(modalSetRange, 'Set Range for ');
  createCloseButton(modalSetRange, 'closeButtonRange');
  createHeader(modalSetRange, 'headerDimensionRange');
  createInfoMessage(modalSetRange, 'infoRange3');
  createInfoMessage(modalSetRange, 'infoRange');
  createInfoMessage(modalSetRange, 'infoRange2');
  createInputFieldWithLabel(modalSetRange, 'Min', 'minRangeValue');
  createInputFieldWithLabel(modalSetRange, 'Max', 'maxRangeValue');
  createButton(modalSetRange, 'buttonRange');
  createErrorMessage(modalSetRange, 'errorRange');
}

function createModalToFilter(): void {
  select('body')
    .append('div')
    .attr('class', 'modal-overlay')
    .attr('id', 'modalOverlayFilter');

  select('#modalOverlayFilter').on('click', () => {
    select('#modalFilter').style('display', 'none');
    select('#modalOverlayFilter').style('display', 'none');
  });

  const modalFilter = select('body')
    .append('div')
    .attr('class', 'modal')
    .attr('id', 'modalFilter')
    .style('display', 'none');

  createModalTitle(modalFilter, 'Set Filter for ');
  createCloseButton(modalFilter, 'closeButtonFilter');
  createHeader(modalFilter, 'headerDimensionFilter');
  createInfoMessage(modalFilter, 'infoFilter');
  createInputFieldWithLabel(modalFilter, 'Min', 'minFilterValue');
  createInputFieldWithLabel(modalFilter, 'Max', 'maxFilterValue');
  createButton(modalFilter, 'buttonFilter');
  createErrorMessage(modalFilter, 'errorFilter');
}

function createModalTitle(modal: any, modalTitel: string): void {
  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = modalTitel;
  modal.append(() => title);
}

function createHeader(modal: any, id: string): void {
  const header = document.createElement('div');
  header.id = id;
  header.className = 'modal-title';
  modal.append(() => header);
}

function createInfoMessage(modal: any, id: string): void {
  const infoMessage = document.createElement('div');
  infoMessage.id = id;
  infoMessage.className = 'modal-notes';
  modal.append(() => infoMessage);
}

function createInputFieldWithLabel(modal: any, text: string, inputId: string): void {
  const label = document.createElement('label');
  label.className = 'modal-label';
  label.textContent = text;
  modal.append(() => label);

  const input = document.createElement('input');
  input.className = 'modal-input';
  input.type = 'number';
  input.id = inputId;
  modal.append(() => input);
}

function createButton(modal: any, id: string): void {
  const button = document.createElement('button');
  button.className = 'save-button';
  button.id = id;
  button.textContent = 'Save';
  modal.append(() => button);
}

function createCloseButton(modal: any, id: string): void {
  const closeButton = document.createElement('span');
  closeButton.className = 'close-button';
  closeButton.id = id;
  closeButton.innerHTML = '&times;';
  modal.append(() => closeButton);
}

function createErrorMessage(modal: any, id: string): void {
  const errorMessage = document.createElement('div');
  errorMessage.className = 'modal-errormessage';
  errorMessage.id = id;
  modal.append(() => errorMessage);
}

export function createContextMenuForRecords(): any {
    let contextMenu = select('#parallelcoords')
        .append('g')
        .attr('class', 'contextmenu-records')
        .attr('id', 'contextmenuRecords')
        .style('position', 'absolute')
        .style('display', 'none');

    createContextMenuItem(contextMenu, 'selectRecord', 'contextmenu', 'Select Record', 'Select Record(s)');
    createContextMenuItem(contextMenu, 'unSelectRecord', 'contextmenu', 'Unselect Record', 'Unselect Record(s)');
    createContextMenuItem(contextMenu, 'toggleRecord', 'contextmenu', 'Toggle Record', 'Toggle Record(s)');
    createContextMenuItem(contextMenu, 'addSelection', 'contextmenu', 'Add to Selection', 'Add to Selection');
    createContextMenuItem(contextMenu, 'removeSelection', 'contextmenu', 'Remove from Selection', 'Remove from Selection');
    return contextMenu;
}

function createContextMenuItem(contextMenu, id, className, text, title)
{
     contextMenu.append('div')
        .attr('id', id)
        .attr('class', className)
        .attr('title', title)
        .text(text);
}

export function handleRecordContextMenu(contextMenu: any, event: any, d: any): void {
    const container = document.querySelector("#parallelcoords");
    const rect = container.getBoundingClientRect();
    const data = helper.getAllPointerEventsData(event);
    const cleanedItems = data.map((item: string) =>
        utils.cleanString(item).replace(/[.,]/g, '')
    );

    if (cleanedItems.length > 1) {
        select('#selectRecord').text('Select Records');
        select('#unSelectRecord').text('Unselect Records');
        select('#toggleRecord').text('Toggle Records');
    } else {
        select('#selectRecord').text('Select Record');
        select('#unSelectRecord').text('Unselect Record');
        select('#toggleRecord').text('Toggle Record');
    }

    const x = (event.clientX - rect.left) / 16 ;
    const y = (event.clientY - rect.top) / 16;
    contextMenu
        .style('left', x + 'rem')
        .style('top', y + 'rem')
        .style('display', 'block')
        .on('click', (event: { stopPropagation: () => void; }) => {
            event.stopPropagation();
        });

    select('#selectRecord').on('click', (event) => {
        api.setSelection(cleanedItems);
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    select('#unSelectRecord').on('click', (event) => {
        cleanedItems.forEach(item => {
            api.setUnselected(item);
        });
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    select('#toggleRecord').style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            cleanedItems.forEach(item => {
                api.toggleSelection(item);
            });
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#addSelection').style('border-top', '0.08rem lightgrey solid')
        .on('click', (event) => {
            let selectedRecords = [];
            selectedRecords = api.getSelected();
            const records = [...selectedRecords , ...cleanedItems];
            api.setSelection(records);
            event.stopPropagation();
            select('#contextmenuRecords').style('display', 'none');
        });

    select('#removeSelection').on('click', (event) => {
        cleanedItems.forEach(item => {
            api.setUnselected(item);
        });
        event.stopPropagation();
        select('#contextmenuRecords').style('display', 'none');
    });

    selectAll('.contextmenu').style('padding', 0.35 + 'rem');
    
    event.preventDefault();
}