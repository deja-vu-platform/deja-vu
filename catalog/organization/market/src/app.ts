const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

const uuid = require("uuid");

const mean = new Mean();

const handlers = {
  party: {
    create: Helpers.resolve_create(mean.db, "party"),
    update: Helpers.resolve_update(mean.db, "party")
  },
  good: {
    create: Helpers.resolve_create(mean.db, "good"),
    update: Helpers.resolve_update(mean.db, "good")
  }
};

const bus = new ServerBus(
    mean.fqelement, mean.ws, handlers, mean.comp, mean.locs);


/////////////////////

const grafo = new Grafo(mean.db);

const schema = grafo
  .add_type({
    name: "Party",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      balance: {"type": graphql.GraphQLFloat}
    }
  })
  .add_type({
    name: "Good",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      offer_price: {"type": graphql.GraphQLFloat},
      transaction_price: {"type": graphql.GraphQLFloat},
      seller: {"type": "Party"},
      buyer: {"type": "Party"}
    }
  })
 .add_mutation({
    name: "CreateGood",
    "type": "Good",
    args: {
      name: {"type": graphql.GraphQLString},
      offer_price: {"type": graphql.GraphQLFloat} ,
      seller_id: {"type": graphql.GraphQLString}
    },
    resolve: (_, {name, offer_price, seller_id}) => {
      const good = {
        atom_id: uuid.v4(),
        name: name,
        offer_price: offer_price,
        seller: {atom_id: seller_id}
      };
      return Promise
        .all([
          mean.db.collection("goods").insertOne(good),
          bus.create_atom("Good", good.atom_id, good)
          ])
        .then(_ => good)
      } 
  })
 .add_mutation({
    name: "BuyGood",
    "type": "Good",
    args: {
      good_id: {"type": graphql.GraphQLString},
      fraction: {"type": graphql.GraphQLFloat} ,
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (_, {good_id, fraction, buyer_id}) => {
      return mean.db.collection("goods")
        .findOne({atom_id: good_id})
        .then(good => {
          const transaction_price = good.offer_price * fraction;
          return mean.db.collection("goods")
            .updateOne({atom_id: good_id}, { $set: {
                transaction_price: transaction_price,
                buyer: {atom_id: buyer_id}
              } })
            .then(_ => {
              const seller_id = good.seller.atom_id;
              const u1 = {$inc: {balance: -transaction_price}};
              const u2 = {$inc: {balance: transaction_price}};
              return Promise.all([
                mean.db.collection("parties").updateOne({atom_id: buyer_id}, u1)
                    .then(_ => bus.update_atom("Party", buyer_id, u1)),
                mean.db.collection("parties").updateOne({atom_id: seller_id}, u2)
                    .then(_ => bus.update_atom("Party", seller_id, u2))
              ]);
            });
        })
    }
  })
 .add_mutation({
    name: "AddAmount",
    "type": "Party",
    args: {
      amount: {"type": graphql.GraphQLFloat},
      party_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {amount, party_id}) => {
      return mean.db.collection("parties")
        .updateOne({atom_id: party_id}, {$inc: {balance: amount}})
        .then(_ => bus.update_atom("Party", party_id, {$inc: {balance: amount}}));
      } 
  })
  .add_query({
    name: "AffordableGoods",
    "type": "[Good]",
    args: {
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {buyer_id}) => { 
      return mean.db.collection("parties")
        .findOne({atom_id: buyer_id})
        .then(buyer => {
          return mean.db.collection("goods")
            .find({ offer_price: { $lte: buyer.balance } });
        });
      }
  })
  .add_query({
    name: "UnaffordableGoods",
    "type": "[Good]",
    args: {
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {buyer_id}) => {
      return mean.db.collection("parties")
        .findOne({atom_id: buyer_id})
        .then(buyer => {
          return mean.db.collection("goods")
            .find({ offer_price: { $gt: buyer.balance } });
        });
      } 
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
  }

  mean.start();
});