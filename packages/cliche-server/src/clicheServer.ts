import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as mongodb from 'mongodb';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from 'graphql-tools';

import { Config } from './config';

// GitHub Issue: https://github.com/apollographql/apollo-server/issues/927
// tslint:disable-next-line:no-var-requires
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');


/**
 * The error message to include when there is a concurrent update in the server.
 */
export const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

/**
 * The type of the function to be called after connecting to the db.
 */
export type InitDbCallbackFn = ((db: mongodb.Db, config: Config) => Promise<any>);

/**
 * The type of the function to be called to generate the resolvers.
 * @return the resolvers object
 */
export type InitResolversFn = ((db: mongodb.Db, config: Config) => object);

export interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

/**
 * The server for a cliche that contains its associated db (if applicable)
 * and that accepts applicable read and write requests.
 */
export class ClicheServer {
  private readonly _name: string;
  private readonly _schemaPath: string;
  private readonly _config: Config;
  private _db: mongodb.Db | undefined;
  private _resolvers: object | undefined;
  private readonly _initDbCallback: InitDbCallbackFn | undefined;
  private readonly _initResolvers: InitResolversFn | undefined;
  private readonly _dynamicTypeDefs: string[];

  constructor(name: string, config: Config, schemaPath: string,
    initDbCallback?: InitDbCallbackFn, initResolvers?: InitResolversFn,
    dynamicTypeDefs: string[] = []) {
    this._name = name;
    this._config = config;
    this._schemaPath = schemaPath;
    this._initDbCallback = initDbCallback;
    this._initResolvers = initResolvers;
    this._dynamicTypeDefs = dynamicTypeDefs;
  }

  private startApp(schema) {
    const app = express();

    app.get(/^\/dv\/(.*)\/vote\/.*/,
      (req, res, next) => {
        req['reqId'] = req.params[0];
        next();
      },
      bodyParser.json(),
      graphqlExpress((req) => {
        return {
          schema: schema,
          context: {
            reqType: 'vote',
            reqId: req!['reqId']
          },
          formatResponse: (gqlResp) => {
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          }
        };
      })
    );

    app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
      (req, res, next) => {
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
              default:
                throw new Error(`Unexpected request type ${reqType} for
                   ${this._name} cliche server`);
            }
          }
        };
      })
    );

    app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
      extended: true
    }), graphqlExpress({ schema }));

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
    const mongoServer: string = `${this._config.dbHost}:${this._config.dbPort}`;
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
