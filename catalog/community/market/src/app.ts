const graphql = require("graphql");
import {Promise} from "es6-promise";

import {Mean} from "mean-loader";
import {Helpers} from "helpers";
import {ServerBus} from "server-bus";
import {Grafo} from "grafo";

import * as _u from "underscore";

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
  },
  transaction: {
    create: Helpers.resolve_create(mean.db, "transaction"),
    update: Helpers.resolve_update(mean.db, "transaction")
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
      supply: {"type": graphql.GraphQLInt},
      price: {"type": graphql.GraphQLFloat},
      seller: {"type": "Party"},
      market: {"type": "Market"}
    }
  })
  .add_type({
    name: "Market",
    fields: {
      atom_id: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "Transaction",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      good: {"type": "Good"},
      seller: {"type": "Party"},
      buyer: {"type": "Party"},
      price: {"type": graphql.GraphQLFloat},
      quantity: {"type": graphql.GraphQLInt},
      market: {"type": "Market"}
    }
  })
  .add_type({
    name: "CompoundTransaction",
    fields: {
      transactions: {"type": "[Transaction]"},
      paid: {"type": graphql.GraphQLBoolean},
      addTransaction: {
        "type": "Transaction",
        args: {
          good_id: {"type": graphql.GraphQLString},
          buyer_id: {"type": graphql.GraphQLString},
          quantity: {"type": graphql.GraphQLInt},
          price: {"type": graphql.GraphQLFloat}
        },
        resolve: (compound_transaction, {good_id, buyer_id, quantity, price}) => {
          return mean.db.collection("goods")
            .findOne({atom_id: good_id})
            .then(good => {
              quantity = Math.min(quantity, good.supply);
              if (quantity === 0) {
                return false;
              }
              // use good price as default if no price is given
              // FIXME: is transaction_price total or for each quantity bought?
              const transaction_price = (price === undefined) ? price : good.price;
              const transaction_id = uuid.v4();
              const transaction = {
                atom_id: transaction_id,
                good: {atom_id: good.atom_id},
                seller: {atom_id: good.seller.atom_id},
                buyer: {atom_id: buyer_id},
                price: transaction_price,
                quantity: quantity,
                market: {atom_id: good.market.atom_id}
              }
              const compound_transction_update_op = {
                $push: {transactions: transaction_id}
              };
              const good_update_op = {$inc: {supply: -quantity}};

              return Promise.all([
                mean.db.collection("compoundtransactions")
                  .updateOne(
                    {atom_id: compound_transaction.atom_id},
                    compound_transction_update_op)
                  .then(_ => bus.update_atom(
                    "CompoundTransaction",
                    compound_transaction.atom_id,
                    compound_transction_update_op)),

                mean.db.collection("transactions")
                  .insertOne(transaction)
                  .then(_ => bus.update_atom(
                    "Transaction", transaction.atom_id, transaction)),

                mean.db.collection("goods")
                  .updateOne({atom_id: good.atom_id}, good_update_op)
                  .then(_ => bus.update_atom("Good", good.atom_id, good_update_op)),
              ])
              .then(_ => transaction);
            });
        }
      }
    }
  })
  .add_mutation({
    name: "CreateGood",
    "type": "Good",
    args: {
      name: {"type": graphql.GraphQLString},
      price: {"type": graphql.GraphQLFloat},
      supply: {"type": graphql.GraphQLInt},
      seller_id: {"type": graphql.GraphQLString},
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (_,
      {name, price, supply, seller_id, market_id}
    ) => {
      const good = {
        atom_id: uuid.v4(),
        name: name,
        price: price,
        supply: supply,
        seller: {atom_id: seller_id},
        market: {atom_id: market_id}
      };
      return Promise
        .all([
          mean.db.collection("goods").insertOne(good),
          bus.create_atom("Good", good.atom_id, good)
          ])
        .then(_ => good);
    }
  })
  .add_mutation({
    name: "BuyGood",
    "type": graphql.GraphQLBoolean,
    args: {
      good_id: {"type": graphql.GraphQLString},
      buyer_id: {"type": graphql.GraphQLString},
      quantity: {"type": graphql.GraphQLInt},
      fraction: {"type": graphql.GraphQLFloat}
    },
    resolve: (_, {good_id, buyer_id, quantity, fraction,}) => {
      return mean.db.collection("goods")
        .findOne({atom_id: good_id})
        .then(good => {
          quantity = Math.min(quantity, good.supply);
          if (quantity === 0) {
            return false;
          }
          const transaction_price = good.price * fraction;
          const transaction = {
            atom_id: uuid.v4(),
            good: {atom_id: good.atom_id},
            seller: {atom_id: good.seller.atom_id},
            buyer: {atom_id: buyer_id},
            price: transaction_price,
            quantity: quantity,
            market: {atom_id: good.market.atom_id}
          }
          return mean.db.collection("transactions")
            .insertOne(transaction)
            .then(_ => {
              const seller_id = good.seller.atom_id;
              const u1 = {$inc: {balance: -transaction_price}};
              const u2 = {$inc: {balance: transaction_price}};
              const u3 = {$inc: {supply: -quantity}};
              return Promise.all([
                bus.update_atom("Transaction", transaction.atom_id,
                  transaction),
                mean.db.collection("partys").updateOne({atom_id: buyer_id}, u1)
                  .then(_ => bus.update_atom("Party", buyer_id, u1)),
                mean.db.collection("partys").updateOne({atom_id: seller_id}, u2)
                  .then(_ => bus.update_atom("Party", seller_id, u2)),
                mean.db.collection("goods").updateOne({atom_id:good.atom_id},u3)
                  .then(_ => bus.update_atom("Good", good.atom_id, u3))
              ])
              .then(_ => true);
            });
        });
    }
  })
  .add_mutation({
    name: "CreateCompoundTransaction",
    "type": "CompoundTransaction",
    args: {
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (_, {buyer_id}) => {
      const compoundTransaction = {
        atom_id: uuid.v4(),
        transactions: [],
        paid: false,
        buyer_id
      };
      return mean.db.collection("compoundtransactions")
        .insertOne(compoundTransaction)
        .then(_ => {
          bus.create_atom("CompoundTransaction", 
            compoundTransaction.atom_id, compoundTransaction);
        })
        .then(_ => compoundTransaction);
    }
  })
  .add_mutation({
    name: "PayForCompoundTransaction",
    "type": graphql.GraphQLBoolean,
    args: {
      compound_transaction_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {compound_transaction_id}) => {
      const update_op = {$set: {paid: true}};
      return mean.db.collection("compoundtransactions")
        .findOne({atom_id: compound_transaction_id})
        .then(compound_transaction => {
          // process each transaction in the compound transaction
          const transaction_ids = compound_transaction.transactions;
          const seller_to_earnings = {};
          const buyer_to_expenditure = {};
          const transactions_to_process = [];
          // calculate total earnings and expenditures for each party
          _u.each(transaction_ids, tid => {
            transactions_to_process.push(
              mean.db.collection("transactions")
                .findOne({atom_id: tid})
                .then(transaction => {
                  const price = transaction.transaction_price;
                  const bid = transaction.buyer.atom_id;
                  if (buyer_to_expenditure[bid] === undefined) buyer_to_expenditure[bid] = 0;
                  buyer_to_expenditure[bid] += price;
                  return mean.db.collection("goods")
                    .findOne({atom_id: transaction.good.atom_id})
                    .then(good => {
                      // no need to update quantities because they were updated when the transaction was made
                      const sid = good.seller.atom_id;
                      if (seller_to_earnings[sid] === undefined) seller_to_earnings[sid] = 0;
                      seller_to_earnings[sid] += price;
                    });
                })
            );
          });
          // TODO: check whether buyer has enough money?
          return Promise.all(transactions_to_process)
            .then(_ => {
              const payments = [];
              for (const sid in seller_to_earnings) {
                const update_op = {$inc: {balance: seller_to_earnings[sid]}};
                payments.push(
                  mean.db.collection("partys").updateOne({atom_id: sid}, update_op)
                    .then(_ => bus.update_atom("Party", sid, update_op))
                );
              }
              for (const bid in buyer_to_expenditure) {
                const update_op = {$inc: {balance: -buyer_to_expenditure[bid]}};
                payments.push(
                  mean.db.collection("partys").updateOne({atom_id: bid}, update_op)
                    .then(_ => bus.update_atom("Party", bid, update_op))
                );
              }
              return Promise.all(payments);
            })
            .then(_ => {
              const update_op = {$set: {paid: true}};
              return mean.db.collection("compoundtransactions")
                .updateOne({atom_id: compound_transaction_id}, update_op)
                .then(_ => bus.update_atom("CompoundTransaction", compound_transaction_id, update_op));
            });
        });
    }
  })
  .add_mutation({
    name: "CancelCompoundTransaction",
    "type": graphql.GraphQLBoolean,
    args: {
      compound_transaction_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {compound_transaction_id}) => {
      const update_op = {$set: {paid: true}};
      return mean.db.collection("compoundtransactions")
        .findOne({atom_id: compound_transaction_id})
        .then(compound_transaction => {
          // process each transaction in the compound transaction
          const transaction_ids = compound_transaction.transactions;
          const transactions_to_process = [];
          _u.each(transaction_ids, tid => {
            transactions_to_process.push(
              mean.db.collection("transactions")
                .findOne({atom_id: tid})
                .then(transaction => {
                  // no need to update balance of parties because no payments were made
                  const update_op = {$inc: {supply: transaction.quantity}};
                  return mean.db.collection("goods")
                    .updateOne({atom_id: transaction.good.atom_id}, update_op);
                })
            );
          });
          // TODO: do we delete the transactions and compound transaction or set some field to canceled?
          return Promise.all(transactions_to_process)
            .then(_ => {
              return mean.db.collection("transactions")
                .remove({atom_id: {$in: transaction_ids}})
                .then(_ => {
                  _u.each(transaction_ids, tid => bus.remove_atom("Transaction", tid));
                });
            })
            .then(_ => {
              return mean.db.collection("compoundtransactions")
                .deletOne({atom_id: compound_transaction_id})
                .then(_ => bus.remove_atom("CompoundTransaction", compound_transaction_id));
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
    name: "GoodsByMarket",
    "type": "[Good]",
    args: {
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {market_id}) => {
      return mean.db.collection("goods")
        .find({
          "market.atom_id": market_id,
          supply: { $gt: 0 }
        })
        .toArray();
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
      return mean.db.collection("partys")
        .findOne({atom_id: buyer_id})
        .then(buyer => {
          return mean.db.collection("goods")
            .find({
              "market.atom_id": market_id,
              price: {
                $lte: buyer.balance
              }
            })
            .toArray();
        });
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
      return mean.db.collection("partys")
        .findOne({atom_id: buyer_id})
        .then(buyer => {
          return mean.db.collection("goods")
            .find({
              "market.atom_id": market_id,
              price: {
                $gt: buyer.balance
              }
            })
            .toArray();
        });
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
      return mean.db.collection("goods")
        .find({
          "market.atom_id": market_id,
          "seller.atom_id": seller_id,
        })
        .toArray();
    }
  })
  .add_query({
    name: "TransactionsByMarket",
    "type": "[Transaction]",
    args: {
      market_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {market_id}) => {
      return mean.db.collection("transactions")
        .find({
          "market.atom_id": market_id
        })
        .toArray();
    }
  })
  .add_query({
    name: "TransactionsByBuyer",
    "type": "[Transaction]",
    args: {
      market_id: {"type": graphql.GraphQLString},
      buyer_id: {"type": graphql.GraphQLString}
    },
    resolve: (root, {market_id, buyer_id}) => {
      return mean.db.collection("transactions")
        .find({
          "market.atom_id": market_id,
          "buyer.atom_id": buyer_id
        })
        .toArray();
    }
  })
  .schema();

Helpers.serve_schema(mean.ws, schema);

grafo.init().then(_ => {
  if (mean.debug) {
    mean.db.collection("goods").insertMany([
        {atom_id: "1", name: "ramen", price: 5,
          seller: {atom_id: "3"}},
        {atom_id: "2", name: "sushi", price: 10,
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
