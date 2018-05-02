Déjà Vu
=======

Building and running for development
------------------------------------

You need to be running npm v5, node v9 and at least MongoDB 3.4. The directory 
containing `mongod` has to be in your path.

Each cliché and sample is its own node project. Like any other node project, you
need to run `npm install` to install dependencies. To build a library, cliché
or app do `npm run build`. To run a cliché or an app do `npm start`. When a
cliché is run it shows a "development" page that is used for testing.

To check the running cliché or app visit `http://localhost:3000`

Some projects depend on others so you need to build the dependencies first.
If you follow these steps in order then everything should work:
  1. `npm i`, `npm run package` and `npm i -g` in `packages/dv-cli` to install
      the cli globally
  2. `npm i` and `npm run package` in `packages/dv-core` and
      `packages/dv-gateway`
  3. `npm i` and `npm run package` in each cliché under `catalog` (e.g.,
     `npm i` and `npm run package` in `catalog/event`)
  4. `npm i` in each sample under `samples` (e.g., `npm i` in `samples/morg`)

If you are developing a sample app and make a change in a cliché you need to
repackage that cliché and reinstall it.
