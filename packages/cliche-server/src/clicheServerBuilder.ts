import * as callsite from 'callsite';
import * as minimist from 'minimist';
import * as path from 'path';

import {
  ComponentRequestTable,
  ClicheServer,
  InitDbCallbackFn,
  InitResolversFn
} from './clicheServer';
import { Config, getConfig } from './config';


/**
 * The type of the function to be called to get the dynamic type definitions
 * for the schema from the config
 */
export type GetDynamicTypeDefsFn<C = Config> = (config: C) => string[];

/**
 * A builder for {@link ClicheServer}
 */
export class ClicheServerBuilder<C extends Config = Config> {
  private readonly _name: string;
  private _schemaPath: string = path.join(
    path.dirname(callsite()[1]
        .getFileName()), 'schema.graphql');
  private _componentRequestTable: ComponentRequestTable = {};
  private _config: C;
  private _initDbCallback?: InitDbCallbackFn<C>;
  private _initResolvers?: InitResolversFn<C>;
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
    this._config = getConfig<C>(this._name, argv);
  }

  /**
   * Set the component request table for the cliche server
   * @param  componentRequestTable the table
   * @return                    this builder
   */
  componentRequestTable(
    componentRequestTable: ComponentRequestTable): ClicheServerBuilder<C> {
    this._componentRequestTable = componentRequestTable;

    return this;
  }

  /**
   * Update the existing (default) config with the given one.
   * Any fields present in the previous config, but not in the new one
   * will be retained.
   * @param  config the config to use for updating
   * @return        this builder
   */
  config(config: C): ClicheServerBuilder<C> {
    // https://github.com/Microsoft/TypeScript/issues/10727
    // this._config = {...this._config, ...config};
    this._config = Object.assign({}, this._config, config);

    return this;
  }

  /**
   * Set the init db callback function for the cliche server
   * @param  callback the function to be called
   *                  after connecting to the db
   * @return          this builder
   */
  initDb(callback: InitDbCallbackFn<C>): ClicheServerBuilder<C> {
    this._initDbCallback = callback;

    return this;
  }

  /**
   * Set the function to initialize the resolvers for the cliche server
   * @param  initResolvers the function to init resolvers
   * @return               this builder
   */
  resolvers(initResolvers: InitResolversFn<C>): ClicheServerBuilder<C> {
    this._initResolvers = initResolvers;

    return this;
  }

  /**
   * Set the filepath that contains the schema for the cliche.
   * If not set before, overrides the default filepath.
   * @param  schemaPath the filepath of the schema
   * @return            this builder
   */
  schemaPath(schemaPath: string): ClicheServerBuilder<C> {
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
    getDynamicTypeDefsFn: GetDynamicTypeDefsFn): ClicheServerBuilder<C> {
    this._getDynamicTypeDefsFn = getDynamicTypeDefsFn;

    return this;
  }

  /**
   * Create a ClicheServer out of this builder
   * @return the resulting cliche server
   */
  build(): ClicheServer<C> {
    return new ClicheServer<C>(this._name, this._componentRequestTable,
      this._config, this._schemaPath,
      this._initDbCallback, this._initResolvers,
      this._getDynamicTypeDefsFn(this._config));
  }
}
