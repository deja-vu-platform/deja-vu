
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
  readonly config?: any;
  readonly gateway: { config: GatewayConfig };
  readonly usedCliches?: UsedClichesMap;
  // Actions that have no expected request
  readonly actionsNoRequest?: { exec: string[] };
  readonly routes?: { path: string, action: string }[];
}
