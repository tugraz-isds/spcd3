import {loadCSV, generateSVG, invert, setDimensions, saveAsSvg, moveByOne, 
    isInverted, getDimensionPositions, setFilter, getDimensionRange,
    getNumberOfDimensions, hide, show, getHiddenStatus, getMinRange, getMaxRange,
    setDimensionRange} from './lib/spcd3.js';

let data;
let newData;
let newFeatures = [];
let moveDimensionData;
let filterDimensionData;
let rangeDimensionData;

let inputButton = document.getElementById('input');
inputButton.addEventListener('click', openFileDialog, false);
let inputFile = document.getElementById('fileInput');
inputFile.addEventListener('change', handleFileSelect, false);
inputFile.addEventListener('click', (event) => {
    event.target.value = null;
})

let downloadButton = document.getElementById('download');
downloadButton.addEventListener('click', saveAsSvg, false);
downloadButton.style.visibility = 'hidden';

let moveRightButton = document.getElementById('moveRight');
moveRightButton.addEventListener('click', moveDimensionRight, false);
moveRightButton.style.visibility = 'hidden';

let moveLeftButton = document.getElementById('moveLeft');
moveLeftButton.addEventListener('click', moveDimensionLeft, false);
moveLeftButton.style.visibility = 'hidden';

let filterButton = document.getElementById('filterButton');
filterButton.addEventListener('click', filter, false);
filterButton.style.visibility = 'hidden';

let rangeButton = document.getElementById('rangeButton');
rangeButton.addEventListener('click', setRange, false);
rangeButton.style.visibility = 'hidden';

function openFileDialog() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            clearPlot();
            data = e.target.result;
            newData = loadCSV(data);

            generateDropdownForShow();
            generateDropdownForInvert();
            generateDropdownForMove();
            generateDropdownForFilter();
            generateDropdownForRange();
            
            let selectedDimensions = getSelectedDimensions();
            newFeatures = setDimensions(selectedDimensions);

            showButtons();

            generateSVG(newData, newFeatures);
            document.getElementById('border').style.visibility = 'visible';
        };
        reader.readAsText(file);
    }
}

function showButtons() {
    downloadButton.style.visibility = 'visible';
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

    checkboxes.style.display == 'block' ? button.style.backgroundColor = 'grey' :
        button.style.backgroundColor = 'white';
    checkboxes.style.display == 'block' ? button.style.color = 'white' :
        button.style.color = 'black'; 

    newFeatures.forEach(function (feature) {
        if(getHiddenStatus(feature) == 'hidden') {
            document.getElementById('show_' + feature).checked = false;
        }
        disableCheckbox(feature);
        disableOptionInDropdown('filterOption_', feature);
        disableOptionInDropdown('rangeOption', feature);
        disableOptionInDropdown('moveOption_', feature);
        disableLeftAndRightButton(feature);
    });
}

function generateDropdownForShow() {

    let dimensions = newData['columns'];
    
    document.getElementById('showDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('showDimensionContainer');

    let selectButton = document.createElement('button');
    selectButton.id = 'showButton';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', (event) => {
        showOptions('options', 'showButton');
    });

    let textElement = document.createElement('span');
    textElement.textContent = 'Show Dimensions';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'options';
    dimensionContainer.className = 'ddList';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
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
    })

    container.appendChild(selectButton);
    container.appendChild(dimensionContainer);
}

function generateDropdownForInvert() {
    let dimensions = newData['columns'];
    
    document.getElementById('invertDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('invertDimensionContainer');

    let selectButton = document.createElement('button');
    selectButton.id = 'invertButton';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', (event) => {
        showOptions('invertOptions', 'invertButton');
        for (let i = 0; i < newFeatures.length; i++) {
            const position = getDimensionPositions(newFeatures[i]);
            if (position != -1) {
                const inverted = isInverted(newFeatures[i]);
                if (inverted == true) {
                    document.getElementById('invert_' + newFeatures[i]).checked = true;
                }
                else {
                    document.getElementById('invert_' + newFeatures[i]).checked = false;
                }
            }
        }
    });

    let textElement = document.createElement('span');
    textElement.id = 'invertText';
    textElement.textContent = 'Invert Dimensions';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'invertOptions';
    dimensionContainer.className = 'ddList';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
    dimensionContainer.name = 'invertOptions';
    dimensionContainer.addEventListener('change', (event) => {
        invertDimension(event.target.value);
    });

    dimensions.forEach(function(dimension) {
        let label = document.createElement('label');
        label.className = 'dropdownLabel';
        label.id = 'invertLabel_' + dimension;
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'invert_' + dimension;
        input.value = dimension;
        input.name = 'invertDimension';
        label.appendChild(input);
        label.appendChild(document.createTextNode(dimension));
        dimensionContainer.appendChild(label);
    })

    container.appendChild(selectButton);
    container.appendChild(dimensionContainer);
}

function invertDimension(dimension) {
    invert(dimension);
}

function disableCheckbox(dimension) {
    let position = getDimensionPositions(dimension);
    if (position != -1) {
        document.getElementById('invert_' + dimension).disabled = false;
        document.getElementById('invertLabel_' + dimension).style.opacity = 1;
    }
    else {
        document.getElementById('invert_' + dimension).disabled = true;
        document.getElementById('invertLabel_' + dimension).style.opacity = 0.5;
    }
}

function disableOptionInDropdown(prefixId, dimension) {
    const value = prefixId.concat(dimension);
    const position = getDimensionPositions(dimension);
    if (position != -1) {
        document.getElementById(value).disabled = false;
    }
    else {
        document.getElementById(value).disabled = true;
    }
}

function generateDropdownForMove() {
    let dimensions = newData['columns'];

    document.getElementById('moveDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('moveDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => {
        moveDimensionData = dropdown.value;
        disableLeftAndRightButton(moveDimensionData);
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Move Dimension';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'moveOption_' + dimension;
        dropdown.appendChild(option);
    })
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
    const position = getDimensionPositions(dimension);
    const numberOfDimensions = getNumberOfDimensions();
    
    if (position == 0 || position == -1) {
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
    let dimensions = newData['columns'];

    document.getElementById('filterDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('filterDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = (event) => {
        filterDimensionData = event.target.value;
        generateInputFieldsForSetFilter();
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Set Filter';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'filterOption_' + dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function generateInputFieldsForSetFilter() {
  const container = document.getElementById('filterContainer');
  const labelTop = document.getElementById('filterDimensionLabelTop');
  const labelBottom = document.getElementById('filterDimensionLabelBottom');
  const inputTextElementTop = document.getElementById('filterDimensionInputFieldTop');
  const inputTextElementBottom = document.getElementById('filterDimensionInputFieldBottom');

  container.style.visibility = 'visible';

  inputTextElementTop.style.visibility = 'visible';
  inputTextElementTop.name = 'topRange';

  labelTop.for = 'topRange';
  labelTop.innerHTML = 'Min Value:';

  inputTextElementBottom.style.visibility = 'visible';
  inputTextElementBottom.name = 'bottomRange';

  labelBottom.for = 'bottomRange';
  labelBottom.innerHTML = 'Max Value:';

  filterButton.style.visibility = 'visible';
  filterButton.textContent = 'Filter';

  container.appendChild(labelTop);
  container.appendChild(inputTextElementTop);
  container.appendChild(labelBottom);
  container.appendChild(inputTextElementBottom);
  container.appendChild(filterButton);
}

function filter() {
    let top = Number(document.getElementById('filterDimensionInputFieldTop').value);
    let bottom = Number(document.getElementById('filterDimensionInputFieldBottom').value);
    const limit = getDimensionRange(filterDimensionData);

    let topLimit = limit[1];
    let bottomLimit = limit[0];

    const inverted = isInverted(filterDimensionData);
    
    let isOk = true;
    if (inverted) { 
        if (!isNaN(topLimit)) {
            if (isNaN(top) || isNaN(bottom)) {
                alert(`Attention: Values are not numbers! 
                    Please enter values between ${topLimit} and ${bottomLimit}.`);
                isOk = false;
            }
            if (top < topLimit) {
                top = topLimit;
            }
            if (bottom > bottomLimit) {
                bottom = bottomLimit;
            }
            if (top > bottom) {
                alert(`Attention: Min value ${top} is bigger than max value ${bottom}. 
                    Please enter values between ${topLimit} and ${bottomLimit}.`);
                isOk = false;
            }
        }
    }
    else {
        if (!isNaN(topLimit)) {
            if (isNaN(top) || isNaN(bottom)) {
                alert(`Attention: Values are not numbers! 
                    Please enter values between ${topLimit} and ${bottomLimit}.`);
                isOk = false;
            }
            if (top < bottomLimit) {
                top = bottomLimit;
            }
            if (bottom > topLimit) {
                bottom = topLimit;
            }
            if (top > bottom) {
                alert(`Attention: Min value is bigger than max value. 
                    Please enter values between ${bottomLimit} and ${topLimit}.`);
                isOk = false;
            }
        }
    }

    if (isOk) {
        if (inverted) {
            setFilter(filterDimensionData, top, bottom);
        }
        else {
            setFilter(filterDimensionData, bottom, top);
        }
        
        document.getElementById('filterDimensionInputFieldTop').value = '';
        document.getElementById('filterDimensionInputFieldBottom').value = '';

        /*document.getElementById('filterButton').style.visibility = 'hidden';
        document.getElementById('rangeContainer').style.visibility = 'hidden';
        document.getElementById('filterDimensionInputFieldTop').style.visibility = 'hidden';
        document.getElementById('filterDimensionInputFieldBottom').style.visibility = 'hidden';*/
    }
}

function generateDropdownForRange() {
    let dimensions = newData['columns'];

    document.getElementById('rangeDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('rangeDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = (event) => {
        rangeDimensionData = event.target.value;
        generateInputFieldsForSetRange();
    }

    const headline = document.createElement('option');
    headline.selected = 'disabled';
    headline.textContent = 'Set Range';
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement('option');
        option.textContent = dimension;
        option.value = dimension;
        option.id = 'rangeOption_' + dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function generateInputFieldsForSetRange() {
    const container = document.getElementById('rangeContainer');
    const labelTop = document.getElementById('rangeDimensionLabelTop');
    const labelBottom = document.getElementById('rangeDimensionLabelBottom');
    const inputTextElementTop = document.getElementById('rangeDimensionInputFieldTop');
    const inputTextElementBottom = document.getElementById('rangeDimensionInputFieldBottom');
  
    container.style.visibility = 'visible';
  
    inputTextElementTop.style.visibility = 'visible';
    inputTextElementTop.name = 'minRange';
  
    labelTop.for = 'minRange';
    labelTop.innerHTML = 'Min';
  
    inputTextElementBottom.style.visibility = 'visible';
    inputTextElementBottom.name = 'maxRange';
  
    labelBottom.for = 'maxRange';
    labelBottom.innerHTML = 'Max';
  
    rangeButton.style.visibility = 'visible';
    rangeButton.textContent = 'Save';
  
    container.appendChild(labelTop);
    container.appendChild(inputTextElementTop);
    container.appendChild(labelBottom);
    container.appendChild(inputTextElementBottom);
    container.appendChild(rangeButton);
}

function setRange() {
    let min = Number(document.getElementById('rangeDimensionInputFieldTop').value);
    let max = Number(document.getElementById('rangeDimensionInputFieldBottom').value);
   
    const inverted = isInverted(rangeDimensionData);
    
    let isOk = true;
    if (inverted) { 
        if (!isNaN(getMinRange(rangeDimensionData))) {
            
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }
            if (max < getMinRange(rangeDimensionData) || 
                min > getMaxRange(rangeDimensionData)) {
                    alert(`The range has to be bigger than 
                    ${getMinRange(rangeDimensionData)} and 
                    ${getMaxRange(rangeDimensionData)}.`);
                    isOk = false;
            }
        }
    }
    else {
        if (!isNaN(getMinRange(rangeDimensionData))) {
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }
            if (min > getMinRange(rangeDimensionData) || 
                max < getMaxRange(rangeDimensionData)) {
                    alert(`The range has to be bigger than 
                    ${getMinRange(rangeDimensionData)} and 
                    ${getMaxRange(rangeDimensionData)}.`);
                    isOk = false;
            }
        }
    }

    if (isOk) {
        setDimensionRange(rangeDimensionData, min, max);
    }
    document.getElementById('rangeDimensionInputFieldTop').value = '';
    document.getElementById('rangeDimensionInputFieldBottom').value = '';
}

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invertDimensionContainer')
    const showContainer = document.getElementById('showDimensionContainer');
    const moveContainer = document.getElementById('moveDimensionContainer');
    const filterDimensionContainer = document.getElementById('filterDimensionContainer');
    const filterContainer = document.getElementById('filterContainer');
    const inputTextElementTop = document.getElementById('filterDimensionInputFieldTop');
    const inputTextElementBottom = document.getElementById('filterDimensionInputFieldBottom');
    const rangeDimensionContainer = document.getElementById('rangeDimensionContainer');
    const rangeContainer = document.getElementById('rangeContainer');
    const inputTextElementMin = document.getElementById('rangeDimensionInputFieldTop');
    const inputTextElementMax = document.getElementById('rangeDimensionInputFieldBottom');

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

    filterContainer.style.visibility = 'hidden';
    filterButton.style.visibility = 'hidden';
    inputTextElementTop.style.visibility = 'hidden';
    inputTextElementBottom.style.visibility = 'hidden';

    rangeContainer.style.visibility = 'hidden';
    rangeButton.style.visibility = 'hidden';
    inputTextElementMin.style.visibility = 'hidden';
    inputTextElementMax.style.visibility = 'hidden';
}