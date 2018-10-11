import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as minimist from 'minimist';

import { readFileSync } from 'fs';
import * as path from 'path';

import { DvConfig, GatewayConfig } from './gateway.model';
import { RequestProcessor } from './requestProcessor';


const JSON_INDENTATION = 2;
const INTERNAL_SERVER_ERROR = 500;

const DEFAULT_CONFIG: GatewayConfig = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `gateway-db`,
  reinitDbOnStartup: true
};

const CONFIG_FLAG = 'configFilePath';
const ACTION_TABLE_FP = 'actionTable.json';
const distFolder = path.join(process.cwd(), 'dist');


function getFromArgs<T>(args, flag: string): T {
  const filePath = args[flag];
  if (!filePath) {
    throw new Error(`No ${flag} given!`);
  }
  const ret: T = JSON.parse(readFileSync(filePath, 'utf8'));
  console.log(`Using ${flag} ${stringify(ret)}`);

  return ret;
}

const argv = minimist(process.argv);
const dvConfig: DvConfig = getFromArgs<DvConfig>(argv, CONFIG_FLAG);
const config: GatewayConfig = { ...DEFAULT_CONFIG, ...dvConfig.gateway.config };
const appActionTable = JSON.parse(
  readFileSync(path.join(distFolder, ACTION_TABLE_FP), 'utf8'));

const requestProcessor = new RequestProcessor(dvConfig, config, appActionTable);

const app = express();


// Handle API requests
app.use('/api', bodyParser.json(), async (req, res) => {
  try {
    await requestProcessor.processRequest(req, res);
  } catch (e) {
    console.error(
      `Something bad happened when processing req` +
      ` ${JSON.stringify(req.query)}: ${e.stack}`);
    res.status(INTERNAL_SERVER_ERROR)
      .send();
  }
});

// Serve SPA
app.use(express.static(distFolder));
app.get('*', ({}, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Listen
const port = config.wsPort;
requestProcessor.start()
  .then(() => {
    app.listen(port, async () => {
      console.log(`Running gateway on port ${port}`);
      console.log(`Using config ${stringify(dvConfig)}`);
      console.log(`Serving ${distFolder}`);
    });
  });

function stringify(json: any) {
  return JSON.stringify(json, undefined, JSON_INDENTATION);
}
