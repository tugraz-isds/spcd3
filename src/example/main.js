import {loadCSV, generateSVG, invertD, setDimensions, prepareData, setupYScales, setupXScales, setupYAxis} from './lib/esm/spcd3.js';

let data;
let newData;
let newFeatures;
let yAxis;

let inputButton = document.getElementById("input");
inputButton.addEventListener("click", openFileDialog, false);
let inputFile = document.getElementById('fileInput');
inputFile.addEventListener("change", handleFileSelect, false);
inputFile.addEventListener("click", (event) => {
    event.target.value = null;
})

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
            generateSVG(newData, newFeatures);
        };

        reader.readAsText(file);
    }
}

function updateDimensions()
{
    let selected_dimensions = getSelectedDimensions();
    let new_selected_dimensions = setDimensions(selected_dimensions);
    generateSVG(newData, new_selected_dimensions);
}

function getSelectedDimensions()
{
    return Array.from(document.getElementById("selectDim").options)
        .filter(option => option.selected).map(option => option.value);
}

function selectDimensions(){

    let dimensions = newData["columns"];

    document.getElementById('checkboxHeader').style.visibility = "visible";
    const container = document.getElementById('checkboxContainer');

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

function generateDropdownForInvert()
{
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

    document.getElementById('invertContainerHeader').style.visibility = "visible";

    const container = document.getElementById('invert_container');

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

function clearPlot() {
    const parentElement = document.getElementById('parallelcoords');
    const invertContainer = document.getElementById('invert_container')
    const container = document.getElementById('checkboxContainer');

    while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }
    while (invertContainer.firstChild) {
        invertContainer.removeChild(invertContainer.firstChild);
    }
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

