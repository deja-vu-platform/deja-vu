
export interface GatewayConfig {
  readonly dbHost: string;
  readonly dbPort: number;
  readonly wsPort: number;
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
  wsPort: number;
  reinitDbOnStartup?: boolean;
  [s: string]: any;
}
