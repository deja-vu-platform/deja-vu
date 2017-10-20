const graphql = require("graphql");
const jwt = require("jsonwebtoken");

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

const mean = new Mean();

const SALT_WORK_FACTOR = 10;
const SECRET_KEY = "ultra-secret-key";

const handlers = {
    users: {
        create: Helpers.resolve_create(mean.db, "user", "users", user => {
            user["passkey"] = user.passkey;
            return user;
        }),
        update: Helpers.resolve_update(mean.db, "user")
    }
}

const bus = new ServerBus(mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);

////////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
    .add_type({
        name: "User",
        fields: {
            username: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        }
    })
    .add_mutation({
        name: "createPasskey",
        "type": graphql.GraphQLBoolean,
        args: {
            username: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) },
            passkey: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { username, passkey }) => {
            return Validation.userIsNew(passkey).then(_ => {
                // Both username and passkey should be unique, but we use passkey
                // as the atom id because unlike passwords in Standard Authentication, 
                // a passkey is unique to each user.
                const user = {
                    username: username,
                    passkey: passkey,
                    atom_id: passkey
                };
                return mean.db.collection("users")
                    .insertOne(user)
                    .then(write_res => {
                        if (write_res.insertedCount !== 1) {
                            throw new Error("Couldn't save new user");
                        }
                        bus.create_atom("User", user.atom_id, user);
                        return true;
                    });
            });
        }
    })
    .add_mutation({
        name: "validatePasskey",
        "type": graphql.GraphQLBoolean,
        args: {
            passkey: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { passkey }) => {
            return Validation.userExists(passkey).then(user => {
                const token = jwt.sign(passkey, SECRET_KEY);
                return JSON.stringify({
                    token: token,
                    user: user
                });
            });
        }
    })
    .schema();

namespace Validation {
    export function userExists(passkey) {
        return mean.db.collection("users")
            .findOne({ passkey: passkey })
            .then(user => {
                if (!user) throw new Error(`user with passkey ${passkey} doesn't exist`);
                return user;
            });
    }

    // Both username and passkey should be unique.
    export function userIsNew(username, passkey) {
        return mean.db.collection("users")
            .findOne({
                $or: [{ username: username }, { passkey: passkey }]
            }, { _id: 1 })
            .then(user => {
                if (user) throw new Error(`username ${username} or passkey ${passkey} exists`);
                return user;
            });
    }

    // OR separate the errors?
}
