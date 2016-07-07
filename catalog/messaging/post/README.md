Post
====

To avoid duplicate definitions use
```
/// <reference path="../../node_modules/angular2/typings/node/node.d.ts" />
```
in the express and mongodb typings

Also, need to
```
rm -rf node_modules/angular2/typings/es6-shim/
```

declare var Promise: PromiseConstructor;
