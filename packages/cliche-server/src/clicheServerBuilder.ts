import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';

import {
  ClicheServer,
  InitDbCallbackFn,
  InitResolversFn
} from './clicheServer';
import { Config, getConfig } from './config';


/**
 * The type of the function to be called to get the dynamic type definitions
 * for the schema from the config
 */
export type GetDynamicTypeDefsFn = (config: Config) => string[];

/**
 * A builder for {@link ClicheServer}
 */
export class ClicheServerBuilder {
  private readonly _name: string;
  private _schemaPath: string = path.join(
    process.cwd(), 'dist', 'server', 'schema.graphql');
  private _config: Config;
  private _initDbCallback?: InitDbCallbackFn;
  private _initResolvers?: InitResolversFn;
  private _getDynamicTypeDefsFn: GetDynamicTypeDefsFn = (_) => [];

  /**
   * Start building a ClicheServerBuilder,
   * which starts out with the default schema path, and
   * the default config and the ones specified in the command-line arguments.
   * @param defaultName the cliche name to use if it is not specified
   *                    in the command-line arguments
   */
  constructor(defaultName: string) {
    const argv = minimist(process.argv);
    this._name = argv.as ? argv.as : defaultName;
    this._config = getConfig(this._name, argv);
  }

  /**
   * Update the existing (default) config with the given one.
   * Any fields present in the previous config, but not in the new one
   * will be retained.
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
   * Set the filepath that contains the schema for the cliche.
   * If not set before, overrides the default filepath.
   * @param  schemaPath the filepath of the schema
   * @return            this builder
   */
  schemaPath(schemaPath: string): ClicheServerBuilder {
    this._schemaPath = schemaPath;
    return this;
  }

  /**
   * Set the function that will return the list of
   * dynamic type definitions for the schema from the config.
   * If not set before, overrides the default function
   * which provides no dynamic type definitions.
   * @param  getDynamicTypeDefsFn the function to get the dynamic type defs
   * @return                      this builder
   */
  dynamicTypeDefs(
    getDynamicTypeDefsFn: GetDynamicTypeDefsFn): ClicheServerBuilder {
    this._getDynamicTypeDefsFn = getDynamicTypeDefsFn;
    return this;
  }

  /**
   * Create a ClicheServer out of this builder
   * @return the resulting cliche server
   */
  build(): ClicheServer {
    return new ClicheServer(this._name, this._config, this._schemaPath,
      this._initDbCallback, this._initResolvers,
      this._getDynamicTypeDefsFn(this._config));
  }
}
