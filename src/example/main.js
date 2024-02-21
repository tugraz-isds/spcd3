import {loadCSV, generateSVG, invert, setDimensions, saveAsSvg, moveByOne, 
    isInverted, getDimensionPositions, setFilter, getDimensionRange,
    getNumberOfDimensions, hide, show, getHiddenStatus} from './lib/spcd3.js';

let data;
let newData;
let newFeatures = [];
let moveDimensionData;
let filterDimensionData;

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
        disableOptionInDropdown('moveOption_', event.target.value);
        disableLeftAndRightButton();
    });

    dimensions.forEach(function(dimension) {
        let label = document.createElement('label');
        label.className = 'dropdownLabel';
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = dimension;
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
        disableLeftAndRightButton();
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
    disableLeftAndRightButton();
}

function moveDimensionRight() {
    moveByOne(moveDimensionData, 'right');
    disableLeftAndRightButton();
}

function disableLeftAndRightButton() {
    const position = getDimensionPositions(moveDimensionData);
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
        generateInputFieldsForSetRange();
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

function generateInputFieldsForSetRange() {
  const container = document.getElementById('rangeContainer');
  const filterButton = document.getElementById('filterButton');
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

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invertDimensionContainer')
    const showContainer = document.getElementById('showDimensionContainer');
    const moveContainer = document.getElementById('moveDimensionContainer');
    const filterContainer = document.getElementById('filterDimensionContainer');
    const rangeContainer = document.getElementById('rangeContainer');
    const filterButton = document.getElementById('filterButton');
    const inputTextElementTop = document.getElementById('filterDimensionInputFieldTop');
    const inputTextElementBottom = document.getElementById('filterDimensionInputFieldBottom');

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
    while (filterContainer.firstChild) {
        filterContainer.removeChild(filterContainer.firstChild);
    }

    rangeContainer.style.visibility = 'hidden';
    filterButton.style.visibility = 'hidden';
    inputTextElementTop.style.visibility = 'hidden';
    inputTextElementBottom.style.visibility = 'hidden';
}