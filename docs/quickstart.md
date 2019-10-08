---
---

# quickstart 

To start, you only need to download and
install the Déjà Vu CLI. The CLI will take care of running your
Déjà Vu app and installing other Déjà Vu packages if necessary.

You are going to need [Node.js](https://nodejs.org/en/) v10 and
[MongoDB](https://www.mongodb.com/download-center/community)
4.0+. Note that you just need the community server version of MongoDB,
you don't need to register or pay any money to Mongo Inc.

You can create an npm project and install the CLI locally
as a dependency (recommended) or you can install the CLI globally.

## project install

1. clone our [template repo]()
2. in a separate shell, start the mongo deamon with `mongod`
3. navigate to the root of the project directory (where
  you put `dvconfig.json`)
4. run `npm i` to install the project dependencies (the CLI)
5. run `npm start` to start your app locally
6. visit [http://localhost:3000](http://localhost:3000).

## global install

1. run `npm -ig @deja-vu/cli`. After doing this, the `dv` command should be
  available
2. create a folder for you app and write a `dvconfig.json` file
3. in a separate shell, start the mongo deamon with `mongod`
4. navigate to the root of the project directory (where
  you put `dvconfig.json`) and run `dv serve`. This will start your app
  locally
5. visit [http://localhost:3000](http://localhost:3000).

## uninstall

If you've installed it locally in your project there's nothing to uninstall.
Simply removing the project directory will remove the `node_modules`
folder that contains the CLI package.
If you've installed the CLI globally, do `npm rm -g @deja-vu/cli`.
