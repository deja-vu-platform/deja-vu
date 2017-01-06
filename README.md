dv
==

Here's a list of annoying things you need to remember to do:

- if you get:
```
node_modules/angular2/src/facade/promise.d.ts(1,10): error TS2661: Cannot re-export name that is not defined in the module.
```
You need to add the following to the top of the file:
```
   declare var Promise;
```
- everytime you do a `grunt lib` you need to edit the ts definition file
under `lib/` and remove the first line (the one with the tripleslashes)

- if you get typing errors, run `tsd install`


To run:
- you need to start the mongo deamon: run `mongod`
