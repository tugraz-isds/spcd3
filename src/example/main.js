import {loadCSV, generateSVG, invertD, setDimensions, prepareData, setupYScales, setupXScales, setupYAxis, saveAsSvg, move} from './lib/spcd3.js';

let data;
let newData;
let newFeatures;
let yAxis;
let parcoords;
let showDimensionData;
let showDimensionStatus = [];
let moveDimensionData;
let invertDimensionData;
let invertDimensionStatus = [];

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

let showButton = document.getElementById("showButton");
showButton.addEventListener("click", updateDimension, false);
showButton.style.visibility = "hidden";

let invertButton = document.getElementById("invertButton");
invertButton.addEventListener("click", invertDimension, false);
invertButton.style.visibility = "hidden";

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
            let selectedDimensions = getSelectedDimensions();
            newFeatures = setDimensions(selectedDimensions);
            showDimensionData = newFeatures[newFeatures.length-1];
            let dataset = prepareData(newData, newFeatures);
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
            setShowDimensionDataInit(parcoords.newFeatures);
            setInvertDimensionStatusInit(parcoords.newFeatures);
            generateDropdownForInvert();
            generateDropdownForMove();
            generateDropdownForFilter();
            generateSVG(newData, newFeatures);
            downloadButton.style.visibility = "visible";
            showButton.style.visibility = "visible";
            invertDimensionData = newFeatures[newFeatures.length-1];
            invertButton.style.visibility = "visible";
            moveDimensionData = newFeatures[newFeatures.length-1];
            moveRightButton.style.visibility = "visible";
            moveLeftButton.style.visibility = "visible";
        };

        reader.readAsText(file);
    }
}

function getSelectedDimensions() {
    var sel = document.getElementById("selectDim");
    var opts = sel.options;
    var array = new Array();
    for(let i = 0; i < opts.length; i++)
    {
        array.push(opts[i].value);
    }
    return array;
}

function setShowDimensionDataInit(newFeatures) {
    for (let i = 0; i < newFeatures.length; i++) {
        showDimensionStatus.push({key: newFeatures[i], status: "in"});
    }
}

function updateDimension() {
    let className = document.getElementById("sign");
    if(className.className == "sign in") {
        document.getElementById("sign").className = "sign out";
    }
    else {
        document.getElementById("sign").className = "sign in";
    }
    setShowDimensionStatus(showDimensionData);
    let selectedDimension = [];
    
    showDimensionStatus.forEach(function (item) {
        if (item.status == "in") {
            selectedDimension.push(item.key);
        }
    });
    generateSVG(newData, selectedDimension);
}

function setShowDimensionStatus(dimension) {
    const dataStatus = showDimensionStatus.find((obj) => obj.key == dimension);

    var new_status = {};
    if(dataStatus.status == "in") {
        new_status["status"] = "out";
    }
    else {
        new_status["status"] = "in";
    }
    Object.assign(dataStatus, new_status);
}

function getShowDimensionStatus(dimension) {
    const data = showDimensionStatus.find((obj) => obj.key == dimension);
    return data.status;
}

function generateDropdownForShow() {

    let dimensions = newData["columns"];

    document.getElementById('showDimensionHeader').style.visibility = "visible";
    const container = document.getElementById('showDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.id = "selectDim";
    dropdown.onchange = () => {
        showDimensionData = dropdown.value;
        let status = getShowDimensionStatus(showDimensionData);
        if (status == "in") {
            document.getElementById("sign").className = "sign in";
        }
        else {
            document.getElementById("sign").className = "sign out";
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

function setInvertDimensionStatusInit(newFeatures) {
    for (let i = 0; i < newFeatures.length; i++) {
        invertDimensionStatus.push({key: newFeatures[i], invert: "up"});
    }
}

function setInvertDimensionStatus(dimension) {
    const dimensionStatus = invertDimensionStatus.find((obj) => obj.key == dimension);
    
    var new_status = {};
    if(dimensionStatus.invert == "down") {
        new_status["invert"] = "up";
    }
    else {
        new_status["invert"] = "down";
    }
    Object.assign(dimensionStatus, new_status);
}

function getInvertDimensionStatus(dimension) {
    const status = invertDimensionStatus.find((obj) => obj.key == dimension);
    return status.invert;
}

function generateDropdownForInvert() {
    let dimensions = newData["columns"];

    document.getElementById('invertDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('invertDimensionContainer');

    const dropdown = document.createElement('select');
    dropdown.onchange = () => {
        invertDimensionData = dropdown.value;
        let status = getInvertDimensionStatus(invertDimensionData);
        if (status == "down") {
            document.getElementById("arrow").className = "arrow down";
        }
        else {
            document.getElementById("arrow").className = "arrow up";
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

function invertDimension() {
    invertD(invertDimensionData, newFeatures, parcoords, yAxis);
    let className = document.getElementById("arrow");
    if(className.className == "arrow down") {
        document.getElementById("arrow").className = "arrow up";
    }
    else {
        document.getElementById("arrow").className = "arrow down";
    }
    setInvertDimensionStatus(invertDimensionData);
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

function generateDropdownForFilter() {
    let dimensions = newData["columns"];

    document.getElementById('filterDimensionHeader').style.visibility = "visible";

    const container = document.getElementById('filterDimensionContainer');

    const dropdown = document.createElement('select');
    //dropdown.onchange = () => invertD(dropdown.value, newFeatures, parcoords, yAxis);

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

