/// <reference path="../typings/tsd.d.ts" />
//import {Promise} from "es6-promise";
// const graphql = require("graphql");
// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");


const mean = new mean_mod.Mean("social-network", {});

mean.app.use("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

setTimeout(init_composer, 10 * 1000);  // hack..

function init_composer() {
  console.log("Creating type bonds");
  mean.composer.config(`{
    newTypeBond(types: [
      {name: "User", element: "friend", loc: "@@dv-community-friend"},
      {name: "User", element: "auth", loc: "@@dv-access-auth"},
      {name: "User", element: "post", loc: "@@dv-messaging-post"},
      {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed"}
    ])
  }`);

  /*
  // this doesn't work...type bonds must always be between root types
  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Post", element: "post", loc: "@@dv-messaging-post"},
      {name: "Content", element: "feed", loc: "@@dv-messaging-feed"}
    ])
  }`);
  */

  // can only have field bonds if the types (domain) are already bonded
  // the codomain must have the same type (maybe not?)
  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "published",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed"}
      },
      {
        name: "posts",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post"}
      }
    ])
  }`);
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "friends",
        type: {name: "User", element: "friend", loc: "@@dv-community-friend"}
      },
      {
        name: "subscriptions",
        type: {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed"}
      }
    ])
  }`);

  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "username",
        type: {name: "User", element: "friend", loc: "@@dv-community-friend"}
      },
      {
        name: "username",
        type: {name: "User", element: "auth", loc: "@@dv-access-auth"}
      },
      {
        name: "username",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post"}
      },
      {
        name: "name",
        type: {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed"}
      },
      {
        name: "name",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed"}
      }
    ])
  }`);
}
