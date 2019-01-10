import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as mongodb from 'mongodb';
import * as _ from 'lodash';

import { readFileSync } from 'fs';
import { makeExecutableSchema } from 'graphql-tools';

import { Config } from './config';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');


/**
 * The error message to include when there is a concurrent update in the server.
 */
export const CONCURRENT_UPDATE_ERROR =
  'An error has occured. Please try again later';

/**
 * The type of the table that maps action names to
 * functions that return the corresponding graphql request
 */
export type ActionRequestTable = { [key: string]: (extraInfo) => string };

/**
 * Generates the return fields for a graphql request, if any
 * @param e - extra information to include with the graphql request
 */
export function getReturnFields(e: any) {
  const hasValue = !(_.isEmpty(e) || _.isNil(e));
  const hasReturnFields = hasValue ?
    !(_.isEmpty(e.returnFields) || _.isNil(e.returnFields)) : false;
  return hasReturnFields ? '{' + e.returnFields + '}' : '';
}

/**
 * The type of the function to be called after connecting to the db.
 */
export type InitDbCallbackFn<C = Config> =
  (db: mongodb.Db, config: C) => Promise<any>;

/**
 * The type of the function to be called to generate the resolvers.
 * @return the resolvers object
 */
export type InitResolversFn<C = Config> =
  (db: mongodb.Db, config: C) => object;

export interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

/**
 * The server for a cliche that contains its associated db (if applicable)
 * and that accepts applicable read and write requests.
 */
export class ClicheServer<C extends Config = Config> {
  private readonly _name: string;
  private readonly _schemaPath: string;
  private readonly _actionRequestTable: ActionRequestTable;
  private readonly _config: C;
  private _db: mongodb.Db | undefined;
  private _resolvers: object | undefined;
  private readonly _initDbCallback: InitDbCallbackFn<C> | undefined;
  private readonly _initResolvers: InitResolversFn<C> | undefined;
  private readonly _dynamicTypeDefs: string[];

  constructor(name: string, actionRequestTable: ActionRequestTable, config: C, schemaPath: string,
    initDbCallback?: InitDbCallbackFn<C>, initResolvers?: InitResolversFn<C>,
    dynamicTypeDefs: string[] = []) {
    this._name = name;
    this._actionRequestTable = actionRequestTable;
    this._config = config;
    this._schemaPath = schemaPath;
    this._initDbCallback = initDbCallback;
    this._initResolvers = initResolvers;
    this._dynamicTypeDefs = dynamicTypeDefs;
  }

  /**
   * Get the action name from the full one
   * @param fullActionName the action name that includes/begins
   *                           with the cliché name and a separator
   */
  private static GetActionName(clicheName: string, fullActionName: string) {
    // +1 to the length for the separator
    return fullActionName.substring(clicheName.length + 1);
  }

  // needs clicheServer passed in because `this` is not in scope
  // when this function is used
  private static SetGraphqlQuery = (clicheServer: ClicheServer) =>
    (req, _res, next) => {
      const reqField = req.method === 'GET' ? 'query' : 'body';
      req[reqField].query = clicheServer._actionRequestTable[
        ClicheServer.GetActionName(
          clicheServer._name, req['fullActionName']
        )
      ](req[reqField].extraInfo);
      next();
    }

  private startApp(schema) {
    const app = express();

    // /dv-{fullActionName}/{reqId}/{reqType}/
    app.use(/^\/dv-(.*)\/(.*)\/(vote|commit|abort)\/.*/,
      (req, _res, next) => {
        req['fullActionName'] = req.params[0];
        req['reqId'] = req.params[1];
        req['reqType'] = req.params[2];
        next();
      },
      bodyParser.json(),
      ClicheServer.SetGraphqlQuery(this),
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
              default:
                throw new Error(`Unexpected request type ${reqType} for
                   ${this._name} cliche server`);
            }
          }
        };
      })
    );

    app.use('/graphql/:fullActionName', bodyParser.json(),
      bodyParser.urlencoded({
        extended: true
      }),
      (req, _res, next) => {
        req['fullActionName'] = req.params.fullActionName;
        next();
      },
      ClicheServer.SetGraphqlQuery(this),
      graphqlExpress({ schema })
    );

    app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));


    app.listen(this._config.wsPort, () => {
      console.log(`Running ${this._name} with config
        ${JSON.stringify(this._config)}`);
    });
  }

  /**
   * Start this cliche server.
   */
  async start(): Promise<void> {
    // TODO: make connecting to mongo optional since there will be cliches that
    // don't require a db, e.g. email cliche
    const mongoServer = `${this._config.dbHost}:${this._config.dbPort}`;
    console.log(`Connecting to mongo server ${mongoServer}`);
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(
      `mongodb://${mongoServer}`);

    this._db = client.db(this._config.dbName);

    if (this._config.reinitDbOnStartup) {
      await this._db.dropDatabase();
      console.log(`Reinitialized db ${this._config.dbName}`);
    }
    if (this._initDbCallback) {
      await this._initDbCallback(this._db, this._config);
    }
    // TODO: support for initResolvers that don't require a db
    if (this._initResolvers) {
      this._resolvers = this._initResolvers(this._db, this._config);
      const typeDefs = [
        readFileSync(this._schemaPath, 'utf8'), ...this._dynamicTypeDefs];
      const schema = makeExecutableSchema(
        { typeDefs, resolvers: this._resolvers });

      this.startApp(schema);
    }
  }
}
