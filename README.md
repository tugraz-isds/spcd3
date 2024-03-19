# Steerable Parallel Coordinates in D3

SPC in D3 is primarily a library for generating parallel coordinates with interaction.
This project contains the library and an already implemented example
that the library is using. In addition, the project uses D3v7.

A live version of the `main` branch can be found at
[spcd3.netlify.app](https://spcd3.netlify.app/).

## Built With

As mentioned, the library uses D3v7 but not the entire library; only some modules from [D3](https://d3js.org/) are used.

The modules we are using are:
 - d3-dsv
 - d3-selection
 - d3-drag
 - d3-shape
 - d3-axis
 - d3-scale
 - d3-transition

 We are using [Mini SVG data: URI](https://github.com/tigt/mini-svg-data-uri#readme) to convert SVGs in data URIs and [xml-formatter](https://github.com/chrisbottin/xml-formatter#readme) to get a pretty downloaded SVG file of the parallel coordinate plot.

 We are using [gulp](https://gulpjs.com/) and [rollup](https://rollupjs.org/) to bundle and build the library.


## Getting Started

### Prerequisites

Open terminal and execute the following command to install all the dependencies:


``` 
npm install 
```

### Build And Development

Gulp is used to automate repeatable tasks. The file [gulpfile.js](gulpfile.js)
defines for now three public tasks:

- The `clean` task removes the existing `dist` directory in
  order to enable a clean rebuild of the project.

- The `build` task creates a new build of the library and stores the generated .js file into
  `dist/library` folder. Additionally, the example folder is copied to the `dist/example` folder.

- The `serve` task executes the build task, then additionally executes a private task called watcher which 
is used to initialize a live server which serves the `dist/example` directory.


The public tasks can be invoked either by directly running gulp or
by running the equivalent scripts in package.json:

```
npm run clean
npx gulp clean

npm run build
npx gulp build

npm run serve
npx gulp serve
```

## Usage

As mentioned in the beginning, we implemented an example to show how the library works and what the parallel coordinate plot will look like in addition to the library.

[Here](./src/lib/LIBRARY.md) is a listing of all available functions to give an overview of the API. Furthermore, we generated with the **student-marks** dataset, which can be found in the folder [data](./src/example/data/), a small explanation. The explanation can be found [here](./src/example/DESCRIPTION.md).

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
