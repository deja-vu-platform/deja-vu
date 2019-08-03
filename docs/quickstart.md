---
---

# quickstart 

To start, you only need to download and
install the re# CLI. The CLI will take care of running your
re# app and installing other re# packages if necessary.

You are going to need [Node.js](https://nodejs.org/en/) v9+ and
[MongoDB](https://www.mongodb.com/download-center/community)
4.0+. Note that you just need the community server version of MongoDB,
you don't need to register or pay any money to Mongo Inc.

You can install the CLI globally or you
can create an npm project and install it locally
as a dependency.


## global install

1. run `npm -ig @rehash/cli`. After doing this, the `re` command should be
  available
2. create a folder for you app and write a `config.json` file
3. in a separate shell, start the mongo deamon with `mongod`
4. navigate to the root of the project directory (where
  you put `config.json`) and run `re serve`. This will start your app
  locally
5. visit [http://localhost:3000](http://localhost:3000).

## project install

1. clone our [template repo]()
2. in a separate shell, start the mongo deamon with `mongod`
3. navigate to the root of the project directory (where
  you put `config.json`)
4. run `npm i` to install the project dependencies (the CLI)
5. run `npm start` to start your app locally
6. visit [http://localhost:3000](http://localhost:3000).


## uninstall

If you've installed the CLI globally, do `npm rm -g @rehash/cli`.
If you've installed it locally in your project there's nothing to uninstall.
Simply removing the project directory will remove the `node_modules`
folder that contains the CLI package.