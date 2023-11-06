# Steerable Parallel Coordinates in D3

## How to build the spcd3 library

### Install dependencies
- Open terminal and execute the following command to install all of the dependencies:


``` 
npm install 
```

### Gulp Build And Development

Gulp is used to automate repeatable tasks. The file [gulpfile.js](gulpfile.js)
defines for now two public tasks:

- The `clean` task removes the existing `package` directory in
  order to enable a clean rebuild of the project.

- The `build` task creates a new build of the framework and stores the generated .js file into
  `package` folder.


The public tasks can be invoked either by directly running gulp or
by running the equivalent scripts in package.json:

```
npm run clean
gulp clean

npm run build
gulp build
```

## Project Git Workflow

### Example
- e.g. Feature "implement..." -> create a branch with the name "implement..." -> implement the functions -> create a merge request to the dev branch
-> let another member take a look at the merge request -> if everything is ok accept merge request -> if the project is finished we merge the dev branch into the main branch and publish the work

### Main Branch
- The main branch is only for the release
- Every participant needs to accept the merge request from the dev branch
- Only the dev branch can be merged into the main branch.

### Dev Branch
- The dev branch is used to merge feature branches
- The merge of a feature branch can be done only if another member accepts the merge request

### Feature Branch
- Feature branches are to be created for every new functionality that needs to be implemented
- After finishing the implementation of the feature create a merge request to the dev

