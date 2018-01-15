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
  },
  compoundtransaction: {
    create: Helpers.resolve_create(mean.db, "compoundtransaction"),
    update: Helpers.resolve_update(mean.db, "compoundtransaction")
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
      market: {"type": "Market"},
      updateGood: {
        "type": graphql.GraphQLBoolean,
        args: {
          name: {"type": graphql.GraphQLString},
          supply: {"type": graphql.GraphQLInt},
          price: {"type": graphql.GraphQLFloat},
          seller_id: {"type": graphql.GraphQLString},
          market_id: {"type": graphql.GraphQLString}
        },
        resolve: (good, {name, supply, price, seller_id, market_id}) => {
          const updatedGood = {};
          if (name)
            updatedGood["name"] = name;
          if (supply || supply === 0)
            updatedGood["supply"] = supply;
          if (price)
            updatedGood["price"] = price;
          if (seller_id)
            updatedGood["seller"] = {atom_id: seller_id};
          if (market_id)
            updatedGood["market"] = {atom_id: market_id};

          const setOp = {$set: updatedGood};
          return mean.db.collection("goods")
            .updateOne({atom_id: good.atom_id}, setOp)
            .then(_ => bus.update_atom("Good", good.atom_id, setOp))
            .then(_ => true);
        }
      }
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
      market: {"type": "Market"},
      status: {"type": graphql.GraphQLString}
    }
  })
  .add_type({
    name: "CompoundTransaction",
    fields: {
      atom_id: {"type": graphql.GraphQLString},
      transactions: {"type": "[Transaction]"},
      total_price: {"type": graphql.GraphQLFloat},
      addTransaction: {
        "type": "Transaction",
        args: {
          good_id: {"type": graphql.GraphQLString},
          buyer_id: {"type": graphql.GraphQLString},
          quantity: {"type": graphql.GraphQLInt},
          price: {"type": graphql.GraphQLFloat},
          status: {"type": graphql.GraphQLString}
        },
        resolve: (compound_transaction, 
          {good_id, buyer_id, quantity, price, status}) => {
          const reference_id = compound_transaction.transactions[0].atom_id;
          return mean.db.collection("transactions")
            .findOne({atom_id: reference_id}, {status: 1})
            .then(transaction => {
              if (transaction.status != status) {
                throw new Error("Statuses does not match!");
              }
            })
            .then(_ => {
              mean.db.collection("goods")
                .findOne({atom_id: good_id})
                .then(good => {
                  quantity = Math.min(quantity, good.supply);
                  if (quantity === 0) {
                    return false;
                  }
                  // use good price as default if no price is given
                  const transaction_price = (price === undefined) ? price : good.price;
                  const transaction_id = uuid.v4();
                  const transaction = {
                    atom_id: transaction_id,
                    good: {atom_id: good.atom_id},
                    buyer: {atom_id: buyer_id},
                    price: transaction_price,
                    quantity: quantity,
                    market: {atom_id: good.market.atom_id},
                    status
                  };
                  // groceryship transactions start out with no seller
                  if (good.seller) {
                    transaction["seller"] = {atom_id: good.seller.atom_id};
                  }
                  const compound_transaction_update_op = {
                    $push: {transactions: {atom_id: transaction_id}},
                    $inc: {total_price: transaction.price}
                  };
                  const good_update_op = {$inc: {supply: -quantity}};

                  return Promise.all([
                    mean.db.collection("compoundtransactions")
                      .updateOne(
                        {atom_id: compound_transaction.atom_id},
                        compound_transaction_update_op)
                      .then(_ => bus.update_atom(
                        "CompoundTransaction",
                        compound_transaction.atom_id,
                        compound_transaction_update_op)),

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
            });
        }
      },
      // update all the transactions (and the goods within them, if applicable)
      // in a compound transaction
      updateTransactions: {
        "type": graphql.GraphQLBoolean,
        args: {
          seller_id: {"type": graphql.GraphQLString},
          buyer_id: {"type": graphql.GraphQLString},
          status: {"type": graphql.GraphQLString}
        },
        resolve: (compound_transaction, {seller_id, buyer_id, status}) => {
          const updatedTransaction = {};
          const updatedGood = {};
          if (seller_id) {
            updatedTransaction["seller"] = {atom_id: seller_id};
            updatedGood["seller"] = {atom_id: seller_id};
          }
          if (buyer_id) {
            updatedTransaction["buyer"] = {atom_id: buyer_id};
            updatedGood["buyer"] = {atom_id: buyer_id};
          }
          if (status) {
            updatedTransaction["status"] = status;
          }

          const transactionSetOp = {$set: updatedTransaction};
          const goodSetOp = {$set: updatedGood};

          return mean.db.collection("compoundtransactions")
            .findOne({atom_id: compound_transaction.atom_id}, {transactions: 1})
            .then(compound_transaction => {
              const transactions = compound_transaction.transactions;

              return Promise.all(transactions.map(transaction => {
                return mean.db.collection("transactions")
                  .findOneAndUpdate(transaction, transactionSetOp,
                    {returnNewDocument: true, projection: {good: 1}})
                  .then(result => {
                    return Promise.all(
                      [bus.update_atom(
                        "Transaction", transaction, transactionSetOp),
                      mean.db.collection("goods")
                      .updateOne(result.value.good, goodSetOp)
                      .then(_ => bus.update_atom(
                        "Good", result.value.good, goodSetOp))]);
                  })
              }));
            })
            .then(_ => true, err => {
              console.log(err);
              throw err;
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
        market: {atom_id: market_id}
      };
      // seller_id can not be present in the scenario
      // where there is a buyer looking for a seller to buy this good from
      if (seller_id) {
         good["seller"] = {atom_id: seller_id};
      }
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
      fraction: {"type": graphql.GraphQLFloat} // fraction of good.price each good will be bought for
    },
    resolve: (_, {good_id, buyer_id, quantity, fraction,}) => {
      return mean.db.collection("goods")
        .findOne({atom_id: good_id})
        .then(good => {
          quantity = Math.min(quantity, good.supply);
          if (quantity === 0) {
            return false;
          }
          const transaction_price = good.price * fraction; // price for each good
          const transaction = {
            atom_id: uuid.v4(),
            good: {atom_id: good.atom_id},
            seller: {atom_id: good.seller.atom_id},
            buyer: {atom_id: buyer_id},
            price: transaction_price,
            quantity: quantity,
            market: {atom_id: good.market.atom_id},
            status: "paid"
          }
          return mean.db.collection("transactions")
            .insertOne(transaction)
            .then(_ => {
              const seller_id = good.seller.atom_id;
              const u1 = {$inc: {balance: -transaction_price * quantity}};
              const u2 = {$inc: {balance: transaction_price * quantity}};
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
    name: "CreateUnpaidTransaction",
    "type": "Transaction",
    args: {
      good_id: {"type": graphql.GraphQLString},
      buyer_id: {"type": graphql.GraphQLString},
      quantity: {"type": graphql.GraphQLInt},
      price: {"type": graphql.GraphQLFloat}
    },
    resolve: (_, {good_id, buyer_id, quantity, price}) => {
      return mean.db.collection("goods")
        .findOne({atom_id: good_id})
        .then(good => {
          quantity = Math.min(quantity, good.supply);
          if (quantity === 0) {
            return false;
          }
          // use good price as default if no price is given
          const transaction_price = (price === undefined) ? price : good.price;
          const transaction = {
            atom_id: uuid.v4(),
            good: {atom_id: good.atom_id},
            buyer: {atom_id: buyer_id},
            price: transaction_price,
            quantity: quantity,
            market: {atom_id: good.market.atom_id},
            status: "unpaid"
          }
          // seller can not be present in the scenario
          // where there is a buyer looking for a seller to buy this good from
          if (good.seller) {
            transaction["seller"] = {atom_id: good.seller.atom_id}
          }
          return mean.db.collection("transactions")
            .insertOne(transaction)
            .then(_ => {
              // reserve the goods in the transaction
              const update_op = {$inc: {supply: -quantity}};
              return Promise.all([
                bus.update_atom("Transaction", transaction.atom_id,
                  transaction),
                mean.db.collection("goods")
                  .updateOne({atom_id:good.atom_id}, update_op)
                  .then(_ => bus.update_atom("Good", good.atom_id, update_op))
              ])
              .then(_ => transaction);
            });
        });
    }
  })
  .add_mutation({
    name: "CreateCompoundTransaction",
    "type": "CompoundTransaction",
    args: {
      transactions: {"type": new graphql.GraphQLList(graphql.GraphQLString) },
    },
    resolve: (_, {transactions}) => {
      // transactions must have already been created
      // and checked that they all have the same status
      const transaction_ids = transactions.map((atom_id) => {
        return {atom_id};
      });
      const prices_promises = transactions.map((atom_id) => {
        return mean.db.collection("transactions")
          .findOne({atom_id: atom_id}, {price: 1}) //just return the price field
          .then(transaction => transaction.price);
      });
      return Promise.all(prices_promises)
        .then(prices => {
          const total_price = prices.reduce((total: number, price: number) => {
            return total + price;
          }, 0);

          const compoundTransaction = {
            atom_id: uuid.v4(),
            transactions: transaction_ids,
            total_price
          };
          return mean.db.collection("compoundtransactions")
            .insertOne(compoundTransaction)
            .then(_ => {
              bus.create_atom("CompoundTransaction", 
                compoundTransaction.atom_id, compoundTransaction);
            })
            .then(_ => compoundTransaction);
        });
    }
  })
  .add_mutation({
    name: "PayForCompoundTransaction",
    "type": graphql.GraphQLBoolean,
    args: {
      compound_transaction_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {compound_transaction_id}) => {
      return mean.db.collection("compoundtransactions")
        .findOne({atom_id: compound_transaction_id})
        .then(compound_transaction => {
          // process each transaction in the compound transaction
          const transaction_ids = compound_transaction.transactions
            .map(transaction => transaction.atom_id);
          const seller_to_earnings = {};
          const buyer_to_expenditure = {};
          const transactions_to_process = [];
          const transaction_update_op = {$set: {status: "paid"}};
          // check that the transaction isn't canceled
          // we only check the first one because our operations
          // guarantee that all transactions have the same status
          return mean.db.collection("transactions")
            .findOne({atom_id: transaction_ids[0]}, {status: 1})
            .then(transaction => {
              if (transaction.status == "canceled") {
                throw new Error("Cannot pay for canceled transactions!");
              }
            })
            .then(_ => {
              // calculate total earnings and expenditures for each party
              _u.each(transaction_ids, tid => {
                transactions_to_process.push(
                  mean.db.collection("transactions")
                    .findOne({atom_id: tid})
                    .then(transaction => {
                      if (transaction.status == "paid") return;
                      const total_price = transaction.price 
                        * transaction.quantity;
                      const bid = transaction.buyer.atom_id;
                      if (buyer_to_expenditure[bid] === undefined) 
                        buyer_to_expenditure[bid] = 0;
                      buyer_to_expenditure[bid] += total_price;

                      return mean.db.collection("goods")
                        .findOne({atom_id: transaction.good.atom_id})
                        .then(good => {
                          // no need to update quantities 
                          // because they were updated when the transaction was made
                          const sid = good.seller.atom_id;
                          if (seller_to_earnings[sid] === undefined) 
                            seller_to_earnings[sid] = 0;
                          seller_to_earnings[sid] += total_price;
                        })
                        .then(_ => {
                          return mean.db.collection("transactions")
                            .updateOne({atom_id: tid}, transaction_update_op)
                            .then(_ => bus.update_atom(
                              "Transaction", tid, transaction_update_op));
                        });
                    })
                );
              });

              // TODO: check whether buyer has enough money next time
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
                .then(_ => true);
            });          
        });
    }
  })
  .add_mutation({
    name: "CancelUnpaidCompoundTransaction",
    "type": graphql.GraphQLBoolean,
    args: {
      compound_transaction_id: {"type": graphql.GraphQLString},
    },
    resolve: (_, {compound_transaction_id}) => {
      return mean.db.collection("compoundtransactions")
        .findOne({atom_id: compound_transaction_id})
        .then(compound_transaction => {
          // process each transaction in the compound transaction
          const transaction_ids = compound_transaction.transactions;
          const transactions_to_process = [];
          const transaction_update_op = {$set: {status: "canceled"}};
          // check that the transaction hasn't been paid for
          // (if it has, then it should be a refund, not a cancellation)
          // we only check the first one because our operations
          // guarantee that all transactions have the same status
          const reference_id = transaction_ids[0].atom_id;
          return mean.db.collection("transactions")
            .findOne({atom_id: reference_id}, {status: 1})
            .then(transaction => {
              if (transaction.status == "paid") {
                throw new Error("Cannot cancel for paid transactions!");
              }
            })
            .then(_ => {
              _u.each(transaction_ids, tid => {
                transactions_to_process.push(
                  mean.db.collection("transactions")
                    .findOneAndUpdate(tid, transaction_update_op)
                    .then(result => {
                      const transaction = result.value;
                      if (transaction.status == "canceled") return;
                      // no need to update balance of parties because no payments were made
                      const update_op = {$inc: {supply: transaction.quantity}};
                      return Promise.all([
                        bus.update_atom("Transaction", tid, transaction_update_op),
                        mean.db.collection("goods")
                        .updateOne({atom_id: transaction.good.atom_id}, update_op)
                        .then(_ => bus.update_atom(
                          "Good", transaction.good.atom_id, update_op))
                      ]);
                    })
                );
              });

              return Promise.all(transactions_to_process)
                .then(_ => true,
                  err => {
                    console.log(err);
                    throw err;
                  });
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
