import {loadCSV, generateSVG, invert, setDimensions, prepareData, setupYScales, setupXScales, setupYAxis, saveAsSvg, move} from './lib/spcd3.js';

let data;
let newData;
let newFeatures = [];
let showDimensionData;
let dimensionData = [];
let moveDimensionData;
let invertDimensionData;
let yScales;
let xScales;
let features;
let featuresCopy;
let newDataset;
let newDatasetCopy = [];
let newFeaturesCopy = [];
let yAxis;
let parcoords = {};
let datasetForBrushing = [];

let inputButton = document.getElementById("input");
inputButton.addEventListener("click", openFileDialog, false);
let inputFile = document.getElementById('fileInput');
inputFile.addEventListener("change", handleFileSelect, false);
inputFile.addEventListener("click", (event) => {
    event.target.value = null;
})

let downloadButton = document.getElementById("download");
downloadButton.addEventListener("click", saveAsSvg, false);
downloadButton.style.visibility = "hidden";

let moveRightButton = document.getElementById("moveRight");
moveRightButton.addEventListener("click", moveDimensionRight, false);
moveRightButton.style.visibility = "hidden";

let moveLeftButton = document.getElementById("moveLeft");
moveLeftButton.addEventListener("click", moveDimensionLeft, false);
moveLeftButton.style.visibility = "hidden";

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
            
            for(let i = 0; i < newFeatures.length; i++) {
                newFeaturesCopy[i] = newFeatures[i];
            }
            let dataset = prepareData(newData, newFeatures);
            newDatasetCopy = dataset[1];
            featuresCopy = dataset[0];
            
            parcoords = {
                xScales : setupXScales(newFeatures.length * 80, 80, dataset[0]),
                yScales : setupYScales(400, 80, dataset[0], dataset[1]),
                dragging : {},
                newFeatures : newFeatures,
                features : dataset[0],
                newDataset : dataset[1],
                datasetForBrushing : dataset[1],
            }
            yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);

            setFunctionsDataInit(newFeatures);
            showButtons();

            generateSVG(newData, newFeatures);
        };
        reader.readAsText(file);
    }
}

function showButtons() {
    downloadButton.style.visibility = "visible";
    moveRightButton.style.visibility = "visible";
    moveLeftButton.style.visibility = "visible";
    moveRightButton.disabled = true;
    moveRightButton.style.opacity = 0.5;
    moveLeftButton.disabled = true;
    moveLeftButton.style.opacity = 0.5;
}

function setFunctionsDataInit(newFeatures) {
    for (let i = 0; i < newFeatures.length; i++) {
        dimensionData.push({key: newFeatures[i], status: "in", invert: false});
    }
}

function updateDimensions()
{
    let selectedDimensions = getSelectedDimensions();
    let newSelectedDimensions = setDimensions(selectedDimensions);
    generateSVG(newData, newSelectedDimensions);
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

function showOptions(id) {
    
    let checkboxes =  document.getElementById(id);
    
    checkboxes.style.display == 'none' ? checkboxes.style.display = 'block' :
        checkboxes.style.display = 'none';
}

function generateDropdownForShow() {

    let dimensions = newData["columns"];
    
    document.getElementById('showDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('showDimensionContainer');

    let selectButton = document.createElement('button');
    selectButton.id = 'showButton';
    selectButton.addEventListener("click", (event) => {
        showOptions('options');
    });

    let textElement = document.createElement('span');
    textElement.textContent = 'Show Dimensions';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'options';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
    dimensionContainer.name = 'options';
    dimensionContainer.addEventListener("change", (event) => {
        updateDimensions();
    });

    dimensions.forEach(function(dimension) {
        let label = document.createElement('label');
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

function setInvertDimensionStatus(dimension) {
    const dimensionStatus = dimensionData.find((obj) => obj.key == dimension);
    
    var new_status = {};
    if(dimensionStatus.invert == false) {
        new_status["invert"] = true;
    }
    else {
        new_status["invert"] = false;
    }
    Object.assign(dimensionStatus, new_status);
}

function getInvertDimensionStatus(dimension) {
    const status = dimensionData.find((obj) => obj.key == dimension);
    return status.invert;
}

function generateDropdownForInvert() {
    let dimensions = newData["columns"];
    
    document.getElementById('invertDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('invertDimensionContainer');

    let selectButton = document.createElement('button');
    selectButton.id = 'invertButton';
    selectButton.addEventListener("click", (event) => {
        showOptions('invertOptions');
    });

    let textElement = document.createElement('span');
    textElement.textContent = 'Invert Dimensions';
    selectButton.appendChild(textElement);

    let dimensionContainer = document.createElement('div');
    dimensionContainer.id = 'invertOptions';
    dimensionContainer.style.display = 'none';
    dimensionContainer.style.border = '0.1rem lightgrey solid';
    dimensionContainer.style.width = 'max-content';
    dimensionContainer.style.borderRadius = '0.2rem';
    dimensionContainer.name = 'invertOptions';
    dimensionContainer.addEventListener("click", (event) => {
        invertDimension();
    });

    dimensions.forEach(function(dimension) {
        let label = document.createElement('label');
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = dimension;
        input.value = dimension;
        input.name = 'invertDimension';
        label.appendChild(input);
        label.appendChild(document.createTextNode(dimension));
        dimensionContainer.appendChild(label);
    })

    container.appendChild(selectButton);
    container.appendChild(dimensionContainer);
}

function invertDimension() {
    const checkedCheckboxes = document.querySelectorAll('input[name="invertDimension"]:checked');
    const uncheckedCheckboxes = document.querySelectorAll('input[name="invertDimension"]:not(:checked)');


    checkedCheckboxes.forEach(function(checkbox) {
        const isChecked = getInvertDimensionStatus(checkbox.value);
        if(isChecked == false) {
            invert(checkbox.value, parcoords, yAxis);
            setInvertDimensionStatus(checkbox.value);
        }   
    });

    uncheckedCheckboxes.forEach(function(checkbox) {
        const isUnchecked = getInvertDimensionStatus(checkbox.value);
        if(isUnchecked == true) {
            invert(checkbox.value, parcoords, yAxis);
            setInvertDimensionStatus(checkbox.value);
        }
    });
}

function generateDropdownForMove() {
    let dimensions = newData["columns"];

    document.getElementById('moveDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('moveDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => {
        moveDimensionData = dropdown.value;
        disableLeftAndRightButton();
    }

    const headline = document.createElement("option");
    headline.selected = "disabled";
    headline.textContent = "Move dimension";
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement("option");
        option.textContent = dimension;
        option.value = dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
    document.getElementById("moveLeft").disabled = true;
}

function moveDimensionLeft() {  
    move(moveDimensionData, 'left', parcoords);
    disableLeftAndRightButton();
}

function moveDimensionRight() {
    move(moveDimensionData, 'right', parcoords);
    disableLeftAndRightButton();
}

function disableLeftAndRightButton() {
    let index = newFeatures.indexOf(moveDimensionData);

    if (index == 0 || index == -1) {
        document.getElementById("moveRight").disabled = true;
        document.getElementById("moveRight").style.opacity = 0.5;
    }
    else {
        document.getElementById("moveRight").disabled = false;
        document.getElementById("moveRight").style.opacity = 1;
    }

    if (index == newFeatures.length - 1 || index == -1) {
        document.getElementById("moveLeft").disabled = true;
        document.getElementById("moveLeft").style.opacity = 0.5;
    }
    else {
        document.getElementById("moveLeft").disabled = false;
        document.getElementById("moveLeft").style.opacity = 1;
    }
}

function generateDropdownForFilter() {
    let dimensions = newData["columns"];

    document.getElementById('filterDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('filterDimensionContainer');

    const dropdown = document.createElement('select');
    //dropdown.onchange = () => invertD(dropdown.value, newFeatures, parcoords, yAxis);

    const headline = document.createElement("option");
    headline.selected = "disabled";
    headline.textContent = "Filter dimension";
    dropdown.appendChild(headline);

    dimensions.forEach(function(dimension) {
        let option = document.createElement("option");
        option.textContent = dimension;
        option.value = dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invertDimensionContainer')
    const showContainer = document.getElementById('showDimensionContainer');
    const moveContainer = document.getElementById('moveDimensionContainer');
    const filterContainer = document.getElementById('filterDimensionContainer');

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
}

