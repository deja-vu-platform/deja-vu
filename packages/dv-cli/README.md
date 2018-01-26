Déjà Vu CLI
===========

The Déjà Vu CLI is a tool to initialize, develop, and deploy Déjà Vu
applications.

Install
-------

To install you need to have node installed. Once you do, you can install the
Déjà Vu CLI with:

```
npm install -g dv-cli
```

Interface
---------

  - `dv new` - create a new app, cliché, or action
  - `dv serve` - build the app, run it locally and watch for changes
  - `dv install` - install a cliché
  - `dv uninstall` - uninstall a cliché
  - `dv package` - package the cliché so that it can be used in other projects


Guide
-----

### Create a new app

To create and serve a new app or cliché:

```
dv new app my-app
cd my-app
dv serve
```

This will generate a bunch of files. If you know Angular and TypeScript they
will make sense to you but if you don't then it doesn't matter since for
most apps you'll only have to write HTML and CSS.

Navigate to ()[http://localhost:4200/]. The app will automatically reload if you
change any of the source files.
