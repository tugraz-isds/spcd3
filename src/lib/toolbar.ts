import * as d3 from 'd3-selection';
import * as icon from './icons/icons';
import * as pc from './parallelcoordinates';
import * as io from './io';

export function createToolbar(dataset) {
    const toolbarRow = document.createElement('div');
        toolbarRow.id = 'toolbarRow';
        toolbarRow.style.display = 'flex';
        toolbarRow.style.alignItems = 'center';
        toolbarRow.style.marginTop = '1.5rem';
        toolbarRow.style.marginLeft = '1rem';
    
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = icon.getExpandToolbarIcon();
        toggleButton.style.margin = '0';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '0';
        toggleButton.style.padding = '0';
        toggleButton.style.width = '2rem';
        toggleButton.style.height = '2rem';
        toolbarRow.appendChild(toggleButton);
    
        const toolbar = document.createElement('div');
        toolbar.style.display = 'flex';
        toolbar.style.overflow = 'hidden';
        toolbar.style.maxWidth = '0';
        toolbar.style.opacity = '0';
        toolbar.style.transition = 'max-width 0.3s ease, opacity 0.3s ease';
        toolbar.style.pointerEvents = 'none';
    
        /*const selectionToolButton = document.createElement('button');
        selectionToolButton.id = 'selectionTool';
        selectionToolButton.innerHTML = icon.getSelectionIcon();
        selectionToolButton.addEventListener('click', function () {
            isSelectionMode = !isSelectionMode;
    
            selectionWithRectangle(isSelectionMode);
    
            this.innerHTML = isSelectionMode ? icon.getSelectionActiveIcon() : icon.getSelectionIcon();
        });*/
    
        const showDataButton = document.createElement('button');
        showDataButton.id = 'showData';
        showDataButton.innerHTML = icon.getTableIcon();
        showDataButton.style.margin = '0rem';
        showDataButton.style.border = 'none';
        showDataButton.style.borderRadius = '0';
        showDataButton.style.padding = '0';
        showDataButton.style.width = '2rem';
        showDataButton.style.height = '2rem';
        showDataButton.addEventListener('click', function () {
            showModalWithData(dataset);
        });
    
        const downloadButton = document.createElement('button');
        downloadButton.id = 'downloadButton';
        downloadButton.innerHTML = icon.getDownloadButton();
        downloadButton.style.margin = '0';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '0';
        downloadButton.style.padding = '0';
        downloadButton.style.width = '2rem';
        downloadButton.style.height = '2rem';
        downloadButton.addEventListener('click', io.saveAsSvg);
    
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refreshButton';
        refreshButton.innerHTML = icon.getRefreshIcon();
        refreshButton.style.margin = '0';
        refreshButton.style.border = 'none';
        refreshButton.style.borderRadius = '0';
        refreshButton.style.padding = '0';
        refreshButton.style.width = '2rem';
        refreshButton.style.height = '2rem';
        refreshButton.addEventListener('click', pc.refresh);
    
        const resetButton = document.createElement('button');
        resetButton.id = 'resetButton';
        resetButton.innerHTML = icon.getResetIcon();
        resetButton.style.margin = '0';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '0';
        resetButton.style.padding = '0';
        resetButton.style.width = '2rem';
        resetButton.style.height = '2rem';
        resetButton.addEventListener('click', pc.reset);
    
        //toolbar.appendChild(selectionToolButton);
        toolbar.appendChild(showDataButton);
        toolbar.appendChild(downloadButton);
        toolbar.appendChild(refreshButton);
        toolbar.appendChild(resetButton);
        toolbarRow.appendChild(toolbar);
    
        let expanded = false;
    
        toggleButton.addEventListener('click', () => {
            expanded = !expanded;
        
            if (!expanded) {
                toolbar.style.maxWidth = '0';
                toolbar.style.opacity = '0';
                toolbar.style.pointerEvents = 'none';
                toggleButton.innerHTML = icon.getExpandToolbarIcon();;
            } else {
                toolbar.style.maxWidth = '12.5rem';
                toolbar.style.opacity = '1';
                toolbar.style.pointerEvents = 'auto';
                toggleButton.innerHTML = icon.getCollapseToolbarIcon();;
            }
        })
    
        const parent = d3.select('#pc_svg').node().parentNode;
        parent.insertBefore(toolbarRow, document.getElementById('pc_svg'));
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

