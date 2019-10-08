Déjà Vu CLI
===========

The Déjà Vu CLI is a tool to initialize and develop Déjà Vu concepts and apps.

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

  - `dv new <type> <name>` - create a new concept or component
  - `dv serve` - build the app or concept in the current directory and run it locally
  - `dv package` - package the concept so that it can be used in other projects
  - `dv --help` - show the list of dv commands


Guide
-----

### Create a new concept

To create and serve a new concept:

```
dv new concept conceptname --pathToDv=deja-vu
cd deja-vu/packages/catalog/concept-name
dv serve
```

`conceptname` must be a single word, all lowercase.

`pathToDv` is the path to the folder where the dv code is located (the repo).
This argument is optional and the default value is the name of the repo,
`deja-vu`. As such, it is recommended that the command be run in the directory
that contains the dv repo.

The newly-created concept comes with four initial components to serve as examples
for each of the CRUD (create, read, update, and delete) operations.
They are called `create-conceptname`, `delete-conceptname`, `show-conceptname`, and `update-conceptname`,
under the assumption that `conceptname` is usually the name of the primary entity
in the concept. Each `conceptname` object starts out with an `id` field to
uniquely identify each object, and an editable `content` field.
Of course, all of the above can and should be updated.

Navigate to [http://localhost:3000/](http://localhost:3000/) and see the four concept components in component.
All the CRUD operations they represent should already work.

### Create components in a concept

To create a component in a concept, run the following from the root of
the concept's directory:

```
dv new component type entityname component-name
```

By convention, use kebab-case for the `component-name`, and a single word for
the `entityname` on which to perform the component.

There are five possible `type` parameters that can be used:
`blank`, `create`, `show`, `update`, and `delete`. The first creates a blank
component, while the rest each create a component for the one of the CRUD operations,
respectively. If `blank` is specified as the `type`, the parameter `entityName`
will be the component name (the parameter `component-name` will be unused). For other `type`s, the default component name is `type-entityname`.
Here are a few examples that demonstrate the above rules:

```
# create the choose-event component with the blank template
dv new component blank choose-event

# create the show-event component
dv new component show event

# create the edit-event component using the update component template
dv new component udpate event edit-event
```

The command will create the HTML, TypeScript, CSS, and test files for the component.
It will also add the component to `conceptname.metadata.ts` and to `app.component.html`
so that it can be used and tested right away. In order for it to be added
correctly to those files, the initial structure of those files shouldn't be changed.
These additions can be skipped using the flags `--skipMetadataImport` and `--skipAppComponentHtml`. The command skips a modification if the relevant code
for that component is already there (e.g. imports in the metadata file).


Development
-----------

If you are developing the cli and you want to test your changes you can build
and reinstall it globally with:

```
npm run package && npm uninstall -g && npm install -g
```

Every concept package also comes with the `dv` command, so you can prepend `yarn`
or `npm run` to the usual `dv` command, e.g. `yarn dv serve`.


Dv Config
---------

The presence of a dvconfig.json file in a directory indicates that the directory
is the root of a Deja Vu project.

The "components" property specifies the location of the components. It has two
properties: "package" and "app". "package" is for specifying the components that
should be included when packaging a concept. "app" is for specifying the components
that will be used when running an app.

By default, all `.html` files are included but the list
of components to include can be customized with properties "include" and
"exclude".

The "include" and "exclude" properties take a list of
[glob-like file patterns](https://www.npmjs.com/package/glob#glob-primer).
If "include" is left unspecified, the cli defaults to
including all `.html` files in the containing directory and subdirectories
except those excluded using the "exclude" property.
The `node_modules`, `dist` and `pkg` directories are always excluded. So is
`index.html` and all files ending in something else other than `.html`.
Any component referenced in an `.html` file must be included.

The name of the component is given by the value of `name` in the dvconfig.json and
the name of the html file up to the first `.` For example, for a file named
`show-groups.component.html` or `show-groups.html` and `name: 'group'` the
component name is `group-show-groups`. This default behavior can be overriden
with the "names" property that accepts a list of objects with "for" and "use"
properties. For example, if the "names" list contains
`{ "for": "src/app/app.component.hml", "use": "allocator-root" }` then
`allocator-root` will be used as the name for the component
`src/app/app.component.html` instead of the default name which is
`allocator-app` if the value of `name` in the dvconfig.json file is `allocator`.

