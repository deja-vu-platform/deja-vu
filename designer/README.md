# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
Run `yarn start` to host the app at `localhost:4200` and open it in Electron. If you'd rather use a browser, run `yarn serve` to host the app without starting Electron (some features will be disabled).

## Production
Run `yarn prod` build the app and open it in Electron. Currently the production build fails due to issues in the clichés so this is a development build.

## How to add a cliché
1. Add to `package.json` and install.
2. In `src/app/cliche/cliche.module.ts`
  - Import it.
  - Add it to the `importedCliches` object.
