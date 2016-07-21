/// <reference path="../typings/tsd.d.ts" />
import {Mean} from "mean-loader";
import {ServerBus} from "server-bus";


const mean = new Mean();
const bus = new ServerBus(
    mean.fqelement,  mean.ws, {user: {create: undefined, update: undefined}},
    mean.comp, mean.locs);

mean.start();

setTimeout(init_db, 30 * 1000);  // hack..

function init_db() {
  console.log("Initializing DB");
  bus.create_atom(
      "Topic", "3", {
        name: "hello",
        posts: [{atom_id: "1"}, {atom_id: "2"}]
      });
  bus.create_atom(
      "Post", "1", {
        name: "1",
        content: "hello, I'm Ben",
        topics: [{atom_id: "3"}]
      });
  bus.create_atom(
      "Post", "2", {
        name: "2",
        content: "hello, I'm Alyssa",
        topics: [{atom_id: "3"}]
      });
  bus.create_atom(
      "User", "1", {
        username: "benbitdiddle", follows: [],
        posts: [{atom_id: "1"}]
      });
  bus.create_atom(
      "User", "2", {
        username: "alyssaphacker", follows: [],
        posts: [{atom_id: "2"}]
      });
}
