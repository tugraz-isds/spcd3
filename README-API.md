# SPCD3 API Guide

The SPCD3 API comprises 49 functions grouped into nine categories.

<br/>

## 1. I/O Functions

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

#### drawChart

`function drawChart(data: []): void`

Uses the given dataset to create a parallel coordinates chart, using
D3 to dynamically create SVG elements in the DOM. This chart is
considered to be the current chart.


#### deleteChart

`function deleteChart(): void`

Deletes the current parallel coordinates chart.


#### refresh

`function refresh(): void`

Refreshes the current parallel coordinates chart.


#### reset

`function reset(): void`

Resets the current parallel coordinates chart.


#### saveAsSvg

`function saveAsSvg(): void`

Saves the current parallel coordinates chart as an SVG file with a
default name of **'parcoords.svg'**.


<br/>

## 2. Show And Hide Functions

#### show

`function show(dimension: string): void`

Makes a hidden dimension visible. The dimension is assigned the status **shown**.


#### hide

`function hide(dimension: string): void`

Hides the given dimension. The dimension is assigned the status **hidden**.


#### getHiddenStatus

`function getHiddenStatus(dimension: string): string`

Returns the visibility status of the dimension, which can be either **shown** or **hidden**.

<br/>

## 3. Invert Functions

#### invert

`function invert(dimension: string): void`

Inverts the given dimension.


#### getInversionStatus

`function getInversionStatus(dimension: any): string`

Returns the inversion status of a dimension, which can be either **ascending** or **descending**.


#### setInversionStatus

`function setInversionStatus(dimension: string, status: string): void`

Sets the inversion status of the given dimension to one of **ascending** and **descending**.

<br/>

## 4. Move Functions

#### move

`function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void`

Moves dimension A either to the left side of dimension B or to the right side of dimension B.


#### moveByOne

`function moveByOne(dimension: string, direction: string): void`

Moves a dimension one position to the left or right, independent of other dimensions.


#### swap

`function swap(dimensionA: string, dimensionB: string): void`

Swaps the positions of the given dimensions.


#### getDimensionPosition

`function getDimensionPosition(dimension: string): number`

Returns the position of the given dimension (0...n-1).


#### setDimensionPosition

`function setDimensionPosition(dimension: string, position: number): void`

Sets the position of the given dimension (0...n-1).

<br/>

## 5. Range Functions

#### getDimensionRange

`function getDimensionRange(dimension: string): [min, max]`

Returns the given dimension’s current range (min, max).


#### setDimensionRange

`function setDimensionRange(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to specific values (min, max).


#### setDimensionRangeRounded

`function setDimensionRangeRounded(dimension: string, min: number, max: number): void`

Sets the range of the given dimension to rounded specific values (min, max).


#### getMinValue

`function getMinValue(dimension: string): number`

Returns the minimum data value of a dimension.


#### getMaxValue

`function getMaxValue(dimension: string): number`

Returns the maximum data value of a dimension.


#### getCurrentMinRange

`function getCurrentMinRange(dimension: string): number`

Returns the current minimum value of a dimension’s range (in data coordinates).


#### getCurrentMaxRange

`function getCurrentMaxRange(dimension: string): number`

Returns the current maximum value of a dimension’s range (in data coordinates).

<br/>

## 6. Filter Functions

#### getFilter

`function getFilter(dimension: string): [min, max]`

Returns the minimum and maximum values of the filter of a dimension.


#### setFilter

`function setFilter(dimension: string, min: number, max: number): void`

Sets the filter for a dimension by specifying minimum and maximum values.
If the minimum value lies below the current range, the filter minimum is set
to the current range minimum. If the minimum value exceeds the current range,
the filter maximum is set to the current range maximum.

<br/>

## 7. Selection Functions

#### getSelected

`function getSelected(): []`

Returns all selected records in the chart as an array, where each record is
identified with its label, taken by default from the first column of the dataset.


#### setSelection

`function setSelection(records: []): void`

Selects one or more records by handing over an array of labels.


#### toggleSelection

`function toggleSelection(record: string): void`

Toggles the selection of a given record by specifying its label.


#### isSelected

`function isSelected(record: string): boolean`

Returns a boolean for the selection status of a given record by
specifying its label: true if the record is selected and false if not.


#### setSelected

`function setSelected(record: string): void`

Selects a given record by specifying its label.


#### setUnselected

`function setUnselected(record: string): void`

Deselects a given record by specifying its label.

<br/>

## 8. Selection Functions with ID

#### setSelectionWithId

`function setSelectionWithId(recordIds: []): void`

Selects one or more records by handing over an array of IDs.


#### toggleSelectionWithId

`function toggleSelectionWithId(recordId: number): void`

Toggles the selection of a given record by specifying its ID.


#### isSelectedWithId

`function isSelectedWithId(recordId: number): boolean`

Returns a boolean for the selection status of a given record by specifying
its ID: true if the record is selected and false if not.


#### setSelectedWithId

`function setSelectedWithId(recordId: number): void`

Selects a given record by specifying its ID.


#### setUnselectedWithId

`function setUnselectedWithId(recordId: number): void`

Deselects a given record by specifying its ID.

<br/>

## 9. Helper Functions

#### getAllDimensionNames

`function getAllDimensionNames(): []`

Returns an array of all dimensions names in order.


#### getAllHiddenDimensionNames

`function getAllHiddenDimensionNames(): string[]`

Returns an array of all hidden dimensions names in order.


#### getAllVisibleDimensionNames

`function getAllVisibleDimensionNames(): string[]`

Returns an array of all visible dimensions names in order.


#### getAllRecords

`function getAllRecords(): []`

Returns all records as an array.


#### getNumberofDimensions

`function getNumberOfDimensions(): number`

Returns the number of dimensions.


#### getDimensionPosition

`function getDimensionPosition(dimension: string): number`

Returns the position of a dimension (0..𝑚 − 1).


#### isDimensionCategorical

`function isDimensionCategorical(dimension: string): boolean`

Returns true if a dimension is categorial and false if not (i.e. it is numerical).


#### setDimensionForHovering

`function setDimensionForHovering(dimension: string): void`

Sets the dimension as label for hovering.


#### getRecordWithId

`function getRecordWithId(recordId: number): string`

Returns the label of a record.


#### isRecordInactive

`function isRecordInactive(record: string): boolean`

Returns true if a record is inactive and false if not.


#### colorRecord

`function colorRecord(record: string, color: string): void`

Change the color of a record.


#### uncolorRecord

`function uncolorRecord(record: string): void`

Reset the color of a record to its default color.

#### disableInteractivity

`function disableInteractivity(): void`

Disables the interactivity of the chart.

#### enableInteractivity

`function enableInteractivity(): void`

Enables the interactivity of the chart.