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

/*
 * - Users create posts and attach topics to them
 * - Users can follow other users or topics
 * - Users get a feed with all the posts of the users or topics they follow
 */
function init_composer() {
  console.log("Creating type bonds");
  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Source", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-1"},
      {name: "Source", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "User", element: "auth", loc: "@@dv-access-auth-1"},
      {name: "User", element: "post", loc: "@@dv-messaging-post-1"},
      {name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ])
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Item", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Post", element: "post", loc: "@@dv-messaging-post-1"}
    ])
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Label", element: "label", loc: "@@dv-organization-label-1"},
      {name: "Target", element: "follow", loc: "@@dv-community-follow-2"}
    ])
  }`);

  mean.composer.config(`{
    newTypeBond(types: [
      {name: "Target", element: "follow", loc: "@@dv-community-follow-2"},
      {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
    ])
  }`);


  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "published",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
      },
      {
        name: "posts",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      }
    ])
  }`);
  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "follows",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "follows",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "subscriptions",
        type: {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      }
    ])
  }`);


  mean.composer.config(`{
    newFieldBond(fields: [
      {
        name: "name",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        type: {
          name: "Target", element: "follow", loc: "@@dv-community-follow-1"
        }
      },
      {
        name: "name",
        type: {
          name: "Source", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "name",
        type: {
          name: "Target", element: "follow", loc: "@@dv-community-follow-2"
        }
      },
      {
        name: "username",
        type: {name: "User", element: "auth", loc: "@@dv-access-auth-1"}
      },
      {
        name: "username",
        type: {name: "User", element: "post", loc: "@@dv-messaging-post-1"}
      },
      {
        name: "name",
        type: {
          name: "Subscriber", element: "feed", loc: "@@dv-messaging-feed-1"
        }
      },
      {
        name: "name",
        type: {name: "Publisher", element: "feed", loc: "@@dv-messaging-feed-1"}
      }
    ])
  }`);
}
