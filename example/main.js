import {loadCSV, generateSVG, invert, setDimensions} from './lib/esm/spcd3.js';

var data;
var newData;
var newFeatures;

var inputButton = document.getElementById("input");
inputButton.addEventListener("click", openFileDialog, false);
var inputFile = document.getElementById('fileInput');
inputFile.addEventListener("change", handleFileSelect, event);

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
            generateInvertButtons();
            var selected_dimensions = getSelectedDimensions();
            newFeatures = setDimensions(selected_dimensions);
            generateSVG(newData, newFeatures);
        };

        reader.readAsText(file);
    }
}

function invertMaths()
{
    console.log("invert maths");
    invert("Maths");
}

function updateDimensions()
{
    var selected_dimensions = getSelectedDimensions();
    setDimensions(selected_dimensions);
    generateSVG();
    console.log("update dimensions");
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

function selectDimensions(){
    //var data = getData();
    var dimensions = newData["columns"];

    document.getElementById('checkboxHeader').style.visibility = "visible";
    const container = document.getElementById('checkboxContainer');

    dimensions.forEach(function(dimension) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'dimension';
        checkbox.value = dimension;
        checkbox.checked = true;

        checkbox.addEventListener('change', updateDimensions);

        const label = document.createElement('label');
        label.appendChild(document.createTextNode(dimension));

        container.appendChild(checkbox);
        container.appendChild(label);
    });
}

function generateInvertButtons()
{
    //var data = getData()
    var dimensions = newData["columns"];

    document.getElementById('invertContainerHeader').style.visibility = "visible";

    const container = document.getElementById('invert_container');

    dimensions.forEach(function(dimension) {
        const button = document.createElement('input');
        button.type = 'button';
        button.name = 'dimension';
        button.value = dimension;
        button.className = 'input-button';
        button.onclick = () => invert(dimension);
        container.appendChild(button);
    });
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

