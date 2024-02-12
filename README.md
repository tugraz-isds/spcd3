# Steerable Parallel Coordinates in D3

SPC in D3 is primarily a library for generating parallel coordinates with interaction.
This project contains the library and an already implemented example
that the library is using. In addition, the project, but also the example, uses D3v7.

A live version of the `main` branch can be found at
[spcd3.netlify.app](https://spcd3.netlify.app/).

## How to build the spcd3 library

### Install dependencies
- Open terminal and execute the following command to install all the dependencies:


``` 
npm install 
```

### Gulp Build And Development

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
