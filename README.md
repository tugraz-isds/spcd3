# Steerable Parallel Coordinates in D3 (SPCD3)

SPCD3 is a JavaScript library which implements a parallel coordinates
visualisation.  This project contains the library and an already
implemented example that the library is using. In addition, the
project uses D3v7.

A live version of the latest deployment can be found at
[https://tugraz-isds.github.io/spcd3](https://tugraz-isds.github.io/spcd3).

## Built With

As mentioned, the library uses D3v7 but not the entire library;
only some modules from [D3](https://d3js.org/) are used.

The modules we are using are:
- d3-dsv
- d3-selection
- d3-drag
- d3-shape
- d3-axis
- d3-scale
- d3-transition

In addition to D3, the following JavaScript libraries are used:
 - [Mini SVG data: URI](https://github.com/tigt/mini-svg-data-uri#readme):
   To convert SVGs in data URIs.
 - [xml-formatter](https://github.com/chrisbottin/xml-formatter#readme):
   To prettify the SVG file of the parallel coordinate plot for download.

The task runner [Gulp](https://gulpjs.com/) is used to automate
repeatable tasks and [Rollup](https://rollupjs.org/)
is used to bundle and build the library.



## Getting Started

### Prerequisites

Open terminal and execute the following command to install all the dependencies:


``` 
npm install 
```

### Build And Development

Gulp is used to automate repeatable tasks. The file [gulpfile.js](gulpfile.js)
defines four public tasks:

<br/>

 `clean` removes the existing `dist/` directory in
  order to enable a clean rebuild of the project:
```
  npx gulp clean
```

<br/>

`cleanAll` restores the project folder to its virgin state,
  by deleting the existing `dist/` and `node_modules/` directories
  and the `package-lock.json` file:
```
  npx gulp cleanAll
```

<br/>

`build` creates a new build of the library in three formats (CJS, ESM, IIFE)
  and stores the generated library packages into the `dist/library/` folder.
  Additionally, the example folder is copied to `dist/example/`:
```
  npx gulp build
```

<br/>

`serve` executes the build task, then additionally executes a private task
  called watcher, which starts live web server in the `dist/example/` folder:
```
  npx gulp serve
```

<br/>

Each of the public Gulp tasks can also be invoked by running the
equivalent npm script defined in package.json.

**Important:** To run the build, a live web server must be started.

## Usage

As mentioned in the beginning, an example was implemented to show how
the library works and what the parallel coordinate plot will look like
in addition to the library.

The [API Guide](./API.md) lists all available functions in SPCD3's
API.

An example application was built to illustrate the use of the SPCD3
library. It is described in the [Example Application
Guide](./EXAMPLE.md).




## Data-Handling

A CSV file is required to visualise a dataset as a parallel coordinate
plot. The CSV should be separated by a comma. Otherwise, there are no
special requirements. Data dimensions can be categorical or
numerical. Three example datasets can be found in folder
[data](./src/example/data/). Other datasets should have the same
structure.


## Example Datasets

- Student Marks Dataset

A fictitious dataset of student marks between 0 and 100 for 30
students in 8 subjects. The spreadsheet has a header row and 30 rows
of data (records), and 9 columns (dimensions) including the name of
the student
([Source](https://github.com/burimvrella/SteerableParallelCoordinates/blob/main/lib/example/data/student-marks_v2.csv)).

- Cereals Dataset

A dataset with 77 cereals and their characteristics. The spreadsheet
has a header row and 77 rows of data, and 15 columns including the
name of the cereal
([Source](https://lib.stat.cmu.edu/datasets/1993.expo/)).

- Cities Dataset

A dataset about prices and earnings for ~70 cities all over the
world. The spreadsheet has a header row and about 70 rows of data, and
58 columns including the city name
([Source](https://ubs.com/global/en/media/display-page-ndp/en-20120914-20120914a.html)).



## License

SPCD3 is distributed under the MIT License. See [LICENSE](LICENSE) for
more information.
