# SPCD3 API Guide

The SPCD3 API comprises 41 functions grouped into nine categories.


## I/O Functions

#### loadCSV

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

<br/>

#### drawChart

`function drawChart(data: []): void`

Uses the given dataset to create a parallel coordinates chart, using D3 to dynamically create SVG
elements in the DOM. This chart is considered to be the current chart.

<br/>

#### deleteChart

`function deleteChart(): void`

Deletes the current parallel coordinates chart.

<br/>

#### saveAsSvg

`function saveAsSvg(): void`

Saves the current parallel coordinates chart as an SVG file with a default name of **'parcoords.svg'**.

## Show And Hide Functions

#### show

`function show(dimension: string): void`

Makes a hidden dimension visible. The dimension is assigned the status **shown**.

<br/>

#### hide

`function hide(dimension: string): void`

Hides the given dimension. The dimension is assigned the status **hidden**.

<br/>

#### getHiddenStatus

`function getHiddenStatus(dimension: string): string`

Returns the visibility status of the dimension, which can be either **shown** or **hidden**.

## Invert Functions

#### invert

`function invert(dimension: string): void`

Inverts the given dimension.

<br/>

#### getInversionStatus

`function getInversionStatus(dimension: any): string`

Returns the inversion status of a dimension, which can be either **ascending** or **descending**.

<br/>

#### setInversionStatus

`function setInversionStatus(dimension: string, status: string): void`

Sets the inversion status of the given dimension to one of **ascending** and **descending**.

## Move Functions

#### move

`function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void`

Moves dimension A either to the left side of dimension B or to the right side of dimension B.

<br/>

#### moveByOne

`function moveByOne(dimension: string, direction: string): void`

Moves a dimension one position to the left or right, independent of other dimensions.

<br/>

#### swap

`function swap(dimensionA: string, dimensionB: string): void`

Swaps the positions of the given dimensions.

<br/>

#### getDimensionPosition

`function getDimensionPosition(dimension: string): number`

Returns the position of the given dimension (0...n-1).

<br/>

#### setDimensionPosition

`function setDimensionPosition(dimension: string, position: number): void`

Sets the position of the given dimension (0...n-1).

## Range Functions

#### getDimensionRange

`function getDimensionRange(dimension: string): [min, max]`

Returns the given dimension’s current range (min, max).

<br/>

#### setDimensionRange

`function setDimensionRange(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to specific values (min, max).

<br/>

#### setDimensionRangeRounded

`function setDimensionRangeRounded(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to rounded specific values (min, max).

<br/>

#### getMinValue

`function getMinValue(dimension: string): number`

Returns the minimum data value of a dimension.

<br/>

#### getMaxValue

`function getMaxValue(dimension: string): number`

Returns the maximum data value of a dimension.

<br/>

#### getCurrentMinRange

`function getCurrentMinRange(dimension: string): number`

Returns the current minimum value of a dimension’s range (in data coordinates).

<br/>

#### getCurrentMaxRange

`function getCurrentMaxRange(dimension: string): number`

Returns the current maximum value of a dimension’s range (in data coordinates).

## Filter Functions

#### getFilter

`function getFilter(dimension: string): [min, max]`

Returns the minimum and maximum values of the filter of a dimension.

<br/>

#### setFilter

`function setFilter(dimension: string, min: number, max: number): void`

Sets the filter for a dimension by specifying minimum and maximum values. If the minimum value lies below the current range, the filter minimum is set to the current range minimum. If the minimum value exceeds the current range, the filter maximum is set to the current range maximum.

## Selection Functions

#### getSelected

`function getSelected(): []`

Returns all selected records in the chart as an array, where each record is identified with its label,
taken by default from the first column of the dataset.

<br/>

#### setSelection

`function setSelection(records: []): void`

Selects one or more records by handing over an array of labels.

<br/>

#### toggleSelection

`function toggleSelection(record: string): void`

Toggles the selection of a given record by specifying its label.

<br/>

#### isSelected

`function isSelected(record: string): boolean`

Returns a boolean for the selection status of a given record by specifying its label: true if the record is selected and false if not.

<br/>

#### setSelected

`function setSelected(record: string): void`

Selects a given record by specifying its label.

<br/>

#### setUnselected

`function setUnselected(record: string): void`

Deselects a given record by specifying its label.

## Selection Functions with ID

#### setSelectionWithId

`function setSelectionWithId(recordIds: []): void`

Selects one or more records by handing over an array of IDs.

<br/>

#### toggleSelectionWithId

`function toggleSelectionWithId(recordId: number): void`

Toggles the selection of a given record by specifying its ID.

<br/>

#### isSelectedWithId

`function isSelectedWithId(recordId: number): boolean`

Returns a boolean for the selection status of a given record by specifying its ID: true if the record is selected and false if not.

<br/>

#### setSelectedWithId

`function setSelectedWithId(recordId: number): void`

Selects a given record by specifying its ID.

<br/>

#### setUnselectedWithId

`function setUnselectedWithId(recordId: number): void`

Deselects a given record by specifying its ID.


## Helper Functions

#### getAllDimensionNames

`function getAllDimensionNames(): []`

Returns an array of all dimensions names in order.

<br/>

#### getAllRecords

`function getAllRecords(): []`

Returns all records as an array.

<br/>

#### getNumberofDimensions

`function getNumberOfDimensions(): number`

Returns the number of dimensions.

<br/>

#### getDimensionPosition

`function getDimensionPosition(dimensionName: string): number`

Returns the position of a dimension (0..𝑚 − 1).

<br/>

#### isDimensionCategorical

`function isDimensionCategorical(dimensionName: string): boolean`

Returns true if a dimension is categorial and false if not (i.e. it is numerical).

<br/>

#### setDimensionForHovering

`function setDimensionForHovering(dimension: string): void`

Sets the dimension as label for hovering.

<br/>

#### getRecordWithId

`function getRecordWithId(recordId: number): string`

Returns the label of a record.