# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
Run `yarn start` to host the app at `localhost:4200` and open it in Electron. If you'd rather use a browser, run `yarn serve` to host the app without starting Electron (some features will be disabled).

Don't forget to start the mongo daemon with `mongod` in a separate shell.

## Production
Run `yarn prod` build the app and open it in Electron. Currently the production build fails due to issues in the concepts so this is a development build.

## Samples
The `samples` directory contains apps built with the designer. You can use the designer to load the `designer-save.json` file and modify and/or export the app. Once the app is exported, run `yarn` in its directory to install its dependencies and `yarn start` to run the app at `localhost:3000`.

## How to add a concept
1. Add to `package.json` and install.
2. In `src/app/concept/concept.module.ts`
  - Import it.
  - Import and add its documentation.
  - Add it to the `importedConcepts` object.
