# Designer
*A WYSIWYG application builder for Déjà Vu*

## Requirements
You must use Node 9 and NPM 5. This also assumes the directory structure of the Déjà Vu project.

## Development
- `npm start` -- start the app (`http://localhost:4200/`)
- `npm run lint` -- check & fix code quality

## How to add a cliché
1. Add to `package.json` and install.
2. In `src/app/cliche/cliche.module.ts`
  - Import it.
  - Add it to the `importedCliches` object.
