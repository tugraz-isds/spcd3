import {
  loadCSV,
  drawChart,
  invert,
  saveAsSvg,
  moveByOne,
  getCurrentMinRange,
  getCurrentMaxRange,
  getDimensionPosition,
  setFilter,
  getFilter,
  getDimensionRange,
  getNumberOfDimensions,
  hide,
  show,
  getHiddenStatus,
  getMinValue,
  getMaxValue,
  getInversionStatus,
  setDimensionRange,
  getAllDimensionNames,
  getAllVisibleDimensionNames,
  getAllHiddenDimensionNames,
  getAllRecords,
  toggleSelection,
  isSelected,
  setDimensionRangeRounded,
  isDimensionCategorical,
  setSelectableWidth,
  getSelectableWith,
} from "pc-lib";

type ParsedData = ReturnType<typeof loadCSV>;

let data: string;
let newData: ParsedData;
let moveDimensionData = "";
let filterDimensionData = "";
let rangeDimensionData = "";

let studentData =
  "Name,Maths,English,PE,Art,History,IT,Biology,German\nAdrian,95,24,82,49,58,85,21,24\nAmelia,92,98,60,45,82,85,78,92\nBrooke,27,35,84,45,23,50,15,22\nChloe,78,9,83,66,80,63,29,12\nDylan,92,47,91,56,47,81,60,51\nEmily,67,3,98,77,25,100,50,34\nEvan,53,60,97,74,21,78,72,75\nFinn,42,73,65,52,43,61,82,85\nGia,50,81,85,80,43,46,73,91\nGrace,24,95,98,94,89,25,91,69\nHarper,69,9,97,77,56,94,38,2\nHayden,2,72,74,53,40,40,66,64\nIsabella,8,99,84,69,86,20,86,85\nJesse,63,39,93,84,30,71,86,19\nJordan,11,80,87,68,88,20,96,81\nKai,27,65,62,92,81,28,94,84\nKaitlyn,7,70,51,77,79,29,96,73\nLydia,75,49,98,55,68,67,91,87\nMark,51,70,87,40,97,94,60,95\nMonica,62,89,98,90,85,66,84,99\nNicole,70,8,84,64,26,70,12,8\nOswin,96,14,62,35,56,98,5,12\nPeter,98,10,71,41,55,66,38,29\nRenette,96,39,82,43,26,92,20,2\nRobert,78,32,98,55,56,81,46,29\nSasha,87,1,84,70,56,88,49,2\nSylvia,86,12,97,4,19,80,36,8\nThomas,76,47,99,34,48,92,30,38\nVictor,5,60,70,65,97,19,63,83\nZack,19,84,83,42,93,15,98,95";

window.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const targetId = target?.id ?? "";
  if (!targetId.includes("show")) {
    closeElements("options");
  }
  if (!targetId.includes("invert")) {
    closeElements("invertOptions");
  }
  if (!targetId.includes("move")) {
    closeElements("moveOptions");
  }
  if (!targetId.includes("filter")) {
    closeElements("filterOptions");
    const filterContainer = document.getElementById("filterContainer");
    if (filterContainer) {
      filterContainer.remove();
    }
  }
  if (!targetId.includes("range")) {
    closeElements("rangeOptions");
    const rangeContainer = document.getElementById("rangeContainer");
    if (rangeContainer) {
      rangeContainer.remove();
    }
  }
  if (!targetId.includes("sel")) {
    closeElements("options_r");
  }
});

function elementById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error("No element with id: ${id}");
  }
  return element;
}

document.addEventListener(
  "DOMContentLoaded",
  function () {
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
  },
  false,
);

let inputButton = elementById<HTMLElement>("input");
inputButton.addEventListener("click", openFileDialog, false);

let inputFile = elementById<HTMLInputElement>("fileInput");
inputFile.addEventListener("change", handleFileSelect, false);
inputFile.addEventListener("cancel", () => {
  elementById<HTMLElement>("input").textContent = "Upload File...";
});
inputFile.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLInputElement | null;
  if (target) {
    target.value = "";
  }
});

let downloadButton = elementById<HTMLButtonElement>("download");
downloadButton.addEventListener("click", () => {
  saveAsSvg();
});
downloadButton.style.visibility = "hidden";

let resetRangesButton = elementById<HTMLButtonElement>("resetRanges");
resetRangesButton.addEventListener("click", resetToOriginalRange, false);
resetRangesButton.style.visibility = "hidden";

let resetRoundedRangesButton =
  elementById<HTMLButtonElement>("resetRoundedRanges");
resetRoundedRangesButton.addEventListener("click", resetToRoundedRange, false);
resetRoundedRangesButton.style.visibility = "hidden";

let resetAllButton = elementById<HTMLButtonElement>("resetAll");
resetAllButton.addEventListener("click", resetAll, false);
resetAllButton.style.visibility = "hidden";

let sensitivityButton = elementById<HTMLButtonElement>(
  "setSelectionSensitivity",
);
sensitivityButton.addEventListener(
  "click",
  generateModalForSetSensitivity,
  false,
);
sensitivityButton.style.visibility = "hidden";

function openFileDialog() {
  elementById<HTMLInputElement>("fileInput").click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e: ProgressEvent<FileReader>) {
      clearPlot();
      const result = e.target?.result;
      if (typeof result !== "string") return;
      data = result;
      newData = loadCSV(data);
      drawChart(newData);

      showButtons();

      generateDropdownForShow();
      generateDropdownForInvert();
      generateDropdownForMove();
      generateDropdownForFilter();
      generateDropdownForRange();
      generateDropdownForSelectRecords();

    };
    reader.readAsText(file);
  }
}

function showButtons() {
  downloadButton.style.visibility = "visible";
  resetRangesButton.style.visibility = "visible";
  resetRoundedRangesButton.style.visibility = "visible";
  resetAllButton.style.visibility = "visible";
  sensitivityButton.style.visibility = "visible";
}

function updateDimensions(dimension: string) {
  if (getHiddenStatus(dimension) == "shown") {
    hide(dimension);
  } else {
    show(dimension);
  }
}

function closeElements(id: string) {
  const options = document.getElementById(id);
  if (options) {
    options.style.display = "none";
  }
}

function showOptions(id: string, buttonId: string) {
  const options = document.getElementById(id);
  if (!options) return;

  options.style.display == "none"
    ? (options.style.display = "block")
    : (options.style.display = "none");

  if (buttonId == "moveButton") {
    disableLeftAndRightButton();
  }

  const dimensions = getAllDimensionNames();

  dimensions.forEach((dimension: string) => {
    if (getHiddenStatus(dimension) === "hidden") {
      const el = document.getElementById(
        `show_${dimension}`,
      ) as HTMLInputElement | null;
      if (el) {
        el.checked = false;
      }
    }
  });
}

function showOptionsForRecords(id: string, buttonId: string) {
  let checkboxes = document.getElementById(id);
  if (!checkboxes) return;

  checkboxes.style.display == "none"
    ? (checkboxes.style.display = "block")
    : (checkboxes.style.display = "none");

  let button = document.getElementById(buttonId);
  if (!button) return;

  checkboxes.style.display == "block"
    ? (button.style.backgroundColor = "white")
    : (button.style.backgroundColor = "white");
  checkboxes.style.display == "block"
    ? (button.style.color = "black")
    : (button.style.color = "black");

  let records = getAllRecords();
  records.forEach(function (record: string) {
    let selected = isSelected(record);
    const checkbox = document.getElementById(
      `sel_${record}`,
    ) as HTMLInputElement | null;

    if (checkbox) {
      checkbox.checked = selected;
    }
  });
}

function generateDropdownForShow() {
  const container = elementById<HTMLElement>("hideDimensionContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "showButton";
  selectButton.className = "ddButton";

  let textElement = document.createElement("span");
  textElement.innerHTML =
    'Show Dimensions <img src="./svg/dropdown-symbol.svg" id="show"/>';
  textElement.id = "showText";
  textElement.className = "labels";
  selectButton.appendChild(textElement);

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "options";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "options");

  let dimensions = getAllDimensionNames();
  let copyDimensions = dimensions.slice();
  let reverseDimensions = copyDimensions.reverse();

  if (reverseDimensions.length > 10) {
    dimensionContainer.style.height = "12.5rem";
  }

  dimensionContainer.addEventListener("change", (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      updateDimensions(target.value);
    }
  });

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    let test1 = getAllVisibleDimensionNames();
    let test2 = getAllHiddenDimensionNames();
    var result = test1.concat(test2);
    result.forEach(function (dimension) {
      let ddElement = document.createElement("div");
      ddElement.className = "dropdownLabel";
      ddElement.id = "show";
      let input = document.createElement("input");
      input.className = "inputFields";
      input.type = "checkbox";
      input.id = "show_" + dimension;
      input.value = dimension;
      input.name = "dimension";
      input.checked = true;
      let textLabel = document.createElement("label");
      textLabel.textContent = dimension;
      textLabel.id = "showLabel";
      ddElement.appendChild(input);
      ddElement.appendChild(textLabel);
      dimensionContainer.appendChild(ddElement);
    });
    showOptions("options", "showButton");
    calcDDBehaviour(dimensionContainer, selectButton);
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function generateDropdownForInvert() {
  const container = elementById<HTMLElement>("invDimensionContainer");
  container.style.position = "relative";

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "invertOptions";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "invertOptions");

  const dimensions = getAllVisibleDimensionNames();
  if (dimensions.length > 10) {
    dimensionContainer.style.height = "12.5rem";
  }

  let selectButton = document.createElement("button");
  selectButton.id = "invertButton";
  selectButton.className = "ddButton";

  let textElement = document.createElement("span");
  textElement.id = "invertText";
  textElement.className = "labels";
  textElement.innerHTML =
    'Invert Dimensions <img src="./svg/dropdown-symbol.svg" id="invert"/>';
  selectButton.appendChild(textElement);

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      let ddElement = document.createElement("div");
      ddElement.className = "dropdownLabel";
      ddElement.id = "invertElement";
      let inputButton = document.createElement("button");
      inputButton.className = "inputButton";
      inputButton.id = "invert_" + dimension;
      if (getInversionStatus(dimension) == "ascending") {
        inputButton.innerHTML =
          '<img src="./svg/arrow-up.svg" id="invertArrow"/>';
      } else {
        inputButton.innerHTML =
          '<img src="./svg/arrow-down.svg" id="invertArrow"/>';
      }

      inputButton.addEventListener("click", () => {
        const value = inputButton.id.replace("invert_", "");
        if (value != undefined) {
          invert(value);
          if (getInversionStatus(value) == "ascending") {
            inputButton.innerHTML =
              '<img src="./svg/arrow-up.svg" id="invertArrow"/>';
          } else {
            inputButton.innerHTML =
              '<img src="./svg/arrow-down.svg" id="invertArrow"/>';
          }
        }
      });

      let textLabel = document.createElement("label");
      textLabel.className = "textLabel";
      textLabel.textContent = dimension;
      textLabel.id = "invertLabel";
      ddElement.appendChild(inputButton);
      ddElement.appendChild(textLabel);
      dimensionContainer.appendChild(ddElement);
    });

    showOptions("invertOptions", "invertButton");
    calcDDBehaviour(dimensionContainer, selectButton);
    for (let i = 0; i < dimensions.length; i++) {
      document.addEventListener("DOMContentLoaded", function () {
        if (getInversionStatus(dimensions[i]) == "ascending") {
          inputButton.innerHTML =
            '<img src="./svg/arrow-up.svg" id="invertArrow"/>';
        } else {
          inputButton.innerHTML =
            '<img src="./svg/arrow-down.svg" id="invertArrow"/>';
        }
      });
    }
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function generateDropdownForMove() {
  const container = elementById<HTMLElement>("moDimensionContainer");
  container.style.position = "relative";

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "moveOptions";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "moveOptions");

  let selectButton = document.createElement("button");
  selectButton.id = "moveButton";
  selectButton.className = "ddButton";

  let textElement = document.createElement("span");
  textElement.id = "moveText";
  textElement.className = "labels";
  textElement.innerHTML =
    'Move Dimensions <img src="./svg/dropdown-symbol.svg" id="move"/>';
  selectButton.appendChild(textElement);

  const dimensions = getAllVisibleDimensionNames();
  if (dimensions.length > 10) {
    dimensionContainer.style.height = "12.5rem";
  }

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      let dimensionLabel = document.createElement("div");
      dimensionLabel.className = "dropdownLabel";
      dimensionLabel.id = "move";
      let arrowLeft = document.createElement("button");
      arrowLeft.className = "inputButtonMoveLeft";
      arrowLeft.id = "moveleft_" + dimension;
      arrowLeft.innerHTML = '<img src="./svg/arrow-left.svg" id="moveArrow"/>';
      arrowLeft.addEventListener("click", () => {
        const value = arrowLeft.id.replace("moveleft_", "");
        if (value != undefined) {
          moveDimensionData = value;
          moveDimensionLeft();
          disableLeftAndRightButton();
        }
      });
      let arrowRight = document.createElement("button");
      arrowRight.className = "inputButtonMoveRight";
      arrowRight.id = "moveright_" + dimension;
      arrowRight.innerHTML =
        '<img src="./svg/arrow-right.svg" id="moveArrow"/>';
      arrowRight.style.paddingRight = "0.5rem";
      arrowRight.addEventListener("click", () => {
        const value = arrowRight.id.replace("moveright_", "");
        if (value != undefined) {
          moveDimensionData = value;
          moveDimensionRight();
          disableLeftAndRightButton();
        }
      });
      let textLabel = document.createElement("label");
      textLabel.textContent = dimension;
      textLabel.id = "moveLabel";
      textLabel.className = "textLabel";
      dimensionLabel.appendChild(arrowLeft);
      dimensionLabel.appendChild(arrowRight);
      dimensionLabel.appendChild(textLabel);
      dimensionContainer.appendChild(dimensionLabel);
    });
    showOptions("moveOptions", "moveButton");
    calcDDBehaviour(dimensionContainer, selectButton);
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function calcDDBehaviour(
  dimensionContainer: HTMLElement,
  selectButton: HTMLButtonElement,
) {
  const dropdownHeight = dimensionContainer.clientHeight;
  const windowHeight = window.innerHeight;
  const dropdownTop = selectButton.getBoundingClientRect().top;

  if (windowHeight - dropdownTop < dropdownHeight) {
    dimensionContainer.style.bottom = "100%";
    dimensionContainer.style.top = "auto";
  } else {
    dimensionContainer.style.bottom = "auto";
    dimensionContainer.style.top = "100%";
  }
}

function moveDimensionLeft() {
  moveByOne(moveDimensionData, "left");
  disableLeftAndRightButton();
}

function moveDimensionRight() {
  moveByOne(moveDimensionData, "right");
  disableLeftAndRightButton();
}

function disableLeftAndRightButton() {
  const dimensions = getAllVisibleDimensionNames();
  for (let i = 0; i < dimensions.length; i++) {
    const position = getDimensionPosition(dimensions[i]);
    const numberOfDimensions = getNumberOfDimensions();
    const moveLeft = document.getElementById(
      `moveleft_${dimensions[i]}`,
    ) as HTMLButtonElement | null;

    if (moveLeft) {
      if (position === numberOfDimensions - 1 || position === -1) {
        moveLeft.disabled = true;
        moveLeft.innerHTML =
          '<img src="./svg/arrow-left-disabled.svg" id="moveArrow"/>';
      } else {
        moveLeft.disabled = false;
        moveLeft.innerHTML = '<img src="./svg/arrow-left.svg" id="moveArrow"/>';
      }
    }

    const moveRight = document.getElementById(
      `moveright_${dimensions[i]}`,
    ) as HTMLButtonElement | null;

    if (moveRight) {
      if (position === 0 || position === -1) {
        moveRight.disabled = true;
        moveRight.innerHTML =
          '<img src="./svg/arrow-right-disabled.svg" id="moveArrow"/>';
      } else {
        moveRight.disabled = false;
        moveRight.innerHTML =
          '<img src="./svg/arrow-right.svg" id="moveArrow"/>';
      }
    }
  }
}

function generateDropdownForFilter() {
  const container = elementById<HTMLElement>("filtDimensionContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "filterButton";
  selectButton.className = "ddButton";

  let textElement = document.createElement("span");
  textElement.id = "filterText";
  textElement.className = "labels";
  textElement.innerHTML =
    'Set Filter <img src="./svg/dropdown-symbol.svg" id="filter"/>';
  selectButton.appendChild(textElement);

  const dimensions = getAllVisibleDimensionNames();

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      if (!isDimensionCategorical(dimension)) {
        let dimensionLabel = document.createElement("label");
        dimensionLabel.className = "dropdownLabel";
        dimensionLabel.id = "filterLabel";
        let filterInput = document.createElement("input");
        filterInput.className = "inputText";
        filterInput.type = "image";
        filterInput.name = "dimension";
        filterInput.value = dimension;
        filterInput.src = "./svg/dropdown-symbol.svg";
        filterInput.id = "filter_" + dimension;
        filterInput.style.height = "0rem";
        dimensionLabel.appendChild(filterInput);
        dimensionLabel.appendChild(document.createTextNode(dimension));
        dimensionContainer.appendChild(dimensionLabel);
      }
    });
    showOptions("filterOptions", "filterButton");
    calcDDBehaviour(dimensionContainer, selectButton);
  });

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "filterOptions";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "filterOptions");

  if (dimensions.length > 15) {
    dimensionContainer.style.height = "12.5rem";
  }

  dimensionContainer.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLInputElement | null;
    if (target?.value != undefined) {
      filterDimensionData = target.value;
      generateModuleForSetFilter();
      dimensionContainer.style.display == "none"
        ? (dimensionContainer.style.display = "block")
        : (dimensionContainer.style.display = "none");
    }
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function generateModuleForSetFilter() {
  const section = elementById<HTMLElement>("bottom-controls");

  const overlay = document.createElement("div");
  overlay.id = "filterOverlay";
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.id = "filterContainer";
  modal.className = "modal";

  modal.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  const title = document.createElement("div");
  title.className = "modal-title";
  const newText =
    filterDimensionData.length > 25
      ? filterDimensionData.substr(0, 25) + "..."
      : filterDimensionData;
  title.textContent = "Set Filter for";
  title.style.whiteSpace = "pre";

  const closeButton = document.createElement("span");
  closeButton.id = "filterCloseButton";
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  const header = document.createElement("div");
  header.className = "modal-title";
  header.textContent = newText;

  modal.appendChild(title);
  modal.appendChild(closeButton);
  modal.appendChild(header);

  const content = document.createElement("div");
  content.className = "modal-content";

  const notes = document.createElement("div");
  notes.className = "modal-notes";
  notes.textContent = "Enter min/max values for the filter.";

  modal.appendChild(notes);

  const currentFilters = getFilter(filterDimensionData);

  const row = document.createElement("div");
  row.className = "modal-row";

  const labelMin = document.createElement("label");
  labelMin.className = "modal-label";
  labelMin.setAttribute("for", "filterMinValue");
  labelMin.textContent = "Min";

  const inputMin = document.createElement("input");
  inputMin.id = "filterMinValue";
  inputMin.type = "number";
  inputMin.lang = "en";
  inputMin.className = "modal-input";
  inputMin.value = Number(currentFilters[0]).toFixed(0);

  const labelMax = document.createElement("label");
  labelMax.className = "modal-label";
  labelMax.setAttribute("for", "filterMaxValue");
  labelMax.textContent = "Max";

  const inputMax = document.createElement("input");
  inputMax.id = "filterMaxValue";
  inputMax.type = "number";
  inputMax.lang = "en";
  inputMax.className = "modal-input";
  inputMax.value = Number(currentFilters[1]).toFixed(0);

  const saveButton = document.createElement("button");
  saveButton.id = "onrangeButton";
  saveButton.className = "save-button";
  saveButton.type = "button";
  saveButton.textContent = "Save";

  row.appendChild(labelMin);
  row.appendChild(inputMin);
  row.appendChild(labelMax);
  row.appendChild(inputMax);
  row.appendChild(saveButton);

  const error = document.createElement("div");
  error.id = "filterError";
  error.className = "modal-errormessage";

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveButton.click();
    }
  };
  inputMin.addEventListener("keydown", onEnter);
  inputMax.addEventListener("keydown", onEnter);

  const showError = (msg: string) => {
    error.textContent = msg;
    error.style.display = "block";
  };

  const hideError = () => {
    error.textContent = "";
    error.style.display = "none";
  };

  const close = () => {
    overlay.remove();
    modal.remove();
  };

  content.appendChild(row);
  content.appendChild(error);

  modal.appendChild(content);

  section.appendChild(overlay);
  section.appendChild(modal);

  closeButton.onclick = close;
  overlay.onclick = close;

  overlay.style.display = "block";
  modal.style.display = "block";

  saveButton.onclick = () => {
    hideError();

    let min = Number(inputMin.value);
    let max = Number(inputMax.value);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      showError("Attention: Values are not numbers!");
      return;
    }

    const limit = getDimensionRange(filterDimensionData);
    const inversionstatus = getInversionStatus(filterDimensionData);

    const topLimit = Number(limit[1]);
    const bottomLimit = Number(limit[0]);

    if (inversionstatus === "descending") {
      if (min < topLimit) {
        min = topLimit;
        showError(
          `Min value is smaller than ${getMinValue(filterDimensionData)}.`,
        );
      }
      if (max > bottomLimit) {
        max = bottomLimit;
        showError(
          `Max value is bigger than ${getMaxValue(filterDimensionData)}.`,
        );
      }
    } else {
      if (min < bottomLimit) {
        min = bottomLimit;
        showError(
          `Min value is smaller than ${getMinValue(filterDimensionData)}.`,
        );
      }
      if (max > topLimit) {
        max = topLimit;
        showError(
          `Max value is bigger than ${getMaxValue(filterDimensionData)}.`,
        );
      }
    }

    inversionstatus === "descending"
      ? setFilter(filterDimensionData, min, max)
      : setFilter(filterDimensionData, max, min);

    close();
  };
}

function generateDropdownForRange() {
  const container = elementById<HTMLElement>("ranDimensionContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "rangeButton";
  selectButton.className = "ddButton";

  let textElement = document.createElement("span");
  textElement.id = "rangeText";
  textElement.className = "labels";
  textElement.innerHTML =
    'Set Range <img src="./svg/dropdown-symbol.svg" id="range"/>';
  selectButton.appendChild(textElement);

  const dimensions = getAllVisibleDimensionNames();

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      if (!isDimensionCategorical(dimension)) {
        let dimensionLabel = document.createElement("label");
        dimensionLabel.className = "dropdownLabel";
        dimensionLabel.id = "rangeLabel";
        let rangeInput = document.createElement("input");
        rangeInput.className = "inputText";
        rangeInput.type = "image";
        rangeInput.name = "dimension";
        rangeInput.value = dimension;
        rangeInput.src = "./svg/dropdown-symbol.svg";
        rangeInput.id = "range_" + dimension;
        rangeInput.style.height = "0rem";
        dimensionLabel.appendChild(rangeInput);
        dimensionLabel.appendChild(document.createTextNode(dimension));
        dimensionContainer.appendChild(dimensionLabel);
      }
    });
    showOptions("rangeOptions", "rangeButton");
    calcDDBehaviour(dimensionContainer, selectButton);
  });

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "rangeOptions";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "rangeOptions");

  if (dimensions.length > 15) {
    dimensionContainer.style.height = "12.5rem";
  }

  dimensionContainer.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLInputElement | null;
    if (target?.value != undefined) {
      rangeDimensionData = target.value;
      generateModuleForRangeSettings();
      dimensionContainer.style.display == "none"
        ? (dimensionContainer.style.display = "block")
        : (dimensionContainer.style.display = "none");
    }
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function generateModuleForRangeSettings() {
  const section = elementById<HTMLElement>("bottom-controls");

  const overlay = document.createElement("div");
  overlay.id = "rangeOverlay";
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.id = "rangeContainer";
  modal.className = "modal";

  modal.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  const title = document.createElement("div");
  title.className = "modal-title";
  const newText =
    rangeDimensionData.length > 25
      ? rangeDimensionData.substr(0, 25) + "..."
      : rangeDimensionData;
  title.textContent = "Set Range for";
  title.style.whiteSpace = "pre";

  const closeButton = document.createElement("span");
  closeButton.id = "rangeCloseButton";
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  const header = document.createElement("div");
  header.className = "modal-title";
  header.textContent = newText;

  modal.appendChild(title);
  modal.appendChild(closeButton);
  modal.appendChild(header);

  const content = document.createElement("div");
  content.className = "modal-content";

  const resultMin =
    getCurrentMinRange(rangeDimensionData) -
      Math.floor(getCurrentMinRange(rangeDimensionData)) !==
    0;
  const resultMax =
    getCurrentMaxRange(rangeDimensionData) -
      Math.floor(getCurrentMaxRange(rangeDimensionData)) !==
    0;

  let minValue = String(getCurrentMinRange(rangeDimensionData));
  let maxValue = String(getCurrentMaxRange(rangeDimensionData));

  if (resultMin && !resultMax) {
    const count = minValue.split(".")[1].length;
    maxValue = getCurrentMaxRange(rangeDimensionData).toFixed(count);
  } else if (!resultMin && resultMax) {
    const count = maxValue.split(".")[1].length;
    minValue = getCurrentMinRange(rangeDimensionData).toFixed(count);
  }

  const notes = document.createElement("div");
  notes.className = "modal-notes";
  notes.textContent =
    "Range values must be below the minimum and above the maximum data value.";

  const notes1 = document.createElement("div");
  notes1.className = "modal-notes";
  notes1.textContent = `The current range of ${rangeDimensionData} is between ${minValue} and ${maxValue}.`;

  const notes2 = document.createElement("div");
  notes2.className = "modal-notes";
  notes2.textContent = `The original range of ${rangeDimensionData} is between ${getMinValue(rangeDimensionData)} and ${getMaxValue(rangeDimensionData)}.`;

  modal.appendChild(notes);
  modal.appendChild(notes1);
  modal.appendChild(notes2);

  const row = document.createElement("div");

  const labelMin = document.createElement("label");
  labelMin.className = "modal-label";
  labelMin.setAttribute("for", "rangeMinValue");
  labelMin.textContent = "Min";

  const inputMin = document.createElement("input");
  inputMin.id = "rangeMinValue";
  inputMin.type = "number";
  inputMin.lang = "en";
  inputMin.className = "modal-input";
  inputMin.value = minValue;

  const labelMax = document.createElement("label");
  labelMax.className = "modal-label";
  labelMax.setAttribute("for", "rangeMaxValue");
  labelMax.textContent = "Max";

  const inputMax = document.createElement("input");
  inputMax.id = "rangeMaxValue";
  inputMax.type = "number";
  inputMax.lang = "en";
  inputMax.className = "modal-input";
  inputMax.value = maxValue;

  const saveButton = document.createElement("button");
  saveButton.id = "onrangeButton";
  saveButton.className = "save-button";
  saveButton.type = "button";
  saveButton.textContent = "Save";

  row.appendChild(labelMin);
  row.appendChild(inputMin);
  row.appendChild(labelMax);
  row.appendChild(inputMax);
  row.appendChild(saveButton);

  const error = document.createElement("div");
  error.id = "rangeError";
  error.className = "modal-errormessage";

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveButton.click();
    }
  };

  inputMin.addEventListener("keydown", onEnter);
  inputMax.addEventListener("keydown", onEnter);

  content.appendChild(row);
  content.appendChild(error);

  modal.appendChild(content);

  section.appendChild(overlay);
  section.appendChild(modal);

  const close = () => {
    overlay.remove();
    modal.remove();
  };

  closeButton.onclick = close;
  overlay.onclick = close;

  overlay.style.display = "block";
  modal.style.display = "block";

  saveButton.onclick = () => {
    const min = Number(inputMin.value);
    const max = Number(inputMax.value);

    const inversionStatus = getInversionStatus(rangeDimensionData);
    let isOk = true;

    if (isNaN(min) || isNaN(max)) {
      alert("Attention: Values are not numbers!");
      isOk = false;
    }

    if (isOk) {
      if (inversionStatus === "descending") {
        if (
          max < getMinValue(rangeDimensionData) ||
          min > getMaxValue(rangeDimensionData)
        ) {
          isOk = false;
        }
      } else {
        if (
          min > getMinValue(rangeDimensionData) ||
          max < getMaxValue(rangeDimensionData)
        ) {
          isOk = false;
        }
      }
    }

    if (!isOk) {
      error.textContent = `The range has to be bigger than ${minValue} and ${maxValue}.`;
      error.style.display = "block";
      return;
    }

    error.style.display = "none";
    setDimensionRange(rangeDimensionData, min, max);
    close();
  };
}

function resetToOriginalRange() {
  const dimensions = getAllVisibleDimensionNames();
  dimensions.forEach(function (dimension) {
    if (!isNaN(getMinValue(dimension))) {
      let min = getMinValue(dimension);
      let max = getMaxValue(dimension);
      setDimensionRange(dimension, min, max);
    }
  });
}

function resetToRoundedRange() {
  const dimensions = getAllVisibleDimensionNames();
  dimensions.forEach(function (dimension) {
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

function generateModalForSetSensitivity() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay-test";

  const modal = document.createElement("div");
  modal.className = "modal-content-test";

  const closeButton = document.createElement("span");
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  const close = () => {
    document.removeEventListener("keydown", onKeyDown);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", onKeyDown);

  const wrapper = document.createElement("div");
  wrapper.className = "hitbox-control";

  const labelRow = document.createElement("div");
  labelRow.className = "hitbox-label-row";

  const label = document.createElement("div");
  label.className = "hitbox-label";
  label.textContent = "Selection Sensitivity";

  const valueDisplay = document.createElement("div");
  valueDisplay.className = "hitbox-value";

  labelRow.appendChild(label);
  labelRow.appendChild(valueDisplay);

  const sliderRow = document.createElement("div");
  sliderRow.className = "hitbox-slider-row";

  const slider = document.createElement("input");
  slider.className = "hitbox-slider";
  slider.type = "range";
  slider.min = "0";
  slider.max = "1";
  slider.step = "0.1";

  const minLabel = document.createElement("span");
  minLabel.className = "hitbox-min";
  minLabel.textContent = slider.min;

  const maxLabel = document.createElement("span");
  maxLabel.className = "hitbox-max";
  maxLabel.textContent = slider.max;

  const current = getSelectableWith();

  slider.value = String(current.replace("rem", ""));
  valueDisplay.textContent = current;

  slider.addEventListener("input", (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    const v = Math.round(+(target?.value ?? slider.value) * 100) / 100;
    valueDisplay.textContent = v + "rem";
  });

  const infoMessage = document.createElement("div");
  infoMessage.textContent =
    "Sets the sensitivity of polylines for hover and select.";
  infoMessage.className = "info-text";

  const button = document.createElement("button");
  button.className = "apply-button";
  button.textContent = "Save";
  button.addEventListener("click", () => {
    setSelectableWidth(slider.value + "rem");
    overlay.remove();
  });

  sliderRow.appendChild(minLabel);
  sliderRow.appendChild(slider);
  sliderRow.appendChild(maxLabel);

  wrapper.appendChild(labelRow);
  wrapper.appendChild(sliderRow);
  wrapper.appendChild(infoMessage);
  wrapper.appendChild(button);

  modal.appendChild(closeButton);
  modal.appendChild(wrapper);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function generateDropdownForSelectRecords() {
  let records = getAllRecords();

  const container = elementById<HTMLElement>("selRecordsContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "selectButtonR";
  selectButton.className = "ddButton";
  selectButton.addEventListener("click", () => {
    showOptionsForRecords("options_r", "selectButtonR");
    calcDDBehaviour(recordsContainer, selectButton);
  });

  let textElement = document.createElement("span");
  textElement.id = "selectText";
  textElement.className = "labels";
  textElement.innerHTML =
    'Select Records <img src="./svg/dropdown-symbol.svg" id="select"/>';
  selectButton.appendChild(textElement);

  let recordsContainer = document.createElement("div");
  recordsContainer.id = "options_r";
  recordsContainer.className = "ddList";
  recordsContainer.style.display = "none";
  recordsContainer.setAttribute("name", "options_r");

  if (records.length > 10) {
    recordsContainer.style.height = "12.5rem";
  }

  recordsContainer.addEventListener("change", (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    var line = document.getElementsByClassName(target.value);
    const element = line[0];
    const computedStyle = window.getComputedStyle(element);
    const strokeColor = computedStyle.stroke;
    if (strokeColor !== "rgb(211, 211, 211)") {
      toggleSelection(target.value);
    }
  });

  records.forEach(function (record) {
    let label = document.createElement("div");
    label.className = "dropdownLabel";
    label.id = "selectLabel";
    let input = document.createElement("input");
    input.type = "checkbox";
    input.className = "inputFields";
    input.id = "sel_" + record;
    input.value = record;
    input.name = "record";
    input.checked = false;
    let textLabel = document.createElement("label");
    textLabel.textContent = record;
    textLabel.id = "selectLabel";
    label.appendChild(input);
    label.appendChild(textLabel);
    recordsContainer.appendChild(label);
  });

  container.appendChild(selectButton);
  container.appendChild(recordsContainer);
}

function clearPlot() {
  const parentElement = elementById<HTMLElement>("spcd3-parallelcoords");
  const invertContainer = elementById<HTMLElement>("invDimensionContainer");
  const hideContainer = elementById<HTMLElement>("hideDimensionContainer");
  const moveContainer = elementById<HTMLElement>("moDimensionContainer");
  const filterDimensionContainer = elementById<HTMLElement>(
    "filtDimensionContainer",
  );
  const rangeDimensionContainer = elementById<HTMLElement>(
    "ranDimensionContainer",
  );
  const selectRecordsContainer = elementById<HTMLElement>(
    "selRecordsContainer",
  );

  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }
  while (invertContainer.firstChild) {
    invertContainer.removeChild(invertContainer.firstChild);
  }
  while (hideContainer.firstChild) {
    hideContainer.removeChild(hideContainer.firstChild);
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
