# Steerable Parallel Coordinates in D3

SPC is a library that generates interactive parallel coordinate plots.
The following sections explain all existing functions.

## I/O Functions

- loadCSV

`function loadCSV(csv: string): []`

As the function name already states, using loadCSV loads the data and returns the data as an array.
As a parameter a CSV file is required.
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

- getDimensions

`function getDimensions(data: any): []`

This function returns an array of all dimensions.
The dimensions are needed to generate the plot.
The previously loaded columns of the data, e.g., data['columns'], are necessary as parameters.

- generateSVG

`function generateSVG(data: [], dimensions: []): void`

This function creates the plot of the previously loaded data.
Parameters are the loaded data and the returned dimensions of getDimensions.

- resetSVG

`function resetSVG(): void`

The complete plot can be deleted with the resetSVG function.

- saveAsSvg

`function saveAsSvg(): void`

This function allows to save the current plot as SVG.
The plot is saved as **'parcoords.svg'**.

## Show And Hide Functions

- show

`function show(dimension: string): void`

The show function can make a hidden dimension visible by handing over the dimension name as a string (e.g., 'PE' of the example CSV data).

- hide

`function hide(dimension: string): void`

All visible dimensions can also be made invisible, but individually, with the function hide, where also the dimension name as string is required.

- getHiddenStatus

`function getHiddenStatus(dimension: string): string`

With getHiddenStatus, the status of a dimension can be queried.
As a parameter, the dimension name is required as a string.
The return type is also a string, and the value can be **shown** or **hidden**.

## Invert Functions

- invert

`function invert(dimension: string): void`

With inverting, the scale of a dimension will be flipped.
A string, namely the dimension name, is required as a parameter.

- getInversionStatus

`function getInversionStatus(dimension: any): string`

This function returns the inversion status of a dimension.
As a parameter, a string, namely the dimension, is required.
The return type is a string; the value can be **ascending** or **descending**.

- setInversionStatus

`function setInversionStatus(dimension: string, status: string): void`

This function allows changing the inversion status of a dimension.
As parameters, the dimension and the status are required as strings.
The status can either be **ascending** or **descending**.

## Move Functions

- move

`function move(dimensionA: string, toRightOf: boolean, dimensionB: string): void`

A dimension can be moved with the move function.
There is the possibility to move dimension A next to dimension B.
With the toRightOf parameter, it is possible to decide if dimension A is placed on the left side of dimension B or the right side of dimension B.
The parameters are:
- dimensionA as a string (this dimension is moved),
- toRightOf as a boolean (true means right of dimensionB, false means left of dimension B),
- dimensionB as a string.

- moveByOne

`function moveByOne(dimension: string, direction: string): void`

A dimension can also be moved to the left or the right, independent of another dimension.
Parameters are the dimensions string and the direction as a string.
The direction can be either **right** or **left**.

- swap

`function swap(dimensionA: string, dimensionB: string): void`

This function allows two dimensions to swap.
There are only two dimensions needed as a string for the parameters.

- getDimensionPosition

`function getDimensionPosition(dimension: string): number`

This function returns the position of a dimension (0...n).
As a parameter, a string, namely the dimension, is required.
The function returns a number between 0 and n dimensions.

- setDimensionPosition

`function setDimensionPosition(dimension: string, position: number): void`

It is also possible to set the position of a dimension.
As parameters, only the dimension string and the desired position number are needed.

## Range Functions

- getDimensionRange

`function getDimensionRange(dimension: string): void`

This function returns a dimension's current range (min, max).
As a parameter, a string, namely the dimension, is required.

- setDimensionRange

`function setDimensionRange(dimension: string, min: number, max: number): void`

The range of a dimension can also be changed.
Only the dimension string, min value and max value are required as parameters.

- setDimensionRangeRounded

`function setDimensionRangeRounded(dimension: string, min: number, max: number): void`

This function set the minimum and maximum ranges to round values.
Only the dimension string, min value and max value are required as parameters.

- getMinRange

`function getMinRange(dimension: any): number`

This function returns the minimum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.

- getMaxRange

`function getMaxRange(dimension: any): number`

This function returns the maximum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.

- getCurrentMinRange

`function getCurrentMinRange(dimension: any): number`

This function returns the current minimum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.

- getCurrentMaxRange

`function getCurrentMaxRange(dimension: any): number`

This function returns the current maximum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.

## Filter Functions

- getFilter

`function getFilter(dimension): any`

This function returns the filter of a dimension (in range coords).
As a parameter, a string, namely the dimension, is required.
The function returns the minimum and the maximum value of the filter.

- setFilter

`function setFilter(dimension: string, min: number, max: number): void`

The filter of a dimension can be set with this function by handing over the dimension string and the minimum and maximum values of the filter (in range coords).

## Select Functions

- getSelected

`function getSelected(): any[]`

It is possible to get all the selected records in the plot with this function.
This function returns an array with all selected records.
A record is identified with its label, for example, the name.

- setSelection

`function setSelection(records: []): void`

This function allows to select several records.
An array of records is needed as a parameter, identified by the label.

- toggleSelection

`function toggleSelection(record: string): void`

It is possible to toggle a record selection by handing the dimension string over as a parameter.

- isSelected

`function isSelected(record: string): boolean`

This function checks whether a record is selected or not.
As a parameter, a string is required, namely the record label.
This function returns true if the record is selected or false if not.

- setSelected

`function setSelected(record: string): void`

With this function, a single record can be selected.
As a parameter, a string is required, namely the record label.

- setUnselected

`function setUnselected(record: string): void`

With this function, a single record can be selected.
As a parameter, a string is required, namely the record label.


## Helper Functions

- getAllDimensions

`function getAllDimensions(): string[]`

This function returns an array of all dimensions in order.

- getAllRecords

`function getAllRecords(): any[]`

This function returns all records (regardless of whether record is selected or not).
This function returns an array with all records.
A data record is identified by its label, for example the name.

- isDimensionNaN

`function isDimensionNaN(dimension: string): boolean`

This function checks if the data of a dimension is numerical or not.
As a parameter, a string is required, namely the dimension name.
This function returns true if it is numerical and false if not.