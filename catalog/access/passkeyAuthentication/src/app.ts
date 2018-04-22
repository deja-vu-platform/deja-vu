const graphql = require("graphql");
const shajs = require("sha.js");
const jwt = require("jsonwebtoken");

import { Mean } from "mean-loader";
import { Helpers } from "helpers";
import { ServerBus } from "server-bus";
import { Grafo } from "grafo";

import { WORDS } from "./words";

const mean = new Mean();

// IMPORTANT: Change before deploying
const SECRET_KEY = "ultra-secret-key";

const WORDS_SIZE = WORDS.length;

const handlers = {
    passkey: {
        create: Helpers.resolve_create(mean.db, "passkey", "passkeys", passkey => {
            passkey["code"] = shajs('sha256').update(passkey.code).digest('hex');
            return passkey;
        }),
        update: Helpers.resolve_update(mean.db, "passkey")
    }
};

const bus = new ServerBus(mean.fqelement, mean.ws, handlers,
                          mean.comp, mean.locs);

//////////////////////////////////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
    .add_type({
        name: "Passkey",
        fields: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        }
    })
    .add_query({
        name: "passkey",
        "type": "Passkey",
        args: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { code }) => {
            const hashedCode = shajs('sha256').update(code).digest('hex');
            return mean.db.collection("passkeys").findOne({ code: hashedCode });
        }
    })
    .add_mutation({
        name: "createCustomPasskey",
        "type": graphql.GraphQLString,
        args: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { code }) => {
            const hashedCode = shajs('sha256').update(code).digest('hex');
            return mean.db.collection("passkeys")
                .findOne({ code: hashedCode })
                .then(passkey => {
                    if (passkey) { throw new Error(`Passkey with code ${code} already exists`) }

                    const newPasskey = { code: hashedCode, atom_id: hashedCode };

                    return mean.db.collection("passkeys")
                        .insertOne(newPasskey)
                        .then(write_res => {
                            if (write_res.insertedCount !== 1) {
                                throw new Error("Could not save new passkey");
                            }
                            // report
                            return bus.create_atom("Passkey", newPasskey.atom_id, newPasskey);
                        })
                        .then(_ => { newPasskey.atom_id });
                })
        }
    })
    .add_mutation({
        name: "createRandomPasskey",
        "type": graphql.GraphQLString,
        args: {},
        resolve: (_, { }) => {
            return getRandomPasscode().then(code => {
                const hashedCode = shajs('sha256').update(code).digest('hex');
                const passkey = { code: hashedCode, atom_id: hashedCode };

                return mean.db.collection("passkeys")
                    .insertOne(passkey)
                    .then(write_res => {
                        if (write_res.insertedCount !== 1) {
                            throw new Error("Could not save new passkey");
                        }
                        // report
                        return bus.create_atom("Passkey", passkey.atom_id, passkey);
                    })
                    .then(_ => { passkey.atom_id });
            });
        }
    })
    .add_mutation({
        name: "validatePasskey",
        "type": graphql.GraphQLString,
        args: {
            code: { "type": new graphql.GraphQLNonNull(graphql.GraphQLString) }
        },
        resolve: (_, { code }) => {
            const hashedCode = shajs('sha256').update(code).digest('hex');
            return mean.db.collection("passkeys")
                .findOne({ code: hashedCode })
                .then(passkey => {
                    if (!passkey) { throw new Error(`Passkey with code ${code} does not exist.`) };

                    const token = jwt.sign(hashedCode, SECRET_KEY);
                    return JSON.stringify({ token: token, passkey: passkey });
                });
        }
    })
    .schema();

/**
 * Generates a random code. 
 * @returns{string} A unique 5-7 letter english word not found in the database.
 */
export function getRandomPasscode() {
    var randomIndex = Math.floor(Math.random() * WORDS_SIZE);
    var code = WORDS[randomIndex];
    return mean.db.collection("passkeys")
        .findOne({ atom_id: code }, { _id: 1 })
        .then(passkey => {
            if (!passkey) return code;
            return getRandomPasscode();
        })
}

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => mean.start());
