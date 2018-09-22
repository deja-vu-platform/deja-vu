import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

import * as assert from 'assert';


interface ItemCount {
  itemId: string;
  count: number;
}

interface PendingTransfer<Balance> {
  updateId: string;
  transfer: TransferDoc<Balance>;
}

interface AccountDoc<Balance> {
  id: string;
  balance: Balance;
  /*
   * This field exists if the account itself is pending
   * This could be because it's the first time we are seeing a transfer from/to
   * this account. If the transfer ends up being aborted, then we'll delete
   * the account.
   */
  pending?: string;
  // This field exists if the account has a pending transfer
  pendingTransfer?: PendingTransfer<Balance>;
}

interface AccountPendingDoc<Balance> {
  id: string;
  balance: Balance;
  pending: string;
  pendingTransfer: PendingTransfer<Balance>;
}

interface TransferDoc<Balance> {
  id: string;
  fromId?: string;
  toId: string;
  amount: Balance;
}

interface AddToBalanceInput<Balance> {
  accountId: string;
  amount: Balance;
}

interface CreateTransferInput<Balance> {
  id: string;
  fromId: string;
  toId: string;
  amount: Balance;
}

interface TransfersInput {
  fromId?: string;
  toId?: string;
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  reqId: string | undefined;
}


interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
  balanceType: 'money' | 'items';
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'transfer';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true,
  balanceType: 'money'
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = { ...DEFAULT_CONFIG, ...configArg };

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db;
/**
 * `transfers` is the main collection, the only reason why we have an `accounts`
 * collection is to keep track of the balance (to avoid having to compute it
 * every time) and to be able to lock accounts when processing transfers.
 */
let accounts: mongodb.Collection, transfers: mongodb.Collection;
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

    transfers = db.collection('transfers');
    transfers.createIndex({ id: 1 }, { unique: true, sparse: true });
    transfers.createIndex({ fromId: 1 }, { sparse: true });
    transfers.createIndex({ toId: 1 }, { sparse: true });
  });


type AccountHasFundsFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => boolean;
type NewBalanceFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => Balance;
type NegateBalanceFn<Balance> = (balance: Balance) => Balance;
type ZeroBalanceFn<Balance> = () => Balance;
type IsZeroBalanceFn<Balance> = (balance: Balance) => boolean;

function getResolvers<Balance>(
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  negateBalanceFn: NegateBalanceFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>) {
  return {
    Query: {
      balance: async (_root, { accountId }) => {
        const account: AccountDoc<Balance> | null = await accounts
          .findOne({ id: accountId });

        return account === null ? zeroBalanceFn() : account.balance;
      },
      transfers: async (_root, { input }: { input: TransfersInput }) => {
        return transfers.find({ ...input, pending: { $exists: false } })
          .toArray();
      }
    },
    Mutation: {
      addToBalance: async (
        _root, {input}: { input: AddToBalanceInput<Balance> },
        context: Context): Promise<TransferDoc<Balance>> => {
        const transfer: TransferDoc<Balance> = {
          id: uuid(),
          toId: input.accountId,
          amount: input.amount
        };
        const updateId = _.get(context, 'reqId', uuid());

        await transfers.insertOne({...transfer, pending: updateId });
        try {
          await addToBalance<Balance>(
            input.accountId, input.amount, transfer,
            updateId, context.reqType,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
        } catch (e) {
          console.error(`Transfer ${transfer.id} aborted, error: ${e.message}`);
          await abortAccountUpdate(updateId);
          await transfers.deleteOne({ pending: updateId });
          throw e;
        }

        await transfers
          .updateOne({ pending: updateId }, { $unset: { pending: '' }});

        return transfer;
      },
      createTransfer: async (
        _root, {input}: { input: CreateTransferInput<Balance> },
        context: Context): Promise<TransferDoc<Balance>> => {
        const updateId = _.get(context, 'reqId', uuid());
        const transfer: TransferDoc<Balance> = {
          id: input.id ? input.id : uuid(),
          fromId: input.fromId,
          toId: input.toId,
          amount: input.amount
        };
        transfer.fromId = input.fromId;

        await transfers.insertOne({...transfer, pending: updateId });
        try {
          /*
           * It is important that we apply the update to the source account
           * first so that we don't need to rollback the update to the other
           * account if the account has insufficient funds
           */
          await addToBalance<Balance>(
            input.fromId, negateBalanceFn(input.amount), transfer,
            updateId, context.reqType,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
        } catch (e) {
          console.error(`Transfer ${transfer.id} aborted, error: ${e.message}`);
          await abortAccountUpdate(updateId);
          await transfers.deleteOne({ pending: updateId });
          throw e;
       }

       /*
        * At this point we know that the transfer is going to work, because
        * we are adding a positive number to `toId`. There's no need to do
        * the updates in a tx because even if the server fails with an
        * internal error before doing the second update, there will be a
        * record of the pending transfer that can be used to reconcile the
        * data
        */
       await addToBalance<Balance>(
         input.toId, input.amount, transfer, updateId, context.reqType,
         accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);

       await transfers
         .updateOne({ pending: updateId }, { $unset: { pending: '' }});


       return transfer;
      }
    }
  };
}

async function voteAccountUpdate<Balance>(
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  updateId: string,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>)
  : Promise<AccountPendingDoc<Balance>> {
  // Error messages
  const noFundsMsg = (accountIdWithError) =>
    `Account ${accountIdWithError} has insufficient funds`;
  const pendingTransferMsg = (accountIdWithError) =>
    `Account ${accountIdWithError} has a pending transfer, try again later`;

  const pendingTransfer: PendingTransfer<Balance> = {
    updateId: updateId,
    transfer: transfer
  };
  let voteAccount: AccountPendingDoc<Balance>;

  const accountExists = (await accounts
    .findOne({ id: accountId }, { projection: { _id: 1 } })) !== null;
  if (accountExists) {
    const accountFilter = {
      id: accountId, pendingTransfer: { $exists: false }
    };
    const voteUpdateOp = { $set: { pendingTransfer: pendingTransfer } };
    voteAccount = (await accounts
      .findOneAndUpdate(accountFilter, voteUpdateOp, { returnOriginal: false }))
      .value;
    if (voteAccount === undefined) {
      throw new Error(pendingTransferMsg(accountId));
    }
  } else {
    const newAccount: AccountPendingDoc<Balance> = {
      id: accountId,
      balance: zeroBalanceFn(),
      pending: updateId,
      pendingTransfer: pendingTransfer
    };
    await accounts.insertOne(newAccount);
    voteAccount = newAccount;
  }

  // Throw an error if the balance in acct would be negative after updating
  if (!accountHasFundsFn(voteAccount.balance, amount)) {
    await abortAccountUpdate(updateId);
    throw new Error(noFundsMsg(accountId));
  }

  return voteAccount;
}

async function commitAccountUpdate<Balance>(
  account: AccountPendingDoc<Balance>, newBalance: Balance,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>) {
  const reqIdPendingFilter = {
    'pendingTransfer.updateId': account.pendingTransfer.updateId
  };
  console.log(
    `New balance for account ${account.id} is ${JSON.stringify(newBalance)}`);
  if (isZeroBalanceFn(newBalance)) {
    console.log(`Balance is 0, deleting ${account.id}`);
    const res = await accounts.deleteOne(reqIdPendingFilter);
    assert.ok(
      res.deletedCount === 1,
      `Expected deletedCount of update to be 1, ` +
      `but got ${res.deletedCount}`);
  } else {
    const commitUpdateOp = {
      $set: { balance: newBalance },
      $unset: { pendingTransfer: '', pending: '' }
    };
    const res = await accounts
      .updateOne(reqIdPendingFilter, commitUpdateOp);
    assert.ok(
      res.matchedCount === 1,
      `Expected matchedCount of update to be 1, ` +
      `but got ${res.matchedCount}`);
    assert.ok(
      res.modifiedCount === 1,
      `Expected modifiedCount of update to be 1, ` +
      `but got ${res.modifiedCount}`);
  }

  return;
}

async function abortAccountUpdate(updateId: string) {
  const reqIdPendingFilter = { 'pendingTransfer.updateId': updateId };
  await accounts
    .updateMany(reqIdPendingFilter, { $unset: { pendingTransfer: '' } });

  // Also delete any new accounts that were created
  const res = await accounts
    .deleteMany({ pending: updateId });
  assert.ok(
    res.result.n === undefined || res.result.n <= 2,
    `Expected the number of deleted accounts to be less than 2, ` +
    `but got ${res.result.n}`);

  return;
}

/**
 * Adds `amount` to the balance of account `accountId` and adds `transfer`
 * to the transfer log if the account has sufficient funds (amount could be
 * negative)
 *
 * @param accountId the id of the account that will receive `amount`
 * @param amount the balance to add to the account. Use a negative number to
 *               subtract from the account.
 * @param transfer the transfer object to add to the log
 * @param updateId the id of the update
 * @param action the action to perform
 * @param accountHasFundsFn fn that returns true if the account has funds
 * @param newBalanceFn fn to compute the new account balance
 * @param zeroBalanceFn fn to retrieve the initial balance of a new account
 * @param isZeroBalanceFn fn to check if a given balance is 0
 * @throws error if the account doesn't exists, has insufficient funds, or has
 *         a pending update
 */
async function addToBalance<Balance>(
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  updateId: string, action: 'vote' | 'commit' | 'abort' | undefined,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>)
  : Promise<AccountDoc<Balance> | undefined> {
  if (_.isEmpty(accountId)) {
    throw new Error(`Invalid account id ${accountId}`);
  }
  if (_.isEmpty(updateId)) {
    throw new Error(`Invalid update id ${updateId}`);
  }

  console.log(`Adding ${JSON.stringify(amount)} to ${accountId}`);
  switch (action) {
    case 'vote':
      return await voteAccountUpdate<Balance>(
        accountId, amount, transfer, updateId,
        accountHasFundsFn, zeroBalanceFn);
    case undefined:
      /*
       * We can't apply the update directly because we need to check that the
       * account has sufficient funds. But if we do the check and then the
       * update, the balance could have changed between the check and update.
       * If we do vote + commit then we ensure that the balance won't change in
       * the middle (because voting on an update puts a "lock" on that account)
       */
      try {
        const account: AccountPendingDoc<Balance> = await
          voteAccountUpdate<Balance>(
            accountId, amount, transfer, updateId,
            accountHasFundsFn, zeroBalanceFn);
        const newBalance = newBalanceFn(account.balance, amount);
        await commitAccountUpdate<Balance>(
          account, newBalance, isZeroBalanceFn);

        return account;
      } catch (e) {
        console.error(
          `Balance update ${updateId} aborted, error: ${e.message}`);
        await abortAccountUpdate(updateId);
        throw e;
      }
    case 'commit':
      const reqIdPendingFilter = { 'pendingTransfer.updateId': updateId };
      const commitAccount: AccountPendingDoc<Balance> | null = await accounts
        .findOne(reqIdPendingFilter);
      if (commitAccount === null) {
        console.error(`Couldn't find account for update id ${updateId}`);
        throw new Error('An internal error has occurred');
      }

      const newCommitBalance = newBalanceFn(commitAccount.balance, amount);
      await commitAccountUpdate<Balance>(
        commitAccount, newCommitBalance, isZeroBalanceFn);

      return;
    case 'abort':
      await abortAccountUpdate(updateId);

      return;
  }
}

let typeDefinitions, resolvers;
if (config.balanceType === 'money') {

  const schemaPath = path.join(__dirname, 'schema.graphql');
  typeDefinitions = [
    _.replace(
      _.replace(
        readFileSync(schemaPath, 'utf8'),
        /#BalanceInput/g, 'Float'),
      /#Balance/g, 'Float')
  ];

  const newBalanceFn: NewBalanceFn<number> =
    (accountBalance: number, transferAmount: number) => (
      accountBalance + transferAmount
    );
  const accountHasFundsFn: AccountHasFundsFn<number> =
    (accountBalance: number, transferAmount: number) => (
      newBalanceFn(accountBalance, transferAmount) >= 0
    );
  const negateBalanceFn: NegateBalanceFn<number> =
    (balance: number) => -balance;
  const zeroBalanceFn: ZeroBalanceFn<number> = () => 0;
  const isZeroBalanceFn: IsZeroBalanceFn<number> =
    (balance: number) => balance === 0;

  resolvers = getResolvers<number>(
    accountHasFundsFn, newBalanceFn, negateBalanceFn,
    zeroBalanceFn, isZeroBalanceFn);

} else {
  const schemaPath = path.join(__dirname, 'schema.graphql');
  typeDefinitions = [
    _.replace(
      _.replace(
        readFileSync(schemaPath, 'utf8')
          .concat(`
            input ItemCountInput {
              itemId: ID!
              count: Int
            }

            type ItemCount {
              itemId: ID!
              count: Int
            }
          `),
        /#BalanceInput/g, '[ItemCountInput]'),
      /#Balance/g, '[ItemCount]')
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
          delete accountBalanceMap[itemCount.itemId];
        } else {
          accountBalanceMap[itemCount.itemId] = newCount;
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
  const negateBalanceFn: NegateBalanceFn<ItemCount[]> =
    (balance: ItemCount[]) => {
      return _.map(balance, (itemCount: ItemCount) => {
        return { itemId: itemCount.itemId, count: -itemCount.count };
      });
    };
  const zeroBalanceFn: ZeroBalanceFn<ItemCount[]> = () => [];
  const isZeroBalanceFn: IsZeroBalanceFn<ItemCount[]> =
    (balance: ItemCount[]) => _.isEmpty(balance);

  resolvers = getResolvers<ItemCount[]>(
    accountHasFundsFn, newBalanceFn,
    negateBalanceFn, zeroBalanceFn, isZeroBalanceFn);

  _.merge(resolvers, {
    ItemCount: {
      itemId: (itemCount: ItemCount) => itemCount.itemId,
      count: (itemCount: ItemCount) => itemCount.count
    }
  });
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
