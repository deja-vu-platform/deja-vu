/// <reference path="../typings/tsd.d.ts" />
const graphql = require("graphql");
import {Mean} from "mean-loader";
import {ServerBus} from "server-bus";
import {Helpers} from "helpers";


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


const mean = new Mean();
const bus = new ServerBus(
    mean.fqelement,  mean.ws, {user: {create: undefined, update: undefined}},
    mean.comp, mean.locs);


Helpers.serve_schema(mean.ws, schema);

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
