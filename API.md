# Steerable Parallel Coordinates in D3

SPC is a library that generates interactive parallel coordinate plots.
The following sections explain all existing functions.

## I/O Functions

- loadCSV

`function loadCSV(csv: string): []`

Loads a dataset from a CSV file.
An example CSV file separated with a comma:

```
Name,Maths,English,PE
Adrian,95,24,82
Amelia,92,98,60
Brooke,27,35,84
Chloe,78,9,83
Dylan,92,47,91
Emily,67,3,98
Evan,53,60,97
Finn,42,73,65
Gia,50,81,85
Grace,24,95,98
Harper,69,9,97
```

- drawChart

`function drawChart(data: []): void`

Uses the given dataset to create a parallel coordinates chart, using D3 to dynamically create SVG
elements in the DOM. This chart is considered to be the current chart.

- deleteChart

`function deleteChart(): void`

Deletes the current parallel coordinates chart.

- saveAsSvg

`function saveAsSvg(): void`

Saves the current parallel coordinates chart as an SVG file with a default name of **'parcoords.svg'**.

## Show And Hide Functions

- show

`function show(dimension: string): void`

Makes a hidden dimension visible. The dimension is assigned the status **shown**.

- hide

`function hide(dimension: string): void`

Hides the given dimension. The dimension is assigned the status **hidden**.

- getHiddenStatus

`function getHiddenStatus(dimension: string): string`

Returns the visibility status of the dimension, which can be either **shown** or **hidden**.

## Invert Functions

- invert

`function invert(dimension: string): void`

Inverts the given dimension.

- getInversionStatus

`function getInversionStatus(dimension: any): string`

Returns the inversion status of a dimension, which can be either **ascending** or **descending**.

- setInversionStatus

`function setInversionStatus(dimension: string, status: string): void`

Sets the inversion status of the given dimension to one of **ascending** and **descending**.

## Move Functions

- move

`function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void`

Moves dimension A either to the left side of dimension B or to the right side of dimension B.

- moveByOne

`function moveByOne(dimension: string, direction: string): void`

Moves a dimension one position to the left or right, independent of other dimensions.

- swap

`function swap(dimensionA: string, dimensionB: string): void`

Swaps the positions of the given dimensions.

- getDimensionPosition

`function getDimensionPosition(dimension: string): number`

Returns the position of the given dimension (0...n).

- setDimensionPosition

`function setDimensionPosition(dimension: string, position: number): void`

Sets the position of the given dimension (0...n).

## Range Functions

- getDimensionRange

`function getDimensionRange(dimension: string): void`

Returns the given dimension’s current range (min, max).

- setDimensionRange

`function setDimensionRange(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to specific values (min, max).

- setDimensionRangeRounded

`function setDimensionRangeRounded(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to rounded specific values (min, max).

- getMinValue

`function getMinValue(dimension: string): number`

Returns the minimum data value of a dimension.

- getMaxValue

`function getMaxValue(dimension: string): number`

Returns the maximum data value of a dimension.

- getCurrentMinRange

`function getCurrentMinRange(dimension: string): number`

Returns the current minimum value of a dimension’s range (in data coordinates).

- getCurrentMaxRange

`function getCurrentMaxRange(dimension: string): number`

Returns the current maximum value of a dimension’s range (in data coordinates).

## Filter Functions

- getFilter

`function getFilter(dimension: string): [min, max]`

Returns the minimum and maximum values of the filter of a dimension.

- setFilter

`function setFilter(dimension: string, min: number, max: number): void`

Sets the filter for a dimension by specifying minimum and maximum values. If the minimum value lies below the current range, the filter minimum is set to the current range minimum. If the minimum value exceeds the current range, the filter maximum is set to the current range maximum.

## Select Functions

- getSelected

`function getSelected(): []`

Returns all selected records in the chart as an array, where each record is identified with its label,
taken by default from the first column of the dataset.

- setSelection

`function setSelection(records: []): void`

Selects one or more records by handing over an array of labels.

- toggleSelection

`function toggleSelection(record: string): void`

Toggles the selection of a given record by specifying its label.

- isSelected

`function isSelected(record: string): boolean`

Returns a boolean for the selection status of a given record by specifying its label: true if the record is selected and false if not.

- setSelected

`function setSelected(record: string): void`

Selects a given record by specifying its label.

- setUnselected

`function setUnselected(record: string): void`

Deselects a given record by specifying its label.


## Helper Functions

- getAllDimensionNames

`function getAllDimensionNames(): []`

Returns an array of all dimensions names in order.

- getAllRecords

`function getAllRecords(): []`

Returns all records as an array.

- getAllDimensionNames

`function getAllDimensionNames(): []`

Returns an array of all dimensions names in order.

- getNumberofDimensions

`function getNumberOfDimensions(): number`
Returns the number of dimensions.

- getDimensionPosition

`function getDimensionPosition(dimensionName: string): number`
Returns the position of a dimension (0..𝑚 − 1).

- setDimensionPosition

`function setDimensionPosition(dimensionName: string, position: number): void`

Sets the position of the given dimension to a specific position (0..𝑚 − 1).

- isDimensionCategorical

`function isDimensionCategorical(dimensionName: string): boolean`

Returns true if a dimension is categorial and false if not (i.e. it is numerical).

- setDimensionForHovering

`function setDimensionForHovering(dimension: string): void`

Sets the dimension as label for hovering.