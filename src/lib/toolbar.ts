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
        .attr('class', 'toolbar');

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

        const currentIcon = isExpanded ? icon.getCollapseToolbarIcon() : icon.getExpandToolbarIcon();
        toggleButton.select('#toggleButtonicon').html(currentIcon);
    });
}

function makeIconButton(parent, opts) {
  const {id, iconHtml, tipText, onClick} = opts;

  const btn = parent.append('button')
    .attr('class', 'toolbar-button')
    .attr('type', 'button')
    .attr('id', id ?? null);

  if (onClick) btn.on('click', onClick);

  btn.append('span')
    .attr('class', 'toolbar-buttonicon')
    .attr('id', id + 'icon')
    .html(iconHtml);

  btn.select('.btn-icon').selectAll('svg')
    .attr('class', 'toolbar-svg');

  const tip = btn.append('span')
    .attr('class', 'toolbar-buttontip')
    .attr('id', id + 'tip')
    .text(tipText ?? '');

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
        .attr('class', 'modal-tableoverlay')
        .attr('id', 'modalTableOverlay');

    overlay.on('click', () => {
        overlay.style('display', 'none');
        modal.style('display', 'none');
    });

    const modal = d3.select('body')
        .append('div')
        .attr('class', 'modal-tabledata')
        .attr('id', 'dataModal');

    const saveAsCSV = document.createElement('button');
    saveAsCSV.className = 'save-button';
    saveAsCSV.id = 'saveAsCsv';
    saveAsCSV.textContent = 'Download as CSV';
    modal.append(() => saveAsCSV);

    saveAsCSV.addEventListener('click', () => {
        const reservedArray = dataset.map((entry: { [s: string]: unknown; } | ArrayLike<unknown>) => {
            const entries = Object.entries(entry).reverse();
            return Object.fromEntries(entries);
        });
        downloadCSV(reservedArray);
    });

    const closeButton = document.createElement('span');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.style.marginBottom = '3rem';
    modal.append(() => closeButton);

    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'scroll-wrapper';

    const tableContainer = document.createElement('table');
    tableContainer.className = 'tablecontainer';

    scrollWrapper.appendChild(tableContainer);
    modal.append(() => scrollWrapper);

    generateTable(dataset, tableContainer);

    closeButton.addEventListener('click', () => {
        modal.style('display', 'none');
        overlay.style('display', 'none');
    });
}

function generateTable(dataset: any[], table: HTMLTableElement) {

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