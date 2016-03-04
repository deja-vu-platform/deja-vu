/// <reference path="../typings/tsd.d.ts" />
// import * as express from "express";
// import * as mongodb from "mongodb";
let graphql = require("graphql");
let express_graphql = require("express-graphql");

import {Mean} from "mean";


const mean = new Mean("friend", (db, debug) => {
  db.createCollection("users", (err, users) => {
    if (err) throw err;
    if (debug) {
      console.log("Resetting users collection");
      users.remove((err, remove_count) => {
        if (err) throw err;
        console.log(`Removed ${remove_count} elems`);
        users.insertMany([
          {username: "benbitdiddle", friends: []},
          {username: "alyssaphacker", friends: []},
          {username: "eva", friends: []},
          {username: "louis", friends: []},
          {username: "cydfect", friends: []},
          {username: "lem", friends: []}
        ], (err, res) => { if (err) throw err; });
      });
    }
  });
});


let user_type = new graphql.GraphQLObjectType({
  name: "User",
  fields: () => ({
    username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
    friends: {
      "type": new graphql.GraphQLList(user_type),
      resolve: user => {
        console.log(`getting friends of ${user.username}`);
        return user.friends;
      }
    },
    potentialFriends: {
      "type": new graphql.GraphQLList(user_type),
      resolve: ({username}) => {
        console.log(`getting potential friends of ${username}`);
        const query = {
          $and: [
            {friends: {$nin: [username]}},
            {username: {$ne: username}}
          ]};
        return mean.db.collection("users").find(query).toArray();
      }
    }
  })
});

/*
const fields = ast => ast.fields.selections.reduce((fields, s) => {
  fields[s.name.value] = 1;
  return fields;
}, {});*/

let schema = new graphql.GraphQLSchema({
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
          // const fields = {username: 1, friends: {username: 1}}; TODO: project
          return mean.db.collection("users").findOne({username: username});
        }
      }
    }
  }),

  mutation: new graphql.GraphQLObjectType({
    name: "Mutation",
    fields: {
      addFriend: {
        "type": user_type,
        args: {
          u1: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
          u2: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)}
        },
        resolve: (root, {u1, u2}) => {
          return Promise.all(Validation.userExists(u1)) // stuff...
          console.log(`HEllooo ${u1} ${u2}`);
          if (!Validation.userExists(u1)) throw `${u1} doesn't exist`;
          if (!Validation.userExists(u2)) throw `${u1} doesn't exist`;
          if (!Validation.userExists("adas")) throw `${u1} doesn't exist`;
          if (u1 === u2) return;

          console.log("all good");
          return u1;
        }
      }
    }
  })
});



mean.app.use("/graphql", express_graphql({schema: schema, pretty: true}));

namespace Validation {
  export function userExists(username) {
    return mean.db.collection("users").findOne({username: username}, {_id: 1});
  }
}

/*
namespace Processor {
  export function fields(req, unused_res, next) {
    const fields = req.query.fields;
    if (fields) {
      const ret = {};
      fields.split(",").forEach(e => ret[e] = 1);
      req.fields = ret;
    }
    next();
  }
}

// temp hack
function cors(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
      "Access-Control-Allow-Methods",
      "POST, GET, OPTIONS, PUT, DELETE");
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept");
  next();
}

mean.app.get(
  "/users/:userid/potential_friends",
  cors,
  Validation.userExists,
  mean.bus.crud("User"),
  mean.bus.crud("friends"),
  Processor.fields,
  (req: Request, res, next) => {
    const query = {
    $and: [
      {friends: {$nin: [req.params.userid]}},
      {username: {$ne: req.params.userid}}
    ]};
    req.users.find(query, req.fields, (err, friends) => {
      if (err) return next(err);
      friends.toArray((err, arr) => {
        if (err) return next(err);
        res.json(arr);
      });
    });
  });

mean.app.get(
  "/users/:userid/friends",
  cors,
  Validation.userExists,
  mean.bus.crud("User"),
  mean.bus.crud("friends"),
  Processor.fields,
  (req: Request, res, next) => {
    req.users.findOne({username: req.params.userid}, (err, user) => {
      if (err) return next(err);
      if (!user.friends) {
        res.json([]);
        return;
      }
      req.users.find(
        {username: {$in: user.friends}}, req.fields,
        (err, users) => {
          if (err) return next(err);
          users.toArray((err, arr) => {
            if (err) return next(err);
            res.json(arr);
          });
        });
    });
  });

const updateOne = (users, userid, update, next) => {
  users.updateOne({username: userid}, update, (err, user) => {
    if (err) return next(err);
  });
};

// tmp hack
mean.app.options("/users/:userid/friends/:friendid", cors);

mean.app.put(
  "/users/:userid/friends/:friendid",
  cors,
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  mean.bus.crud("User"),
  mean.bus.crud("friends"),
  (req: Request, res, next) => {
    const userid = req.params.userid;
    const friendid = req.params.friendid;
    updateOne(req.users, userid, {$addToSet: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$addToSet: {friends: userid}}, next);
    res.json({});
  });

mean.app.delete(
  "/users/:userid/friends/:friendid",
  cors,
  Validation.userExists, Validation.friendExists,
  Validation.friendNotSameAsUser,
  mean.bus.crud("User"),
  mean.bus.crud("friends"),
  (req: Request, res, next) => {
    const userid = req.params.userid;
    const friendid = req.params.friendid;
    updateOne(req.users, userid, {$pull: {friends: friendid}}, next);
    updateOne(req.users, friendid, {$pull: {friends: userid}}, next);
    res.json({});
  });
*/
