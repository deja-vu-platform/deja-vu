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

Each cliché and sample is its own node project. Like any other node project, you need to run
`npm install` to install dependencies. Since we use TypeScript, you also need to run
`typings install` to install type dependencies. We use Grunt to compile and run the code. To build
a library do `grunt lib` and to build a cliche `grunt dv-mean:lib`. You can also
see a "development" page for a cliché with `grunt dv-mean:dev`. The development
page will display all widgets.

You can install and build all packages in this repo using `node install-all.js`.

To run a sample do `npm start`. You also need to start the mongo daemon before running any
cliche, to do so run `mongod`. To check the sample visit `http://localhost:3000`
