var parcoords = new SteerableParcoords();
var data;

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
            parcoords.loadCSV(data);
            selectDimensions();
            generateInvertButtons();
            selected_dimensions = getSelectedDimensions();
            parcoords.setDimensions(selected_dimensions);
            parcoords.generateSVG();
        };

        reader.readAsText(file);
    }
}

function invertMaths()
{
    console.log("invert maths");
    parcoords.invert("Maths");
}

function updateDimensions()
{
    selected_dimensions = getSelectedDimensions();
    parcoords.setDimensions(selected_dimensions);
    parcoords.generateSVG();
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
    var data = parcoords.getData();
    var dimensions = data["columns"];

    document.getElementById('checkboxHeader').style.visibility = "visible";
    document.getElementById('line').style.visibility = "visible";
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
    var data = parcoords.getData()
    var dimensions = data["columns"];

    document.getElementById('invertContainerHeader').style.visibility = "visible";
    document.getElementById('line').style.visibility = "visible";

    const container = document.getElementById('invert_container');

    dimensions.forEach(function(dimension) {
        const button = document.createElement('input');
        button.type = 'button';
        button.name = 'dimension';
        button.value = dimension;
        button.className = 'dimension-button';
        button.onclick = () => parcoords.invert(dimension);
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

