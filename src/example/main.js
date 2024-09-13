import {loadCSV, drawChart, invert, saveAsSvg, moveByOne, 
    isInverted, getDimensionPosition, setFilter, getDimensionRange,
    getNumberOfDimensions, hide, show, getHiddenStatus, getMinValue, getMaxValue,
    setDimensionRange, isDimensionCategorical, getAllDimensionNames, getAllRecords,
    toggleSelection, isSelected, setDimensionRangeRounded, getInversionStatus} from './lib/spcd3.js';

let data;
let newData;
let newFeatures = [];
let initFeatures = [];
let moveDimensionData;
let filterDimensionData;
let rangeDimensionData;

let studentData = "Name,Maths,English,PE,Art,History,IT,Biology,German\nAdrian,95,24,82,49,58,85,21,24\nAmelia,92,98,60,45,82,85,78,92\nBrooke,27,35,84,45,23,50,15,22\nChloe,78,9,83,66,80,63,29,12\nDylan,92,47,91,56,47,81,60,51\nEmily,67,3,98,77,25,100,50,34\nEvan,53,60,97,74,21,78,72,75\nFinn,42,73,65,52,43,61,82,85\nGia,50,81,85,80,43,46,73,91\nGrace,24,95,98,94,89,25,91,69\nHarper,69,9,97,77,56,94,38,2\nHayden,2,72,74,53,40,40,66,64\nIsabella,8,99,84,69,86,20,86,85\nJesse,63,39,93,84,30,71,86,19\nJordan,11,80,87,68,88,20,96,81\nKai,27,65,62,92,81,28,94,84\nKaitlyn,7,70,51,77,79,29,96,73\nLydia,75,49,98,55,68,67,91,87\nMark,51,70,87,40,97,94,60,95\nMonica,62,89,98,90,85,66,84,99\nNicole,70,8,84,64,26,70,12,8\nOswin,96,14,62,35,56,98,5,12\nPeter,98,10,71,41,55,66,38,29\nRenette,96,39,82,43,26,92,20,2\nRobert,78,32,98,55,56,81,46,29\nSasha,87,1,84,70,56,88,49,2\nSylvia,86,12,97,4,19,80,36,8\nThomas,76,47,99,34,48,92,30,38\nVictor,5,60,70,65,97,19,63,83\nZack,19,84,83,42,93,15,98,95";

document.addEventListener('DOMContentLoaded', function() {
    data = studentData;
    newData = loadCSV(data);  
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
inputFile.addEventListener('click', (event) => {
    event.target.value = null;
})

let downloadButton = document.getElementById('download');
downloadButton.addEventListener('click', saveAsSvg, false);
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

let filterButton = document.getElementById('filterButton');
filterButton.addEventListener('click', filter, false);
filterButton.style.visibility = 'hidden';

let rangeButton = document.getElementById('rangeButton');
rangeButton.addEventListener('click', setRange, false);
rangeButton.style.visibility = 'hidden';

let topFilter = document.getElementById('filterDimensionInputFieldTop');
topFilter.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
        filter();
    }
});

let bottomFilter = document.getElementById('filterDimensionInputFieldBottom');
bottomFilter.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
        filter();
    }
});

let topRange = document.getElementById('rangeDimensionInputFieldTop');
topRange.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
        setRange();
    }
});

let bottomRange = document.getElementById('rangeDimensionInputFieldBottom');
bottomRange.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
        setRange();
    }
});

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
            //newFeatures = getAllDimensionNames().reverse();
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
    checkboxes.style.display == 'block' ? button.style.color = 'white' :
        button.style.color = 'white';

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
    let dimensions = newData['columns'];

    document.getElementById('showDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('showDimensionContainer');

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
                input.checked = false;
                label.appendChild(input);
                label.appendChild(document.createTextNode(dimension));
                dimensionContainer.appendChild(label);
            });
        }
        showOptions('options', 'showButton');
    });

    let textElement = document.createElement('span');
    textElement.innerHTML = 'Show Dimensions <img src="./svg/dropdown-symbol.svg" />';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'options';
    dimensionContainer.className = 'ddList';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
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
    let dimensions = newData['columns'];
    
    document.getElementById('invertDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('invertDimensionContainer');

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
    dimensionContainer.style.marginLeft = '15.5rem';
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
    let dimensions = newData['columns'];

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
        disableLeftAndRightButton(dimensions[0]);
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
    let dimensions = newData['columns'];

    document.getElementById('filterDimensionHeader').style.visibility = 'visible';

    const container = document.getElementById('filterDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = (event) => {
        filterDimensionData = event.target.value;
        generateInputFieldsForSetFilter();
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

function generateInputFieldsForSetFilter() {
  const container = document.getElementById('filterContainer');
  const labelTop = document.getElementById('filterDimensionLabelTop');
  const labelBottom = document.getElementById('filterDimensionLabelBottom');
  const inputTextElementTop = document.getElementById('filterDimensionInputFieldTop');
  const inputTextElementBottom = document.getElementById('filterDimensionInputFieldBottom');
  const filterInfo = document.getElementById('filterInfo');

  if (filterDimensionData === 'Set Filter') {
        container.style.visibility = 'hidden';
        labelTop.style.visibility = 'hidden';
        labelBottom.style.visibility = 'hidden';
        inputTextElementTop.style.visibility = 'hidden';
        inputTextElementBottom.style.visibility = 'hidden';
        filterInfo.style.visibility = 'hidden';
        filterButton.style.visibility = 'hidden';
  }
  else {
        container.style.visibility = 'visible';

        inputTextElementTop.style.visibility = 'visible';
        inputTextElementTop.name = 'topRange';

        labelTop.for = 'topRange';
        labelTop.innerHTML = 'Min';

        inputTextElementBottom.style.visibility = 'visible';
        inputTextElementBottom.name = 'bottomRange';

        labelBottom.for = 'bottomRange';
        labelBottom.innerHTML = 'Max';

        filterButton.style.visibility = 'visible';
        filterButton.textContent = 'Set Filter';

        let range = getDimensionRange(filterDimensionData);

        filterInfo.style.visibility = 'visible';
        filterInfo.innerHTML = `Filtering for dimension ${filterDimensionData} is possible between ${range[0]} and ${range[1]}.`;
        filterInfo.style.color = 'grey';
        filterInfo.style.fontSize = 'smaller';

        container.appendChild(labelTop);
        container.appendChild(inputTextElementTop);
        container.appendChild(labelBottom);
        container.appendChild(inputTextElementBottom);
        container.appendChild(filterButton);
  }
}

function filter() {

    if(isDimensionCategorical(filterDimensionData)) {
        alert(`Attention: Set Filter works only for numerical data!`);
        return;
    }

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
                    Please enter values between ${bottomLimit} and ${topLimit}.`);
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

function generateInputFieldsForSetRange() {
    const container = document.getElementById('rangeContainer');
    const labelTop = document.getElementById('rangeDimensionLabelTop');
    const labelBottom = document.getElementById('rangeDimensionLabelBottom');
    const inputTextElementTop = document.getElementById('rangeDimensionInputFieldTop');
    const inputTextElementBottom = document.getElementById('rangeDimensionInputFieldBottom');
    const rangeInfo = document.getElementById('rangeInfo');

    if (rangeDimensionData === 'Set Range') {
        container.style.visibility = 'hidden';
        labelTop.style.visibility = 'hidden';
        labelBottom.style.visibility = 'hidden';
        inputTextElementTop.style.visibility = 'hidden';
        inputTextElementBottom.style.visibility = 'hidden';
        rangeInfo.style.visibility = 'hidden';
        rangeButton.style.visibility = 'hidden';
    }
    else {
        container.style.visibility = 'visible';
    
        inputTextElementTop.style.visibility = 'visible';
        inputTextElementTop.name = 'minRange';
    
        labelTop.for = 'minRange';
        labelTop.innerHTML = 'Min';

        const max = getMaxValue(rangeDimensionData);
        const min = getMinValue(rangeDimensionData);

        inputTextElementBottom.style.visibility = 'visible';
        inputTextElementBottom.name = 'maxRange';
    
        labelBottom.for = 'maxRange';
        labelBottom.innerHTML = 'Max';
    
        rangeButton.style.visibility = 'visible';
        rangeButton.textContent = 'Set Range';

        rangeInfo.style.visibility = 'visible';
        rangeInfo.innerHTML = `The original range of ${rangeDimensionData} is between ${min} and ${max}.`;
        rangeInfo.style.color = 'grey';
        rangeInfo.style.fontSize = 'smaller';

        container.appendChild(labelTop);
        container.appendChild(inputTextElementTop);
        container.appendChild(labelBottom);
        container.appendChild(inputTextElementBottom);
        container.appendChild(rangeButton);
    }
}

function setRange() {

    if(isDimensionCategorical(rangeDimensionData)) {
        alert(`Attention: Set Range works only for numerical data!`);
        return;
    }

    let min = Number(document.getElementById('rangeDimensionInputFieldTop').value);
    let max = Number(document.getElementById('rangeDimensionInputFieldBottom').value);
   
    const inverted = isInverted(rangeDimensionData);
    
    let isOk = true;
    if (inverted) { 
        if (!isNaN(getMinValue(rangeDimensionData))) {
            
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }
            if (max < getMinValue(rangeDimensionData) || 
                min > getMaxValue(rangeDimensionData)) {
                    alert(`The range has to be bigger than ${getMinValue(rangeDimensionData)} and ${getMaxValue(rangeDimensionData)}.`);
                    isOk = false;
            }
        }
    }
    else {
        if (!isNaN(getMinValue(rangeDimensionData))) {
            if (isNaN(min) || isNaN(max)) {
                alert(`Attention: Values are not numbers!`);
                isOk = false;
            }
            if (min > getMinValue(rangeDimensionData) || 
                max < getMaxValue(rangeDimensionData)) {
                    alert(`The range has to be bigger than ${getMinValue(rangeDimensionData)} and ${getMaxValue(rangeDimensionData)}.`);
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

    let selectButton = document.createElement('button');
    selectButton.id = 'selectButtonR';
    selectButton.className = 'ddButton';
    selectButton.addEventListener('click', () => {
        showOptionsForRecords('options_r', 'selectButtonR');
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
    const filterContainer = document.getElementById('filterContainer');
    const inputTextElementTop = document.getElementById('filterDimensionInputFieldTop');
    const inputTextElementBottom = document.getElementById('filterDimensionInputFieldBottom');
    const rangeDimensionContainer = document.getElementById('rangeDimensionContainer');
    const rangeContainer = document.getElementById('rangeContainer');
    const inputTextElementMin = document.getElementById('rangeDimensionInputFieldTop');
    const inputTextElementMax = document.getElementById('rangeDimensionInputFieldBottom');
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

    filterContainer.style.visibility = 'hidden';
    filterButton.style.visibility = 'hidden';
    inputTextElementTop.style.visibility = 'hidden';
    inputTextElementBottom.style.visibility = 'hidden';

    rangeContainer.style.visibility = 'hidden';
    rangeButton.style.visibility = 'hidden';
    inputTextElementMin.style.visibility = 'hidden';
    inputTextElementMax.style.visibility = 'hidden';
}