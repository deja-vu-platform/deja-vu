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
see a "development" page for a cliche with `grunt dv-mean:test`. The development
page will display all widgets.

To run a sample do `npm start`. You also need to start the mongo daemon before running any
cliche, to do so run `mongod`. To check the sample visit `http://localhost:3000`

Note: the migration to using the dv language is currently in progress, to specify new bonds or edit
existing ones you should modify the `comp.json` and `wcomp.json` files
