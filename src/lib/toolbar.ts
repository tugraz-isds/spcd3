import * as d3 from 'd3-selection';
import * as icon from './icons/icons';
import * as pc from './parallelcoordinates';
import * as io from './io';

export function createToolbar(dataset) {
    const toolbarRow = d3.select('#toolbarRow')

    const toggleButton = toolbarRow.append('button')
        .html(icon.getExpandToolbarIcon())
        .style('margin', '0')
        .style('border', 'none')
        .style('border-radius', '0')
        .style('padding', '0')
        .style('width', '2rem')
        .style('height', '2rem');

    const toolbar = toolbarRow.append('div')
        .style('display', 'flex')
        .style('overflow', 'hidden')
        .style('max-width', '0')
        .style('opacity', '0')
        .style('transition', 'max-width 0.3s ease, opacity 0.3s ease')
        .style('pointer-events', 'none');

    const showDataButton = toolbar.append('button')
        .attr('id', 'showData')
        .html(icon.getTableIcon())
        .style('margin', '0rem')
        .style('border', 'none')
        .style('border-radius', '0')
        .style('padding', '0')
        .style('width', '2rem')
        .style('height', '2rem')
        .on('click', () => showModalWithData(dataset));

    const downloadButton = toolbar.append('button')
        .attr('id', 'downloadButton')
        .html(icon.getDownloadButton())
        .style('margin', '0')
        .style('border', 'none')
        .style('border-radius', '0')
        .style('padding', '0')
        .style('width', '2rem')
        .style('height', '2rem')
        .on('click', io.saveAsSvg);

    const refreshButton = toolbar.append('button')
        .attr('id', 'refreshButton')
        .html(icon.getRefreshIcon())
        .style('margin', '0')
        .style('border', 'none')
        .style('border-radius', '0')
        .style('padding', '0')
        .style('width', '2rem')
        .style('height', '2rem')
        .on('click', pc.refresh);

    const resetButton = toolbar.append('button')
        .attr('id', 'resetButton')
        .html(icon.getResetIcon())
        .style('margin', '0')
        .style('border', 'none')
        .style('border-radius', '0')
        .style('padding', '0')
        .style('width', '2rem')
        .style('height', '2rem')
        .on('click', pc.reset);

    let expanded = false;

    toggleButton.on('click', () => {
        expanded = !expanded;

        toolbar.style('max-width', expanded ? '12.5rem' : '0')
            .style('opacity', expanded ? '1' : '0')
            .style('pointer-events', expanded ? 'auto' : 'none');

        toggleButton.html(
            expanded ? icon.getCollapseToolbarIcon() : icon.getExpandToolbarIcon()
        );
    });

}

function showModalWithData(dataset) {

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
        .style('overflow', 'auto')
        .style('z-index', '1000')
        .style('display', 'block');

    const saveAsCSV = document.createElement('button');
    saveAsCSV.id = 'saveAsCsv';
    saveAsCSV.textContent = 'Save as CSV';
    saveAsCSV.style.marginBottom = '3rem';
    modal.append(() => saveAsCSV);

    saveAsCSV.addEventListener('click', () => {
        const reservedArray = dataset.map(entry => {
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
    scrollWrapper.style.width = '100%';
    scrollWrapper.style.overflowX = 'auto';
    scrollWrapper.style.whiteSpace = 'nowrap';
    scrollWrapper.style.maxHeight = '79vh';

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

function generateTable(dataArray, table) {
    table.innerHTML = '';
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const reservedArray = dataArray.map(entry => {
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
        th.style.backgroundColor = 'rgb(232, 232, 158)';
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.zIndex = '1';
        th.style.textAlign = 'left';
        headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    reservedArray.forEach(obj => {
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

function downloadCSV(dataArray, filename = 'data.csv') {
    if (!dataArray || !dataArray.length) return;

    const keys = Object.keys(dataArray[0]);

    const csvRows = [];

    csvRows.push(keys.join(','));

    dataArray.forEach(row => {
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

