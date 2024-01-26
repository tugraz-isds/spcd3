import {loadCSV, generateSVG, invertD, setDimensions, prepareData, setupYScales, setupXScales, setupYAxis, saveAsSvg, move} from './lib/spcd3.js';

let data;
let newData;
let newFeatures;
let yAxis;
let moveDimensionData;

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
            selectDimensions();
            let selected_dimensions = getSelectedDimensions();
            newFeatures = setDimensions(selected_dimensions);
            generateDropdownForInvert();
            generateDropdownForMove();
            generateSVG(newData, newFeatures);
            downloadButton.style.visibility = "visible";
            moveDimensionData = newFeatures[newFeatures.length-1];
            moveRightButton.style.visibility = "visible";
            moveLeftButton.style.visibility = "visible";
        };

        reader.readAsText(file);
    }
}

function updateDimensions() {
    let selected_dimensions = getSelectedDimensions();
    let new_selected_dimensions = setDimensions(selected_dimensions);
    generateSVG(newData, new_selected_dimensions);
}

function getSelectedDimensions() {
    return Array.from(document.getElementById("selectDim").options)
        .filter(option => option.selected).map(option => option.value);
}

function selectDimensions() {

    let dimensions = newData["columns"];

    document.getElementById('showDimensionHeader').style.visibility = "visible";
    const container = document.getElementById('showDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.multiple = true;
    dropdown.id = "selectDim";
    dropdown.addEventListener('change', updateDimensions);

    dimensions.forEach(function(dimension) {
        let option = document.createElement("option");
        option.textContent = dimension;
        option.value = dimension;
        option.selected = true;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function generateDropdownForInvert() {
    let dataset = prepareData(newData, newFeatures);

    let parcoords = {
        xScales : setupXScales(newFeatures.length * 80, 80, dataset[0]),
        yScales : setupYScales(400, 80, dataset[0], dataset[1]),
        dragging : {},
        newFeatures : newFeatures,
        features : dataset[0],
        newDataset : dataset[1],
        datasetForBrushing : dataset[1],
    }
    yAxis = setupYAxis(parcoords.features, parcoords.yScales, parcoords.newDataset);

    let dimensions = newData["columns"];

    document.getElementById('invertDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('invertDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => invertD(dropdown.value, newFeatures, parcoords, yAxis);

    dimensions.forEach(function(dimension) {
        let option = document.createElement("option");
        option.textContent = dimension;
        option.value = dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function generateDropdownForMove() {
    let dimensions = newData["columns"];

    document.getElementById('moveDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('moveDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => {
        moveDimensionData = dropdown.value;
        let index = newFeatures.indexOf(moveDimensionData);
        if (index == 0) {
            document.getElementById("moveRight").disabled = true;
        }
        else {
            document.getElementById("moveRight").disabled = false;
        }

        if (index == newFeatures.length-1) {
            document.getElementById("moveLeft").disabled = true;
        }
        else {
            document.getElementById("moveLeft").disabled = false;
        }
    }

    dimensions.forEach(function(dimension) {
        let option = document.createElement("option");
        option.textContent = dimension;
        option.value = dimension;
        dropdown.appendChild(option);
    })
    container.appendChild(dropdown);
}

function moveDimensionLeft() {
    move(moveDimensionData, 'left', newData, newFeatures);
}

function moveDimensionRight() {
    move(moveDimensionData, 'right', newData, newFeatures);
}

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invertDimensionContainer')
    const showContainer = document.getElementById('showDimensionContainer');
    const moveContainer = document.getElementById('moveDimensionContainer');

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
}

