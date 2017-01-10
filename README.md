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
`tsd install` to install type dependencies. We use Grunt to compile and run the code. To build
a library do `grunt lib`, to build a cliche `grunt dv-mean:lib`, to run a sample
`grunt dv-mean:test`.


Here's a list of annoying things you need to remember to do:

- if you get:
```
node_modules/angular2/src/facade/promise.d.ts(1,10): error TS2661: Cannot re-export name that is not defined in the module.
```
You need to add the following to the top of the file (`node_modules/angular2/src/facade/promise.d.ts`):
```
   declare var Promise;
```
- everytime you do a `grunt lib` you need to edit the ts definition file
under `lib/` and remove the first line (the one with the tripleslashes)

- if you get typing errors, run `tsd install`


To run:
- you need to start the mongo daemon: run `mongod`
