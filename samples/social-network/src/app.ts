/// <reference path="../typings/tsd.d.ts" />
//import {Promise} from "es6-promise";
// const graphql = require("graphql");
// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");


const elements = [
  {name: "Friend", loc: "@@dv-community-friend"},
  {name: "Auth", loc: "@@dv-access-auth"},
  {name: "Post", loc: "@@dv-messaging-post"},
  {name: "Feed", loc: "@@dv-messaging-feed"}
];

const mean = new mean_mod.Mean("social-network", {});

mean.app.use("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

setTimeout(init_composer, 10 * 1000);  // hack..

function init_composer() {
  console.log("Adding all elements");
  for (let elem of elements) {
    mean.composer.config(`{
      newElement(name: "${elem.name}", loc: "${elem.loc}")
    }`);
  }


  console.log("Creating type bonds");
  mean.composer.config(`{
    newTypeBond(type_bond: {
      types: [
        {element: "Friend", name: "User"},
        {element: "Auth", name: "User"},
        {element: "Post", name: "User"},
        {element: "Feed", name: "Subscriber"},
        {element: "Feed", name: "Publisher"}
      ]
    })
  }`);

  mean.composer.config(`{
    newTypeBond(type_bond: {
      types: [
        {element: "Post", name: "Post"},
        {element: "Feed", name: "Content"}
      ]
    }) 
  }`);

  mean.composer.config(`{
    newTypeBond(type_bond: {
      types: [
        {element: "Feed", name: "Name"},
        {element: "Friend", name: "Username"}
      ]
    })
  }`);


  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(field_bond: {
      fields: [
        {type: {element: "Friend", name: "User"}, name: "friends"},
        {type: {element: "Feed", name: "Subscriber"}, name: "subscriptions"}
      ]
    })
  }`);
}
