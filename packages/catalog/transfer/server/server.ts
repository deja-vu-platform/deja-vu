import {
  ComponentRequestTable,
  ConceptDb,
  ConceptDbNotFoundError,
  ConceptServer,
  ConceptServerBuilder,
  Collection,
  Config,
  Context,
  EMPTY_CONTEXT,
  getReturnFields
} from '@deja-vu/concept-server';
import { readFileSync } from 'fs';
import { IResolvers } from 'graphql-tools';
import * as _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  AccountDoc,
  AddToBalanceInput,
  CreateTransferInput,
  ItemCount,
  TransferDoc,
  TransfersInput
} from './schema';


interface TransferConfig extends Config {
  balanceType: 'money' | 'items';
}

const componentRequestTable: ComponentRequestTable = {
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
  db: ConceptDb,
  accounts: Collection<AccountDoc<Balance>>,
  transfers: Collection<TransferDoc<Balance>>,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  negateBalanceFn: NegateBalanceFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>) {
  return {
    Query: {
      balance: async (_root, { accountId }) => {
        try {
          const account: AccountDoc<Balance> = await accounts
          .findOne({ id: accountId });

          return account.balance;
        } catch (err) {
          if (err.errorCode !== ConceptDbNotFoundError.ERROR_CODE) {
            throw err;
          }

          return zeroBalanceFn();
        }
      },
      transfers: async (_root, { input }: { input: TransfersInput }) => {
        return await transfers.find(input);
      },
      transfer: async (_root, { id }) => {
        return await transfers.findOne({ id: id });
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
        await addToBalance<Balance>(db, context,
          accounts, transfers, input.accountId, input.amount, transfer, true,
          accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);

        return transfer;
      },
      createTransfer: async (
        _root, {input}: { input: CreateTransferInput<Balance> },
        context: Context): Promise<TransferDoc<Balance>> => {
        const transfer: TransferDoc<Balance> = {
          id: input.id ? input.id : uuid(),
          fromId: input.fromId,
          toId: input.toId,
          amount: input.amount
        };
        transfer.fromId = input.fromId;

        // Do these in a tx so that db won't be seen in an inconsistent
        // state, e.g. transfer object is seen but toId account does not have
        // the funds yet
        return await db.inTransaction(async () => {
          /*
           * It is important that we apply the update to the source account
           * first so that we don't need to rollback the update to the other
           * account if the account has insufficient funds
           */
          await addToBalance<Balance>(
            db, context, accounts, transfers, input.fromId,
            negateBalanceFn(input.amount), transfer, true,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);

          /*
           * At this point we know that the transfer is going to work, because
           * we are adding a positive number to `toId`.
           */
          await addToBalance<Balance>(db, context,
            accounts, transfers, input.toId, input.amount, transfer, false,
            accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);

          return transfer;
        });
      }
    }
  };
}

async function addToBalanceOperation<Balance>(context: Context,
  accounts: Collection<AccountDoc<Balance>>,
  accountId: string, amount: Balance,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>): Promise<AccountDoc<Balance>> {
  return await accounts.findOneAndUpdateWithFn(
    context, { id: accountId }, (fetchedAccount: AccountDoc<Balance>) => {
      const newBalance = newBalanceFn(fetchedAccount.balance, amount);
      if (isZeroBalanceFn(newBalance)) {
        return undefined;
      }

      return { $set: { balance: newBalance } };
    },
    { upsert: true, setOnInsert: { balance: zeroBalanceFn() } },
    (fetchedAccount: AccountDoc<Balance>) => {
    // Throw an error if the balance in acct would be negative after updating
    if (!accountHasFundsFn(fetchedAccount.balance, amount)) {
      // ConceptDb will take care of rolling back
      throw new Error(`Account ${accountId} has insufficient funds`);
    }
  });
}

/**
 * Adds `amount` to the balance of account `accountId` and adds `transfer`
 * to the transfer log if the account has sufficient funds (amount could be
 * negative)
 *
 * @param context the context performing the operation
 * @param accounts the accounts collection
 * @param transfers the transfers collection
 * @param accountId the id of the account that will receive `amount`
 * @param amount the balance to add to the account. Use a negative balance to
 *               subtract from the account.
 * @param transfer the transfer object to add to the log
 * @param onCommitAddTransferToLog whether to add the transfer to the log or not
 * @param accountHasFundsFn fn that returns true if the account has funds
 * @param newBalanceFn fn to compute the new account balance
 * @param zeroBalanceFn fn to retrieve the 0 balance. This will be used as
 *                      the initial balance of a new account
 * @param isZeroBalanceFn fn to check if a given balance is 0
 * @throws error if the account doesn't exists, has insufficient funds, or has
 *         a pending update
 */
async function addToBalance<Balance>(db: ConceptDb, context: Context,
  accounts: Collection<AccountDoc<Balance>>,
  transfers: Collection<TransferDoc<Balance>>,
  accountId: string, amount: Balance, transfer: TransferDoc<Balance>,
  onCommitAddTransferToLog: boolean,
  accountHasFundsFn: AccountHasFundsFn<Balance>,
  newBalanceFn: NewBalanceFn<Balance>,
  zeroBalanceFn: ZeroBalanceFn<Balance>,
  isZeroBalanceFn: IsZeroBalanceFn<Balance>)
  : Promise<AccountDoc<Balance> | undefined> {
  if (_.isEmpty(accountId)) {
    throw new Error(`Invalid account id ${accountId}`);
  }

  console.log(`Adding ${JSON.stringify(amount)} to ${accountId}`);

  if ((context.reqType === undefined || context.reqType === 'commit') &&
      onCommitAddTransferToLog) {
    return db.inTransaction(async () => {
      const account = await addToBalanceOperation<Balance>(
        context, accounts, accountId, amount,
        accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
      await transfers.insertOne(EMPTY_CONTEXT, transfer);

      return account;
    });
  }

  return await addToBalanceOperation<Balance>(
    context, accounts, accountId, amount,
    accountHasFundsFn, newBalanceFn, zeroBalanceFn, isZeroBalanceFn);
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

function resolvers(db: ConceptDb, config: TransferConfig): IResolvers {
  if (config.balanceType === 'money') {
    const accounts: Collection<AccountDoc<number>> =
      db.collection('accounts');
    const transfers: Collection<TransferDoc<number>> =
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
      db, accounts, transfers,
      accountHasFundsFn, newBalanceFn, negateBalanceFn,
      zeroBalanceFn, isZeroBalanceFn);

  } else {
    const accounts: Collection<AccountDoc<ItemCount[]>> =
      db.collection('accounts');
    const transfers: Collection<TransferDoc<ItemCount[]>> =
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

    const baseResolvers = getResolvers<ItemCount[]>(
      db, accounts, transfers,
      accountHasFundsFn, newBalanceFn,
      negateBalanceFn, zeroBalanceFn, isZeroBalanceFn);

    return _.merge(baseResolvers, {
      ItemCount: {
        id: (itemCount: ItemCount) => itemCount.id,
        count: (itemCount: ItemCount) => itemCount.count
      }
    });
  }
}

const transferConcept: ConceptServer = new ConceptServerBuilder('transfer')
  .initDb((db: ConceptDb, _config: Config): Promise<any> => {
    /**
     * `transfers` is the main collection,
     * the only reason why we have an `accounts`
     * collection is to keep track of the balance (to avoid having to compute it
     * every time) and to be able to lock accounts when processing transfers.
     */
    const accounts = db.collection('accounts');
    const transfers = db.collection('transfers');

    return Promise.all([
      accounts.createIndex({ id: 1 }, { unique: true, sparse: true }),
      transfers.createIndex({ id: 1 }, { unique: true, sparse: true }),
      transfers.createIndex({ fromId: 1 }, { sparse: true }),
      transfers.createIndex({ toId: 1 }, { sparse: true })
    ]);
  })
  .componentRequestTable(componentRequestTable)
  .resolvers(resolvers)
  .dynamicTypeDefs(getDynamicTypeDefs)
  .build();

transferConcept.start();
