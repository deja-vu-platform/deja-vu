Déjà Vu
=======

Code
----

The Déjà Vu code is organized as follows:

- `catalog/` contains all the clichés organized by category
- `core/` contains the core platform libraries
- `gql/`, `grafo/` and `helpers/` contain useful libraries to build
   clichés
- `samples/` contains a set of samples that use the clichés


Building and running
--------------------

You need to be running npm v3 and node v6. Also, you need to have `grunt-cli` installed so that you
can run grunt from the command line and the directory containing `mongod` has to be in your path.

Each cliché and sample is its own node project. Like any other node project, you
need to run `npm install` to install dependencies. To build a library or a
cliché do `npm run lib`. To run a cliché or an app do `npm start`. When a
cliché is run it shows a "development" page that displays all widgets.

To check the running cliché or app visit `http://localhost:3000`

Some projects depend on others so you need to build the dependencies first.
If you follow these steps in order then everything should work:
  1. `npm i` and `npm run lib` in `core/server-bus`, `core/client-bus`, and `core/mean-loader`
  2. `npm i` and `npm run lib` in `core/lang`
  3. `npm i` and `npm run lib` in `gql`, `grafo`, `helpers`
  4. `npm i` and `npm run lib` in each cliché under `catalog` (e.g., `npm i` and `npm run lib` in `catalog/community/market`)
  5. `npm i` in each sample under `samples` (e.g., `npm i` in `samples/morg`)
