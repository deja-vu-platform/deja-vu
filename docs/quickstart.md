---
---

# quickstart 

You are going to need [Node.js](https://nodejs.org/en/) v10 and
[MongoDB](https://www.mongodb.com/download-center/community)
4.0+. Note that you just need the community server version of MongoDB,
you don't need to register or pay any money to Mongo Inc.

## project install

1. clone our [starter template repo](https://github.com/deja-vu-platform/hello-world)
2. in a separate shell, start the mongo deamon with `mongod`
3. navigate to the root of the project directory (the directory
   with the `dvconfig.json` file)
4. run `npm i` to install the project dependencies
5. run `npm start` to start your app locally
6. visit [http://localhost:3000](http://localhost:3000). You should see a "hello world" page.

You can now start [including concepts and creating new pages](./tutorial).
To see your new changes, you have to restart the web
server (Ctrl+C and run `npm start` again).


## uninstall

Simply removing the project directory will remove the `node_modules`
folder that contains the Déjà Vu packages.
