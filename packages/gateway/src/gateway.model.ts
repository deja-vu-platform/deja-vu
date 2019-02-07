
export interface GatewayConfig {
  readonly dbHost: string;
  readonly dbPort: number;
  readonly wsPort: number;
  readonly dbName: string;
  readonly reinitDbOnStartup: boolean;
}

export interface UsedClichesMap {
  readonly [as: string]: DvConfig;
}

export interface DvConfig {
  readonly name: string;
  readonly startServer?: boolean;
  readonly watch?: boolean;
  readonly config?: Config;
  readonly gateway: { config: GatewayConfig };
  readonly usedCliches?: UsedClichesMap;
  // Actions that have no expected request
  readonly actionsNoRequest?: { exec: string[] };
  readonly routes?: { path: string, action: string }[];
}

export interface Config {
  wsPort: number;
  reinitDbOnStartup?: boolean;
  [s: string]: any;
}
