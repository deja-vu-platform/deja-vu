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

  - `dv new` - create a new app
  - `dv action` - list, create or delete actions
  - `dv serve` - build the app, run it locally and watch for changes
  - `dv build` - compile the application 
  - `dv cliche` - list, install and uninstall clichés


Guide
-----

### Create a new app

To create and serve a new app or cliché:

```
dv new my-app
cd my-app
dv serve
```

This will generate a bunch of files. If you know Angular and TypeScript they
will make sense to you but if you don't then it doesn't matter since for
most apps you'll only have to write HTML and CSS.

Navigate to ()[http://localhost:4200/]. The app will automatically reload if you
change any of the source files.

There are a few important files and directories to be aware of:
 - `dvconfig.json`: configuration file for this project. See dv config 
 - `src/actions`: directory containing all actions of this project.

When you create a new app with `dv new` a default `dvconfig.json` file and
a `main` action is created.


### Creating actions

To create an action of name `foo` you can create of a new html file in
`src/actions/foo/foo.html` or use `dv action -c foo`.
