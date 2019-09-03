# Déjà Vu

Déjà Vu is an experimental platform for building web apps. It features
built-in user functionality for rapid construction of apps
with complex behavior and rich user interfaces.

To build apps using Déjà Vu you configure and compose *concepts*, drawn from a catalog
developed by experts. A concept is a self-contained,
reusable, increment of functionality that is motivated by a purpose defined in
terms of the needs of a user (for example, think of the "comment" functionality
you can find on Facebook, or the "rating" functionality on Amazon).
Concepts include all the necessary parts to achieve the required
functionality&mdash;from the front-end GUI to the back-end data
storage&mdash;and export a collection of "components"&mdash;composable GUI elements.

Building apps with Déjà Vu boils down to tuning the concepts you need via
configuration variables (using JSON) and linking actions to create pages (using
the Déjà Vu language). You can also use CSS to customize the appearance of your
app. Read the [tutorial](docs/tutorial.md) for more information.

**Déjà Vu is a research prototype and you shouldn't rely on it for anything
important at this point**, but we would love to hear what you think!
You can play around with it and shoot us an email or create an issue with your
feedback or questions.

## Motivation

As a user, you might have noticed the fundamental similarities between the
many applications you use on a day-to-day basis. Maybe it was the day you
were scrolling through your Facebook news feed and then through your
Twitter feed; or giving a 5-star review to a restaurant in Yelp, and then
to a book on Amazon; or replying to a tweet and then to a comment on Hacker
News. And while you as a user are experiencing the same rating concept, for
example, in multiple applications, developers all over the world are
implementing that concept afresh as if it had never been implemented before.

In each of these cases, the developer may be implementing something slightly
different: a rating of a post in one case, for example, and a user in another.
Our premise, however, is that fundamentally they are all doing the same thing,
and much of the work in building an application involves combining pre-existing
*concepts* in novel ways. If we could exploit this fact, applications might be
assembled with much less effort.

## Create an App

- If you haven't done so already, install [Node.js](https://nodejs.org) v9-11. v10 is the release recommended by node for most
users. [We don't currently support v12](https://github.com/spderosso/deja-vu/issues/352)
- If you haven't done so already, install [MongoDB](https://www.mongodb.com/) 4.0+
- Clone the app-starter-repo
- In a separate terminal, start MongoDB locally with `mongod`
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

Note: If you see errors of the kind `npm` not found, it means
that you don't have `npm`. Usually, npm is distributed with node, but depending on how you
installed node you might have to additionally install npm.

Each concept and sample is its own node project. We use yarn workspaces to make
it easier to build and install all packages. First,
[clone](https://help.github.com/en/articles/cloning-a-repository) this github repo.
Then, `cd` into the project source directory. 
Once you are there, run `yarn` to install and build everything
(running `yarn` with no command will run `yarn install`).
Unfortunately, yarn has a [bug](https://github.com/yarnpkg/yarn/issues/3421) that
affects our installation process, so the first `yarn` will fail. After
the first `yarn` fails, run `yarn --check-files` and everything should work.

If `yarn --check-files` fails, try the following:
- `cd packages/compiler` and `yarn package`
- `cd ../cli` and `yarn package`
- then `yarn --check-files` again

Installation will take a while as it downloads dependencies and builds all
concepts and core libraries. 

To run a concept or an app start the mongo daemon with `mongod` (all of our concepts
and the runtime system use MongoDB) and then in a separate shell `cd` into the
concept or app you want to run and do `yarn start`.

To check the running concept or app visit `http://localhost:3000`.

When a concept is run it shows a "development" page that is used for testing.

Yarn will symlink dependencies so if you make a change to a concept you are using
in an app, the only thing you need to do is rebuild the concept with
`yarn package` and restart your app.
