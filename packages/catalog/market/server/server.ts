import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

// Change
enum TransactionStatus {
  Paid = 'PAID',
  Unpaid = 'UNPAID',
  Canceled = 'CANCELED'
}

interface MarketDoc {
  id: string;
}

interface PartyDoc {
  id: string;
  balance: number;
}

interface GoodDoc {
  id: string;
  name: string;
  price: number;
  sellerId?: string; // optional when buyer is looking for a seller from whom to buy this
  supply: number;
  marketId: string;
}

interface TransactionDoc {
  id: string;
  goodId: string;
  buyerId: string;
  sellerId?: string;
  price: number;
  quantity: number;
  marketId: string;
  status: TransactionStatus;
}

interface CompoundTransactionDoc {
  id: string;
  transactions: string[];
  totalPrice: number;
}

// interface CreateUnpaidTransactionInput {
//   id: string;
//   goodId: string;
//   buyerId: string;
//   quantity: number;
//   price: number;
// }

// interface CreateAndAddUnpaidTransactionInput {
//   compopundTransactionId: string;
//   createTransactionInput: CreateUnpaidTransactionInput;
// }

interface CreatePartyInput {
  id: string;
  balance: number;
}

interface AddAmountInput {
  partyId: string;
  amount: number;
}

interface CreateGoodInput {
  id: string;
  name: string;
  price: number;
  supply: number;
  sellerId: string;
  marketId: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  initialPartyIds: string[];
  reinitDbOnStartup: boolean;
}

const argv = minimist(process.argv);

// Change
const name = argv.as ? argv.as : 'Market';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  initialPartyIds: [],
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
// Change
let db, partys, goods, markets, transactions, compoundtransactions;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
      if (!_.isEmpty(config.initialPartyIds)) {
        await db.collection('partys')
          .insertMany(_.map(config.initialPartyIds, (id) => ({id: id})));
        console.log(
          `Initialized party set with ${config.initialPartyIds}`);
      }
    }
    // Change
    partys = db.collection('partys');
    goods = db.collection('goods');
    markets = db.collection('markets');
    transactions = db.collection('transactions');
    compoundtransactions = db.collection('compoundtransactions');
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async marketExists(marketId: string) {
    return Validation.exists(markets, marketId, 'Market');
  }

  static async partyExists(id: string) {
    return Validation.exists(partys, id, 'Party');
  }

  static async goodExists(id: string): Promise<GoodDoc> {
    return Validation.exists(goods, id, 'Good');
  }

  static async transactionExists(id: string): Promise<TransactionDoc> {
    return Validation.exists(transactions, id, 'Transaction');
  }

  static async compoundTransactionExists(id: string): Promise<CompoundTransactionDoc> {
    return Validation.exists(compoundtransactions, id, 'Compound Transaction');
  }

  static async transactionHasStatus(
    id: string, status: TransactionStatus): Promise<TransactionDoc> {
    const transaction: TransactionDoc = await Validation.transactionExists(id);
    if (transaction.status !== status) {
      throw new Error(`Transaction is ${transaction.status}`);
    }
    return transaction;
  }

  static async compoundTransactionHasStatus(id: string, status: TransactionStatus):
    Promise<CompoundTransactionDoc> {
    const compoundTransaction: CompoundTransactionDoc = await 
      Validation.compoundTransactionExists(id);
    if (!_.isEmpty(compoundTransaction.transactions)) {
      // other operations guarantee that
      // all transactions in a compound transaction have the same status
      await Validation.transactionHasStatus(
        compoundTransaction.transactions[0], status);
    }
    return compoundTransaction;
  }

  static async goodPurchasable(id: string, quantity: number) {
    const good: GoodDoc = await Validation.goodExists(id);
    if (good.supply < quantity) {
      throw new Error(`Good ${id} does not enough supply (${good.supply})
        for purchase quantity ${quantity}`);
    }
  }

  static async transactionStatusMatches(
    transactions: TransactionDoc[], expected: TransactionStatus) {
    const sameStatus = _.every(transactions, ['status', expected]);
    if (!sameStatus) {
      throw new Error('Transactions must all have the same status');
    }
  }

  static async goodHasSeller(id: string): Promise<GoodDoc> {
    const good: GoodDoc = await Validation.goodExists(id);
    if (!good.sellerId) {
      throw new Error(`Good ${id} does not have a seller`);
    }
    return good;
  }

  static async transactionHasSeller(id: string): Promise<TransactionDoc> {
    const transaction: TransactionDoc = await Validation.transactionExists(id);
    if (!transaction.sellerId) {
      throw new Error(`Transaction ${id} does not have a seller`);
    }
    return transaction;
  }

  private static async exists(collection, id: string, type: string) {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }
    return doc;
  }
}


const resolvers = {
  Query: {
    // partys: () => partys.find().toArray(),
    // goods: () => goods.find().toArray(),
    // markets: () => markets.find().toArray(),
    // transactions: () => transactions.find().toArray(),
    // compoundtransactions: () => compoundtransactions.find().toArray(),

    party: (_, { id }) => partys.findOne({ id: id }),
    good: (_, { id }) => goods.findOne({ id: id }),
    market: (_, { id }) => markets.findOne({ id: id }),
    transaction: (_, { id }) => transactions.findOne({ id: id }),
    compoundtransaction: (id) => compoundtransactions.findOne({ id: id }),

    affordableGoods: async (_, { marketId, buyerId }) => {
      const buyer: PartyDoc = await partys
        .findOne({ id: buyerId });

      return goods.find({
        marketId: marketId,
        price: { $lte: buyer.balance }
      })
      .toArray();
    },
    unaffordableGoods: async (_, { marketId, buyerId }) => {
      const buyer: PartyDoc = await partys
        .findOne({ id: buyerId });

      return goods.find({
        marketId: marketId,
        price: { $gt: buyer.balance }
      })
      .toArray();
    },
    goodsInMarket: (_, { marketId }) => goods
      .find({
        marketId: marketId,
        supply: { $gt: 0 }
      })
      .toArray(),
    goodsFromSeller: (_, { marketId, sellerId }) => goods
      .find({
        marketId: marketId,
        sellerId: sellerId
      })
      .toArray(),
    marketTransactions: (_, { marketId }) => transactions
      .find({ marketId: marketId })
      .toArray(),
    buyerTransactions: (_, { buyerId, marketId }) => transactions
      .find({
        buyerId: buyerId,
        marketId: marketId
      })
      .toArray()
  },
  Party: {
    id: (party: PartyDoc) => party.id,
    balance: (party: PartyDoc) => party.balance
  },
  Good: {
    id: (good: GoodDoc) => good.id,
    name: (good: GoodDoc) => good.name,
    price: (good: GoodDoc) => good.price,
    seller: (good: GoodDoc) => partys
      .findOne({ id: good.sellerId }),
    supply: (good: GoodDoc) => good.supply,
    market: (good: GoodDoc) => markets
      .findOne({ id: good.marketId })
  },
  Transaction: {
    id: (transaction: TransactionDoc) => transaction.id,
    good: (transaction: TransactionDoc) => goods
      .findOne({ id: transaction.goodId }),
    buyer: (transaction: TransactionDoc) => partys
      .findOne({ id: transaction.buyerId }),
    seller: (transaction: TransactionDoc) => partys
      .findOne({ id: transaction.sellerId }),
    price: (transaction: TransactionDoc) => transaction.price,
    quantity: (transaction: TransactionDoc) => transaction.quantity,
    market: (transaction: TransactionDoc) => markets
      .findOne({ id: transaction.marketId }),
    status: (transaction: TransactionDoc) => transaction.status
  },
  CompoundTransaction: {
    id: (compoundTransaction: CompoundTransactionDoc) => compoundTransaction.id,
    transactions: (compoundTransaction: CompoundTransactionDoc) => transactions
      .find({ id: { $in: compoundTransaction.transactions } })
      .toArray(),
    totalPrice: (compoundTransaction: CompoundTransactionDoc) =>
      compoundTransaction.totalPrice
  },
  Mutation: {
    createMarket: async (_root, {id}: {id: string}) => {
      const market: MarketDoc = { id: id ? id : uuid() };
      await markets.insertOne(market);

      return market;
    },
    createParty: async (_root, {input}: {input: CreatePartyInput}) => {
      const party: PartyDoc = {
        id: input.id ? input.id : uuid(),
        balance: input.balance
      };
      await partys.insertOne(party);

      return party;
    },
    addAmount: async (_root, {input}: {input: AddAmountInput}) => {
      await Validation.partyExists(input.partyId);
      const updateOp = { $inc: { balance: input.amount } };
      await partys.updateOne({ id: input.partyId }, updateOp);

      return true;
    },
    createGood: async (_root, {input}: {input: CreateGoodInput}) => {
      console.log("create good");
      await Validation.marketExists(input.marketId);
      const good: GoodDoc = {
        id: input.id ? input.id : uuid(),
        name: input.name,
        price: input.price,
        supply: input.supply,
        marketId: input.marketId
      };
      if (input.sellerId) {
        await Promise.resolve(Validation.partyExists(input.sellerId));
        good.sellerId = input.sellerId;
      }
      await goods.insertOne(good);
      console.log(good);
      return good;
    },
    updateGood: async (_root, {id, name, price, sellerId, supply}) => {
      await Validation.goodExists(id);
      const updatedGood = {};
      if (name) {
        updatedGood[name] = name;
      }
      if (price || price === 0) {
        updatedGood[price] = price;
      }
      if (sellerId) {
        await Promise.resolve(Validation.partyExists(sellerId));
        updatedGood[sellerId] = sellerId;
      }
      if (supply || supply === 0) {
        updatedGood[supply] = supply;
      } 
      const updateOp = { $set: updatedGood }
      await goods.updateOne({ id: id }, updateOp);

      return true;
    },
//     buyGood: async (_root, {id, buyerId, quantity, fraction}) => {
//       await Promise.all([
//         Validation.partyExists(buyerId),
//         Validation.goodPurchasable(id, quantity)
//       ]);
//       const good: GoodDoc = await Validation.goodHasSeller(id);
//       const pricePerGood: number = good.price * fraction;
//       const transaction: TransactionDoc = {
//         id: uuid(),
//         goodId: id,
//         buyerId,
//         quantity,
//         price: pricePerGood,
//         marketId: good.marketId,
//         status: TransactionStatus.Paid
//       };
//       const goodUpdateOp = { $inc: { supply:  -quantity } };
//       await Promise.all([
//         transactions.insertOne(transaction),
//         makePayment(good.sellerId!, buyerId, pricePerGood * quantity),
//         goods.updateOne({ id: good.id }, goodUpdateOp)
//       ]);

//       return transaction;
//     },
//     createUnpaidTransaction: async (_root, {input}: {input: CreateUnpaidTransactionInput}) => {
//       return createUnpaidTransaction(input);
//     },
//     createUnpaidCompoundTransaction: async (_root,
//       {id, transactions}: {id: string, transactions: CreateUnpaidTransactionInput[]}) => {
//       const transactionDocs: TransactionDoc[] = await Promise.all<TransactionDoc>(
//         _.map(transactions, createUnpaidTransaction));
//       const transactionIds = _.map(transactionDocs, 'id');

//       const totalPrice: number = _.reduce(transactionDocs,
//         (sum: number, transaction: TransactionDoc) =>
//         sum + transaction.price * transaction.quantity, 0);

//       const compoundTransaction: CompoundTransactionDoc = {
//         id: id ? id : uuid(),
//         transactions: transactionIds,
//         totalPrice
//       };
//       await compoundtransactions.insertOne(compoundTransaction);

//       return compoundTransaction;
//     },
//     createAndAddUnpaidTransaction: async (_root, {input}: {input: CreateAndAddUnpaidTransactionInput}) => {
//       const compoundTransaction: CompoundTransactionDoc =
//         await Validation.compoundTransactionExists(input.compopundTransactionId);
//       // make sure compoundTransaction is still unpaid
//       if (!_.isEmpty(compoundTransaction.transactions)) {
//         const referenceTransaction: TransactionDoc = await transactions
//           .findOne({ id: compoundTransaction.transactions[0] });
//         await Validation.transactionStatusMatches(
//           [referenceTransaction], TransactionStatus.Unpaid);
//       }
//       const newTransaction: TransactionDoc = await createUnpaidTransaction(
//         input.createTransactionInput);
//       const updateOp = {
//         $push: { transactions: newTransaction.id },
//         $inc: { totalPrice: newTransaction.price * newTransaction.quantity }
//       }
//       await compoundtransactions.updateOne({
//         id: input.compopundTransactionId
//       }, updateOp);

//       return newTransaction;
//     },
//     setCompoundTransactionSeller: async (_root, {id, sellerId}) => {
//       await Promise.all([
//         Validation.compoundTransactionHasStatus(id, TransactionStatus.Unpaid),
//         Validation.partyExists(sellerId)
//       ]);
//       const updateOp = { $set: { sellerId: sellerId }};
//       // TODO: should update all transactions + goods seller instead
//       await compoundtransactions.updateOne({ id: id }, updateOp);

//       return true;
//     },
//     payForCompoundTransaction: async (_root, {id}) => {
//       const compoundTransaction: CompoundTransactionDoc =
//         await Validation.compoundTransactionHasStatus(
//           id, TransactionStatus.Unpaid);
//       const transactions: TransactionDoc[] = await Promise.all<TransactionDoc>(
//         _.map(compoundTransaction.transactions, Validation.transactionHasSeller));
//       // good supply was already decremented when transaction was created
//       await Promise.all(_.map(transactions, (transaction: TransactionDoc) => 
//         makePayment(transaction.sellerId!, transaction.buyerId,
//           transaction.price * transaction.quantity)));
//       return true;
//     },
//     cancelUnpaidTransaction: async (_root, {id}) => {
//       const compoundTransaction: CompoundTransactionDoc =
//         await Validation.compoundTransactionHasStatus(
//           id, TransactionStatus.Unpaid);

//       await Promise.all(_.map(compoundTransaction.transactions,
//         (transactionId: string) => cancelUnpaidTransaction(transactionId)));
//       return true;
//     }
  }
};

// async function createUnpaidTransaction(
//   input: CreateUnpaidTransactionInput): Promise<TransactionDoc> {
//   await Promise.all([
//     Validation.partyExists(input.buyerId),
//     Validation.goodPurchasable(input.goodId, input.quantity)
//   ]);
//   const good: GoodDoc = await goods.findOne({ id: input.goodId });
//   const transaction: TransactionDoc = {
//     id: input.id ? input.id : uuid(),
//     goodId: input.goodId,
//     buyerId: input.buyerId,
//     quantity: input.quantity,
//     price: input.price ? input.price : good.price,
//     marketId: good.marketId,
//     status: TransactionStatus.Unpaid
//   };
//   if (good.sellerId) {
//     transaction.sellerId = good.sellerId;
//   }
//   const updateOp = { $inc: { supply: -input.quantity }};
//   await Promise.all([
//     transactions.insertOne(transaction),
//     goods.updateOne({ id: input.goodId, }, updateOp)
//   ]);

//   return transaction;
// }

// async function cancelUnpaidTransaction(id: string) {
//   const transaction: TransactionDoc = await Validation.transactionHasStatus(
//     id, TransactionStatus.Unpaid);
//   const transactionUpdateOp = { $set: { status: TransactionStatus.Canceled }};
//   const goodUpdateOp = { $inc: { supply: transaction.quantity }};

//   await Promise.all([
//     transactions.updateOne({ id: id }, transactionUpdateOp),
//     goods.updateOne({ id: transaction.goodId }, goodUpdateOp)
//   ]);
// }

// async function makePayment(sellerId: string, buyerId: string, price: number) {
//   const buyerUpdateOp = { $inc: { balance: -price } };
//   const sellerUpdateOp = { $inc: { balance: price } };
//   // NOTE: allows negative balance
//   await Promise.all([
//     partys.updateOne({ id: buyerId }, buyerUpdateOp),
//     partys.updateOne({ id: sellerId }, sellerUpdateOp)
//   ]);
// }

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
