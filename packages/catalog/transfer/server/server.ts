import * as assert from 'assert';
import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import { readFileSync } from 'fs';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import * as path from 'path';
import {
  AccountDoc,
  AccountPendingDoc,
  AddToBalanceInput,
  CreateTransferInput,
  ItemCount,
  PendingTransfer,
  TransferDoc,
  TransfersInput
} from './schema';
import { v4 as uuid } from 'uuid';


interface TransferConfig extends Config {
  balanceType: 'money' | 'items';
}

const actionRequestTable: ActionRequestTable = {
  'add-to-balance': (extraInfo) => `
    mutation AddToBalance($input: AddToBalanceInput!) {
      addToBalance(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-transfer': (extraInfo) => `
    mutation CreateTransfer($input: CreateTransferInput!) {
      createTransfer(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-balance': (extraInfo) => `
    query ShowBalance($accountId: ID!) {
      balance(accountId: $accountId) ${getReturnFields(extraInfo)}
    }
  `,
  'show-transfer': (extraInfo) => `
    query ShowTransfer($id: ID!) {
      transfer(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-transfers': (extraInfo) => `
    query ShowTransfers($input: TransfersInput!) {
      transfers(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

type AccountHasFundsFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => boolean;
type NewBalanceFn<Balance> = (
  accountBalance: Balance, transferAmount: Balance) => Balance;
type NegateBalanceFn<Balance> = (balance: Balance) => Balance;
type ZeroBalanceFn<Balance> = () => Balance;
type IsZeroBalanceFn<Balance> = (balance: Balance) => boolean;

function getResolvers<Balance>(
  accounts: mongodb.Collection<AccountDoc<Balance>>,
  transfers: mongodb.Collection<TransferDoc<Balance>>,
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
      },
      transfer: async (_root, { id }) => {
        return transfers.findOne({ id: id });
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
        try {
          await addToBalance<Balance>(
            accounts, transfers,
            input.accountId, input.amount, transfer,
            updateId, context.reqType, true,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
        } catch (e) {
          console.error(`Transfer ${transfer.id} aborted, error: ${e.message}`);
          await abortUpdate(accounts, transfers, updateId);
          throw e;
        }

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

        try {
          /*
           * It is important that we apply the update to the source account
           * first so that we don't need to rollback the update to the other
           * account if the account has insufficient funds
           */
          await addToBalance<Balance>(
            accounts, transfers,
            input.fromId, negateBalanceFn(input.amount), transfer,
            updateId, context.reqType, true,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
        } catch (e) {
          console.error(`Transfer ${transfer.id} aborted, error: ${e.message}`);
          await abortUpdate(accounts, transfers, updateId);
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
         accounts, transfers,
         input.toId, input.amount, transfer, updateId, context.reqType, false,
         accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);

       return transfer;
      }
    }
  };
}

async function voteAccountUpdate<Balance>(
  accounts /* no type because of usage of AccountDoc vs AccountPendingDoc */,
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
    await abortAccountUpdate(accounts, updateId);
    throw new Error(noFundsMsg(accountId));
  }

  return voteAccount;
}

async function commitAccountUpdate<Balance>(
  accounts: mongodb.Collection<AccountDoc<Balance>>,
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

async function abortUpdate<Balance>(
  accounts: mongodb.Collection<AccountDoc<Balance>>,
  transfers: mongodb.Collection<TransferDoc<Balance>>,
  updateId: string): Promise<void> {
  await Promise.all([
    abortAccountUpdate(accounts, updateId),
    abortTransferUpdate(transfers, updateId)]);

  return;
}

async function abortAccountUpdate<Balance>(
  accounts: mongodb.Collection<AccountDoc<Balance>>, updateId: string) {
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

  return res;
}

function abortTransferUpdate<Balance>(
  transfers: mongodb.Collection<TransferDoc<Balance>>,updateId: string) {
  return transfers.deleteMany({ pending: updateId });
}

/**
 * Adds `amount` to the balance of account `accountId` and adds `transfer`
 * to the transfer log if the account has sufficient funds (amount could be
 * negative)
 *
 * @param accountId the id of the account that will receive `amount`
 * @param amount the balance to add to the account. Use a negative balance to
 *               subtract from the account.
 * @param transfer the transfer object to add to the log
 * @param updateId the id of the update
 * @param action the action to perform
 * @param onCommitAddTransferToLog whether to add the transfer to the log or not
 * @param accountHasFundsFn fn that returns true if the account has funds
 * @param newBalanceFn fn to compute the new account balance
 * @param zeroBalanceFn fn to retrieve the 0 balance. This will be used as
 *                      the initial balance of a new account
 * @param isZeroBalanceFn fn to check if a given balance is 0
 * @throws error if the account doesn't exists, has insufficient funds, or has
 *         a pending update
 */
async function addToBalance<Balance>(
  accounts /* no type because of usage of AccountDoc vs AccountPendingDoc */,
  transfers: mongodb.Collection<TransferDoc<Balance>>,
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  updateId: string, action: 'vote' | 'commit' | 'abort' | undefined,
  onCommitAddTransferToLog: boolean,
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
        accounts, accountId, amount, transfer, updateId,
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
            accounts, accountId, amount, transfer, updateId,
            accountHasFundsFn, zeroBalanceFn);

        if (onCommitAddTransferToLog) {
          await transfers.insertOne(transfer);
        }
        const newBalance = newBalanceFn(account.balance, amount);
        await commitAccountUpdate<Balance>(
          accounts, account, newBalance, isZeroBalanceFn);

        return account;
      } catch (e) {
        console.error(
          `Balance update ${updateId} aborted, error: ${e.message}`);
        await abortUpdate(accounts, transfers, updateId);
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

      if (onCommitAddTransferToLog) {
        await transfers.insertOne(transfer);
      }
      const newCommitBalance = newBalanceFn(commitAccount.balance, amount);
      await commitAccountUpdate<Balance>(
        accounts, commitAccount, newCommitBalance, isZeroBalanceFn);

      return undefined;
    case 'abort':
      await abortUpdate(accounts, transfers, updateId);

      return undefined;
  }
}

function getDynamicTypeDefs(config: TransferConfig): string[] {
  const schemaTemplatePath = path.join(__dirname, 'schema.template.graphql');
  const schemaTemplate = readFileSync(schemaTemplatePath, 'utf8');
  if (config.balanceType === 'money') {

    return [
      _.replace(
        _.replace(
          schemaTemplate,
          /#BalanceInput/g, 'Float'),
        /#Balance/g, 'Float')
    ];
  } else {

    return [
      _.replace(
        _.replace(
          schemaTemplate
            .concat(`
              input ItemCountInput {
                id: ID!
                count: Int
              }

              type ItemCount {
                id: ID!
                count: Int
              }
            `),
          /#BalanceInput/g, '[ItemCountInput]'),
        /#Balance/g, '[ItemCount]')
    ];
  }
}

function resolvers(db: mongodb.Db, config: TransferConfig): object {
  if (config.balanceType === 'money') {
    const accounts: mongodb.Collection<AccountDoc<number>> =
      db.collection('accounts');
    const transfers: mongodb.Collection<TransferDoc<number>> =
      db.collection('transfers');

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

    return getResolvers<number>(
      accounts, transfers,
      accountHasFundsFn, newBalanceFn, negateBalanceFn,
      zeroBalanceFn, isZeroBalanceFn);

  } else {
    const accounts: mongodb.Collection<AccountDoc<ItemCount[]>> =
      db.collection('accounts');
    const transfers: mongodb.Collection<TransferDoc<ItemCount[]>> =
      db.collection('transfers');
    
    const newBalanceFn: NewBalanceFn<ItemCount[]> =
      (accountBalance: ItemCount[], transferAmount: ItemCount[]) => {
        const accountBalanceMap = _
          .reduce(accountBalance, (acc, itemCount: ItemCount) => {
            acc[itemCount.id] = itemCount.count;

            return acc;
          }, {});

        _.each(transferAmount, (itemCount: ItemCount) => {
          const prevItemCount = _.get(accountBalanceMap, itemCount.id, 0);
          const newCount = prevItemCount + itemCount.count;
          if (newCount === 0) {
            delete accountBalanceMap[itemCount.id];
          } else {
            accountBalanceMap[itemCount.id] = newCount;
          }
        });

        return _
          .map(accountBalanceMap, (value: number, key: string): ItemCount => {
            return { id: key, count: value };
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
          return { id: itemCount.id, count: -itemCount.count };
        });
      };
    const zeroBalanceFn: ZeroBalanceFn<ItemCount[]> = () => [];
    const isZeroBalanceFn: IsZeroBalanceFn<ItemCount[]> =
      (balance: ItemCount[]) => _.isEmpty(balance);

    let resolvers = getResolvers<ItemCount[]>(
      accounts, transfers,
      accountHasFundsFn, newBalanceFn,
      negateBalanceFn, zeroBalanceFn, isZeroBalanceFn);

    return _.merge(resolvers, {
      ItemCount: {
        id: (itemCount: ItemCount) => itemCount.id,
        count: (itemCount: ItemCount) => itemCount.count
      }
    });
  }
}

const transferCliche: ClicheServer = new ClicheServerBuilder('transfer')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    /**
     * `transfers` is the main collection, the only reason why we have an `accounts`
     * collection is to keep track of the balance (to avoid having to compute it
     * every time) and to be able to lock accounts when processing transfers.
     */
    const accounts = db.collection('accounts');
    const transfers = db.collection('transfers');
    
    return Promise.all([
      accounts.createIndex({ id: 1 }, { unique: true, sparse: true }),
      transfers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      transfers.createIndex({ fromId: 1 }, { sparse: true }),
      transfers.createIndex({ toId: 1 }, { sparse: true }),
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .dynamicTypeDefs(getDynamicTypeDefs)
  .build();

transferCliche.start();
