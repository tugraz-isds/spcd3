import * as d3 from 'd3-selection';
import * as icon from './icons/icons';
import * as pc from './parallelcoordinates';
import * as io from './io';

export function createToolbar(dataset: any[]): void {
    const toolbarRow = d3.select('#toolbarRow');

    const { btn: toggleButton, tip: toggleTip } = 
    makeIconButton(toolbarRow, {
        id: 'toggleButton',
        iconHtml: icon.getExpandToolbarIcon(),
        tipText: 'Expand Toolbar',
    });

    const toolbar = toolbarRow.append('div')
        .attr('id', 'toolbar')
        .style('display', 'flex')
        .style('overflow', 'hidden')
        .style('max-width', '0')
        .style('opacity', '0')
        .style('transition', 'max-width 0.3s ease, opacity 0.3s ease')
        .style('pointer-events', 'none');


    makeIconButton(toolbar, {
        iconHtml: icon.getTableIcon(),
        tipText: 'Show Table',
        onClick: () => showModalWithData(dataset)
    });

    makeIconButton(toolbar, {
        id: 'downloadButton',
        iconHtml: icon.getDownloadButton(),
        tipText: 'Download Chart (SVG)',
        onClick: io.saveAsSvg
    });

    makeIconButton(toolbar, {
        id: 'refreshButton',
        iconHtml: icon.getRefreshIcon(),
        tipText: 'Refresh',
        onClick: pc.refresh
    });

    makeIconButton(toolbar, {
        id: 'resetButton',
        iconHtml: icon.getResetIcon(),
        tipText: 'Reset',
        onClick: pc.reset
    });

    let isExpanded = false;

    toggleButton.on('click', () => {
        isExpanded = !isExpanded;

        toolbar.style('max-width', isExpanded ? '12.5rem' : '0')
            .style('opacity', isExpanded ? '1' : '0')
            .style('pointer-events', isExpanded ? 'auto' : 'none')
            .style('overflow', isExpanded ? 'visible' : 'hidden');

        toggleTip.text(isExpanded ? 'Collapse Toolbar' : 'Expand Toolbar');

        toggleButton.select('.btn-icon').html(
            isExpanded ? icon.getCollapseToolbarIcon() : icon.getExpandToolbarIcon()
        );

        toggleButton.select('.btn-icon').selectAll('svg')
            .style('display', 'block')
            .style('width', '1em')
            .style('height', '1em');
    });
}

function makeIconButton(parent, opts) {
  const {id, iconHtml, tipText, onClick} = opts;

  const btn = parent.append('button')
    .attr('type', 'button')
    .attr('id', id ?? null)
    .style('position', 'relative')
    .style('display', 'inline-flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('box-sizing', 'border-box')
    .style('vertical-align', 'middle')
    .style('margin', '0')
    .style('line-height', '1')
    .style('border', 'none')
    .style('border-radius', '10%')
    .style('padding', '0')
    .style('width', '1.8em')
    .style('height', '1.8em')
    .style('cursor', 'pointer')
    .style('overflow', 'visible');

  if (onClick) btn.on('click', onClick);

  btn.append('span')
    .attr('class', 'btn-icon')
    .attr('id', id + 'icon')
    .style('display', 'inline-flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('width', '1em')
    .style('height', '1em')
    .style('pointer-events', 'none')
    .html(iconHtml);

  btn.select('.btn-icon').selectAll('svg')
    .style('display', 'block')
    .style('width', '1em')
    .style('height', '1em');

  const tip = btn.append('span')
    .attr('class', 'btn-tip')
    .attr('id', id + 'tip')
    .text(tipText ?? '')
    .style('position', 'absolute')
    .style('left', '70%')
    .style('top', 'calc(100% + 0.5rem)')
    .style('transform', 'translateX(-50%)')
    .style('background', 'lightgrey')
    .style('padding', '0.2rem')
    .style('border', '0.0625rem solid gray')
    .style('border-radius', '0.2rem')
    .style('white-space', 'nowrap')
    .style('font-size', '0.75rem')
    .style('line-height', '1.2')
    .style('pointer-events', 'none')
    .style('opacity', '0')
    .style('visibility', 'hidden')
    .style('transition', 'opacity .15s ease')
    .style('z-index', '99999');

  function show() { tip.style('opacity', '1').style('visibility', 'visible'); }
  function hide() { tip.style('opacity', '0').style('visibility', 'hidden'); }

  btn.on('mouseenter', show)
     .on('mouseleave', hide)
     .on('focus', show)
     .on('blur', hide);

  return { btn, tip };
}

function showModalWithData(dataset: any[]): void {

    const overlay = d3.select('body')
        .append('div')
        .attr('id', 'modalTableOverlay')
        .style('position', 'fixed')
        .style('top', 0)
        .style('left', 0)
        .style('width', '100vw')
        .style('height', '100vh')
        .style('background-color', 'rgba(0, 0, 0, 0.5)')
        .style('z-index', '999')
        .style('display', 'block');

    overlay.on('click', () => {
        overlay.style('display', 'none');
        modal.style('display', 'none');
    });

    const modal = d3.select('body')
        .append('div')
        .attr('id', 'dataModal')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('position', 'fixed')
        .style('background', 'white')
        .style('padding', '1rem')
        .style('box-shadow', '0 0 0.625rem rgba(0, 0, 0, 0.3)')
        .style('border', '0.08rem solid gray')
        .style('border-radius', '0.5rem')
        .style('max-height', '80vh')
        .style('max-width', '90vw')
        .style('z-index', '1000')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('overflow', 'hidden');

    const saveAsCSV = document.createElement('button');
    saveAsCSV.id = 'saveAsCsv';
    saveAsCSV.textContent = 'Download as CSV';
    saveAsCSV.style.marginBottom = '3rem';
    saveAsCSV.style.alignSelf = 'flex-start';
    saveAsCSV.style.width = 'auto';
    saveAsCSV.style.display = 'inline-block';
    modal.append(() => saveAsCSV);

    saveAsCSV.addEventListener('click', () => {
        const reservedArray = dataset.map((entry: { [s: string]: unknown; } | ArrayLike<unknown>) => {
            const entries = Object.entries(entry).reverse();
            return Object.fromEntries(entries);
        });
        downloadCSV(reservedArray);
    });

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0.625rem';
    closeButton.style.right = '0.938rem';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.fontSize = '1.25rem';
    closeButton.style.marginBottom = '3rem';
    modal.append(() => closeButton);

    const scrollWrapper = document.createElement('div');
    scrollWrapper.style.flex = '1 1 auto';
    scrollWrapper.style.minHeight = '0';
    scrollWrapper.style.overflowY = 'auto';
    scrollWrapper.style.overflowX = 'auto';
    scrollWrapper.style.width = '100%';

    const tableContainer = document.createElement('table');
    tableContainer.style.width = '100%';
    tableContainer.style.borderCollapse = 'collapse';

    scrollWrapper.appendChild(tableContainer);
    modal.append(() => scrollWrapper);

    generateTable(dataset, tableContainer);

    closeButton.addEventListener('click', () => {
        modal.style('display', 'none');
        overlay.style('display', 'none');
    });
}

function generateTable(dataset: any[], table: HTMLTableElement) {
    table.innerHTML = '';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const reservedArray = dataset.map((entry: { [s: string]: unknown; } | ArrayLike<unknown>) => {
        const entries = Object.entries(entry).reverse();
        return Object.fromEntries(entries);
    });

    const headers = Object.keys(reservedArray[0]);
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    headers.forEach(header => {
        const th = document.createElement('th');
        th.innerText = header.charAt(0).toUpperCase() + header.slice(1);
        th.style.border = '0.063rem solid #ddd';
        th.style.padding = '0.5rem';
        th.style.backgroundColor = 'rgb(201, 212, 221)';
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.zIndex = '1';
        th.style.whiteSpace = 'nowrap';
        th.style.overflow = 'hidden';
        th.style.textOverflow = 'ellipsis';

        const isNumericCol = reservedArray.every((row: { [x: string]: any; }) => {
            const val = row[header];
            return !isNaN(parseFloat(val)) && isFinite(val);
        });

        th.style.textAlign = isNumericCol ? 'right' : 'left';

        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    reservedArray.forEach((obj: { [x: string]: any; }) => {
        const row = document.createElement('tr');
        headers.forEach(key => {
            const td = document.createElement('td');
            const value = obj[key];
            td.innerText = value;

            td.style.border = '0.063rem solid #ddd';
            td.style.padding = '0.5rem';

            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                td.style.textAlign = 'right';
            } else {
                td.style.textAlign = 'left';
            }

            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
}

function downloadCSV(dataset: any[], filename = 'data.csv') {
    if (!dataset || !dataset.length) return;

    const keys = Object.keys(dataset[0]);

    const csvRows = [];

    csvRows.push(keys.join(','));

    dataset.forEach((row: { [x: string]: any; }) => {
        const values = keys.map(k => {
            const value = row[k];
            return typeof value === 'string' && value.includes(',')
                ? `"${value}"`
                : value;
        });
        csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}