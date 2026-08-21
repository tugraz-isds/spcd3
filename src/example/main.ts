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
  setDimensionSpacing,
  getExampleUiSettings,
  setExampleUiSettings,
} from "spcd3";

type ParsedData = ReturnType<typeof loadCSV>;

let data: string;
let newData: ParsedData;
let moveDimensionData = "";
let filterDimensionData = "";
let rangeDimensionData = "";
let multiRangeDimensionsData: string[] = [];

let studentData =
  "Name,Maths,English,PE,Art,History,IT,Biology,German\nAdrian,95,24,82,49,58,85,21,24\nAmelia,92,98,60,45,82,85,78,92\nBrooke,27,35,84,45,23,50,15,22\nChloe,78,9,83,66,80,63,29,12\nDylan,92,47,91,56,47,81,60,51\nEmily,67,3,98,77,25,100,50,34\nEvan,53,60,97,74,21,78,72,75\nFinn,42,73,65,52,43,61,82,85\nGia,50,81,85,80,43,46,73,91\nGrace,24,95,98,94,89,25,91,69\nHarper,69,9,97,77,56,94,38,2\nHayden,2,72,74,53,40,40,66,64\nIsabella,8,99,84,69,86,20,86,85\nJesse,63,39,93,84,30,71,86,19\nJordan,11,80,87,68,88,20,96,81\nKai,27,65,62,92,81,28,94,84\nKaitlyn,7,70,51,77,79,29,96,73\nLydia,75,49,98,55,68,67,91,87\nMark,51,70,87,40,97,94,60,95\nMonica,62,89,98,90,85,66,84,99\nNicole,70,8,84,64,26,70,12,8\nOswin,96,14,62,35,56,98,5,12\nPeter,98,10,71,41,55,66,38,29\nRenette,96,39,82,43,26,92,20,2\nRobert,78,32,98,55,56,81,46,29\nSasha,87,1,84,70,56,88,49,2\nSylvia,86,12,97,4,19,80,36,8\nThomas,76,47,99,34,48,92,30,38\nVictor,5,60,70,65,97,19,63,83\nZack,19,84,83,42,93,15,98,95";

const DEFAULT_SELECTION_SENSITIVITY_REM = 0.4;
const DEFAULT_DIMENSION_SPACING_REM = 6;
const RANGE_TRANSITION_DURATION_MS = 1000;
const REPOSITORY_URL = "https://github.com/tugraz-isds/spcd3";
const persistedUiSettings = getExampleUiSettings();

type PackageMetadata = {
  version?: string;
  releaseDate?: string;
};

type TauriOpenerApi = {
  openUrl?: (url: string) => Promise<void>;
};

type TauriWebviewHandle = {
  setZoom?: (scaleFactor: number) => Promise<void>;
};

type TauriWebviewApi = {
  getCurrentWebview?: () => TauriWebviewHandle;
};

type TauriWindowApi = Window & {
  __TAURI__?: {
    opener?: TauriOpenerApi;
    webview?: TauriWebviewApi;
  };
};

const DEFAULT_ZOOM_FACTOR = 1;
const MIN_ZOOM_FACTOR = 0.2;
const MAX_ZOOM_FACTOR = 5;
const ZOOM_STEP = 0.2;

function formatReleaseDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function closeFilterModal(): void {
  document.getElementById("filterOverlay")?.remove();
  document.getElementById("filterContainer")?.remove();
}

function closeRangeModal(): void {
  document.getElementById("rangeOverlay")?.remove();
  document.getElementById("rangeContainer")?.remove();
}

function closeMultiRangeModal(): void {
  document.getElementById("multiRangeOverlay")?.remove();
  document.getElementById("multiRangeContainer")?.remove();
}

function openAboutModal(): void {
  const modal = elementById<HTMLElement>("aboutModal");
  modal.hidden = false;
  elementById<HTMLButtonElement>("aboutCloseButton").focus();
}

function closeAboutModal(): void {
  elementById<HTMLElement>("aboutModal").hidden = true;
  elementById<HTMLButtonElement>("aboutButton").focus();
}

function getTauriOpener(): TauriOpenerApi | null {
  if (typeof window === "undefined") return null;
  return (window as TauriWindowApi).__TAURI__?.opener ?? null;
}

function getTauriWebview(): TauriWebviewHandle | null {
  if (typeof window === "undefined") return null;
  return (window as TauriWindowApi).__TAURI__?.webview?.getCurrentWebview?.() ?? null;
}

function clampZoomFactor(value: number): number {
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, value));
}

async function applyZoomFactor(value: number): Promise<void> {
  const zoomFactor = clampZoomFactor(value);
  const webview = getTauriWebview();
  await webview?.setZoom?.(zoomFactor);

  setExampleUiSettings({
    selectionSensitivityRem: Number(selectionSensitivitySlider.value),
    dimensionSpacingRem: Number(dimensionSpacingSlider.value),
    zoomFactor,
  });
}

async function adjustZoomFactor(delta: number): Promise<void> {
  await applyZoomFactor(persistedUiSettings.zoomFactor + delta);
  persistedUiSettings.zoomFactor = clampZoomFactor(
    persistedUiSettings.zoomFactor + delta,
  );
}

async function resetZoomFactor(): Promise<void> {
  await applyZoomFactor(DEFAULT_ZOOM_FACTOR);
  persistedUiSettings.zoomFactor = DEFAULT_ZOOM_FACTOR;
}

async function openRepositoryLink(event: MouseEvent): Promise<void> {
  const opener = getTauriOpener();
  if (!opener?.openUrl) {
    return;
  }

  event.preventDefault();
  await opener.openUrl(REPOSITORY_URL);
}

async function loadExampleVersion(): Promise<void> {
  const versionElement = elementById<HTMLElement>("aboutVersion");
  const releaseDateElement = elementById<HTMLElement>("aboutReleaseDate");

  const response = await fetch("./package.json");
  if (!response.ok) {
    throw new Error(`Failed to load package.json: ${response.status}`);
  }

  const packageMetadata = (await response.json()) as PackageMetadata;
  if (packageMetadata.version) {
    versionElement.textContent = packageMetadata.version;
  }
  if (packageMetadata.releaseDate) {
    releaseDateElement.textContent = formatReleaseDate(
      packageMetadata.releaseDate,
    );
  }
}

window.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target?.closest("#showButton, #options")) {
    closeElements("options");
  }
  if (!target?.closest("#invertButton, #invertOptions")) {
    closeElements("invertOptions");
  }
  if (!target?.closest("#moveButton, #moveOptions")) {
    closeElements("moveOptions");
  }
  if (!target?.closest("#filterButton, #filterOptions, #filterContainer")) {
    closeElements("filterOptions");
    closeFilterModal();
  }
  if (!target?.closest("#rangeButton, #rangeOptions, #rangeContainer")) {
    closeElements("rangeOptions");
    closeRangeModal();
  }
  if (
    !target?.closest(
      "#multiRangeButton, #multiRangeOptions, #multiRangeContainer",
    )
  ) {
    closeElements("multiRangeOptions");
    closeMultiRangeModal();
  }
  if (!target?.closest("#selectButtonR, #options_r")) {
    closeElements("options_r");
  }
});

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const aboutModal = document.getElementById("aboutModal");
  if (event.key === "Escape" && aboutModal && !aboutModal.hidden) {
    closeAboutModal();
    return;
  }

  const isZoomShortcut = event.ctrlKey || event.metaKey;
  if (!isZoomShortcut) {
    return;
  }

  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    void adjustZoomFactor(ZOOM_STEP);
    return;
  }

  if (event.key === "-") {
    event.preventDefault();
    void adjustZoomFactor(-ZOOM_STEP);
    return;
  }

  if (event.key === "0") {
    event.preventDefault();
    void resetZoomFactor();
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
    const repoButton = elementById<HTMLAnchorElement>("repoButton");
    repoButton.href = REPOSITORY_URL;
    repoButton.addEventListener("click", (event) => {
      void openRepositoryLink(event);
    });
    elementById<HTMLButtonElement>("aboutButton").addEventListener(
      "click",
      openAboutModal,
    );
    elementById<HTMLButtonElement>("aboutCloseButton").addEventListener(
      "click",
      closeAboutModal,
    );
    elementById<HTMLElement>("aboutModalBackdrop").addEventListener(
      "click",
      closeAboutModal,
    );
    void loadExampleVersion();

    data = studentData;
    newData = loadCSV(data);
    setDimensionSpacing(persistedUiSettings.dimensionSpacingRem);
    showButtons();
    drawChart(newData);
    applySelectionSensitivity(persistedUiSettings.selectionSensitivityRem);
    generateDropdownForShow();
    generateDropdownForInvert();
    generateDropdownForMove();
    generateDropdownForFilter();
    generateDropdownForRange();
    generateDropdownForMultiRange();
    generateDropdownForSelectRecords();
    void applyZoomFactor(persistedUiSettings.zoomFactor);
  },
  false,
);

const selectionSensitivitySlider = elementById<HTMLInputElement>(
  "selectionSensitivitySlider",
);
const selectionSensitivityValue = elementById<HTMLOutputElement>(
  "selectionSensitivityValue",
);
const dimensionSpacingSlider = elementById<HTMLInputElement>(
  "dimensionSpacingSlider",
);
const dimensionSpacingValue = elementById<HTMLOutputElement>(
  "dimensionSpacingValue",
);

function setSliderDefaultMarker(slider: HTMLInputElement): void {
  const shell = slider.closest<HTMLElement>(".range-slider-shell");
  if (!shell) return;

  const min = Number(slider.min);
  const max = Number(slider.max);
  const defaultValue = Number(slider.defaultValue || slider.value);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    shell.style.setProperty("--default-ratio", "0.5");
    return;
  }

  const ratio = (defaultValue - min) / (max - min);
  shell.style.setProperty("--default-ratio", `${ratio}`);
}

function updateSelectionSensitivityLabel(value: number): void {
  const label = `${value.toFixed(2)} rem`;
  selectionSensitivityValue.value = label;
  selectionSensitivityValue.textContent = label;
}

function updateDimensionSpacingLabel(value: number): void {
  const label = `${value.toFixed(2)} rem`;
  dimensionSpacingValue.value = label;
  dimensionSpacingValue.textContent = label;
}

function resetSlidersToDefaults(): void {
  selectionSensitivitySlider.value =
    DEFAULT_SELECTION_SENSITIVITY_REM.toString();
  updateSelectionSensitivityLabel(DEFAULT_SELECTION_SENSITIVITY_REM);
  setSelectableWidth(`${DEFAULT_SELECTION_SENSITIVITY_REM}rem`);

  dimensionSpacingSlider.value = DEFAULT_DIMENSION_SPACING_REM.toString();
  updateDimensionSpacingLabel(DEFAULT_DIMENSION_SPACING_REM);
  setDimensionSpacing(DEFAULT_DIMENSION_SPACING_REM);

  setExampleUiSettings({
    selectionSensitivityRem: DEFAULT_SELECTION_SENSITIVITY_REM,
    dimensionSpacingRem: DEFAULT_DIMENSION_SPACING_REM,
    zoomFactor: persistedUiSettings.zoomFactor,
  });
}

function syncSelectionSensitivityFromChart(): void {
  const current = getSelectableWith();
  const value = current
    ? Number(current.replace("rem", "").trim())
    : DEFAULT_SELECTION_SENSITIVITY_REM;
  selectionSensitivitySlider.value = value.toString();
  updateSelectionSensitivityLabel(value);
}

function applySelectionSensitivity(value: number): void {
  selectionSensitivitySlider.value = value.toString();
  updateSelectionSensitivityLabel(value);
  setSelectableWidth(`${value}rem`);
}

selectionSensitivitySlider.value =
  persistedUiSettings.selectionSensitivityRem.toString();
setSliderDefaultMarker(selectionSensitivitySlider);
updateSelectionSensitivityLabel(persistedUiSettings.selectionSensitivityRem);

selectionSensitivitySlider.addEventListener("input", (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  const value = Number(target.value);
  applySelectionSensitivity(value);
  setExampleUiSettings({
    selectionSensitivityRem: value,
    dimensionSpacingRem: Number(dimensionSpacingSlider.value),
    zoomFactor: persistedUiSettings.zoomFactor,
  });
});

dimensionSpacingSlider.value = persistedUiSettings.dimensionSpacingRem.toString();
setSliderDefaultMarker(dimensionSpacingSlider);
updateDimensionSpacingLabel(persistedUiSettings.dimensionSpacingRem);

dimensionSpacingSlider.addEventListener("input", (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  const value = Number(target.value);
  updateDimensionSpacingLabel(value);
  setDimensionSpacing(value);
  setExampleUiSettings({
    selectionSensitivityRem: Number(selectionSensitivitySlider.value),
    dimensionSpacingRem: value,
    zoomFactor: persistedUiSettings.zoomFactor,
  });
});

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
      applySelectionSensitivity(
        Number(selectionSensitivitySlider.value) ||
          DEFAULT_SELECTION_SENSITIVITY_REM,
      );

      showButtons();

      generateDropdownForShow();
      generateDropdownForInvert();
      generateDropdownForMove();
      generateDropdownForFilter();
      generateDropdownForRange();
      generateDropdownForMultiRange();
      generateDropdownForSelectRecords();
    };
    reader.readAsText(file);
  }
}

function getVisibleNumericDimensions(): string[] {
  return getAllVisibleDimensionNames().filter(
    (dimension) => !isDimensionCategorical(dimension),
  );
}

function formatCurrentRangeValues(dimension: string): {
  minValue: string;
  maxValue: string;
} {
  const resultMin =
    getCurrentMinRange(dimension) -
      Math.floor(getCurrentMinRange(dimension)) !==
    0;
  const resultMax =
    getCurrentMaxRange(dimension) -
      Math.floor(getCurrentMaxRange(dimension)) !==
    0;

  let minValue = String(getCurrentMinRange(dimension));
  let maxValue = String(getCurrentMaxRange(dimension));

  if (resultMin && !resultMax) {
    const count = minValue.split(".")[1].length;
    maxValue = getCurrentMaxRange(dimension).toFixed(count);
  } else if (!resultMin && resultMax) {
    const count = maxValue.split(".")[1].length;
    minValue = getCurrentMinRange(dimension).toFixed(count);
  }

  return { minValue, maxValue };
}

function validateRangeForDimension(
  dimension: string,
  min: number,
  max: number,
): string | undefined {
  const currentMin = Number(getCurrentMinRange(dimension));
  const currentMax = Number(getCurrentMaxRange(dimension));
  const lowerBound = Math.min(currentMin, currentMax);
  const upperBound = Math.max(currentMin, currentMax);

  if (min >= max) {
    return "Min must be smaller than max.";
  }

  if (min > lowerBound || max < upperBound) {
    return `${dimension} requires a range covering ${lowerBound} to ${upperBound}.`;
  }

  return undefined;
}

function showButtons() {
  downloadButton.style.visibility = "visible";
  resetRangesButton.style.visibility = "visible";
  resetRoundedRangesButton.style.visibility = "visible";
  resetAllButton.style.visibility = "visible";
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

function isDropdownOpen(id: string): boolean {
  const options = document.getElementById(id);
  return options?.style.display === "block";
}

function createDropdownButtonLabel(id: string, text: string): HTMLSpanElement {
  const label = document.createElement("span");
  label.id = id;
  label.className = "labels";
  label.append(document.createTextNode(text));

  const icon = document.createElement("img");
  icon.src = "./svg/dropdown-symbol.svg";
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  label.appendChild(icon);

  return label;
}

function createTextLabel(
  text: string,
  className = "label-text",
  htmlFor?: string,
): HTMLSpanElement {
  const label = document.createElement("span");
  label.className = className;
  label.textContent = text;
  if (htmlFor) {
    label.dataset.htmlFor = htmlFor;
  }
  return label;
}

function createDropdownBulkActions(
  isAllSelected: () => boolean,
  onSelectAll: () => void,
  onDeselectAll: () => void,
): {
  element: HTMLDivElement;
  syncLabel: () => void;
} {
  const actionRow = document.createElement("div");
  actionRow.className = "dropdownBulkActions";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "dropdownBulkActionButton";

  const syncLabel = () => {
    toggleButton.textContent = isAllSelected() ? "Deselect all" : "Select all";
  };

  toggleButton.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
    if (isAllSelected()) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
    syncLabel();
  });

  actionRow.appendChild(toggleButton);
  syncLabel();

  return { element: actionRow, syncLabel };
}

function isRecordSelectable(record: string): boolean {
  const line = document.getElementsByClassName(record)[0];
  if (!(line instanceof Element)) {
    return false;
  }

  return window.getComputedStyle(line).stroke !== "rgb(211, 211, 211)";
}

function setRecordSelection(record: string, selected: boolean): void {
  if (isSelected(record) === selected) {
    return;
  }

  if (!selected || isRecordSelectable(record)) {
    toggleSelection(record);
  }
}

function getDimensionValueFromDropdownClick(
  event: MouseEvent,
): string | undefined {
  const target = event.target as HTMLElement | null;
  if (!target) return undefined;

  const option = target.closest<HTMLElement>("[data-dimension]");
  if (typeof option?.dataset.dimension === "string") {
    return option.dataset.dimension;
  }

  if (
    target instanceof HTMLInputElement &&
    target.name === "dimension" &&
    typeof target.value === "string"
  ) {
    return target.value;
  }

  const fallbackOption = target.closest(".dropdownActionLabel");
  const input = fallbackOption?.querySelector<HTMLInputElement>(
    'input[name="dimension"]',
  );
  return input?.value;
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

function showOptionsForRecords(id: string) {
  let checkboxes = document.getElementById(id);
  if (!checkboxes) return;

  checkboxes.style.display == "none"
    ? (checkboxes.style.display = "block")
    : (checkboxes.style.display = "none");

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

function buildInvertOptions(dimensionContainer: HTMLDivElement): void {
  dimensionContainer.innerHTML = "";

  getAllVisibleDimensionNames().forEach(function (dimension) {
    let ddElement = document.createElement("div");
    ddElement.className = "dropdownLabel";
    ddElement.id = "invertElement";
    let inputButton = document.createElement("button");
    inputButton.className = "inputButton";
    inputButton.id = "invert_" + dimension;
    inputButton.type = "button";
    if (getInversionStatus(dimension) == "ascending") {
      inputButton.innerHTML =
        '<img src="./svg/arrow-up.svg" id="invertArrow"/>';
    } else {
      inputButton.innerHTML =
        '<img src="./svg/arrow-down.svg" id="invertArrow"/>';
    }

    inputButton.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
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

    let textLabel = createTextLabel(dimension, "label-text dropdownOptionText");
    ddElement.appendChild(inputButton);
    ddElement.appendChild(textLabel);
    dimensionContainer.appendChild(ddElement);
  });
}

function buildMoveOptions(dimensionContainer: HTMLDivElement): void {
  dimensionContainer.innerHTML = "";

  getAllVisibleDimensionNames().forEach(function (dimension) {
    let dimensionLabel = document.createElement("div");
    dimensionLabel.className = "dropdownLabel";
    dimensionLabel.id = "move";
    let arrowLeft = document.createElement("button");
    arrowLeft.className = "inputButtonMoveLeft";
    arrowLeft.id = "moveleft_" + dimension;
    arrowLeft.type = "button";
    arrowLeft.innerHTML = '<img src="./svg/arrow-left.svg" id="moveArrow"/>';
    arrowLeft.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
      const value = arrowLeft.id.replace("moveleft_", "");
      if (value != undefined) {
        moveDimensionData = value;
        moveDimensionLeft();
        buildMoveOptions(dimensionContainer);
        disableLeftAndRightButton();
      }
    });
    let arrowRight = document.createElement("button");
    arrowRight.className = "inputButtonMoveRight";
    arrowRight.id = "moveright_" + dimension;
    arrowRight.type = "button";
    arrowRight.innerHTML = '<img src="./svg/arrow-right.svg" id="moveArrow"/>';
    arrowRight.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
      const value = arrowRight.id.replace("moveright_", "");
      if (value != undefined) {
        moveDimensionData = value;
        moveDimensionRight();
        buildMoveOptions(dimensionContainer);
        disableLeftAndRightButton();
      }
    });
    let textLabel = createTextLabel(dimension, "label-text dropdownOptionText");
    dimensionLabel.appendChild(arrowLeft);
    dimensionLabel.appendChild(arrowRight);
    dimensionLabel.appendChild(textLabel);
    dimensionContainer.appendChild(dimensionLabel);
  });
}

function generateDropdownForShow() {
  const container = elementById<HTMLElement>("hideDimensionContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "showButton";
  selectButton.className = "ddButton";

  selectButton.appendChild(
    createDropdownButtonLabel("showText", "Show Dimensions"),
  );

  let dimensionContainer = document.createElement("div");
  dimensionContainer.id = "options";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "options");

  let dimensions = getAllDimensionNames();
  let copyDimensions = dimensions.slice();
  let reverseDimensions = copyDimensions.reverse();
  let currentDimensions: string[] = [];

  if (reverseDimensions.length > 10) {
    dimensionContainer.style.height = "12.5rem";
  }

  dimensionContainer.addEventListener("change", (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      updateDimensions(target.value);
      bulkActions.syncLabel();
    }
  });

  const bulkActions = createDropdownBulkActions(
    () =>
      currentDimensions.length > 0 &&
      currentDimensions.every(
        (dimension) => getHiddenStatus(dimension) === "shown",
      ),
    () => {
      currentDimensions.forEach((dimension) => {
        if (getHiddenStatus(dimension) === "hidden") {
          show(dimension);
        }
      });

      dimensionContainer
        .querySelectorAll<HTMLInputElement>('input[name="dimension"]')
        .forEach((input) => {
          input.checked = true;
        });
    },
    () => {
      currentDimensions.forEach((dimension) => {
        if (getHiddenStatus(dimension) === "shown") {
          hide(dimension);
        }
      });

      dimensionContainer
        .querySelectorAll<HTMLInputElement>('input[name="dimension"]')
        .forEach((input) => {
          input.checked = false;
        });
    },
  );

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    let test1 = getAllVisibleDimensionNames();
    let test2 = getAllHiddenDimensionNames();
    currentDimensions = test1.concat(test2);

    dimensionContainer.appendChild(bulkActions.element);
    bulkActions.syncLabel();

    currentDimensions.forEach(function (dimension) {
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
      let textLabel = createTextLabel(
        dimension,
        "label-text dropdownOptionText",
      );
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

  dimensionContainer.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  let selectButton = document.createElement("button");
  selectButton.id = "invertButton";
  selectButton.className = "ddButton";

  selectButton.appendChild(
    createDropdownButtonLabel("invertText", "Invert Dimensions"),
  );

  selectButton.addEventListener("click", () => {
    if (isDropdownOpen("invertOptions")) {
      closeElements("invertOptions");
      return;
    }

    buildInvertOptions(dimensionContainer);
    showOptions("invertOptions", "invertButton");
    calcDDBehaviour(dimensionContainer, selectButton);
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

  selectButton.appendChild(
    createDropdownButtonLabel("moveText", "Move Dimensions"),
  );

  const dimensions = getAllVisibleDimensionNames();
  if (dimensions.length > 10) {
    dimensionContainer.style.height = "12.5rem";
  }

  dimensionContainer.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  selectButton.addEventListener("click", () => {
    if (isDropdownOpen("moveOptions")) {
      closeElements("moveOptions");
      return;
    }

    buildMoveOptions(dimensionContainer);
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

  selectButton.appendChild(
    createDropdownButtonLabel("filterText", "Set Filter"),
  );

  const dimensions = getAllVisibleDimensionNames();

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      if (!isDimensionCategorical(dimension)) {
        let dimensionLabel = document.createElement("button");
        dimensionLabel.className = "dropdownLabel dropdownActionLabel";
        dimensionLabel.type = "button";
        dimensionLabel.dataset.dimension = dimension;
        dimensionLabel.appendChild(
          createTextLabel(dimension, "label-text dropdownOptionText"),
        );
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
    const dimension = getDimensionValueFromDropdownClick(event);
    if (dimension !== undefined) {
      filterDimensionData = dimension;
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
  labelMin.className = "modal-label label-text";
  labelMin.setAttribute("for", "filterMinValue");
  labelMin.textContent = "Min";

  const inputMin = document.createElement("input");
  inputMin.id = "filterMinValue";
  inputMin.type = "number";
  inputMin.lang = "en";
  inputMin.className = "modal-input";
  inputMin.value = Number(currentFilters[0]).toFixed(0);

  const labelMax = document.createElement("label");
  labelMax.className = "modal-label label-text";
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

  const close = () => closeFilterModal();

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

  selectButton.appendChild(createDropdownButtonLabel("rangeText", "Set Range"));

  const dimensions = getAllVisibleDimensionNames();

  selectButton.addEventListener("click", () => {
    dimensionContainer.innerHTML = "";
    getAllVisibleDimensionNames().forEach(function (dimension) {
      if (!isDimensionCategorical(dimension)) {
        let dimensionLabel = document.createElement("button");
        dimensionLabel.className = "dropdownLabel dropdownActionLabel";
        dimensionLabel.type = "button";
        dimensionLabel.dataset.dimension = dimension;
        dimensionLabel.appendChild(
          createTextLabel(dimension, "label-text dropdownOptionText"),
        );
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
    const dimension = getDimensionValueFromDropdownClick(event);
    if (dimension !== undefined) {
      rangeDimensionData = dimension;
      generateModuleForRangeSettings();
      dimensionContainer.style.display == "none"
        ? (dimensionContainer.style.display = "block")
        : (dimensionContainer.style.display = "none");
    }
  });

  container.appendChild(selectButton);
  container.appendChild(dimensionContainer);
}

function generateDropdownForMultiRange() {
  const container = elementById<HTMLElement>("multiRangeDimensionContainer");
  container.style.position = "relative";

  const selectButton = document.createElement("button");
  selectButton.id = "multiRangeButton";
  selectButton.className = "ddButton";
  selectButton.appendChild(
    createDropdownButtonLabel("multiRangeText", "Set Multiple Ranges"),
  );

  const dimensionContainer = document.createElement("div");
  dimensionContainer.id = "multiRangeOptions";
  dimensionContainer.className = "ddList";
  dimensionContainer.style.display = "none";
  dimensionContainer.setAttribute("name", "multiRangeOptions");

  const buildOptions = () => {
    dimensionContainer.innerHTML = "";

    const numericDimensions = getVisibleNumericDimensions();
    if (numericDimensions.length > 15) {
      dimensionContainer.style.height = "12.5rem";
    } else {
      dimensionContainer.style.height = "";
    }

    const syncSelectedDimensions = () => {
      multiRangeDimensionsData = Array.from(
        dimensionContainer.querySelectorAll<HTMLInputElement>(
          'input[name="multiRangeDimension"]:checked',
        ),
      ).map((input) => input.value);
    };

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "apply-button";
    applyButton.textContent = "Set Multiple Ranges";

    const syncApplyState = () => {
      const selectedCount = dimensionContainer.querySelectorAll(
        'input[name="multiRangeDimension"]:checked',
      ).length;
      applyButton.disabled = selectedCount === 0;
    };

    const bulkActions = createDropdownBulkActions(
      () =>
        numericDimensions.length > 0 &&
        numericDimensions.every((dimension) =>
          multiRangeDimensionsData.includes(dimension),
        ),
      () => {
        dimensionContainer
          .querySelectorAll<HTMLInputElement>(
            'input[name="multiRangeDimension"]',
          )
          .forEach((input) => {
            input.checked = true;
          });
        syncSelectedDimensions();
        syncApplyState();
      },
      () => {
        dimensionContainer
          .querySelectorAll<HTMLInputElement>(
            'input[name="multiRangeDimension"]',
          )
          .forEach((input) => {
            input.checked = false;
          });
        syncSelectedDimensions();
        syncApplyState();
      },
    );

    dimensionContainer.appendChild(bulkActions.element);

    numericDimensions.forEach((dimension) => {
      const option = document.createElement("label");
      option.className = "dropdownLabel";
      option.htmlFor = `multirange_${dimension}`;

      const input = document.createElement("input");
      input.className = "inputFields";
      input.type = "checkbox";
      input.id = `multirange_${dimension}`;
      input.name = "multiRangeDimension";
      input.value = dimension;
      input.checked = multiRangeDimensionsData.includes(dimension);

      option.appendChild(input);
      option.appendChild(
        createTextLabel(dimension, "label-text dropdownOptionText"),
      );
      dimensionContainer.appendChild(option);
    });

    const footer = document.createElement("div");
    footer.className = "dropdownLabel dropdownFooterAction";

    dimensionContainer
      .querySelectorAll<HTMLInputElement>('input[name="multiRangeDimension"]')
      .forEach((input) => {
        input.addEventListener("change", () => {
          syncApplyState();
          bulkActions.syncLabel();
        });
      });

    applyButton.addEventListener("click", (event: MouseEvent) => {
      event.stopPropagation();
      const selected = Array.from(
        dimensionContainer.querySelectorAll<HTMLInputElement>(
          'input[name="multiRangeDimension"]:checked',
        ),
      ).map((input) => input.value);

      if (selected.length === 0) {
        return;
      }

      multiRangeDimensionsData = selected;
      generateModuleForMultiRangeSettings();
      closeElements("multiRangeOptions");
    });

    footer.appendChild(applyButton);
    dimensionContainer.appendChild(footer);
    syncApplyState();
  };

  dimensionContainer.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  dimensionContainer.addEventListener("change", () => {
    multiRangeDimensionsData = Array.from(
      dimensionContainer.querySelectorAll<HTMLInputElement>(
        'input[name="multiRangeDimension"]:checked',
      ),
    ).map((input) => input.value);
  });

  selectButton.addEventListener("click", () => {
    if (isDropdownOpen("multiRangeOptions")) {
      closeElements("multiRangeOptions");
      return;
    }

    buildOptions();
    showOptions("multiRangeOptions", "multiRangeButton");
    calcDDBehaviour(dimensionContainer, selectButton);
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

  const { minValue, maxValue } = formatCurrentRangeValues(rangeDimensionData);

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
  labelMin.className = "modal-label label-text";
  labelMin.setAttribute("for", "rangeMinValue");
  labelMin.textContent = "Min";

  const inputMin = document.createElement("input");
  inputMin.id = "rangeMinValue";
  inputMin.type = "number";
  inputMin.lang = "en";
  inputMin.className = "modal-input";
  inputMin.value = minValue;

  const labelMax = document.createElement("label");
  labelMax.className = "modal-label label-text";
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

  const close = () => closeRangeModal();

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

function generateModuleForMultiRangeSettings() {
  const section = elementById<HTMLElement>("bottom-controls");
  closeMultiRangeModal();

  const overlay = document.createElement("div");
  overlay.id = "multiRangeOverlay";
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.id = "multiRangeContainer";
  modal.className = "modal";

  modal.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
  });

  const title = document.createElement("div");
  title.className = "modal-title";
  title.textContent = "Set Multiple Ranges";

  const closeButton = document.createElement("span");
  closeButton.id = "multiRangeCloseButton";
  closeButton.className = "close-button";
  closeButton.innerHTML = "&times;";

  const header = document.createElement("div");
  header.className = "modal-title";
  header.textContent = `${multiRangeDimensionsData.length} selected dimensions`;

  modal.appendChild(title);
  modal.appendChild(closeButton);
  modal.appendChild(header);

  const notes = document.createElement("div");
  notes.className = "modal-notes";
  notes.textContent =
    "Enter min and max that will be applied to all selected dimensions.";
  modal.appendChild(notes);

  const selectedList = document.createElement("ul");
  selectedList.className = "modal-selected-list";
  multiRangeDimensionsData.forEach((dimension) => {
    const item = document.createElement("li");
    const currentRange = formatCurrentRangeValues(dimension);
    const bounds = `${currentRange.minValue} to ${currentRange.maxValue}`;
    item.textContent = `${dimension}: ${bounds}`;
    selectedList.appendChild(item);
  });
  modal.appendChild(selectedList);

  const content = document.createElement("div");
  content.className = "modal-content";

  const firstDimension = multiRangeDimensionsData[0];
  const { minValue, maxValue } = formatCurrentRangeValues(firstDimension);

  const adjustFilterRow = document.createElement("label");
  adjustFilterRow.className = "modal-checkbox-row";
  adjustFilterRow.htmlFor = "multiRangeAdjustFilter";

  const adjustFilterCheckbox = document.createElement("input");
  adjustFilterCheckbox.id = "multiRangeAdjustFilter";
  adjustFilterCheckbox.type = "checkbox";
  adjustFilterCheckbox.checked = false;

  adjustFilterRow.appendChild(adjustFilterCheckbox);
  adjustFilterRow.appendChild(
    createTextLabel("Also reset all filters to new range", "label-text"),
  );

  const row = document.createElement("div");
  row.className = "modal-row";

  const labelMin = document.createElement("label");
  labelMin.className = "modal-label label-text";
  labelMin.setAttribute("for", "multiRangeMinValue");
  labelMin.textContent = "Min";

  const inputMin = document.createElement("input");
  inputMin.id = "multiRangeMinValue";
  inputMin.type = "number";
  inputMin.lang = "en";
  inputMin.className = "modal-input";
  inputMin.value = minValue;

  const labelMax = document.createElement("label");
  labelMax.className = "modal-label label-text";
  labelMax.setAttribute("for", "multiRangeMaxValue");
  labelMax.textContent = "Max";

  const inputMax = document.createElement("input");
  inputMax.id = "multiRangeMaxValue";
  inputMax.type = "number";
  inputMax.lang = "en";
  inputMax.className = "modal-input";
  inputMax.value = maxValue;

  const saveButton = document.createElement("button");
  saveButton.id = "onMultiRangeButton";
  saveButton.className = "save-button";
  saveButton.type = "button";
  saveButton.textContent = "Save";

  row.appendChild(labelMin);
  row.appendChild(inputMin);
  row.appendChild(labelMax);
  row.appendChild(inputMax);
  row.appendChild(saveButton);

  const error = document.createElement("div");
  error.id = "multiRangeError";
  error.className = "modal-errormessage";

  const onEnter = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveButton.click();
    }
  };

  inputMin.addEventListener("keydown", onEnter);
  inputMax.addEventListener("keydown", onEnter);

  content.appendChild(adjustFilterRow);
  content.appendChild(row);
  content.appendChild(error);
  modal.appendChild(content);

  section.appendChild(overlay);
  section.appendChild(modal);

  const close = () => closeMultiRangeModal();

  closeButton.onclick = close;
  overlay.onclick = close;

  overlay.style.display = "block";
  modal.style.display = "block";

  saveButton.onclick = () => {
    const selectedDimensions = [...multiRangeDimensionsData];
    const min = Number(inputMin.value);
    const max = Number(inputMax.value);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      error.textContent = "Attention: Values are not numbers!";
      error.style.display = "block";
      return;
    }

    const invalidDimension = selectedDimensions.find((dimension) =>
      validateRangeForDimension(dimension, min, max),
    );

    if (invalidDimension) {
      error.textContent =
        validateRangeForDimension(invalidDimension, min, max) ?? "";
      error.style.display = "block";
      return;
    }

    error.style.display = "none";
    selectedDimensions.forEach((dimension) => {
      setDimensionRange(dimension, min, max);
    });

    if (adjustFilterCheckbox.checked) {
      window.setTimeout(() => {
        selectedDimensions.forEach((dimension) => {
          resetFilterToCurrentRange(dimension);
        });
      }, RANGE_TRANSITION_DURATION_MS + 50);
    }
    multiRangeDimensionsData = [];
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

function resetFilterToCurrentRange(dimension: string): void {
  const range = getDimensionRange(dimension);
  const inversionStatus = getInversionStatus(dimension);
  const lowerBound = Number(range[0]);
  const upperBound = Number(range[1]);

  if (inversionStatus === "descending") {
    setFilter(dimension, lowerBound, upperBound);
  } else {
    setFilter(dimension, upperBound, lowerBound);
  }
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
  resetSlidersToDefaults();
  drawChart(reloadedData);
  syncSelectionSensitivityFromChart();
}

function generateDropdownForSelectRecords() {
  let records = getAllRecords();

  const container = elementById<HTMLElement>("selRecordsContainer");
  container.style.position = "relative";

  let selectButton = document.createElement("button");
  selectButton.id = "selectButtonR";
  selectButton.className = "ddButton";
  selectButton.addEventListener("click", () => {
    showOptionsForRecords("options_r");
    calcDDBehaviour(recordsContainer, selectButton);
  });

  selectButton.appendChild(
    createDropdownButtonLabel("selectText", "Select Records"),
  );

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
    setRecordSelection(target.value, target.checked);
    bulkActions.syncLabel();
  });

  const bulkActions = createDropdownBulkActions(
    () => records.length > 0 && records.every((record) => isSelected(record)),
    () => {
      records.forEach((record) => {
        setRecordSelection(record, true);
      });

      recordsContainer
        .querySelectorAll<HTMLInputElement>('input[name="record"]')
        .forEach((input) => {
          input.checked = isSelected(input.value);
        });
    },
    () => {
      records.forEach((record) => {
        setRecordSelection(record, false);
      });

      recordsContainer
        .querySelectorAll<HTMLInputElement>('input[name="record"]')
        .forEach((input) => {
          input.checked = false;
        });
    },
  );

  recordsContainer.appendChild(bulkActions.element);

  records.forEach(function (record) {
    let label = document.createElement("div");
    label.className = "dropdownLabel";
    let input = document.createElement("input");
    input.type = "checkbox";
    input.className = "inputFields";
    input.id = "sel_" + record;
    input.value = record;
    input.name = "record";
    input.checked = false;
    let textLabel = createTextLabel(record, "label-text dropdownOptionText");
    label.appendChild(input);
    label.appendChild(textLabel);
    recordsContainer.appendChild(label);
  });

  container.appendChild(selectButton);
  container.appendChild(recordsContainer);
}

function clearPlot() {
  closeFilterModal();
  closeRangeModal();
  closeMultiRangeModal();

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
  const multiRangeDimensionContainer = elementById<HTMLElement>(
    "multiRangeDimensionContainer",
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
  while (multiRangeDimensionContainer.firstChild) {
    multiRangeDimensionContainer.removeChild(
      multiRangeDimensionContainer.firstChild,
    );
  }
  while (selectRecordsContainer.firstChild) {
    selectRecordsContainer.removeChild(selectRecordsContainer.firstChild);
  }
}
