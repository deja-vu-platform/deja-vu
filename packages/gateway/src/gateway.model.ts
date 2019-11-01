import * as _ from 'lodash';

export interface GatewayConfig {
  readonly dbHost: string;
  readonly dbPort: number;
  readonly wsPort: number | string;
  readonly dbName: string;
  readonly reinitDbOnStartup: boolean;
}

export interface UsedConceptsMap {
  readonly [as: string]: DvConfig;
}

export interface DvConfig {
  readonly name: string;
  readonly startServer?: boolean;
  readonly watch?: boolean;
  readonly config?: Config;
  readonly gateway: { config: GatewayConfig };
  readonly usedConcepts?: UsedConceptsMap;
  // Components that have no expected request
  readonly componentsNoRequest?: { exec: string[] };
  readonly routes?: { path: string, component: string }[];
}

export interface Config {
  wsPort: number | string;
  reinitDbOnStartup?: boolean;
  [s: string]: any;
}

export function getPort(portValue: number | string): number {
  return _.isString(portValue) && portValue.startsWith('$') ?
    // it's an env variable
    _.toNumber(process.env[portValue.slice(1)]) :
    <number> portValue;
}
