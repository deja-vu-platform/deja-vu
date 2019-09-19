# Déjà Vu

Déjà Vu is an experimental platform for building web apps.
It features a catalog of full-stack functionality and an HTML-like language for
assembling web apps using the catalog.

To build apps using Déjà Vu you configure and compose *concepts*, drawn from a catalog
developed by experts. A concept is a self-contained,
reusable, increment of functionality that is motivated by a purpose defined in
terms of the needs of a user. For example, think of the "comment" functionality
you can find on Facebook, or the "rating" functionality on Amazon.
Concepts include all the necessary parts to achieve the required
functionality&mdash;from the front-end GUI to the back-end data
storage&mdash;and export a collection of *components*&mdash;composable GUI elements.

Building apps with Déjà Vu boils down to tuning the concepts you need via
configuration variables (using JSON) and linking actions to create pages (using
our template language). You can also use CSS to customize the appearance of your
app.

For documentation and more information see
[dejavu-platform.com](https://dejavu-platform.com).

> **Déjà Vu is a research prototype and you shouldn't rely on it for anything
> important at this point**, but we would love to hear what you think!
> You can play around with it and shoot us an email or create an issue with your
> feedback or questions.


## Create an App

- If you haven't done so already, install [Node.js](https://nodejs.org) v9-11. v10 is the release recommended by node for most
users. [We don't currently support v12](https://github.com/spderosso/deja-vu/issues/352). See [help](#installation-helptips).
- If you haven't done so already, install [MongoDB](https://www.mongodb.com/) 4.0+
- Clone the app-starter-repo
- In a separate terminal, start MongoDB locally with `mongod`. See [help](#mongodb)
- On the root directory of your new repo, run `npm start` and visit
`http://localhost:3000`.
You should see a "hello world" page.

You can now start including concepts and creating new pages (see the [tutorial](docs/tutorial.md)). To see your new changes, you have to restart the web
server (Ctrl+C and run `npm start` again).


## Deploying DV Apps

(This won't work until the npm packages are public)

A compiled DV app is a regular MEAN app
(MongoDB-Express-Angular-Node.js). Since a compiled DV app uses popular,
well-supported technologies, it shouldn't be too much work to find out
how to deploy a DV app using your favorite cloud provider.

But, if you don't want to spend too much time on this,
here's how to deploy your app using
Heroku, a popular PaaS:

- Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Run `heroku create myapp` to create a new heroku app. (Replace `myapp` with the name of your app)
- Run `heroku addons:create mongolab` to provision a MongoDB instance
- Deploy your changes by running `git push heroku`

Your new changes should be live. To deploy new changes,
create commits and run `git push heroku` again.


## Contributing

In addition to [node](https://nodejs.org) v9-11 ([not v12](https://github.com/spderosso/deja-vu/issues/352)) and [MongoDB](https://www.mongodb.com/) 4.0+, you are going to need [yarn](https://yarnpkg.com) v1.10+.

Each concept and sample is its own node project. We use yarn workspaces to make
it easier to build and install all packages. First,
[clone](https://help.github.com/en/articles/cloning-a-repository) this github repo.
Then, `cd` into the project source directory. 
Once you are there, run `yarn` to install and build everything
(running `yarn` with no command will run `yarn install`).
Unfortunately, yarn has a [bug](https://github.com/yarnpkg/yarn/issues/3421) that
affects our installation process, so the first `yarn` will fail. After
the first `yarn` fails, run `yarn --check-files` and the installation should
succeed.
If it doesn't, follow [these instructions](#the-manual-approach).

Installation will take a while as it downloads dependencies and builds all
concepts and core libraries.

All of our concepts and the runtime system use MongoDB.
To run a concept or an app start the mongo daemon with `mongod` (see [help](#mongodb)). Then,
in a separate shell `cd` into the concept or app you want to run and do `yarn start`.

To check the running concept or app visit [http://localhost:3000](http://localhost:3000).

When a concept is run it shows a development page that can be used for debugging and manual
testing.

Yarn will symlink dependencies so if you make a change to a concept you are using
in an app, the only thing you need to do is rebuild the concept with
`yarn package` and restart your app.

### Creating New Samples

If you are planning on contributing a new sample app, or you simply want to write
a temporary app to test changes to concepts, you should add your new app under `samples/`.
It is important that you put it under `samples/` so that you can run it like
you run any of the other sample apps. Also, before you do `yarn start`
to run your app, run `yarn` to install dependencies.

Any app under `samples/` is automatically part of the monorepo. Note that there can't
be more than one app with the same package name. Thus, if you are starting your
new app by copy+pasting another app you should change the package name in the
new app's package.json file.

### Creating New Concepts

If you are creating a new concept, it is important that you put it under
`packages/catalog`. Any concept under `packages/catalog` is automatically
part of the monorepo and can be used locally by apps under `samples/`.
If you'd like your new concept to appear in the designer, see the
designer's [readme file](https://github.com/spderosso/deja-vu/tree/master/designer#how-to-add-a-concept)
for instructions.
Note that a concept must have a unique name.

### Website

If you want to make changes to the website, you can test them by
running `bundle exec jekyll serve` under
[docs/](https://github.com/spderosso/deja-vu/tree/master/docs).
The website with your local changes will be served at
[http://localhost:4000](http://localhost:4000).

## Installation Help/Tips

### The Manual Approach

If `yarn --check-files` fails, try the following:
- `cd packages/compiler` and `yarn package`
- `cd ../cli` and `yarn package`
- then `yarn --check-files` again

If it still doesn't work, double check that you are running node v9-11
by running `node --version` in the same shell in which you are running
the `yarn` commands.

### Node

- If you see errors of the kind "npm not found", it means
that you don't have `npm`. Usually, npm is distributed with node, but if you've installed
a very old version of node then you won't have `npm`. If you are on Linux, see the note
below.
- Note to Linux users: to install `node` you should follow the
[official Nodejs instructions](https://nodejs.org/en/download/package-manager/).
Don't do `sudo apt install nodejs`, it will install a very old version of node (v8)
that we don't support.
- If you are running an old version of node you'll get errors during the installation
process. But the error is not going to say "your version of node is too old", so if
you see errors check that the version of node you have is v9-11 by running
`node --version` in the same shell in which you are running the `yarn` commands.

### MongoDB

- The first time you run `mongod`, it will fail because there's no
`/data/db` directory. You can create `/data/db`, or you can ask mongo to use
a different directory.
