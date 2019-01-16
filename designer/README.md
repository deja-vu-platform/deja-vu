# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
Run `yarn start` to open the app with hot reloading.

## Production
Run `yarn prod` to open a built version of the app. Currently the production build fails due to issues in the clichés so this is not a true production version.

## How to add a cliché
1. Add to `package.json` and install.
2. In `src/app/cliche/cliche.module.ts`
  - Import it.
  - Add it to the `importedCliches` object.
