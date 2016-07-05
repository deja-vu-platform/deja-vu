/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
import {Mean, Helpers, ServerBus} from "mean";

import {COMP_INFO} from "./shared/comp";


const topic_type = new graphql.GraphQLObjectType({
  name: "Topic",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    posts: {"type": new graphql.GraphQLList(topic_type)}
  })
});

const post_type = new graphql.GraphQLObjectType({
  name: "Post",
  fields: () => ({
    name: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    content: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    topics: {
      "type": new graphql.GraphQLList(topic_type)
    }
  })
});

const user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    follows: {
      "type": new graphql.GraphQLList(new graphql.GraphQLUnionType({
        name: "Follow",
        types: [user_type, topic_type],
        resolveType: value => ("username" in value) ? user_type : topic_type
      }))
    },
    posts: {
      "type": new graphql.GraphQLList(post_type)
    }
  })
});


const schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: "Query",
    fields: {
      user: {
        "type": user_type,
        args: {
          username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
        },
        resolve: (root, {username}) => {
          console.log(`getting ${username}`);
        }
      },
      posts: {
        "type": new graphql.GraphQLList(post_type),
        resolve: (root) => {
          console.log("getting posts");
        }
      }
    }
  })
});


const mean = new Mean("bookmark");
const bus = new ServerBus(
    "bookmark", mean.loc, mean.ws, mean.bushost, mean.busport,
    {user: {create: undefined, update: undefined}});

mean.ws.use("/*", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

setTimeout(init_composer, 10 * 1000);  // hack..
setTimeout(init_db, 30 * 1000);  // hack..


function init_composer() {
  console.log("Creating bonds");
  bus.config(COMP_INFO);
}


function init_db() {
  bus.new_atom(
      topic_type, "3", {
        name: "hello",
        posts: [{atom_id: "1"}, {atom_id: "2"}]
      });
  bus.new_atom(
      post_type, "1", {
        name: "1",
        content: "hello, I'm Ben",
        topics: [{atom_id: "3"}]
      });
  bus.new_atom(
      post_type, "2", {
        name: "2",
        content: "hello, I'm Alyssa",
        topics: [{atom_id: "3"}]
      });
  bus.new_atom(
      user_type, "1", {
        username: "benbitdiddle", follows: [],
        posts: [{atom_id: "1"}]
      });
  bus.new_atom(
      user_type, "2", {
        username: "alyssaphacker", follows: [],
        posts: [{atom_id: "2"}]
      });
}


Helpers.serve_schema(mean.ws, schema);
