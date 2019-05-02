#!/usr/bin/env node

import * as minimist from 'minimist';

import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import * as path from 'path';
import * as WebSocket from 'ws';

import { ActionTable } from './actionHelper';
import { DvConfig, GatewayConfig } from './gateway.model';
import {
  AppRequestProcessor,
  DesignerRequestProcessor,
  RequestProcessor
} from './requestProcessor';


const JSON_INDENTATION = 2;
const INTERNAL_SERVER_ERROR = 500;

const DEFAULT_CONFIG: GatewayConfig = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `gateway-db`,
  reinitDbOnStartup: true
};

const DV_CONFIG_FLAG = 'configFilePath';
const ACTION_TABLE_FP = 'actionTable.json';


export interface AppInfo {
  dvConfig: DvConfig;
  appActionTable: ActionTable;
  distFolder: string;
}

export interface GatewayConfigOptions {
  readonly dbHost?: string;
  readonly dbPort?: number;
  readonly wsPort?: number;
  readonly dbName?: string;
  readonly reinitDbOnStartup?: boolean;
}


/**
 * JSON.stringify with custom indentation
 */
function stringify(json: any) {
  return JSON.stringify(json, undefined, JSON_INDENTATION);
}

/**
 * Start the gateway server.
 */
export function startGateway(
  gatewayConfigOptions?: GatewayConfigOptions,
  info?: AppInfo
): RequestProcessor {
  const gatewayConfig: GatewayConfig = Object
    .assign({}, DEFAULT_CONFIG, gatewayConfigOptions || {});
  const app = express();
  const requestProcessor: RequestProcessor = info
    ? new AppRequestProcessor(gatewayConfig, info.dvConfig, info.appActionTable)
    : new DesignerRequestProcessor(gatewayConfig);

  // Handle API requests
  app.use('/api', bodyParser.json(), async (req, res) => {
    try {
      await requestProcessor.processRequest(req, res);
    } catch (e) {
      console.error(
        `Something bad happened when processing req` +
        ` ${stringify(req.query)}: ${e.stack}`);
      res.status(INTERNAL_SERVER_ERROR)
        .send();
    }
  });

  const server = createServer(app);

  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: string) => {
        console.log('Gateway received message from client: %s', message);
        const subscriptionObj = JSON.parse(message);
        const subscriptionId = subscriptionObj.subscriptionId;

        requestProcessor
        .processSubscription(subscriptionObj)
        .subscribe({
          next: (res) => {
            const response = Object.assign({}, res, { subscriptionId });
            ws.send(JSON.stringify(response));
          },
          error: (e) => console.log(e)
        });
    });
  });

  // serve the SPA
  if (info) {
    app.use(express.static(path.join(info.distFolder, 'app')));
    app.get('*', ({}, res) => {
      res.sendFile(path.join(info.distFolder, 'app', 'index.html'));
    });
  }

  // Listen
  const port = gatewayConfig.wsPort;
  requestProcessor.start()
    .then(() => {
      server.listen(port, async () => {
        console.log(`Running gateway on port ${port}`);
        if (info) {
          console.log(`Using config ${stringify(info.dvConfig)}`);
          console.log(`Serving ${info.distFolder}/app`);
        }
      });
    });

  return requestProcessor;
}

/**
 * For execution from the command line
 */
function main() {
  const argv = minimist(process.argv);
  const dvConfigPath = argv[DV_CONFIG_FLAG];

  const distFolder = path.join(process.cwd(), 'dist');

  let gatewayConfig: GatewayConfigOptions;
  let dvConfig: DvConfig;
  let appActionTable: ActionTable;
  if (dvConfigPath) {
    dvConfig = JSON.parse(readFileSync(dvConfigPath, 'utf8'));
    gatewayConfig = Object.assign({}, dvConfig.gateway.config);
    appActionTable = JSON.parse(
      readFileSync(path.join(distFolder, ACTION_TABLE_FP), 'utf8')
    );
  }

  startGateway(gatewayConfig, { dvConfig, appActionTable, distFolder });
}

// if executed from command line
if (require.main === module) {
  main();
}
