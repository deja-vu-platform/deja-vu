# Déjà Vu

Déjà Vu is an experimental platform for building web apps. It features
built-in user functionality for rapid construction of apps
with complex behavior and rich user interfaces.

To build apps using Déjà Vu you configure and compose *clichés*, drawn from a catalog
developed by experts. A cliché implements a *concept*: a self-contained,
reusable, increment of functionality that is motivated by a purpose defined in
terms of the needs of a user (for example, think of the "comment" functionality
you can find on Facebook, or the "rating" functionality on Amazon).
Clichés include all the necessary parts to achieve the required
functionality&mdash;from the front-end GUI to the back-end data
storage&mdash;and export a collection of "actions"&mdash;composable GUI elements.

Building apps with Déjà Vu boils down to tuning the clichés you need via
configuration variables (using JSON) and linking actions to create pages (using
the Déjà Vu language). You can also use CSS to customize the appearance of your
app. Read the [tutorial](docs/tutorial.md) for more information.

**Déjà Vu is a research prototype and you shouldn't rely on it for anything
important at this point**, but we would love to hear what you think!
You can play around with it and shoot us an email or create an issue with your
feedback or questions. See the [roadmap](ROADMAP.md) for a list of things
we plan to work on next.

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

## Running

At this point, the easiest way to run Déjà Vu is to clone our repo and install
everything from source. Good news is that if you want to contribute code, you'll
be all set to do so.

You are going to need [yarn](https://yarnpkg.com) v1.10+,
[node](https://nodejs.org) v9+ and [MongoDB](https://www.mongodb.com/) 4.0+.

Each cliché and sample is its own node project. We use yarn workspaces to make
it easier to build and install all packages. To install and build everything
do `yarn` (running `yarn` with no command will run `yarn install`). Unfortunately,
yarn has a [bug](https://github.com/yarnpkg/yarn/issues/3421) that
affects our installation process, so the first `yarn` will fail. After
the first `yarn` fails, run `yarn --check-files` and everything should work.

Installation will take a while as it downloads dependencies and builds all
clichés and core libraries. 

To run a cliché or an app start the mongo daemon with `mongod` (all of our clichés
and the runtime system use MongoDB) and then in a separate shell `cd` into the
cliché or app you want to run and do `yarn start`.

To check the running cliché or app visit `http://localhost:3000`.

When a cliché is run it shows a "development" page that is used for testing.

Yarn will symlink dependencies so if you make a change to a cliché you are using
in an app, the only thing you need to do is rebuild the cliche with
`yarn package` and restart your app.
