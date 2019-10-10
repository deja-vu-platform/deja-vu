import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';

import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import { readFileSync } from 'fs';
import { execute, subscribe } from 'graphql';
import { IResolvers, makeExecutableSchema } from 'graphql-tools';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import { Config } from './config';
import { ConceptDb } from './db/db';


/**
 * The type of the table that maps component names to
 * functions that return the corresponding graphql request
 */
export interface ComponentRequestTable {
  [key: string]: (extraInfo) => string;
}

/**
 * Generates the return fields for a graphql request, if any
 * @param e - extra information to include with the graphql request
 */
export function getReturnFields(e: any) {
  const hasValue = !_.isEmpty(e);
  const hasReturnFields = hasValue ? !_.isEmpty(e.returnFields) : false;

  return hasReturnFields ? '{' + e.returnFields + '}' : '';
}

/**
 * The type of the function to be called after connecting to the db.
 */
export type InitDbCallbackFn<C = Config> =
  (db: ConceptDb, config: C) => Promise<any>;

/**
 * The type of the function to be called to generate the resolvers.
 * @return the resolvers object
 */
export type InitResolversFn<C = Config> =
  (db: ConceptDb, config: C) => IResolvers;

/**
 * The server for a concept that contains its associated db (if applicable)
 * and that accepts applicable read and write requests.
 */
export class ConceptServer<C extends Config = Config> {
  private readonly _name: string;
  private readonly _schemaPath: string;
  private readonly _componentRequestTable: ComponentRequestTable;
  private readonly _config: C;
  private _db: mongodb.Db | undefined;
  private _resolvers: IResolvers | undefined;
  private readonly _initDbCallback: InitDbCallbackFn<C> | undefined;
  private readonly _initResolvers: InitResolversFn<C> | undefined;
  private readonly _dynamicTypeDefs: string[];

  constructor(name: string, componentRequestTable: ComponentRequestTable,
    config: C, schemaPath: string,
    initDbCallback?: InitDbCallbackFn<C>, initResolvers?: InitResolversFn<C>,
    dynamicTypeDefs: string[] = []) {
    this._name = name;
    this._componentRequestTable = componentRequestTable;
    this._config = config;
    this._schemaPath = schemaPath;
    this._initDbCallback = initDbCallback;
    this._initResolvers = initResolvers;
    this._dynamicTypeDefs = dynamicTypeDefs;
  }

  /**
   * Get the component name from the full one
   * @param fullComponentName the component name that includes/begins
   *                           with the concept name and a separator
   */
  private getComponentName(fullComponentName: string) {
    return fullComponentName
      .split('-')
      .slice(1)
      .join('-');
  }

  private getGraphqlRequest(fullComponentName: string, extraInfo: any) {
    const componentName = this.getComponentName(fullComponentName);
    if (this._componentRequestTable[componentName]) {
      return this._componentRequestTable[componentName](extraInfo);
    }
    throw new Error(
      `Component ${componentName} request not defined in component table ` +
      JSON.stringify(this._componentRequestTable));
  }

  private setGraphqlQueryAndVariables(
    graphqlParams, variables: object, fullComponentName: string,
    extraInfo: any) {
    graphqlParams.query = this.getGraphqlRequest(fullComponentName, extraInfo);
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
        req['fullComponentName'], req[reqField].extraInfo);
      next();
    };
  }

  private getPort(portValue: string | number): number {
    return _.isString(portValue) && portValue.startsWith('$') ?
      // it's an env variable
      _.toNumber(process.env[portValue.slice(1)]) :
      <number> portValue;
  }

  private startApp(schema) {
    const app = express();

    const reqParamNamesInOrder = ['fullComponentName', 'reqId', 'reqType'];

    // /dv-{fullComponentName}/{reqId}/{reqType}/
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
                   ${this._name} concept server`);
            }
          }
        };
      })
    );

    app.use('/graphql/:fullComponentName', bodyParser.json(),
      bodyParser.urlencoded({
        extended: true
      }),
      (req, _res, next) => {
        req['fullComponentName'] = req.params.fullComponentName;
        next();
      },
      this.getGraphqlExpressMiddleware(),
      graphqlExpress({ schema })
    );

    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql',
      subscriptionsEndpoint:
        `ws://localhost:${this.getPort(this._config.wsPort)}/subscriptions`
    }));

    const server = createServer(app);
    server.listen(this.getPort(this._config.wsPort), () => {
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
            dvParams.fullComponentName,
            dvParams.extraInfo);
        }
      }, {
        server,
        path: '/subscriptions'
      });
    });
  }

  /**
   * Start this concept server.
   */
  async start(): Promise<void> {
    // TODO: make connecting to mongo optional since there might be concepts
    // that don't require a db
    const mongoServer = `${this._config.dbHost}:${this._config.dbPort}`;
    console.log(`Connecting to mongo server ${mongoServer}`);
    const client: mongodb.MongoClient = await mongodb.MongoClient.connect(
      `mongodb://${mongoServer}`);

    this._db = client.db(this._config.dbName);
    const conceptDb: ConceptDb = new ConceptDb(client, this._db);

    if (this._config.reinitDbOnStartup) {
      await this._db.dropDatabase();
      console.log(`Reinitialized db ${this._config.dbName}`);
    }
    if (this._initDbCallback) {
      await this._initDbCallback(conceptDb, this._config);
    }
    // TODO: support for initResolvers that don't require a db
    if (this._initResolvers) {
      this._resolvers = this._initResolvers(
        conceptDb, this._config);
      const typeDefs = [
        readFileSync(this._schemaPath, 'utf8'), ...this._dynamicTypeDefs];
      const schema = makeExecutableSchema(
        { typeDefs, resolvers: this._resolvers });

      this.startApp(schema);
    }
  }
}
