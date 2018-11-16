# Designer
*A WYSIWYG application builder for Déjà Vu*

## Development
- `npm start` -- start the app (`http://localhost:4200/`)
- `npm run lint` -- check & fix code quality

## Production
This is still a work in progress. One cannot yet build a working app with it.

## How to add a cliché
1. Add to `package.json` and install.
2. In `src/app/cliche/cliche.module.ts`
  - Import it.
  - Add it to the `importedCliches` object.
