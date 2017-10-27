const graphql = require("graphql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

import { WORDS } from "./shared/data";

const mean = new Mean();

const SALT_WORK_FACTOR = 10;

// IMPORTANT: Change before deploying
const SECRET_KEY = "ultra-secret-key";

const WORDS_SIZE = WORDS.length;

const handlers = {
    passkey: {
        create: Helpers.resolve_create(mean.db, "passkey", "passkeys", passkey => {
            passkey["code"] = bcrypt.hashSync(passkey.code, SALT_WORK_FACTOR);
            return passkey;
        }),
        update: Helpers.resolve_update(mean.db, "passkey")
    }
}

const bus = new ServerBus(mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);

////////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
    .add_type({
        name: "Passkey",
        fields: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        }
    })
    .add_mutation({
        name: "createCustomPasskey",
        "type": graphql.GraphQLBoolean,
        args: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { code }) => {
            return Validation.passkeyIsNew(code).then(_ => {
                const passkey = {
                    "code": bcrypt.hashSync(code, SALT_WORK_FACTOR),
                    "atom_id": code
                };
                return mean.db.collection("passkeys")
                    .insertOne(passkey)
                    .then(write_res => {
                        if (write_res.insertedCount !== 1) {
                            throw new Error("Couldn't save new passkey");
                        }
                        bus.create_atom("Passkey", passkey.atom_id, passkey);
                        return true;
                    });
            });
        }
    })
    .add_mutation({
        name: "createRandomPasskey",
        "type": graphql.GraphQLBoolean,
        args: {},
        resolve: (_, { }) => {
            return getRandomPassocde().then(code => {
                const passkey = {
                    "code": bcrypt.hashSync(code, SALT_WORK_FACTOR),
                    "atom_id": code
                };
                return mean.db.collection("passkeys")
                    .insertOne(passkey)
                    .then(write_res => {
                        if (write_res.insertedCount !== 1) {
                            throw new Error("Couldn't save new passkey");
                        }
                        bus.create_atom("Passkey", passkey.atom_id, passkey);
                        return true;
                    });
            });
        }
    })
    .add_mutation({
        name: "validatePasskey",
        "type": graphql.GraphQLBoolean,
        args: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { code }) => {
            return Validation.passkeyExists(code).then(passkey => {
                if (!bcrypt.compareSync(code, passkey.code)) {
                    throw new Error("Incorrect code");
                }
                const token = jwt.sign(code, SECRET_KEY);
                return JSON.stringify({
                    token: token,
                    passkey: passkey
                });
            });
        }
    })
    .schema();

namespace Validation {
    export function passkeyExists(code) {
        return mean.db.collection("passkeys")
            .findOne({ atom_id: code })
            .then(passkey => {
                if (!passkey) throw new Error(`passkey with code ${passkey.atom_id} doesn't exist`);
                return passkey;
            });
    }

    export function passkeyIsNew(code) {
        return mean.db.collection("passkeys")
            .findOne({ atom_id: code }, { _id: 1 })
            .then(passkey => {
                if (passkey) throw new Error(`passkey with code ${passkey.atom_id} already exists`);
                return passkey;
            });
    }
}

/**
 * Generates a random code. 
 * @returns{string} A unique 5-7 letter english word not found in the database.
 */
export function getRandomPassocde() {
    var randomIndex = Math.floor(Math.random() * WORDS_SIZE);
    var code = WORDS[randomIndex];
    return mean.db.collection("passkeys")
        .findOne({ atom_id: code }, { _id: 1 })
        .then(passkey => {
            if (!passkey) return code;
            return getRandomPassocde();
        })
}
