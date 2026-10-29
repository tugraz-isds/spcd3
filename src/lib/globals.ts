export let chartPadding: number;
export let xAxisPadding: number;
export let chartWidth: number;
export let chartHeight: number;
export let yAxes: {};
export let selectedRecords: [];
export let parallelCoordinates: {
  xScales: any;
  yScales: Record<string, any>;
  dragging: Record<string, any>;
  dragPosStart: Record<string, any>;
  currentPosOfDims: any;
  newFeatures: any;
  features: any[];
  newDataset: any;
  data: any;
} = {
  xScales: {},
  yScales: {},
  dragging: {},
  dragPosStart: {},
  currentPosOfDims: [],
  newFeatures: null,
  features: [],
  newDataset: null,
  data: null,
};
export let activePaths: any;
export let recordKey: string;
export let chartSvg: any;
export let hoverLabel: string;
export let dataRefreshCallback: any;
export let chartColumns: any;
export let initialDimensions: any;
export let selectableStrokeWidth: string;
export let recordCount: number;
export let dimensionCount: number;
export let chartContent: any;
export let dimensionSpacing: number | null = null;
export let hoveredRecordIds: string[] = [];
export let chartFrameBorder: string | null = null;
export let isWheelZoomEnabled = false;
export let isInteractivityEnabled = true;

export const getChartPadding = (): number => chartPadding;
export const getXAxisPadding = (): number => xAxisPadding;
export const getChartWidth = (): number => chartWidth;
export const getChartHeight = (): number => chartHeight;
export const getYAxes = (): {} => yAxes;
export const getSelectedRecords = (): [] => selectedRecords;
export const getParallelCoordinates = () => parallelCoordinates;
export const getActivePaths = (): any => activePaths;
export const getRecordKey = (): string => recordKey;
export const getChartSvg = (): any => chartSvg;
export const getHoverLabel = (): string => hoverLabel;
export const getDataRefreshCallback = (): any => dataRefreshCallback;
export const getChartColumns = (): any => chartColumns;
export const getInitialDimensions = (): any => initialDimensions;
export const getSelectableStrokeWidth = (): string => selectableStrokeWidth;
export const getRecordCount = (): number => recordCount;
export const getDimensionCount = (): number => dimensionCount;
export const getChartContent = (): any => chartContent;
export const getDimensionSpacing = (): number | null => dimensionSpacing;
export const getHoveredRecordIds = (): string[] => hoveredRecordIds;
export const getChartFrameBorder = (): string | null => chartFrameBorder;
export const getIsWheelZoomEnabled = (): boolean => isWheelZoomEnabled;
export const getIsInteractivityEnabled = (): boolean => isInteractivityEnabled;

export function setChartContent(contentdata: any): void {
  chartContent = contentdata;
}

export function setHoveredRecordIds(records: string[]): void {
  hoveredRecordIds = records;
}

export function setHoverLabel(label: string): void {
  hoverLabel = label;
}

export function setYAxes(axis: any): void {
  yAxes = axis;
}

export function setDataRefreshCallback(data: any): void {
  dataRefreshCallback = data;
}

export function setChartColumns(cols: any): void {
  chartColumns = cols;
}

export function setChartSvg(svgData: any): void {
  chartSvg = svgData;
}

export function setChartWidth(value: number): void {
  chartWidth = value;
}

export function setChartHeight(value: number): void {
  chartHeight = value;
}

export function setChartPadding(value: number): void {
  chartPadding = value;
}

export function setXAxisPadding(value: number): void {
  xAxisPadding = value;
}

export function setInitialDimensions(dimensions: any): void {
  initialDimensions = Array.isArray(dimensions) ? [...dimensions] : dimensions;
}

export function setActivePaths(paths: any): void {
  activePaths = paths;
}

export function setParallelCoordinates(value: typeof parallelCoordinates) {
  parallelCoordinates = value;
}

export function setXScales(value: any): void {
  parallelCoordinates.xScales = value;
}

export function setYScales(value: Record<string, any>): void {
  parallelCoordinates.yScales = value;
}

export function setDragging(value: Record<string, any>): void {
  parallelCoordinates.dragging = value;
}

export function setDragPosStart(value: Record<string, any>): void {
  parallelCoordinates.dragPosStart = value;
}

export function setCurrentPosOfDims(value: any): void {
  parallelCoordinates.currentPosOfDims = value;
}

export function setNewFeatures(value: any): void {
  parallelCoordinates.newFeatures = value;
}

export function setFeatures(value: any[]): void {
  parallelCoordinates.features = value;
}

export function setNewDataset(value: any): void {
  parallelCoordinates.newDataset = value;
}

export function setData(value: any): void {
  parallelCoordinates.data = value;
}

export function setRecordKey(value: string): void {
  recordKey = value;
}

export function setSelectableStrokeWidth(value: string): void {
  selectableStrokeWidth = value;
}

export function setRecordCount(value: number): void {
  recordCount = value;
}

export function setDimensionCount(value: number): void {
  dimensionCount = value;
}

export function setDimensionSpacing(value: number | null): void {
  dimensionSpacing = value;
}

export function setChartFrameBorder(value: string | null): void {
  chartFrameBorder = value;
}

export function setWheelZoomEnabled(value: boolean): void {
  isWheelZoomEnabled = value;
}

export function setInteractivityEnabled(value: boolean): void {
  isInteractivityEnabled = value;
}
