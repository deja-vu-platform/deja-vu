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
  },
  market: {
    create: Helpers.resolve_create(mean.db, "market"),
    update: Helpers.resolve_update(mean.db, "market")
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
      name: {"type": graphql.GraphQLString},
      offer_price: {"type": graphql.GraphQLFloat},
      transaction_price: {"type": graphql.GraphQLFloat},
      seller: {"type": "Party"},
      buyer: {"type": "Party"}
    }
  })
  .add_type({
    name: "Market",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      goods: {"type": "[Good]"}
    }
  })
  .add_mutation({
    name: "CreateGood",
    "type": "Good",
    args: {
      name: {"type": graphql.GraphQLString},
      offer_price: {"type": graphql.GraphQLFloat},
      seller_id: {"type": graphql.GraphQLString},
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (_, {name, offer_price, seller_id, market_id}) => {
      const good = {
        atom_id: uuid.v4(),
        name: name,
        offer_price: offer_price,
        seller: {atom_id: seller_id}
      };
      const update_op = {$addToSet: {goods: {atom_id: good.atom_id}}};
      return Promise
        .all([
          mean.db.collection("goods").insertOne(good),
          bus.create_atom("Good", good.atom_id, good),
          mean.db.collection("markets").updateOne({atom_id: market_id},
            update_op),
          bus.create_atom("Market", market_id, update_op)
          ])
        .then(_ => good)
      ;
    }
  })
  .add_mutation({
    name: "BuyGood",
    "type": graphql.GraphQLBoolean,
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
                mean.db.collection("partys").updateOne({atom_id: buyer_id}, u1)
                    .then(_ => bus.update_atom("Party", buyer_id, u1)),
                mean.db.collection("partys").updateOne({atom_id: seller_id}, u2)
                    .then(_ => bus.update_atom("Party", seller_id, u2))
              ])
              .then(_ => true);
            });
        });
    }
  })
  .add_mutation({
    name: "AddAmount",
    "type": graphql.GraphQLBoolean,
    args: {
      amount: {"type": graphql.GraphQLFloat},
      party_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {amount, party_id}) => {
      const update_op = {$inc: {balance: amount}};
      return mean.db.collection("partys")
        .updateOne({atom_id: party_id}, update_op)
        .then(_ => bus.update_atom("Party", party_id, update_op))
        .then(_ => true);
      }
  })
  .add_query({
    name: "AffordableGoods",
    "type": "[Good]",
    args: {
      market_id: {"type": graphql.GraphQLString},
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {market_id, buyer_id}) => {
      return mean.db.collection("markets")
        .findOne({atom_id: market_id})
        .then(market => {
          const good_ids = (market.goods ?
            market.goods.map(good => good.atom_id) :
            []
          );
          return mean.db.collection("partys")
            .findOne({atom_id: buyer_id})
            .then(buyer => {
              return mean.db.collection("goods")
                .find({
                  atom_id: {
                    $in: good_ids
                  },
                  offer_price: {
                    $lte: buyer.balance
                  }
                })
                .toArray()
              ;
            })
          ;
        })
      ;
    }
  })
  .add_query({
    name: "UnaffordableGoods",
    "type": "[Good]",
    args: {
      market_id: {"type": graphql.GraphQLString},
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {market_id, buyer_id}) => {
      return mean.db.collection("markets")
        .findOne({atom_id: market_id})
        .then(market => {
          const good_ids = (market.goods ?
            market.goods.map(good => good.atom_id) :
            []
          );
          return mean.db.collection("partys")
            .findOne({atom_id: buyer_id})
            .then(buyer => {
              return mean.db.collection("goods")
                .find({
                  atom_id: {
                    $in: good_ids
                  },
                  offer_price: {
                    $gt: buyer.balance
                  }
                })
                .toArray()
              ;
            })
          ;
        })
      ;
    }
  })
  .add_query({
    name: "GoodsFromSeller",
    "type": "[Good]",
    args: {
      seller_id: {"type": graphql.GraphQLString},
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {seller_id, market_id}) => {
      return mean.db.collection("markets")
        .findOne({atom_id: market_id})
        .then(market => {
          const good_ids = (market.goods ?
            market.goods.map(good => good.atom_id) :
            []
          );
          return mean.db.collection("goods")
            .find({
              "seller.atom_id": seller_id,
              "atom_id": {
                $in: good_ids
              }
            })
            .toArray()
          ;
        })
      ;
    }
  })
  .add_query({
    name: "GoodsFromBuyer",
    "type": "[Good]",
    args: {
      buyer_id: {"type": graphql.GraphQLString},
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {buyer_id, market_id}) => {
      return mean.db.collection("markets")
        .findOne({atom_id: market_id})
        .then(market => {
          const good_ids = (market.goods ?
            market.goods.map(good => good.atom_id) :
            []
          );
          return mean.db.collection("goods")
            .find({
              "buyer.atom_id": buyer_id,
              "atom_id": {
                $in: good_ids
              }
            })
            .toArray()
          ;
        })
      ;
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("goods").insertMany([
        {atom_id: "1", name: "ramen", offer_price: 5,
          seller: {atom_id: "3"}},
        {atom_id: "2", name: "sushi", offer_price: 10,
          seller: {atom_id: "3"}}
      ], (err, res) => {
        if (err) throw err;
      });

    mean.db.collection("partys").insertMany([
        {atom_id: "3", name: "Bill", balance: 0},
        {atom_id: "4", name: "Susan", balance: 8}
      ], (err, res) => {
        if (err) throw err;
      });
  }

  mean.start();
});
