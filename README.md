Déjà Vu
=======

Code
----

The Deja Vu code is organized in the following way:

- `catalog/` contains all the clichés organized by category
- `core/` contains the core platform libraries
- `gql/`, `grafo/` and `helpers/` contain useful libraries to build
   clichés
- `samples/` contains a set of samples that use the clichés


Building and running
--------------------

You need to be running npm v3 and node v6.

Each cliché and sample is its own node project. Like any other node project, you
need to run `npm install` to install dependencies. To build a library or a
cliché do `npm run lib`. To run a cliché or an app do `npm start`. When a
cliché is run it shows a "development" page that displays all widgets.

You can install and build all packages in this repo using `node install-all.js`.

To run a sample do `npm start`. To check the running app visit
`http://localhost:3000`
