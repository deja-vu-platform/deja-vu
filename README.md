Déjà Vu
=======

Code
----

The Deja Vu code is organized in the following way:

- `catalog/` contains all the clichés organized by category
- `core/` contains the core platform libraries
- `gql/`, `grafo/` and `helpers/` contain useful libraries used to build the
   clichés
- `samples/` contains a set of samples that use the clichés


Building and running
--------------------

Each cliché and sample is its own node project. Like any other node project, you need to run
`npm install` to install dependencies. Since we use typescript, you also need to run
`typings install` to install type dependencies. We use Grunt to compile and run the code. To build
a library do `grunt lib`, to build a cliche `grunt dv-mean:lib`, to run a sample
`grunt dv-mean:test`. You also need to start the mongo daemon before running any
cliche, to do so run `mongod`.
