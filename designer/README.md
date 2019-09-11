# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
Run `yarn start` to host the app at `localhost:4200` and open it in Electron. If you'd rather use a browser, run `yarn serve` to host the app without starting Electron (some features will be disabled).

Don't forget to start the mongo daemon with `mongod` in a separate shell.

## Production
Run `yarn prod` build the app and open it in Electron. Currently the production build fails due to issues in the concepts so this is a development build.

## Samples
The [`designer/samples/`](https://github.com/spderosso/deja-vu/tree/master/designer/samples) directory contains apps built with the 
designer. Note that you won't be able to open the sample apps under [`samples/`](https://github.com/spderosso/deja-vu/tree/master/samples) 
in the designer. These were built using the HTML language.

The designer save apps in a JSON files. You can load the JSON file for an app and modify it and/or export the app.
If you choose to export the app,
you can then run `yarn` in its directory to install its dependencies and `yarn start` to run the app at [http://localhost:3000](http://localhost:3000).

## How to add a concept
1. Add to `package.json` and install.
2. In `src/app/concept/concept.module.ts`
  - Import it.
  - Import and add its documentation.
  - Add it to the `importedConcepts` object.
