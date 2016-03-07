/// <reference path="../typings/tsd.d.ts" />
//import {Promise} from "es6-promise";
// const graphql = require("graphql");
// the mongodb tsd typings are wrong and we can't use them with promises
const mean_mod = require("mean");


const elements = [
  {name: "friend", loc: "@@dv-community-friend"},
  {name: "auth", loc: "@@dv-access-auth"},
  {name: "post", loc: "@@dv-messaging-post"},
  {name: "feed", loc: "@@dv-messaging-feed"}
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
        {element: "friend", name: "user"},
        {element: "auth", name: "user"},
        {element: "post", name: "user"},
        {element: "feed", name: "subscriber"},
        {element: "feed", name: "publisher"}
      ]
    })
  }`);

  mean.composer.config(`{
    newTypeBond(type_bond: {
      types: [
        {element: "post", name: "post"},
        {element: "feed", name: "content"}
      ]
    }) 
  }`);

  mean.composer.config(`{
    newTypeBond(type_bond: {
      types: [
        {element: "feed", name: "name"},
        {element: "friend", name: "username"}
      ]
    })
  }`);


  console.log("Creating field bonds");
  mean.composer.config(`{
    newFieldBond(field_bond: {
      fields: [
        {type: {element: "friend", name: "user"}, name: "friends"},
        {type: {element: "feed", name: "subscriber"}, name: "subscriptions"}
      ]
    })
  }`);
}
