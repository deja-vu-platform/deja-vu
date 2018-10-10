import * as minimist from 'minimist';
import * as mongodb from 'mongodb';

import {
  ClicheServer,
  InitDbCallbackFn,
  InitResolversFn
} from './clicheServer';
import { Config, getConfig } from './config';


/**
 * A builder for {@link ClicheServer}
 */
export class ClicheServerBuilder {
  private readonly _name: string;
  private _schema: string = 'schema.graphql';
  private _config: Config;
  private _initDbCallback: InitDbCallbackFn;
  private _initResolvers: InitResolversFn;

  /**
   * Start building a ClicheServerBuilder,
   * which starts out with the default config and the ones specified
   * in the command-line arguments.
   * @param defaultName the cliche name to use if it is not specified
   *                    in the command-line arguments
   */
  constructor(defaultName: string) {
    const argv = minimist(process.argv);
    this._name = argv.as ? argv.as : defaultName;
    this._config = getConfig(this._name, argv);
  }

  /**
   * Update the existing config with the given one
   * @param  config the config to use for updating
   * @return        this builder
   */
  config(config): ClicheServerBuilder {
    this._config = {...this._config, ...config};
    return this;
  }

  /**
   * Set the init db callback function for the cliche server
   * @param  callback the function to be called
   *                  after connecting to the db
   * @return          this builder
   */
  initDb(callback: InitDbCallbackFn): ClicheServerBuilder {
    this._initDbCallback = callback;
    return this;
  }

  /**
   * Set the function to initialize the resolvers for the cliche server
   * @param  initResolvers the function to init resolvers
   * @return               this builder
   */
  resolvers(initResolvers: InitResolversFn): ClicheServerBuilder {
    this._initResolvers = initResolvers;
    return this;
  }

  /**
   * Set the filename that contains the schema for the cliche.
   * The file must be in the same directory. (?)
   * @param  schema the filename of the schema
   * @return        this builder
   */
  schema(schema: string): ClicheServerBuilder {
    this._schema = schema;
    return this;
  }

  /**
   * Create a ClicheServer out of this builder
   * @return the resulting cliche server
   */
  build(): ClicheServer {
    return new ClicheServer(this._name, this._config, this._schema,
      this._initDbCallback, this._initResolvers);
  }
} 
