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


enum TransactionStatus {
  Paid = 'PAID',
  Unpaid = 'UNPAID',
  Canceled = 'CANCELED'
}

interface MarketDoc { id: string; }

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
  pricePerGood: number;
  quantity: number;
  marketId: string;
  status: TransactionStatus;
}

interface CompoundTransactionDoc {
  id: string;
  transactions: string[];
  totalPrice: number;
}

interface Market { id: string; }

interface Party {
  id: string;
  balance: number;
}

interface Good {
  id: string;
  name: string;
  price: number;
  seller?: Party; // optional when buyer is looking for a seller from whom to buy this
  supply: number;
  market: Market;
}

interface Transaction {
  id: string;
  good: Good;
  buyer: Party;
  seller?: Party;
  pricePerGood: number;
  quantity: number;
  market: Market;
  status: TransactionStatus;
}

// interface CompoundTransaction {
//   id: string;
//   transactions: Transaction[];
//   totalPrice: number;
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

interface UpdateGoodInput {
  id: string;
  name: string | undefined;
  price: number | undefined;
  supply: number | undefined;
  sellerId: string | undefined;
}

interface GoodsInput {
  buyerId?: string;
  sellerId?: string;
  marketId?: string;
  affordable?: boolean;
  available?: boolean;
}

interface CreateTransactionInput {
  id: string;
  goodId: string;
  buyerId: string;
  quantity: number;
  priceFraction: number;
  paid: boolean;
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

  static async partyExists(id: string): Promise<PartyDoc> {
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

function goodDocToGood(goodDoc: GoodDoc): Good {
  const ret = _.omit(goodDoc, ['sellerId', 'marketId']);
  if (goodDoc.sellerId) {
    ret.seller = { id: goodDoc.sellerId };
  }
  ret.market = { id: goodDoc.marketId };

  return ret;
}

function transactionDocToTransaction(transactionDoc: TransactionDoc): Transaction {
  const ret = _.omit(transactionDoc, ['goodId', 'buyerId', 'sellerId', 'marketId']);
  ret.good = { id: transactionDoc.goodId };
  ret.buyer = { id: transactionDoc.buyerId };
  if (transactionDoc.sellerId) {
    ret.seller = { id: transactionDoc.sellerId };
  }
  ret.market = { id: transactionDoc.marketId };

  return ret;
}


const resolvers = {
  Query: {
    // partys: () => partys.find().toArray(),
    // goods: () => goods.find().toArray(),
    // markets: () => markets.find().toArray(),
    // transactions: () => transactions.find().toArray(),
    // compoundtransactions: () => compoundtransactions.find().toArray(),

    party: (_root, { id }) => partys.findOne({ id: id }),
    good: (_root, { id }) => goodDocToGood(goods.findOne({ id: id })),
    market: (_root, { id }) => markets.findOne({ id: id }),
    transaction: (_root, { id }) =>
      transactionDocToTransaction(transactions.findOne({ id: id })),
    compoundtransaction: (id) => compoundtransactions.findOne({ id: id }),

    goods: async (_root, { input }: { input: GoodsInput }): Promise<Good> => {
      const sellerIdFilterOp = _.omitBy({
        $eq: input.sellerId,
        $ne: input.buyerId
      }, _.isUndefined);
      const filterOp = _.omitBy({
        marketId: input.marketId,
        sellerId: sellerIdFilterOp
      }, (val) => _.isUndefined(val) || _.isEmpty(val));

      if (input.affordable !== undefined && input.buyerId) {
        const buyer: PartyDoc = await Validation.partyExists(input.buyerId);

        filterOp['price'] = { $lte: buyer.balance }; 
      }
      if (input.available) {
        filterOp['supply'] = { $gt: 0 };
      }

      const matchingGoods: GoodDoc[] = await goods.find(filterOp)
        .toArray();
      return _.map(matchingGoods, goodDocToGood);
    },
    marketTransactions: (_root, { marketId }) => transactions
      .find({ marketId: marketId })
      .toArray(),
    buyerTransactions: (_root, { buyerId, marketId }) => transactions
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
    id: (good: Good) => good.id,
    name: (good: Good) => good.name,
    price: (good: Good) => good.price,
    seller: (good: Good) => good.seller,
    supply: (good: Good) => good.supply,
    market: (good: Good) => good.market
  },
  Transaction: {
    id: (transaction: Transaction) => transaction.id,
    good: (transaction: Transaction) => transaction.good,
    buyer: (transaction: Transaction) => transaction.buyer,
    seller: (transaction: Transaction) => transaction.seller,
    pricePerGood: (transaction: Transaction) => transaction.pricePerGood,
    quantity: (transaction: Transaction) => transaction.quantity,
    market: (transaction: Transaction) => transaction.market,
    status: (transaction: Transaction) => transaction.status
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
      return goodDocToGood(good);
    },
    updateGood: async (_root, {input}: {input: UpdateGoodInput}) => {
      await Validation.goodExists(input.id);
      const updatedGood = {};
      if (name) {
        updatedGood[name] = name;
      }
      if (input.price || input.price === 0) {
        updatedGood[input.price] = input.price;
      }
      if (input.sellerId) {
        await Promise.resolve(Validation.partyExists(input.sellerId));
        updatedGood[input.sellerId] = input.sellerId;
      }
      if (input.supply || input.supply === 0) {
        updatedGood[input.supply] = input.supply;
      } 
      const updateOp = { $set: updatedGood }
      await goods.updateOne({ id: input.id }, updateOp);

      return true;
    },
    createTransaction: async (_root, {input}: {input: CreateTransactionInput}) => {
      await Promise.all([
        Validation.partyExists(input.buyerId),
        Validation.goodPurchasable(input.goodId, input.quantity)
      ]);

      const good: GoodDoc = input.paid ? await Validation.goodHasSeller(input.goodId)
        : await Validation.goodExists(input.goodId);
      const pricePerGood = _.isNumber(input.priceFraction) ?
        good.price * input.priceFraction : good.price;

      const transaction: TransactionDoc = {
        id: input.id ? input.id : uuid(),
        goodId: input.goodId,
        buyerId: input.buyerId,
        quantity: input.quantity,
        pricePerGood: pricePerGood,
        marketId: good.marketId,
        status: input.paid ? TransactionStatus.Paid : TransactionStatus.Unpaid
      };
      if (good.sellerId) {
        transaction.sellerId = good.sellerId;
      }
      const goodUpdateOp = { $inc: { supply: -input.quantity }};
      const opPromises = [
        transactions.insertOne(transaction),
        goods.updateOne({ id: input.goodId, }, goodUpdateOp)
      ];
      if (good.sellerId) {
        opPromises.push(
          makePayment(good.sellerId!, input.buyerId, pricePerGood * input.quantity));
      }
      await Promise.all(opPromises);
      return transactionDocToTransaction(transaction);
    },
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

async function makePayment(sellerId: string, buyerId: string, price: number) {
  const buyerUpdateOp = { $inc: { balance: -price } };
  const sellerUpdateOp = { $inc: { balance: price } };
  // NOTE: allows negative balance
  await Promise.all([
    partys.updateOne({ id: buyerId }, buyerUpdateOp),
    partys.updateOne({ id: sellerId }, sellerUpdateOp)
  ]);
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
