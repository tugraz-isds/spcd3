import {loadCSV, drawChart, invert, saveAsSvg, moveByOne, 
    isInverted, getDimensionPosition, setFilter, getDimensionRange,
    getNumberOfDimensions, hide, show, getHiddenStatus, getMinValue, getMaxValue,
    setDimensionRange, isDimensionCategorical, getAllDimensionNames, getAllRecords,
    toggleSelection, isSelected, setDimensionRangeRounded, getInversionStatus} from './lib/spcd3.js';

let data;
let newData;
let newFeatures = [];
let moveDimensionData;
let filterDimensionData;
let rangeDimensionData;
let dimensions;

let studentData = "Name,Maths,English,PE,Art,History,IT,Biology,German\nAdrian,95,24,82,49,58,85,21,24\nAmelia,92,98,60,45,82,85,78,92\nBrooke,27,35,84,45,23,50,15,22\nChloe,78,9,83,66,80,63,29,12\nDylan,92,47,91,56,47,81,60,51\nEmily,67,3,98,77,25,100,50,34\nEvan,53,60,97,74,21,78,72,75\nFinn,42,73,65,52,43,61,82,85\nGia,50,81,85,80,43,46,73,91\nGrace,24,95,98,94,89,25,91,69\nHarper,69,9,97,77,56,94,38,2\nHayden,2,72,74,53,40,40,66,64\nIsabella,8,99,84,69,86,20,86,85\nJesse,63,39,93,84,30,71,86,19\nJordan,11,80,87,68,88,20,96,81\nKai,27,65,62,92,81,28,94,84\nKaitlyn,7,70,51,77,79,29,96,73\nLydia,75,49,98,55,68,67,91,87\nMark,51,70,87,40,97,94,60,95\nMonica,62,89,98,90,85,66,84,99\nNicole,70,8,84,64,26,70,12,8\nOswin,96,14,62,35,56,98,5,12\nPeter,98,10,71,41,55,66,38,29\nRenette,96,39,82,43,26,92,20,2\nRobert,78,32,98,55,56,81,46,29\nSasha,87,1,84,70,56,88,49,2\nSylvia,86,12,97,4,19,80,36,8\nThomas,76,47,99,34,48,92,30,38\nVictor,5,60,70,65,97,19,63,83\nZack,19,84,83,42,93,15,98,95";

document.addEventListener('DOMContentLoaded', function() {
    data = studentData;
    newData = loadCSV(data);
    dimensions = newData['columns'];
    showButtons();
    drawChart(newData);
    generateDropdownForShow();
    generateDropdownForInvert();
    generateDropdownForMove();
    generateDropdownForFilter();
    generateDropdownForRange();
    generateDropdownForSelectRecords();
    document.getElementById('border').style.visibility = 'visible';
}, false);

let inputButton = document.getElementById('input');
inputButton.addEventListener('click', openFileDialog, false);
let inputFile = document.getElementById('fileInput');
inputFile.addEventListener('change', handleFileSelect, false);
inputFile.addEventListener('cancel', () => {
    document.getElementById('input').textContent = 'Upload File';
})
inputFile.addEventListener('click', (event) => {
    event.target.value = null;
})

let downloadButton = document.getElementById('download');
downloadButton.addEventListener('click', () => {
    saveAsSvg();
    document.getElementById('download').textContent = 'Download SVG';
});
inputFile.addEventListener('change', () => {
    document.getElementById('download').textContent = 'Download SVG...';
});
downloadButton.addEventListener('cancel', () => {
    document.getElementById('download').textContent = 'Download SVG';
})
downloadButton.style.visibility = 'hidden';

let resetRangesButton = document.getElementById('resetRanges');
resetRangesButton.addEventListener('click', resetToOriginalRange, false);
resetRangesButton.style.visibility = 'hidden';

let resetRoundedRangesButton = document.getElementById('resetRoundedRanges');
resetRoundedRangesButton.addEventListener('click', resetToRoundedRange, false);
resetRoundedRangesButton.style.visibility = 'hidden';

let resetAllButton = document.getElementById('resetAll');
resetAllButton.addEventListener('click', resetAll, false);
resetAllButton.style.visibility = 'hidden';

let moveRightButton = document.getElementById('moveRight');
moveRightButton.addEventListener('click', moveDimensionRight, false);
moveRightButton.style.visibility = 'hidden';

let moveLeftButton = document.getElementById('moveLeft');
moveLeftButton.addEventListener('click', moveDimensionLeft, false);
moveLeftButton.style.visibility = 'hidden';

function openFileDialog() {
    document.getElementById('input').textContent = 'Upload File...';
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    document.getElementById('input').textContent = 'Upload File';
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            clearPlot();
            data = e.target.result;
            newData = loadCSV(data);
            drawChart(newData);

            showButtons();

            generateDropdownForShow();
            generateDropdownForInvert();
            generateDropdownForMove();
            generateDropdownForFilter();
            generateDropdownForRange();
            generateDropdownForSelectRecords();
            
            document.getElementById('border').style.visibility = 'visible';
        };
        reader.readAsText(file);
    }
}

function showButtons() {
    downloadButton.style.visibility = 'visible';
    resetRangesButton.style.visibility = 'visible';
    resetRoundedRangesButton.style.visibility = 'visible';
    resetAllButton.style.visibility = 'visible';
    moveRightButton.style.visibility = 'visible';
    moveLeftButton.style.visibility = 'visible';
    moveRightButton.disabled = true;
    moveRightButton.style.opacity = 0.5;
    moveLeftButton.disabled = true;
    moveLeftButton.style.opacity = 0.5;
}

function updateDimensions(dimension)
{
    if(getHiddenStatus(dimension) == 'shown') {
        hide(dimension);
    }
    else {
        show(dimension);
    }
}

function getSelectedDimensions()
{
    const checkboxes = document.querySelectorAll('input[name="dimension"]:checked');
    const checkedDimensions = [];

    checkboxes.forEach(function(checkbox) {
        checkedDimensions.push(checkbox.value);
    });

    return checkedDimensions;
}

function showOptions(id, buttonId) {
    
    let checkboxes = document.getElementById(id);
    
    checkboxes.style.display == 'none' ? checkboxes.style.display = 'block' :
        checkboxes.style.display = 'none';

    let button = document.getElementById(buttonId);

    checkboxes.style.display == 'block' ? button.style.backgroundColor = 'white' :
        button.style.backgroundColor = 'white';
    checkboxes.style.display == 'block' ? button.style.color = 'black' :
        button.style.color = 'black';

    newFeatures.forEach(function (feature) {
        if(getHiddenStatus(feature) == 'hidden') {
            document.getElementById('show_' + feature).checked = false;
        }
        disableCheckbox(feature);
        if (!isDimensionCategorical(feature)){
            disableOptionInDropdown('filterOption_', feature);
            disableOptionInDropdown('rangeOption_', feature);
        }
        disableOptionInDropdown('moveOption_', feature);
        disableLeftAndRightButton(feature);
    });
}

function showOptionsForRecords(id, buttonId) {
    
    let checkboxes = document.getElementById(id);
    
    checkboxes.style.display == 'none' ? checkboxes.style.display = 'block' :
        checkboxes.style.display = 'none';

    let button = document.getElementById(buttonId);

    checkboxes.style.display == 'block' ? button.style.backgroundColor = 'white' :
        button.style.backgroundColor = 'white';
    checkboxes.style.display == 'block' ? button.style.color = 'black' :
        button.style.color = 'black';

    let records = getAllRecords();
    records.forEach(function (record) {
        let selected = isSelected(record);
        let checkbox = document.getElementById('sel_' + record);
        if (selected) {
            checkbox.checked = true;
        }
        else {
            checkbox.checked = false;
        }
    })
}

function generateDropdownForShow() {
    //let dimensions = newData['columns'];

    document.getElementById('showDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('showDimensionContainer');
    container.style.position = 'relative';

    let selectButton = document.createElement('button');
    selectButton.id = 'showButton';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', () => {
        dimensionContainer.innerHTML = '';
        const newDimensionsOrder = getAllDimensionNames();
        const oldDimensions = dimensions.slice();
        newDimensionsOrder.forEach(function(dimension) {
            let index = oldDimensions.indexOf(dimension);
            if (index !== -1) {
                oldDimensions.splice(index,1);
            }
            let label = document.createElement('label');
            label.className = 'dropdownLabel';
            let input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'show_' + dimension;
            input.value = dimension;
            input.name = 'dimension';
            input.style.marginTop = '0.5rem';
            input.style.marginLeft = '0.5rem';
            input.style.fontSize = 'smaller';
            input.checked = true;
            label.appendChild(input);
            label.appendChild(document.createTextNode(dimension));
            dimensionContainer.appendChild(label);
        });
        if(oldDimensions.length !== 0) {
            oldDimensions.forEach(function(dimension) {
                let label = document.createElement('label');
                label.className = 'dropdownLabel';
                let input = document.createElement('input');
                input.type = 'checkbox';
                input.id = 'show_' + dimension;
                input.value = dimension;
                input.name = 'dimension';
                input.style.marginTop = '0.5rem';
                input.style.marginLeft = '0.5rem';
                input.style.fontSize = 'smaller';
                input.checked = false;
                label.appendChild(input);
                label.appendChild(document.createTextNode(dimension));
                dimensionContainer.appendChild(label);
            });
        }
        showOptions('options', 'showButton');
        const dropdownHeight = dimensionContainer.clientHeight;
        const windowHeight = window.innerHeight;
        const dropdownTop = selectButton.getBoundingClientRect().top;

        if (windowHeight - dropdownTop < dropdownHeight) {
            dimensionContainer.style.bottom = '100%';
            dimensionContainer.style.top = 'auto';
        }
        else {
            dimensionContainer.style.bottom = 'auto';
            dimensionContainer.style.top = '100%';
        }
    });

    let textElement = document.createElement('span');
    textElement.innerHTML = 'Show Dimensions <img src="./svg/dropdown-symbol.svg" />';
    selectButton.appendChild(textElement);

    

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'options';
    dimensionContainer.className = 'ddList';
    dimensionContainer.style.display = 'none';

    if (window.navigator.userAgent.includes('Mac')){
        dimensionContainer.style.border = '0.1rem lightgrey solid';
    }
    else if (window.navigator.userAgent.includes('Win')){
        dimensionContainer.style.border = '0.1rem white solid';
    }
    
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
    if (dimensions.length > 10) {
        dimensionContainer.style.height = '12.5rem';
    }
    dimensionContainer.name = 'options';
    dimensionContainer.addEventListener('change', (event) => {
        updateDimensions(event.target.value);
        disableCheckbox(event.target.value);
        disableOptionInDropdown('filterOption_', event.target.value);
        disableOptionInDropdown('rangeOption_', event.target.value);
        disableOptionInDropdown('moveOption_', event.target.value);
        disableLeftAndRightButton(event.target.value);
    });

    dimensions.forEach(function(dimension) {
        let label = document.createElement('label');
        label.className = 'dropdownLabel';
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'show_' + dimension;
        input.value = dimension;
        input.name = 'dimension';
        input.checked = true;
        label.appendChild(input);
        label.appendChild(document.createTextNode(dimension));
        dimensionContainer.appendChild(label);
    });

    container.appendChild(selectButton);
    container.appendChild(dimensionContainer);

    
}

function generateDropdownForInvert() {
    //let dimensions = newData['columns'];
    
    document.getElementById('invertDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('invertDimensionContainer');
    container.style.position = 'relative';

    let selectButton = document.createElement('button');
    selectButton.id = 'invertButton';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', () => {
        dimensionContainer.innerHTML = '';
        const dimensions = getAllDimensionNames();
        dimensions.forEach(function(dimension) {
            let label = document.createElement('label');
            label.className = 'dropdownLabel';
            let input = document.createElement('input');
            input.type = 'image';
            input.id = 'invert_' + dimension;
            input.value = dimension;
            input.name = 'dimension';
            input.src = './svg/arrow-up.svg';
            input.style.height = '0.7rem';
            input.style.paddingTop = '0.5rem';
            input.style.paddingLeft = '0.5rem';
            input.checked = true;
            label.appendChild(input);
            label.appendChild(document.createTextNode(dimension));
            dimensionContainer.appendChild(label);
        });
        showOptions('invertOptions', 'invertButton');
        for (let i = 0; i < newFeatures.length; i++) {
            const position = getDimensionPosition(newFeatures[i]);
            document.addEventListener("DOMContentLoaded", function(event) {
            if (getInversionStatus(newFeatures[i]) == "ascending") {
                document.getElementById("invert_" + newFeatures[i]).src = './svg/arrow-up.svg';
            }
            else {
                document.getElementById("invert_" + newFeatures[i]).src = './svg/arrow-down.svg';
            }
            })
        }
        const dropdownHeight = dimensionContainer.clientHeight;
        const windowHeight = window.innerHeight;
        const dropdownTop = selectButton.getBoundingClientRect().top;

        if (windowHeight - dropdownTop < dropdownHeight) {
            dimensionContainer.style.bottom = '100%';
            dimensionContainer.style.top = 'auto';
        }
        else {
            dimensionContainer.style.bottom = 'auto';
            dimensionContainer.style.top = '100%';
        }
    });

    let textElement = document.createElement('span');
    textElement.id = 'invertText';
    textElement.innerHTML = 'Invert Dimensions <img src="./svg/dropdown-symbol.svg" />';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'invertOptions';
    dimensionContainer.className = 'ddList';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
    if (dimensions.length > 10) {
        dimensionContainer.style.height = '12.5rem';
    }
    dimensionContainer.name = 'invertOptions';
    dimensionContainer.addEventListener('click', (event) => {
        if(event.target.value != undefined) {
            invertDimension(event.target.value);
            if (getInversionStatus(event.target.value) == "ascending") {
                document.getElementById("invert_" + event.target.value).src = './svg/arrow-up.svg';
            }
            else {
                document.getElementById("invert_" + event.target.value).src = './svg/arrow-down.svg';
            }
        }
    });

    container.appendChild(selectButton);
    container.appendChild(dimensionContainer);
}

function invertDimension(dimension) {
    invert(dimension);
}

function disableCheckbox(dimension) {
    let position = getDimensionPosition(dimension);
    document.addEventListener("DOMContentLoaded", function(event) {
        if (position != -1) {
            document.getElementById('invert_' + dimension).disabled = false;
            document.getElementById('invertLabel_' + dimension).style.opacity = 1;
        }
        else {
            document.getElementById('invert_' + dimension).disabled = true;
            document.getElementById('invertLabel_' + dimension).style.opacity = 0.5;
        }
      });
    
}

function disableOptionInDropdown(prefixId, dimension) {
    const value = prefixId.concat(dimension);
    const position = getDimensionPosition(dimension);
    if (position != -1) {
        document.getElementById(value).disabled = false;
    }
    else {
        document.getElementById(value).disabled = true;
    }
}

function generateDropdownForMove() {
    //let dimensions = newData['columns'];

    document.getElementById('moveDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('moveDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => {
        moveDimensionData = dropdown.value;
        disableLeftAndRightButton(moveDimensionData);
    }
    dropdown.onfocus = () => {
        dropdown.innerHTML = "";
        dropdown.appendChild(headline);
        let dimensions = getAllDimensionNames();
        dimensions.forEach(function(dimension) {
            let option = document.createElement('option');
            option.textContent = dimension;
            option.value = dimension;
            option.id = 'moveOption_' + dimension;
            dropdown.appendChild(option);
        });
        disableLeftAndRightButton('Move Dimension');
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Move Dimension';
    headline.id = 'move_headline';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'moveOption_' + dimension;
        dropdown.appendChild(option);
    });
    container.appendChild(dropdown);
    document.getElementById('moveLeft').disabled = true;
}

function moveDimensionLeft() {  
    moveByOne(moveDimensionData, 'left');
    disableLeftAndRightButton(moveDimensionData);
}

function moveDimensionRight() {
    moveByOne(moveDimensionData, 'right');  
    disableLeftAndRightButton(moveDimensionData);
}

function disableLeftAndRightButton(dimension) {
    const position = getDimensionPosition(dimension);
    const numberOfDimensions = getNumberOfDimensions();
    const headline = document.getElementById('move_headline');
    
    if (position == 0 || position == -1 || headline.selected) {
        document.getElementById('moveRight').disabled = true;
        document.getElementById('moveRight').style.opacity = 0.5;
    }
    else {
        document.getElementById('moveRight').disabled = false;
        document.getElementById('moveRight').style.opacity = 1;
    }

    if (position == numberOfDimensions - 1 || position == -1) {
        document.getElementById('moveLeft').disabled = true;
        document.getElementById('moveLeft').style.opacity = 0.5;
    }
    else {
        document.getElementById('moveLeft').disabled = false;
        document.getElementById('moveLeft').style.opacity = 1;
    }
}

function generateDropdownForFilter() {
    //let dimensions = newData['columns'];

    document.getElementById('filterDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('filterDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = (event) => {
        filterDimensionData = event.target.value;
        generateModuleForSetFilter();
    }
    dropdown.onfocus = () => {
        dropdown.innerHTML = "";
        dropdown.appendChild(headline);
        let dimensions = getAllDimensionNames();
        dimensions.forEach(function(dimension) {
            if (!isDimensionCategorical(dimension)) {
                let option = document.createElement('option');
                option.textContent = dimension;
                option.value = dimension;
                option.id = 'filterOption_' + dimension;
                dropdown.appendChild(option);
            }
        });
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Set Filter';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        if (!isDimensionCategorical(dimension)) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'filterOption_' + dimension;
        dropdown.appendChild(option);
        }
    });
    container.appendChild(dropdown);
}

function generateModuleForSetFilter() {

    let section = document.getElementById('api-section');
    
    let popupWindowFilter = document.createElement('div');
    popupWindowFilter.id = 'filterContainer';
    popupWindowFilter.className = 'item7';
    popupWindowFilter.style.visibility = 'visible';
    popupWindowFilter.style.display = 'block';
    popupWindowFilter.style.width = 18 + 'rem';
    popupWindowFilter.style.height = 7 + 'rem';
    popupWindowFilter.style.backgroundColor = 'white';
    popupWindowFilter.style.border = '1px solid black';
    popupWindowFilter.style.borderRadius = 0.25 + 'rem';
    
    section.appendChild(popupWindowFilter);

    let headerFilter = document.createElement('div');
    headerFilter.textContent = 'Set Filter for ' + filterDimensionData;
    headerFilter.style.paddingLeft = 0.5 + 'rem';
    headerFilter.style.paddingTop = 0.5 + 'rem';
    headerFilter.style.fontSize = 'large';
    popupWindowFilter.appendChild(headerFilter);
    
    let closeButtonFilter = document.createElement('a');
    closeButtonFilter.textContent = 'x';
    closeButtonFilter.style.position = 'relative';
    closeButtonFilter.style.right = -16.5 + 'rem';
    closeButtonFilter.style.top = -2 + 'rem';
    closeButtonFilter.style.width = 2.5 + 'rem';
    closeButtonFilter.style.height = 2.5 + 'rem';
    closeButtonFilter.style.opacity = 0.3;
    closeButtonFilter.style.backgroundColor = 'transparent';
    closeButtonFilter.style.cursor = 'pointer';
    popupWindowFilter.appendChild(closeButtonFilter);

    closeButtonFilter.onclick = () => {
        popupWindowFilter.style.display = 'none';
    };

    let labelMinFilter = document.createElement('label');
    labelMinFilter.textContent = 'Min';
    labelMinFilter.style.paddingLeft = 0.5 + 'rem';
    popupWindowFilter.appendChild(labelMinFilter);

    let inputMinFilter = document.createElement('input');
    inputMinFilter.id = 'minFilterValue';
    inputMinFilter.style.width = 2 + 'rem';
    inputMinFilter.style.marginLeft = 0.5 + 'rem';
    popupWindowFilter.appendChild(inputMinFilter);

    inputMinFilter.onkeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('filterButton').click();
        }
    }

    let labelMaxFilter = document.createElement('label');
    labelMaxFilter.textContent = 'Max';
    labelMaxFilter.style.paddingLeft = 0.5 + 'rem';
    popupWindowFilter.appendChild(labelMaxFilter);

    let inputMaxFilter = document.createElement('input');
    inputMaxFilter.id = 'maxFilterValue';
    inputMaxFilter.style.width = 2 + 'rem';
    inputMaxFilter.style.marginLeft = 0.5 + 'rem';
    popupWindowFilter.appendChild(inputMaxFilter);

    inputMaxFilter.onkeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('filterButton').click();
        }
    }

    let popupWindowFilterError = document.createElement('div');
    popupWindowFilterError.style.position = 'absolute';
    popupWindowFilter.appendChild(popupWindowFilterError);

    let filterButton = document.createElement('button');
    filterButton.textContent = 'Save';
    filterButton.style.marginLeft = 0.5 + 'rem';
    filterButton.style.marginRight = 0.5 + 'rem';
    filterButton.style.marginTop = 1 + 'rem';
    filterButton.style.width = 6 + 'rem';
    popupWindowFilter.appendChild(filterButton);

    filterButton.onclick = (event) => {
        let min = Number(inputMinFilter.value);
        let max = Number(inputMaxFilter.value);
        const limit = getDimensionRange(filterDimensionData);
        const inverted = isInverted(filterDimensionData);
        let isOk = true;

        let topLimit = limit[1];
        let bottomLimit = limit[0];

        if (inverted) {
            if (min < topLimit) {
                min = topLimit;
                popupWindowFilterError.textContent = `Min value is smaller than 
                ${getMinValue(filterDimensionData)}, filter is set to min.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
            if (max > bottomLimit) {
                max = bottomLimit;
                popupWindowFilterError.textContent = `Max value is bigger than 
                ${getMaxValue(filterDimensionData)}, filter is set to max.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
            if (max > min) {
                popupWindowFilterError.textContent = `Attention: Min value ${max} is bigger 
                than max value ${min}.
                Please enter values between ${topLimit} and ${bottomLimit}.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
        }
        else {
            if (min < bottomLimit) {
                min = bottomLimit;
                popupWindowFilterError.textContent = `Min value is smaller than 
                ${getMinValue(filterDimensionData)}, filter is set to min.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
            if (max > topLimit) {
                max = topLimit;
                popupWindowFilterError.textContent = `Max value is bigger than 
                ${getMaxValue(filterDimensionData)}, filter is set to max.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
            if (min > max) {
                popupWindowFilterError.textContent = `Attention: Min value ${max} is bigger 
                than max value ${min}.
                Please enter values between ${bottomLimit} and ${topLimit}.`;
                popupWindowFilterError.style.display = 'block';
                popupWindowFilterError.style.paddingLeft = 0.5 + 'rem';
                popupWindowFilterError.style.paddingTop = 0.5 + 'rem';
                popupWindowFilterError.style.color = 'red';
                popupWindowFilterError.style.fontSize = 'x-small';
                isOk = false;
            }
        }
        
        if (isOk) {
            popupWindowFilterError.style.display = 'none';
            if (inverted) {
                setFilter(filterDimensionData, min, max);
            }
            else {
                setFilter(filterDimensionData, max, min);
            }
            popupWindowFilter.style.display = 'none';
        }
    }
}

function generateDropdownForRange() {
    //let dimensions = newData['columns'];

    document.getElementById('rangeDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('rangeDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = (event) => {
        rangeDimensionData = event.target.value;
        generateModuleForRangeSettings();
    }
    dropdown.onfocus = () => {
        dropdown.innerHTML = "";
        dropdown.appendChild(headline);
        let dimensions = getAllDimensionNames();
        dimensions.forEach(function(dimension) {
            if (!isDimensionCategorical(dimension)) {
                let option = document.createElement('option');
                option.textContent = dimension;
                option.value = dimension;
                option.id = 'rangeOption_' + dimension;
                dropdown.appendChild(option);
            }
        });
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Set Range';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        if (!isDimensionCategorical(dimension)) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'rangeOption_' + dimension;
        dropdown.appendChild(option);
        }
    });
    container.appendChild(dropdown);
}

function generateModuleForRangeSettings() {

    let section = document.getElementById('api-section');
    
    let popupWindowRange = document.createElement('div');
    popupWindowRange.id = 'rangeContainer';
    popupWindowRange.className = 'item7';
    popupWindowRange.style.visibility = 'visible';
    popupWindowRange.style.display = 'block';
    popupWindowRange.style.width = 18 + 'rem';
    popupWindowRange.style.height = 11.5 + 'rem';
    popupWindowRange.style.backgroundColor = 'white';
    popupWindowRange.style.border = '1px solid black';
    popupWindowRange.style.borderRadius = 0.25 + 'rem';

    section.appendChild(popupWindowRange);

    let headerRange = document.createElement('div');
    headerRange.textContent = 'Set Range for ' + rangeDimensionData;
    headerRange.style.paddingLeft = 0.5 + 'rem';
    headerRange.style.paddingTop = 0.5 + 'rem';
    headerRange.style.fontSize = 'large';
    popupWindowRange.appendChild(headerRange);
    
    let closeButtonRange = document.createElement('a');
    closeButtonRange.textContent = 'x';
    closeButtonRange.style.position = 'relative';
    closeButtonRange.style.right = -17 + 'rem';
    closeButtonRange.style.top = -1.5 + 'rem';
    closeButtonRange.style.width = 2.5 + 'rem';
    closeButtonRange.style.height = 2.5 + 'rem';
    closeButtonRange.style.opacity = 0.3;
    closeButtonRange.style.backgroundColor = 'transparent';
    closeButtonRange.style.cursor = 'pointer';
    popupWindowRange.appendChild(closeButtonRange);

    closeButtonRange.onclick = () => {
        popupWindowRange.style.display = 'none';
    };

    let infoRange = document.createElement('div');
    infoRange.style.color = 'grey';
    infoRange.style.fontSize = 'smaller';
    infoRange.style.paddingLeft = 0.5 + 'rem';
    infoRange.style.paddingTop = 1 + 'rem';
    infoRange.style.width = 17.3 + 'rem';
    infoRange.textContent = 'The original range of ' + rangeDimensionData + ' is between ' + 
        getMinValue(rangeDimensionData) + ' and ' + getMaxValue(rangeDimensionData) + '.';
    popupWindowRange.appendChild(infoRange);

    let labelMinRange = document.createElement('label');
    labelMinRange.textContent = 'Min';
    labelMinRange.style.paddingLeft = 0.5 + 'rem';
    popupWindowRange.appendChild(labelMinRange);

    let inputMinRange = document.createElement('input');
    inputMinRange.id = 'minRangeValue';
    inputMinRange.style.width = 2 + 'rem';
    inputMinRange.style.marginLeft = 0.5 + 'rem';
    popupWindowRange.appendChild(inputMinRange);

    inputMinRange.onkeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('rangeButton').click();
        }
    }

    let labelMaxRange = document.createElement('label');
    labelMaxRange.textContent = 'Max';
    labelMaxRange.style.paddingLeft = 0.5 + 'rem';
    popupWindowRange.appendChild(labelMaxRange);

    let inputMaxRange = document.createElement('input');
    inputMaxRange.id = 'maxRangeValue';
    inputMaxRange.style.width = 2 + 'rem';
    inputMaxRange.style.marginLeft = 0.5 + 'rem';
    popupWindowRange.appendChild(inputMaxRange);

    inputMaxRange.onkeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('rangeButton').click();
        }
    }

    let popupWindowRangeError = document.createElement('div');
    popupWindowRangeError.style.position = 'absolute';
    popupWindowRange.appendChild(popupWindowRangeError);
    
    let rangeButton = document.createElement('button');
    rangeButton.textContent = 'Save';
    rangeButton.style.marginLeft = 0.5 + 'rem';
    rangeButton.style.marginRight = 0.5 + 'rem';
    rangeButton.style.marginTop = 1 + 'rem';
    rangeButton.style.width = 6 + 'rem';
    popupWindowRange.appendChild(rangeButton);

    rangeButton.onclick = (event) => {
        let min = Number(inputMinRange.value);
        let max = Number(inputMaxRange.value);

        const inverted = isInverted(rangeDimensionData);
        let isOk = true;
                        
        if (inverted) {
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }
            if (max < getMinValue(rangeDimensionData) || 
                min > getMaxValue(rangeDimensionData)) {
                popupWindowRangeError.textContent = `The range has to be bigger than 
                    ${getMinValue(rangeDimensionData)} and ${getMaxValue(rangeDimensionData)}.`;
                    popupWindowRangeError.style.display = 'block';
                    popupWindowRangeError.style.paddingLeft = 0.5 + 'rem';
                    popupWindowRangeError.style.paddingTop = 0.5 + 'rem';
                    popupWindowRangeError.style.color = 'red';
                    popupWindowRangeError.style.fontSize = 'x-small';
                    isOk = false;
            }
        }
        else {
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }

            if (min > getMinValue(rangeDimensionData) || 
                max < getMaxValue(rangeDimensionData)) {
                    popupWindowRangeError.textContent = `The range has to be bigger than 
                        ${getMinValue(rangeDimensionData)} and ${getMaxValue(rangeDimensionData)}.`;
                        popupWindowRangeError.style.display = 'block';
                        popupWindowRangeError.style.paddingLeft = 0.5 + 'rem';
                        popupWindowRangeError.style.paddingTop = 0.5 + 'rem';
                        popupWindowRangeError.style.paddingBottom = 0.5 + 'rem';
                        popupWindowRangeError.style.paddingRight = 0.5 + 'rem';
                        popupWindowRangeError.style.color = 'red';
                        popupWindowRangeError.style.fontSize = 'x-small';
                        isOk = false;
                        }
                    }
        if (isOk) {
            popupWindowRangeError.style.display = 'none';
            setDimensionRange(rangeDimensionData, min, max);
            popupWindowRange.style.display = 'none';
        }
    }
    
    let newLine = document.createElement('div');
    let resetRangeButton = document.createElement('button');
    resetRangeButton.textContent = 'Set Ranges from Data';
    resetRangeButton.style.marginLeft = 0.5 + 'rem';
    resetRangeButton.style.marginTop = 1 + 'rem';
    resetRangeButton.style.marginBottom = 1 + 'rem';
    resetRangeButton.style.marginRight = 0.5 + 'rem';
    resetRangeButton.style.width = 16.3 + 'rem';
    newLine.appendChild(resetRangeButton);
    popupWindowRange.appendChild(newLine);

    resetRangeButton.onclick = () => {
        setDimensionRange(rangeDimensionData, getMinValue(rangeDimensionData), getMaxValue(rangeDimensionData));
        popupWindowRange.style.display = 'none';
    };
}

function resetToOriginalRange() {
    let dimensions = getAllDimensionNames();
    dimensions.forEach(function(dimension) {
        if (!isNaN(getMinValue(dimension))) {
            let min = getMinValue(dimension);
            let max = getMaxValue(dimension);
            setDimensionRange(dimension, min, max);
        }
    });
}

function resetToRoundedRange() {
    let dimensions = getAllDimensionNames();
    dimensions.forEach(function(dimension) {
        if (!isNaN(getMinValue(dimension))) {
            let min = getMinValue(dimension);
            let max = getMaxValue(dimension);
            setDimensionRangeRounded(dimension, min, max);
        }
    });
}

function resetAll() {
    let reloadedData = loadCSV(data);
    drawChart(reloadedData);
}

function generateDropdownForSelectRecords() {
    
    let records = getAllRecords();
    
    document.getElementById('selectRecordsHeader').style.visibility = 'visible';

    const container = document.getElementById('selectRecordsContainer');
    container.style.position = 'relative';

    let selectButton = document.createElement('button');
    selectButton.id = 'selectButtonR';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', () => {
        showOptionsForRecords('options_r', 'selectButtonR');
        const dropdownHeight = recordsContainer.clientHeight;
        const windowHeight = window.innerHeight;
        const dropdownTop = selectButton.getBoundingClientRect().top;

        if (windowHeight - dropdownTop < dropdownHeight) {
            recordsContainer.style.bottom = '100%';
            recordsContainer.style.top = 'auto';
        }
        else {
            recordsContainer.style.bottom = 'auto';
            recordsContainer.style.top = '100%';
        }
    });

    let textElement = document.createElement('span');
    textElement.innerHTML = 'Select Records <img src="./svg/dropdown-symbol.svg" />';
    selectButton.appendChild(textElement);

    let recordsContainer = document.createElement('div');
    recordsContainer.id = 'options_r';
    recordsContainer.className = 'ddList';
    recordsContainer.style.display = 'none';
    recordsContainer.style.border = '0.1rem lightgrey solid';
    recordsContainer.style.width = 'max-content';
    recordsContainer.style.borderRadius = '0.2rem';
    if (records.length > 10) {
        recordsContainer.style.height = '12.5rem';
    }
    recordsContainer.name = 'options_r';
    recordsContainer.addEventListener('change', (event) => {
        toggleSelection(event.target.value);
    });

    records.forEach(function(record) {
        let label = document.createElement('label');
        label.className = 'dropdownLabel';
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'sel_' + record;
        input.value = record;
        input.name = 'record';
        input.style.marginTop = '0.5rem';
        input.style.marginLeft = '0.5rem';
        input.checked = false;
        label.appendChild(input);
        label.appendChild(document.createTextNode(record));
        recordsContainer.appendChild(label);
    });

    container.appendChild(selectButton);
    container.appendChild(recordsContainer);
}

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invertDimensionContainer')
    const showContainer = document.getElementById('showDimensionContainer');
    const moveContainer = document.getElementById('moveDimensionContainer');
    const filterDimensionContainer = document.getElementById('filterDimensionContainer');
    const rangeDimensionContainer = document.getElementById('rangeDimensionContainer');
    const selectRecordsContainer = document.getElementById('selectRecordsContainer');

    while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }
    while (invertContainer.firstChild) {
        invertContainer.removeChild(invertContainer.firstChild);
    }
    while (showContainer.firstChild) {
        showContainer.removeChild(showContainer.firstChild);
    }
    while (moveContainer.firstChild) {
        moveContainer.removeChild(moveContainer.firstChild);
    }
    while (filterDimensionContainer.firstChild) {
        filterDimensionContainer.removeChild(filterDimensionContainer.firstChild);
    }
    while (rangeDimensionContainer.firstChild) {
        rangeDimensionContainer.removeChild(rangeDimensionContainer.firstChild);
    }
    while (selectRecordsContainer.firstChild) {
        selectRecordsContainer.removeChild(selectRecordsContainer.firstChild);
    }
}