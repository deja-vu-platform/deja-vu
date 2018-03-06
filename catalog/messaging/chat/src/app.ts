const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import {ChatAtom, MessageAtom} from "./shared/data";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  chat: {
      create: Helpers.resolve_create(mean.db, "chat"),
      update: Helpers.resolve_update(mean.db, "chat")
  },
  user: {
      create: Helpers.resolve_create(mean.db, "user"),
      update: Helpers.resolve_update(mean.db, "user")
  },
  message: {
      create: Helpers.resolve_create(mean.db, "message"),
      update: Helpers.resolve_update(mean.db, "message")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "User",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      username: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Message",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      author: {"type": graphql.GraphQLString},
      content: {"type": graphql.GraphQLString},
      timestamp: {"type": graphql.GraphQLInteger}
    }
  })
  .add_type({
    name: "Chat",
    fields: {
      atom_id: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      users: {"type": "[User]"},
      messages: {"type": "[Message]"}
    }
  })
  .add_query({
    name: "userChats",
    "type": "[Chat]",
    args: {
      user: {"type": graphql.GraphQLString}
    },
    resolve: (_, {user}) => {
      // this is not very scalable yet
      return mean.db.collection("chats")
        .find({users: {atom_id: user}}, {messages: {$slice: -1}})
        .toArray();
    }
  })
  .add_query({
    name: "chatMessages",
    "type": "[Message]",
    args: {
      chat: {"type": graphql.GraphQLString},
      prev_length: {"type": graphql.GraphQLInteger}, // previous number of messages fetched
      new_length: {"type": graphql.GraphQLInteger} // new number of messages to be fetched
    },
    resolve: (_, {chat, prev_length, new_length}) => {
      return mean.db.collection("chats")
        .findOne({atom_id: chat.atom_id},
          {messages: {$slice: [-prev_length-1, new_length]}}) // not very efficient
        .then((chat: ChatAtom): string[] => {
          return chat.messages.map(message => message.atom_id);
        })
        .then((message_ids: string[]): MessageAtom[] => {
          return mean.db.collection("messages")
            .find({atom_id: {$in: message_ids}})
            .toArray()
        });
    }
  })
  .add_mutation({
    name: "startChat",
    "type": graphql.GraphQLBoolean, // if a new chat was created or not
    args: {
      users: {"type": new graphql.GraphQLList(graphql.GraphQLString)} // should be arranged alphabetically
    },
    resolve: (_, {users}) => {
      return mean.db.collection("chats")
      .findOne({users: {$eq: users}})
      .then(found => {
        if (found) return false;
        const chat = {
          atom_id: uuid.v4(),
          users: users,
          messages: []
        };
        return mean.db.collection("chats")
          .insertOne(chat)
          .then(_ => bus.create_atom("Chat", chat.atom_id, chat))
          .then(_ => true);
      });
    }  
  })
  .add_mutation({
    name: "sendMessage",
    "type": graphql.GraphQLString,
    args: {
      chat: {"type": graphql.GraphQLString},
      author: {"type": graphql.GraphQLString},
      content: {"type": graphql.GraphQLString},
      timestamp: {"type": graphql.GraphQLInteger}
    },
    resolve: (_, {chat, author, content, timestamp}) => {
      const messageObj = {
        atom_id: uuid.v4(),
        author, content, timestamp
      };
      const newMessageOp = {$push: {messages: messageObj}};

      return mean.db.collection("messages")
        .insertOne(messageObj)
        .then(_ => mean.db.collection("chats")
          .updateOne({atom_id: chat.atom_id}, newMessageOp)
          .then(_ => Promise.all([
            bus.create_atom("Message", messageObj.atom_id, messageObj),
            bus.update_atom("Chat", chat.atom_id, newMessageOp)])))
        .then(_ => messageObj.atom_id);
    }
  })
  .schema();


Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  mean.start();
});
