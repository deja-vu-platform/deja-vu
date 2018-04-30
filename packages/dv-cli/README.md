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
dv new app my-app path-to-dv
cd my-app
dv serve
```

`path-to-dv` is the path to the folder where the dv code is located (the repo).

This will generate a bunch of files. If you know Angular and TypeScript they
will make sense to you but if you don't then it doesn't matter since for
most apps you'll only have to write HTML and CSS.

Navigate to ()[http://localhost:3000/]. The app will automatically reload if you
change any of the source files.

### Generate actions

```
dv generate action name
```

### Install a cliché

Inside the app directory, do:

```
dv install cliche-name path-to-cliche
```

Development
-----------

If you are developing the cli and you want to test your changes you can build
and reinstall it globally with:

```
npm run clean && npm run build && npm uninstall -g && npm install -g
```

Dv Config
---------

The presence of a dvconfig.json file in a directory indicates that the directory
is the root of a Deja Vu project.

The "actions" property specifies the location of the actions. The property can
be ommitted, in which case it defaults to including all `.html` files. The list
of actions to include can be customized with properties "include" and
"exclude".

The "include" and "exclude" properties take a list of
(glob-like file patterns)[https://www.npmjs.com/package/glob#glob-primer] or
objects with properties "name" and "file".

If "include" is left unspecified, the cli defaults to
including all `.html` files in the containing directory and subdirectories
except those excluded using the "exclude" property.

The `node_modules`, `dist` and `pkg` directories are always excluded. So is
`index.html` and all files ending in something else other than `.html`.
The name of the action is given by the value of `name` in the dvconfig.json and
from the name of the html file up to the first `.` (e.g., for a file named
`show-groups.component.html` or `show-groups.html` and `name: 'group'` the
action name is `group-show-groups`).

Any action referenced in another `.html` file must be included.
