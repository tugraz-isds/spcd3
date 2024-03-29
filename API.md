# Steerable Parallel Coordinates in D3

SPC is a library that generates interactive parallel coordinate plots.
The following sections explain all existing functions.

## Load And Generate Plot Functions

- loadCSV

`function loadCSV(csv: string)`

As the function name already states, using loadCSV loads the data and returns the data as an array.
As a parameter, it is a string required of a CSV file.
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

This function returns an array of dimensions.
This is needed to generate the plot.
The previously loaded columns of the data, e.g., data['columns'], are necessary as parameters.

- generateSVG

`function generateSVG(data: [], dimensions: [])`

This function creates the plot of the previously loaded data.
Parameters are the loaded data and the returned dimensions of getDimensions.

- resetSVG

`function resetSVG()`

The complete plot can be deleted with the resetSVG function.

## Show And Hide Functions

- show

`function show(dimension: string)`

The show function can make a hidden dimension visible. As a parameter, a string is required, namely the dimension (e.g., 'PE' of the example CSV data).

- hide

`function hide(dimension: string)`

All visible dimensions can also be invisible, but individually, with the function hide.
As a parameter, a string, namely the dimension, is required.

- getHiddenStatus

`function getHiddenStatus(dimension: string): string`

With getHiddenStatus, getting the status of a dimension regarding **shown** or **hidden** is possible.
As a parameter, a string, namely the dimension, is required.
The return type is a string, and the value can be **shown** or **hidden**.

## Invert Functions

- invert

`function invert(dimension: string)`

There is the possibility of inverting a dimension by using the invert function.
As a parameter, a string, namely the dimension, is required.

- getInversionStatus

`function getInversionStatus(dimension: any): string`

This function returns the inversion status of a dimension.
As a parameter, a string, namely the dimension, is required.
The return type is a string; the value can be **ascending** or **descending**.

- setInversionStatus

`function setInversionStatus(dimension: string, status: string)`

This function allows changing the inversion status of a dimension.
As parameters, the dimension and the status are required as strings.
The status can either be **ascending** or **descending**.

## Move Functions

- move

`function move(dimensionA: string, toRightOf: boolean, dimensionB: string)`

A dimension can be moved with the move function.
There is the possibility to move dimension A next to dimension B.
With the toRightOf parameter, it is possible to decide if dimension A is placed on the left side of dimension B or the right side of dimension B.
The parameters are:
- dimensionA as a string (this dimension is moved),
- toRightOf as a boolean (true means right of dimensionB, false means left of dimension B),
- dimensionB as a string.

- moveByOne

`function moveByOne(dimension: string, direction: string)`

A dimension can also be moved to the left or the right, independent of another dimension.
Parameters are the dimensions string and the direction as a string.
The direction can be either **right** or **left**.

- swap

`function swap(dimensionA: string, dimensionB: string)`

This function allows two dimensions to swap.
There are only two dimensions needed as a string for the parameters.

- getDimensionPosition

`function getDimensionPosition(dimension: string): number`

This function returns the position of a dimension (0...n).
As a parameter, a string, namely the dimension, is required.
The function returns a number between 0 and n dimensions.

- setDimensionPosition

`function setDimensionPosition(dimension: string, position: number)`

It is also possible to set the position of a dimension.
As parameters, only the dimension string and the desired position number are needed.

- getAllDimensions

`function getAllDimensions(): string[]`

This function returns an array of all dimensions in order.

## Range Functions

- getDimensionRange

`function getDimensionRange(dimension: string)`

This function returns a dimension's current range (min, max).
As a parameter, a string, namely the dimension, is required.

- setDimensionRange

`function setDimensionRange(dimension: string, min: number, max: number)`

The range of a dimension can also be changed.
Only the dimension string, min value and max value are required as parameters.

- getMinRange

`function getMinRange(dimension: any): number`

This function returns the minimum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.

- getMaxRange

`function getMaxRange(dimension: any): number`

This function returns the maximum range of a dimension (in data coords).
As a parameter, a string, namely the dimension, is required.


## Filter Functions

- getFilter

`function getFilter(dimension): any`

This function returns the filter of a dimension (in range coords).
As a parameter, a string, namely the dimension, is required.
The function returns the minimum and the maximum value of the filter.

- setFilter

`function setFilter(dimension: string, min: number, max: number)`

The filter of a dimension can be set with this function by handing over the dimension string and the minimum and maximum values of the filter (in range coords).

## Select Functions

- getSelected

`function getSelected(): any[]`

It is possible to get all the selected records in the plot with this function.
This function returns an array with all selected records.
A record is identified with its label, for example, the name.

- setSelection

`function setSelection(records: [])`

This function allows to select several records.
An array of records is needed as a parameter, identified by the label.

- toggleSelection

`function toggleSelection(record: string)`

It is possible to toggle a record selection by handing the dimension string over as a parameter.

- isSelected

`function isSelected(record: string): boolean`

This function checks whether a record is selected or not.
As a parameter, a string is required, namely the record label.
This function returns true if the record is selected or false if not.

- setSelected

`function setSelected(record: string)`

With this function, a single record can be selected.
As a parameter, a string is required, namely the record label.

- setUnselected

`function setUnselected(record: string)`

With this function, a single record can be selected.
As a parameter, a string is required, namely the record label.

## Save Function

- saveAsSvg

`function saveAsSvg()`

This function allows to save the current plot as SVG.
The plot is saved as **'parcoords.svg'**.

## Helper

- isDimensionNaN

`function isDimensionNaN(dimension: string): boolean`

This function checks if the data of a dimension is numerical or not.
As a parameter, a string is required, namely the dimension name.
This function returns true if it is numerical and false if not.