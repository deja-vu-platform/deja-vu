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
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Canceled = 'Canceled'
}

interface MarketDoc { id: string; }

interface PartyDoc {
  id: string;
  balance: number;
}

interface GoodDoc {
  id: string;
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
  status: TransactionStatus;
}

interface Market { id: string; }

interface Party {
  id: string;
  balance: number;
}

interface Good {
  id: string;
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

interface CompoundTransaction {
  id: string;
  transactions: Transaction[];
  totalPrice: number;
  status: TransactionStatus;
}

interface CreateMarketInput {
  id: string | undefined;
  withNewGoods: CreateGoodInput[];
}

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
  price: number;
  supply: number;
  sellerId: string;
  marketId: string;
}

interface UpdateGoodInput {
  id: string;
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
  compoundTransactionId: string;
  goodId: string;
  buyerId: string;
  quantity: number;
  priceFraction: number;
  paid: boolean;
}

interface TransactionsInput {
  buyerId?: string;
  sellerId?: string;
  marketId?: string;
  status?: TransactionStatus;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  initialPartyIds: string[];
  reinitDbOnStartup: boolean;
  // Whether to check and keep track of balances or not. Default is true.
  enforceBalance: boolean;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'market';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  initialPartyIds: [],
  reinitDbOnStartup: true,
  enforceBalance: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db, parties, goods, markets, transactions, compoundtransactions;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    parties = db.collection('parties');
    parties.createIndex({ id: 1 }, { unique: true, sparse: true });
    goods = db.collection('goods');
    goods.createIndex({ id: 1 }, { unique: true, sparse: true });
    markets = db.collection('markets');
    markets.createIndex({ id: 1 }, { unique: true, sparse: true });
    transactions = db.collection('transactions');
    transactions.createIndex({ id: 1 }, { unique: true, sparse: true });
    compoundtransactions = db.collection('compoundtransactions');
    compoundtransactions.createIndex({ id: 1 }, { unique: true, sparse: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async marketExists(marketId: string) {
    return Validation.exists(markets, marketId, 'Market');
  }

  static async partyExists(id: string): Promise<PartyDoc> {
    return Validation.exists(parties, id, 'Party');
  }

  static async goodExists(id: string): Promise<GoodDoc> {
    return Validation.exists(goods, id, 'Good');
  }

  static async transactionExists(id: string): Promise<TransactionDoc> {
    return Validation.exists(transactions, id, 'Transaction');
  }

  static async compoundTransactionExists(id: string): Promise<CompoundTransactionDoc> {
    return Validation.exists(compoundtransactions, id, 'Compound transaction');
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
    if (compoundTransaction.status !== status) {
      throw new Error(`Compound transaction is ${compoundTransaction.status}`);
    }
    return compoundTransaction;
  }

  static async goodPurchasable(id: string, quantity: number) {
    const good: GoodDoc = await Validation.goodExists(id);
    if (good.supply < quantity) {
      throw new Error(`Good ${id} does not have enough supply (${good.supply})
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

async function transactionDocToTransaction(transactionDoc: TransactionDoc): Promise<Transaction> {
  const ret = _.omit(transactionDoc, ['goodId', 'buyerId', 'sellerId', 'marketId']);
  ret.good = { id: transactionDoc.goodId };
  ret.buyer = { id: transactionDoc.buyerId };
  if (transactionDoc.sellerId) {
    ret.seller = { id: transactionDoc.sellerId };
  }
  ret.market = { id: transactionDoc.marketId };
  return ret;
}

function compoundTransactionDocToCompoundTransaction(
  compoundTransactionDoc: CompoundTransactionDoc): CompoundTransaction {
  const ret = _.omit(compoundTransactionDoc, ['transactions']);
  ret.transactions = _.map(compoundTransactionDoc.transactions,
    (transactionId: string) => { return { id: transactionId }; });

  return ret;
  }

async function createGood(input: CreateGoodInput) {
  await Validation.marketExists(input.marketId);
  const good: GoodDoc = {
    id: input.id ? input.id : uuid(),
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
}


const resolvers = {
  Query: {
    market: (_root, { id }) => markets.findOne({ id: id }),
    party: (_root, { id }) => parties.findOne({ id: id }),
    good: async (_root, { id }) => {
      const good = await Validation.goodExists(id);
      return goodDocToGood(good);
    },
    transaction: async (_root, { id }) => {
      const transaction = await Validation.transactionExists(id);
      return transactionDocToTransaction(transaction);
    },
    compoundTransaction: async (_root, { id }) => {
      const compoundTransaction = await Validation.compoundTransactionExists(id);
      return compoundTransactionDocToCompoundTransaction(compoundTransaction);
    },

    goods: async (_root, { input }: { input: GoodsInput }): Promise<Good[]> => {
      const sellerIdFilterOp = _.omitBy({
        $eq: input.sellerId,
        $ne: input.buyerId
      }, _.isEmpty);
      const filterOp = _.omitBy({
        marketId: input.marketId,
        sellerId: sellerIdFilterOp
      }, _.isEmpty);

      if (input.affordable !== undefined && input.buyerId) {
        const buyer: PartyDoc = await Validation.partyExists(input.buyerId);

        const op = input.affordable ? '$lte' : '$gte';
        filterOp['price'] = { [op]: buyer.balance };
      }
      if (input.available) {
        filterOp['supply'] = { $gt: 0 };
      }

      const matchingGoods: GoodDoc[] = await goods.find(filterOp)
        .toArray();
      return _.map(matchingGoods, goodDocToGood);
    },
    transactions: async (_root, { input }: { input: TransactionsInput })
      : Promise<Transaction[]> => {
      const matchingTransactions: TransactionDoc[] = await transactions
        .find(input)
        .toArray();
      return _.map(matchingTransactions, transactionDocToTransaction);
    }
  },
  Party: {
    id: (party: Party) => party.id,
    balance: (party: Party) => party.balance
  },
  Good: {
    id: (good: Good) => good.id,
    price: (good: Good) => good.price,
    seller: (good: Good) => good.seller,
    supply: (good: Good) => good.supply,
    market: (good: Good) => good.market
  },
  Transaction: {
    id: (transaction: Transaction) => transaction.id,
    good: (transaction: Transaction) => goods.findOne(transaction.good),
    buyer: (transaction: Transaction) => transaction.buyer,
    seller: (transaction: Transaction) => transaction.seller,
    pricePerGood: (transaction: Transaction) => transaction.pricePerGood,
    quantity: (transaction: Transaction) => transaction.quantity,
    market: (transaction: Transaction) => transaction.market,
    status: (transaction: Transaction) => transaction.status
  },
  CompoundTransaction: {
    id: (compoundTransaction: CompoundTransaction) => compoundTransaction.id,
    transactions: (compoundTransaction: CompoundTransaction) =>
    compoundTransaction.transactions,
    totalPrice: (compoundTransaction: CompoundTransaction) =>
      compoundTransaction.totalPrice,
    status: (compoundTransaction: CompoundTransaction) =>
      compoundTransaction.status
  },
  Mutation: {
    createMarket: async (_root, {input}: {input: CreateMarketInput}) => {
      const marketId = input.id ? input.id : uuid();
      const market: MarketDoc = { id: marketId };
      await markets.insertOne(market);
      await Promise.all(_
        .chain(input.withNewGoods)
        .map((g: CreateGoodInput) => {
          g.marketId = marketId;

          return g;
        })
        .map(createGood));

      return market;
    },
    createParty: async (_root, {input}: {input: CreatePartyInput}) => {
      const party: PartyDoc = {
        id: input.id ? input.id : uuid(),
        balance: input.balance
      };
      await parties.insertOne(party);

      return party;
    },
    addAmount: async (_root, {input}: {input: AddAmountInput}) => {
      await Validation.partyExists(input.partyId);
      const updateOp = { $inc: { balance: input.amount } };
      await parties.updateOne({ id: input.partyId }, updateOp);

      return true;
    },
    createGood: async (_root, {input}: {input: CreateGoodInput}) => {
      return createGood(input);
    },
    updateGood: async (_root, {input}: {input: UpdateGoodInput}) => {
      await Validation.goodExists(input.id);
      const updatedGood = {};
      if (input.price || input.price === 0) {
        updatedGood[input.price] = input.price;
      }
      if (input.supply || input.supply === 0) {
        updatedGood[input.supply] = input.supply;
      }

      const opPromises: Promise<any>[] = [];
      if (input.sellerId) {
        await Promise.resolve(Validation.partyExists(input.sellerId));
        updatedGood[input.sellerId] = input.sellerId;
        // Also update seller on each TransactionDoc
        opPromises.push(transactions.update({ goodId: input.id },
          { $set: { sellerId: input.sellerId }}));
      }
      const updateOp = { $set: updatedGood };
      opPromises.push(goods.updateOne({ id: input.id }, updateOp));
      await Promise.all(opPromises);

      return true;
    },
    createTransaction: async (
      _root, {input}: {input: CreateTransactionInput}) => {
      await Promise.all([
        Validation.partyExists(input.buyerId),
        Validation.goodPurchasable(input.goodId, input.quantity)
      ]);

      const good: GoodDoc = await Validation.goodExists(input.goodId);
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
        goods.updateOne({ id: input.goodId }, goodUpdateOp)
      ];
      if (good.sellerId && input.paid) {
        opPromises.push(
          makePayment(good.sellerId!, input.buyerId, pricePerGood * input.quantity));
      }

      if (input.compoundTransactionId) {
        const status: TransactionStatus = input.paid ? TransactionStatus.Paid :
          TransactionStatus.Unpaid;
        await Validation.compoundTransactionHasStatus(
          input.compoundTransactionId, status);

        const updateOp = {
          $push: { transactions: transaction.id },
          $inc: { totalPrice: transaction.pricePerGood * transaction.quantity }
        }
        opPromises.push(compoundtransactions.updateOne({
          id: input.compoundTransactionId
        }, updateOp));
      }

      await Promise.all(opPromises);
      return transactionDocToTransaction(transaction);
    },
    cancelTransaction: async (_root, {id}: {id: string}) => {
      // TODO: what to do about compound transactions associated with this?
      await cancelTransaction(id);
      return true;
    },
    payTransaction: async (_root, {id}: {id: string}) => {
      // TODO: what to do about compound transactions associated with this?
      await payTransaction(id);
      return true;
    },
    createCompoundTransaction: async (_root, {id}: {id: string}) => {
      const compoundTransaction: CompoundTransactionDoc = {
        id: id ? id : uuid(),
        transactions: [],
        totalPrice: 0,
        status: TransactionStatus.Unpaid
      };
      await compoundtransactions.insertOne(compoundTransaction);

      return compoundTransactionDocToCompoundTransaction(compoundTransaction);
    },
    cancelCompoundTransaction: async (_root, {id}: {id: string}) => {
      const compoundTransaction: CompoundTransactionDoc =
        await Validation.compoundTransactionHasStatus(id, TransactionStatus.Unpaid);

      const opPromises = _.map(
        compoundTransaction.transactions, (transactionId: string) => 
        cancelTransaction(transactionId));
      opPromises.push(compoundtransactions.updateOne({ id: id },
        { $set: { status: TransactionStatus.Canceled }}));
      await Promise.all(opPromises);

      return true;
    },
    payCompoundTransaction: async (_root, {id}) => {
      const compoundTransaction: CompoundTransactionDoc =
        await Validation.compoundTransactionHasStatus(id, TransactionStatus.Unpaid);

      const opPromises = _.map(
        compoundTransaction.transactions, (transactionId: string) => 
        payTransaction(transactionId));
      opPromises.push(compoundtransactions.updateOne({ id: id },
        { $set: { status: TransactionStatus.Paid }}));
      await Promise.all(opPromises);

      return true;
    }
  }
};

async function cancelTransaction(id: string) {
  const transaction: TransactionDoc = await Validation.transactionHasStatus(
    id, TransactionStatus.Unpaid);
  const transactionUpdateOp = { $set: { status: TransactionStatus.Canceled }};
  const goodUpdateOp = { $inc: { supply: transaction.quantity }};

  await Promise.all([
    transactions.updateOne({ id: id }, transactionUpdateOp),
    goods.updateOne({ id: transaction.goodId }, goodUpdateOp)
  ]);
}

async function payTransaction(id: string) {
  const transactionDocs: TransactionDoc[] = await Promise.all([
    Validation.transactionHasStatus(id, TransactionStatus.Unpaid),
    Validation.transactionHasSeller(id)
  ]);
  const transaction: TransactionDoc = transactionDocs[0];
  const transactionUpdateOp = { $set: { status: TransactionStatus.Paid }};
  // Good supply was already decremented when transaction was created
  await Promise.all([
    transactions.updateOne({ id: id }, transactionUpdateOp),
    makePayment(transaction.sellerId!, transaction.buyerId,
      transaction.pricePerGood * transaction.quantity)
  ]);

  return true;
}

async function makePayment(sellerId: string, buyerId: string, price: number) {
  if (!config.enforceBalance) {
    return;
  }
  const buyerUpdateOp = { $inc: { balance: -price } };
  const sellerUpdateOp = { $inc: { balance: price } };
  // NOTE: allows negative balance
  await Promise.all([
    parties.updateOne({ id: buyerId }, buyerUpdateOp),
    parties.updateOne({ id: sellerId }, sellerUpdateOp)
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
