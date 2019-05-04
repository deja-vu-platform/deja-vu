import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';
import * as path from 'path';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { readFileSync } from 'fs';
import { execute, subscribe } from 'graphql';
import { IResolvers, makeExecutableSchema } from 'graphql-tools';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import { Config } from './config';
import { ClicheDb } from './db/db';

/**
 * The type of the table that maps action names to
 * functions that return the corresponding graphql request
 */
export interface ActionRequestTable {
  [key: string]: (extraInfo) => string;
}

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
  (db: ClicheDb, config: C) => Promise<any>;

/**
 * The type of the function to be called to generate the resolvers.
 * @return the resolvers object
 */
export type InitResolversFn<C = Config> =
  (db: ClicheDb, config: C) => IResolvers;

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
  private _resolvers: IResolvers | undefined;
  private readonly _initDbCallback: InitDbCallbackFn<C> | undefined;
  private readonly _initResolvers: InitResolversFn<C> | undefined;
  private readonly _dynamicTypeDefs: string[];

  constructor(name: string, actionRequestTable: ActionRequestTable,
    config: C, schemaPath: string,
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
  private getActionName(fullActionName: string) {
    return fullActionName
      .split('-')
      .slice(1)
      .join('-');
  }

  private getGraphqlRequest(fullActionName: string, extraInfo: any) {
    const actionName = this.getActionName(fullActionName);
    if (this._actionRequestTable[actionName]) {
      return this._actionRequestTable[actionName](extraInfo);
    }
    throw new Error(`Action ${actionName} request not defined`);
  }

  private setGraphqlQueryAndVariables(
    graphqlParams, variables: object, fullActionName: string, extraInfo: any) {
    graphqlParams.query = this.getGraphqlRequest(fullActionName, extraInfo);
    if (variables) {
      graphqlParams.variables = variables;
    }

    return graphqlParams;
  }

  private getGraphqlExpressMiddleware() {
    const setGraphqlQueryAndVariables =
      this.setGraphqlQueryAndVariables.bind(this);

    return (req, _res, next) => {
      const reqField = req.method === 'GET' ? 'query' : 'body';

      setGraphqlQueryAndVariables(req[reqField], req[reqField].inputs,
        req['fullActionName'], req[reqField].extraInfo);
      next();
    };
  }

  private startApp(schema) {
    const app = express();

    const reqParamNamesInOrder = ['fullActionName', 'reqId', 'reqType'];

    // /dv-{fullActionName}/{reqId}/{reqType}/
    app.use(/^\/dv-(.*)\/(.*)\/(vote|commit|abort)\/.*/,
      (req, _res, next) => {
        reqParamNamesInOrder.forEach(
          (name, index) => req[name] = req.params[index]);
        next();
      },
      bodyParser.json(),
      this.getGraphqlExpressMiddleware(),
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
      this.getGraphqlExpressMiddleware(),
      graphqlExpress({ schema })
    );

    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql',
      subscriptionsEndpoint:
        `ws://localhost:${this._config.wsPort}/subscriptions`
    }));

    const server = createServer(app);
    server.listen(this._config.wsPort, () => {
      console.log(`Running ${this._name} with config
        ${JSON.stringify(this._config)}`);
      SubscriptionServer.create({
        execute,
        subscribe,
        schema,
        onOperation: (msg, graphqlParams, _webSocket) => {
          const dvParams = msg.payload;

          return this.setGraphqlQueryAndVariables(
            graphqlParams,
            dvParams.inputs,
            dvParams.fullActionName,
            dvParams.extraInfo);
        }
      }, {
        server,
        path: '/subscriptions'
      });
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
    const clicheDb: ClicheDb = new ClicheDb(client, this._db);

    if (this._config.reinitDbOnStartup) {
      await this._db.dropDatabase();
      console.log(`Reinitialized db ${this._config.dbName}`);
    }
    if (this._initDbCallback) {
      await this._initDbCallback(clicheDb, this._config);
    }
    // TODO: support for initResolvers that don't require a db
    if (this._initResolvers) {
      this._resolvers = this._initResolvers(
        clicheDb, this._config);
      const typeDefs = [
        readFileSync(path.join(__dirname, 'schema.base.graphql'), 'utf8'),
        readFileSync(this._schemaPath, 'utf8'), ...this._dynamicTypeDefs];
      const schema = makeExecutableSchema(
        { typeDefs, resolvers: this._resolvers });

      this.startApp(schema);
    }
  }
}
