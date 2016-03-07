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
      {name: "user", element: "friend", loc: "@@dv-community-friend"},
      {name: "user", element: "auth", loc: "@@dv-access-auth"},
      {name: "user", element: "post", loc: "@@dv-messaging-post"},
      {name: "subscriber", element: "feed", loc: "@@dv-messaging-feed"},
      {name: "publisher", element: "feed", loc: "@@dv-messaging-feed"}
    ])
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "post", element: "post", loc: "@@dv-messaging-post"},
      {name: "content", element: "feed", loc: "@@dv-messaging-feed"}
    ])
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "name", element: "feed", loc: "@@dv-messaging-feed"},
      {name: "username", element: "friend", loc: "@@dv-community-friend"}
    ])
  }`);


  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "friends",
        type: {name: "user", element: "friend", loc: "@@dv-community-friend"}
      },
      {
        name: "subscriptions",
        type: {name: "subscriber", element: "feed", loc: "@@dv-messaging-feed"}
      }
    ])
  }`);
}
