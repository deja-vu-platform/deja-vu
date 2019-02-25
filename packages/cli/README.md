Déjà Vu CLI
===========

The Déjà Vu CLI is a tool to initialize, develop, and deploy Déjà Vu
applications.

Install
-------

To install you need to have node installed. Once you do, you can install the
Déjà Vu CLI with one of the following commands:

```
npm install -g @deja-vu/cli
yarn global add @deja-vu/cli
```

Interface
---------

  - `dv new <type> <name>` - create a new cliché or action, must be run outside of the dv repo
  - `dv serve` - build the app or cliché in the current directory and run it locally
  - `dv package` - package the cliché so that it can be used in other projects
  - `dv --help` - show the list of dv commands


Guide
-----

### Create a new cliché

To create and serve a new cliché:

```
dv new cliche clichename --pathToDv=deja-vu
cd deja-vu/packages/catalog/cliche-name
dv serve
```

`clichename` must be a single word, all lowercase.

`pathToDv` is the path to the folder where the dv code is located (the repo).
This argument is optional and the default value is the name of the repo,
`deja-vu`. As such, it is recommended that the command be run in the directory
that contains the dv repo.

The newly-created cliché comes with two initial actions to serve as examples,
`create-clichename` and `show-clichename`,
under the assumption that `clichename` is usually the name of the primary entity
in the cliché. Of course, they can and should be updated.

Navigate to ()[http://localhost:3000/] and see the two cliché actions in action.

### Create actions in a cliché

To create an action in a cliché, run the following from the root of
the cliché's directory:

```
dv new action action-name
```

By convention, use kebab-case for the `action-name`.

The command will create the HTML, TypeScript, CSS, and test files for the action.
It will also add the action to `clichename.metadata.ts` and to `app.component.html`
so that it can be used and tested right away. In order for it to be added
correctly to those files, the initial structure of those files shouldn't be changed.
These additions can be skipped using the flags `--skipMetadataImport` and `--skipAppComponentHtml`. The command skips a modification if the relevant code
for that action is already there (e.g. imports in the metadata file).


Development
-----------

If you are developing the cli and you want to test your changes you can build
and reinstall it globally with:

```
npm run package && npm uninstall -g && npm install -g
```

Every cliché package also comes with the `dv` command, so you can prepend `yarn`
or `npm run` to the usual `dv` command, e.g. `yarn dv serve`.


Dv Config
---------

The presence of a dvconfig.json file in a directory indicates that the directory
is the root of a Deja Vu project.

The "actions" property specifies the location of the actions. It has two
properties: "package" and "app". "package" is for specifying the actions that
should be included when packaging a cliche. "app" is for specifying the actions
that will be used when running an app.

By default, all `.html` files are included but the list
of actions to include can be customized with properties "include" and
"exclude".

The "include" and "exclude" properties take a list of
(glob-like file patterns)[https://www.npmjs.com/package/glob#glob-primer].
If "include" is left unspecified, the cli defaults to
including all `.html` files in the containing directory and subdirectories
except those excluded using the "exclude" property.
The `node_modules`, `dist` and `pkg` directories are always excluded. So is
`index.html` and all files ending in something else other than `.html`.
Any action referenced in an `.html` file must be included.

The name of the action is given by the value of `name` in the dvconfig.json and
the name of the html file up to the first `.` (e.g., for a file named
`show-groups.component.html` or `show-groups.html` and `name: 'group'` the
action name is `group-show-groups`). This default behavior can be overriden
with the "names" property that accepts a list of objects with "for" and "use"
properties. For example, if the "names" list contains
`{ "for": "src/app/app.component.hml", "use": "allocator-root" }` then
`allocator-root` will be used as the name for the action
`src/app/app.component.html` instead of the default name which is
`allocator-app` if the value of `name` in the dvconfig.json file is `allocator`.

