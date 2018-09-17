import * as bodyParser from 'body-parser';
import * as express from 'express';
import {readFileSync} from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import {v4 as uuid} from 'uuid';

import * as _ from 'lodash';

import {graphiqlExpress, graphqlExpress} from 'apollo-server-express';
import {makeExecutableSchema} from 'graphql-tools';


interface ItemCount {
  itemId: string;
  count: number;
}

interface AccountDoc<Balance> {
  id: string;
  balance: Balance;
  transfers: TransferDoc<Balance>[];
  pending?: string;
  pendingTransfer?: {
    updateId: string; transfer: TransferDoc<Balance>
  };
}

interface TransferDoc<Balance> {
  id: string;
  fromId?: string;
  toId: string;
  amount: Balance;
}

interface CreateAccountInput<Balance> {
  id: string;
  balance: Balance;
}

interface CreateTransferInput<Balance> {
  id: string;
  fromId: string;
  toId: string;
  amount: Balance;
}

interface AddToBalanceInput<Balance> {
  accountId: string;
  amount: Balance;
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  balance: 'money' | 'items';
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'transfer';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
  balance: 'money'
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db;
let accounts;
let moneyAccounts: mongodb.Collection<AccountDoc<number>>;
let itemAccounts: mongodb.Collection<AccountDoc<ItemCount>>;
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
    accounts = db.collection('accounts');
    accounts.createIndex({ id: 1 }, { unique: true, sparse: true });

    moneyAccounts = accounts;
    itemAccounts = accounts;
  });


type AccountHasFundsFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => boolean;
type NewBalanceFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => Balance;
type CommitUpdateFn<Balance> = (
  transferAmount: Balance, updateId: string) => Promise<void>;
type NegateBalanceFn<Balance> = (balance: Balance) => Balance;

function getResolvers<Balance>(
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  commitUpdateFn: CommitUpdateFn<Balance>,
  negateBalanceFn: NegateBalanceFn<Balance>) {
  return {
    Query: {
      account: (_root, { id }) => accounts.findOne({ id: id })
    },
    Account: {
      id: (account) => account.id,
      balance: (account) => account.balance,
      transfers: (account) => account.transfers
    },
    Mutation: {
      createAccount: async (
        _root, {input}: { input: CreateAccountInput<Balance> },
        context: Context) => {

        const doc: AccountDoc<Balance> = {
          id: input.id ? input.id : uuid(),
          balance: input.balance,
          transfers: []
        };
        const reqIdPendingFilter = { pending: context.reqId };
        switch (context.reqType) {
          case 'vote':
            doc.pending = context.reqId;
            /* falls through */
          case undefined:
            await accounts.insertOne(input);

            return doc;
          case 'commit':
            await accounts.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return;
          case 'abort':
            await accounts.deleteOne(reqIdPendingFilter);

            return;
        }
      },
      createTransfer: async (
        _root, {input}: { input: CreateTransferInput<Balance> },
        context: Context) => {
        const updateId = context.reqId;
        const transfer = {
          id: input.id ? input.id : uuid(),
          fromId: input.fromId,
          toId: input.toId,
          amount: input.amount
        };
        try {
          /*
           * It is important that we apply the update to the source account
           * first so that we don't need to rollback the update to the other
           * account if the account has insufficient funds
           */
          await addToBalance<Balance>(
            input.fromId, negateBalanceFn(input.amount), transfer,
            updateId, context.reqType,
            accountHasFundsFn, newBalanceFn, commitUpdateFn);

          /*
           * No need to do the updates in a tx. Even if the server fails before
           * doing the second update, there will be a record on the pending
           * transfer in the other account
           */
          await addToBalance<Balance>(
            input.toId, input.amount, transfer, updateId, context.reqType,
            accountHasFundsFn, newBalanceFn, commitUpdateFn);
        } catch (e) {
          await abortUpdate(updateId);
        }

        return transfer;
      },
      addToBalance: async (
        _root, {input}: { input: AddToBalanceInput<Balance> },
        context: Context) => {
        return await addToBalance<Balance>(
          input.accountId, input.amount,
          { id: uuid(), toId: input.accountId, amount: input.amount },
          context.reqId, context.reqType,
          accountHasFundsFn, newBalanceFn, commitUpdateFn);
      }
    }
  };
}

async function voteUpdate<Balance>(
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  updateId: string,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>)
  : Promise<AccountDoc<Balance> | undefined> {
  // Error messages
  const noAccountMsg = (accountIdWithError) =>
    `Account ${accountIdWithError} doesn't exist`;
  const noFundsMsg = (accountIdWithError) =>
    `Account ${accountIdWithError} has insufficient funds`;
  const pendingTransferMsg = (accountIdWithError) =>
    `Account ${accountIdWithError} has a pending transfer, try again later`;

  const accountFilter = { id: accountId, pending: { $exists: false } };
  const pendingTransfer = {
    reqId: updateId,
    transfer: transfer
  };
  const voteUpdateOp = { $set: { pending: pendingTransfer } };
  const voteAccount = (await accounts
    .findOneAndUpdate(accountFilter, voteUpdateOp))
    .value;
  if (voteAccount === undefined) {
    // Do another find so that we return a more specific error
    const accountExists = (await accounts
      .findOne({ id: accountId }, { _id: 1 })) === undefined;
    const errorMsg = accountExists ?
      noAccountMsg(accountId) : pendingTransferMsg(accountId);
    throw new Error(errorMsg);
  }
  // Throw an error if the balance in acct would be negative after updating
  if (!accountHasFundsFn(voteAccount.balance, amount)) {
    await abortUpdate(updateId);
    throw new Error(noFundsMsg(accountId));
  }
  voteAccount.balance = newBalanceFn(voteAccount.balance, amount);

  return voteAccount;
}

async function abortUpdate(updateId: string) {
  const reqIdPendingFilter = { 'pending.updateId': updateId };
  await accounts
    .updateMany(reqIdPendingFilter, { $unset: { pending: '' } });

  return;
}

/**
 * Adds `amount` to the balance of account `accountId` and adds `transfer`
 * to its transfer log if the account has sufficient funds (amount could be
 * negative)
 *
 * @param accountId the id of the account that will receive `amount`
 * @param amount the amount to add to the account. Use a negative number to
 *               subtract money from the account.
 * @param transfer the transfer object to add to the log
 * @param updateId the id of the update
 * @param action the action to perform
 * @param accountHasFundsFn fn that returns true if the account has funds
 * @param newBalanceFn fn to compute the new account balance
 * @param commitUpdateFn fn to commit update
 * @throws error if the account doesn't exists, has insufficient funds, or has
 *         a pending update
 */
async function addToBalance<Balance>(
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  updateId: string, action: 'vote' | 'commit' | 'abort' | undefined,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  commitUpdateFn: CommitUpdateFn<Balance>)
  : Promise<AccountDoc<Balance> | undefined> {
  switch (action) {
    case 'vote':
      return await voteUpdate<Balance>(
        accountId, amount, transfer, updateId, accountHasFundsFn, newBalanceFn);
    case undefined:
      /*
       * We can't apply the update directly because we need to check that the
       * account has sufficient funds. But if we do the check and then the
       * update, the balance could have changed between the check and update.
       * If we do vote + commit then we ensure that the balance won't change in
       * the middle (because voting on an update puts a "lock" on that account)
       */
      let account: AccountDoc<Balance> | undefined;
      try {
        account = await voteUpdate<Balance>(
          accountId, amount, transfer, updateId,
          accountHasFundsFn, newBalanceFn);
      } catch (e) {
        await abortUpdate(updateId);
      }
      await commitUpdateFn(amount, updateId);

      return account;
    case 'commit':
      await commitUpdateFn(amount, updateId);

      return;
    case 'abort':
      await abortUpdate(updateId);

      return;
  }
}

let typeDefinitions, resolvers;
if (config.balance === 'money') {

  const schemaPath = path.join(__dirname, 'schema.graphql');
  typeDefinitions = [
    readFileSync(schemaPath, 'utf8')
      .replace('#Balance', 'Float')
  ];

  const newBalanceFn: NewBalanceFn<number> =
    (accountBalance: number, transferAmount: number) => (
      accountBalance + transferAmount
    );
  const accountHasFundsFn: AccountHasFundsFn<number> =
    (accountBalance: number, transferAmount: number) => (
      newBalanceFn(accountBalance, transferAmount) > 0
    );
  const commitUpdateFn: CommitUpdateFn<number> =
    async (transferAmount: number, updateId: string) => {
      const reqIdPendingFilter = { 'pending.updateId': updateId };
      const commitUpdateOp = {
        $inc: { balance: transferAmount }, $unset: { pending: '' }
      };
      await accounts
        .updateOne(reqIdPendingFilter, commitUpdateOp);

      return;
    };
  const negateBalanceFn: NegateBalanceFn<number> =
    (balance: number) => -balance;

  resolvers = getResolvers<number>(
    accountHasFundsFn, newBalanceFn, commitUpdateFn, negateBalanceFn);

} else {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  typeDefinitions = [
    readFileSync(schemaPath, 'utf8')
      .concat(`
        type ItemCount {
          itemId: ID!
          count: Number
        }
      `)
      .replace('#Balance', '[ItemCount]')
  ];

  const newBalanceFn: NewBalanceFn<ItemCount[]> =
    (accountBalance: ItemCount[], transferAmount: ItemCount[]) => {
      const accountBalanceMap = _
        .reduce(accountBalance, (acc, itemCount: ItemCount) => {
          acc[itemCount.itemId] = itemCount.count;

          return acc;
        }, {});

      _.each(transferAmount, (itemCount: ItemCount) => {
        const prevItemCount = _.get(accountBalanceMap, itemCount.itemId, 0);
        const newCount = prevItemCount + itemCount.count;
        if (newCount === 0) {
          delete accountBalanceMap[itemCount.count];
        } else {
          accountBalanceMap[itemCount.itemId] = prevItemCount + itemCount.count;
        }
      });

      return _
        .map(accountBalanceMap, (value: number, key: string): ItemCount => {
          return { itemId: key, count: value };
        });
    };
  const accountHasFundsFn: AccountHasFundsFn<ItemCount[]> =
    (accountBalance: ItemCount[], transferAmount: ItemCount[]) => {
      const newBalance = newBalanceFn(accountBalance, transferAmount);
      for (const itemCount of newBalance) {
        if (itemCount.count < 0) {
          return false;
        }
      }

      return true;
    };
  const commitUpdateFn: CommitUpdateFn<ItemCount[]> =
    async (transferAmount: ItemCount[], updateId: string) => {
      const reqIdPendingFilter = { 'pending.updateId': updateId };
      const account = await accounts.findOne(reqIdPendingFilter);
      const newBalance = newBalanceFn(account.balance, transferAmount);
      const commitUpdateOp = {
        $set: { balance: newBalance }, $unset: { pending: '' }
      };
      await accounts
        .updateOne(reqIdPendingFilter, commitUpdateOp);

      return;
    };
  const negateBalanceFn: NegateBalanceFn<ItemCount[]> =
    (balance: ItemCount[]) => {
      return _.map(balance, (itemCount: ItemCount) => {
        return { itemId: itemCount.itemId, count: -itemCount.count };
      });
    };

  resolvers = getResolvers<ItemCount[]>(
    accountHasFundsFn, newBalanceFn, commitUpdateFn, negateBalanceFn);
}

const schema = makeExecutableSchema({ typeDefs: typeDefinitions, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, _res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});
