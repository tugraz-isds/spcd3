# Example Application of the Library 'Steerable Parallel Coordinates in D3'

An example application is implemented to show how the library works. Not all functions are shown, but most of them. We use the 'student-marks.csv' dataset to provide an overview of the library.

## Data-Handling

A CSV file is required to visualise a dataset as a parallel coordinate plot. The CSV should be separated by a comma. Otherwise, there are no special requirements. The data can be of categorical or numerical origin. In the folder [data](../example/data/), three example datasets can be viewed. Other datasets should have the same structure.


## Student Example

The student dataset shows several implemented functions. It consists of 9 dimensions and 30 data records. Each record represents one student and their assessment in 8 different subjects.

By launching the example, which is also deployed on [spcd3.netlify.app](https://spcd3.netlify.app/), the start screen appears, where a parallel coordinate plot is generated of the student dataset.

![screenshot](screenshots/startScreen.png)

Now, the user can download the plot, interact with it, and use the functionalities at the bottom, where the plot can also be modified.

## Interactivity within the Plot

Within the plot, a user can perform several actions. The user can invert a dimension, move a dimension, filter a dimension, hide a dimension, set the range of a dimension, hover over record(s), or select record(s).

### Invert a Dimension

To invert a dimension, the user has to click on the arrow at the top of the dimension axis. In the following screenshot, the dimension 'Maths' was inverted.

![screenshot](screenshots/invertDimension.png)

### Move a Dimension

It is possible to move a dimension by dragging the dimension.

![screenshot](screenshots/moveDimension.png)

### Filter Dimension

Users can filter each dimension by dragging the triangles to the bottom or top. The screenshot below provides an example.

![screenshot](screenshots/filterDimension.png)

### Open Context Menu

When a dimension is clicked on with a right mouse click, a context menu opens. The user can hide, invert, set the dimension's range, set the dimension's filter, and reset the filter.

![screenshot](screenshots/contextMenu.png)

When clicking on **Set Range**, a popup window appears. In this window, the user can set a new range by choosing a new minimum and maximum range. He can also reset to the original range.

![screenshot](screenshots/setRange.png)

## Interactivity outside the Plot

The plot's interactivity has now been explained, but it is also possible to modify the plot from outside. A whole set of functions was implemented for this purpose, which are described [here](../lib/LIBRARY.md) and a few of them are shown in this section.

Below the plot, the user can also invert a dimension, change its visibility, move a dimension, set the filter, and set the range of a dimension. In the screenshot below, they are explained:

![screenshot](screenshots/outsideFunc.png)