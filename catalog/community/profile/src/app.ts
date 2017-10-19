const graphql = require("graphql");

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  profile: {
      create: Helpers.resolve_create(mean.db, "profile"),
      update: Helpers.resolve_update(mean.db, "profile")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Profile",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      username: {"type": graphql.GraphQLString},
      first_name: {"type": graphql.GraphQLString},
      last_name: {"type": graphql.GraphQLString},
      email: {"type": graphql.GraphQLString},
      phone: {"type": graphql.GraphQLString},
      birthday: {"type": graphql.GraphQLString}
    }
  })
  .add_mutation({
    name: "createProfile",
    type: "Profile",
    args: {
      username: {"type": new graphql.GraphQLNonNull(graphql.GraphQLString)},
      first_name: {"type": graphql.GraphQLString},
      last_name: {"type": graphql.GraphQLString},
      email: {"type": graphql.GraphQLString},
      phone: {"type": graphql.GraphQLString},
      birthday: {"type": graphql.GraphQLString}
    },
    resolve: (_, {username, first_name, last_name, email, phone, birthday}) => {
      return Validation.userIsNew(username).then(_ => {
        // we use username as atom id which is guaranteed to be unique with Validation.userIsNew
        const profile = {
          atom_id: username,
          username,
          first_name,
          last_name,
          email,
          phone,
          birthday
        };
        return mean.db.collection("profiles")
          .insertOne(profile)
          .then(_ => bus.create_atom("Profile", profile.atom_id, profile));
      });
    }
  })
  .add_mutation({
    name: "updateProfile",
    type: "Profile",
    args: {
      updatedProfile: {"type": "Profile"}
    },
    resolve: (_, {updatedProfile}) => {
      return Validation.userExists(updatedProfile.username).then(profile => {
        const updateOperation = {$set: updatedProfile};
        return mean.db.collection("profiles")
          .updateOne({atom_id: profile.atom_id}, updateOperation)
          .then(write_res => {
              if (write_res.modifiedCount !== 1) {
                throw new Error("Couldn't save updated profile");
              }
              bus.update_atom("Profile", updatedProfile.atom_id, updateOperation);
              return updatedProfile;
            });
      })
    }
  })
  .schema();

namespace Validation {
  export function userExists(username) {
    return mean.db.collection("profiles")
      .findOne({username: username})
      .then(profile => {
        if (!profile) throw new Error(`${username} doesn't exist`);
        return profile;
      });
  }

  export function userIsNew(username) {
    return mean.db.collection("profiles")
      .findOne({username: username}, {_id: 1})
      .then(profile => {
        if (profile) throw new Error(`${username} exists`);
        return profile;
      });
  }
}

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  mean.start();
});
