# SteerableParallelCoordinates

## How to build the SPC library

### Install dependencies
- Open terminal and execute the following command:
  - npm install

### Compile SPC library
- Navigate to ParallelCoordinates folder
- Open terminal and execute the following command:
  -  tsc -p tsconfig.json
- Then you should see the parallelcoordinates.js file in the lib folder

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

