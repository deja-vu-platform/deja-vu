# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
Run the app with `yarn dev` or `yarn prod`. The former gives you hot reloading while the latter allows you to interact with the filesystem.

## Production
This is still a work in progress. One cannot yet build a working app with it.

## How to add a cliché
1. Add to `package.json` and install.
2. In `src/app/cliche/cliche.module.ts`
  - Import it.
  - Add it to the `importedCliches` object.
