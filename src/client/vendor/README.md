ESLint
======

ESLint doesn't run in the browser as is. The `eslint` repo has a `browserify` script to generate a version that runs in the browser, but we cannot use additional plugins or parser.

We use a modified version with some changes to allow running it in browser with `babel-eslint`. The repository exists here - https://github.com/satya164/eslint-browser

To build the bundle, clone the repo, run `yarn install` and then run `yarn browserify`.

Monaco
======

The scripts for building Monaco can be found in the scripts/ folder.
