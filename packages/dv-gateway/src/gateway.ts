import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as minimist from 'minimist';
import * as request from 'superagent';
import { v4 as uuid } from 'uuid';

import * as assert from 'assert';
import { readFileSync } from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

import {
  ActionAst, ActionHelper, ActionTable, ActionTag, ActionTagPath
} from './actionHelper';
import { TxConfig, TxCoordinator, Vote } from './txCoordinator';


interface Config {
  dbHost: string;
  dbPort: number;
  wsPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

interface DvConfig {
  name: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway: { config: Config };
  usedCliches?: {[as: string]: DvConfig};
  // Actions that have no expected request
  actionsNoRequest?: { exec: string[] };
  routes?: { path: string, action: string }[];
}


const JSON_INDENTATION = 2;

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `gateway-db`,
  reinitDbOnStartup: true
};

const CONFIG_FLAG = 'configFilePath';
const ACTION_TABLE_FP = 'actionTable.json';
const distFolder = path.join(process.cwd(), 'dist');

function getFromArgs<T>(argv, flag: string): T {
  const filePath = argv[flag];
  if (!filePath) {
    throw new Error(`No ${flag} given!`);
  }
  const ret: T = JSON.parse(readFileSync(filePath, 'utf8'));
  console.log(`Using ${flag} ${stringify(ret)}`);

  return ret;
}

const argv = minimist(process.argv);
const dvConfig: DvConfig = getFromArgs<DvConfig>(argv, CONFIG_FLAG);
const config: Config = {...DEFAULT_CONFIG, ...dvConfig.gateway.config};

const actionHelper = new ActionHelper(
  JSON.parse(readFileSync(path.join(distFolder, ACTION_TABLE_FP), 'utf8')),
  _.map(_.toPairs(dvConfig.usedCliches),
    ([alias, usedClicheConfig]: [string, DvConfig]): string => _.get(
      usedClicheConfig, 'name', alias)),
  dvConfig.routes);

interface ClicheResponse<T> {
  status: number;
  text: T;
}

function newReqFor(msg: string, gcr: GatewayToClicheRequest)
  : GatewayToClicheRequest {
  const ret: GatewayToClicheRequest = _.clone(gcr);
  ret.path = `/dv/${gcr.reqId}/${msg}` + ret.path;

  return ret;
}

const txConfig: TxConfig<
  GatewayToClicheRequest, ClicheResponse<string>, express.Response> = {
  dbHost: config.dbHost,
  dbPort: config.dbPort,
  dbName: config.dbName,
  reinitDbOnStartup: config.reinitDbOnStartup,
  sendCommitToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    return forwardRequest(newReqFor('commit', gcr))
      .then((unusedResp) => undefined);
  },
  sendAbortToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    return forwardRequest(newReqFor('abort', gcr))
      .then((unusedResp) => undefined);
  },
  sendVoteToCohort: (gcr: GatewayToClicheRequest)
    : Promise<Vote<ClicheResponse<string>>> => {
    return forwardRequest<Vote<string>>(newReqFor('vote', gcr))
      .then((resp: ClicheResponse<Vote<string>>)
        : Vote<ClicheResponse<string>> => {
        const vote = {
          result: resp.text.result,
          payload: { status: resp.status, text: resp.text.payload }
        };
        console.log(`Voted: ${stringify(vote)}`);

        return vote;
      });
  },
  sendAbortToClient: (
    gcr: GatewayToClicheRequest, causedAbort: boolean,
    payload?: ClicheResponse<string>, res?: express.Response) => {
    if (causedAbort) {
      res!.status(payload!.status);
      res!.send(payload!.text);
    } else {
      res!.status(INTERNAL_SERVER_ERROR);
      res!.send('the tx that this action is part of aborted');
    }
  },
  sendToClient: (payload: ClicheResponse<string>, res?: express.Response) =>  {
    res!.status(payload.status);
    res!.send(payload.text);
  },
  getCohorts: (actionPathId: string) => {
    const actionPath: string[] = idToActionPath(actionPathId);
    const dvTxNodeIndex = _.indexOf(actionPath, 'dv-tx');

    const paths: ActionTagPath[] = actionHelper.getMatchingPaths(actionPath);
    // We know that the action path is a valid one because if otherwise the tx
    // would have never been initiated in the first place
    assert.ok(paths.length === 1,
      `Expected 1 path but got ${JSON.stringify(paths, null, 2)}`);
    const actionTagPath: ActionTagPath = paths[0];
    assert.ok(actionTagPath.length === actionPath.length,
      'Expected the length of the path to match the action path length but ' +
      ` got ${JSON.stringify(actionTagPath, null, 2)}`);
    const dvTxNode = actionTagPath[dvTxNodeIndex];

    const cohortActions = _.reject(dvTxNode.content, (action: ActionTag) => {
      return action.tag.split('-')[0] === 'dv' ||
        _.get(action.inputs, '[save]') === 'false' ||
        !actionHelper.shouldHaveExecRequest(action.tag);
    });

    const cohorts = _.map(
      cohortActions, (action: ActionTag) => actionPathToId(
        [..._.take(actionPath, dvTxNodeIndex + 1), action.fqtag]
      ));

    return cohorts;
  },
  onError: (e: Error, gcr: GatewayToClicheRequest, res?: express.Response) => {
    console.error(e);
    res!.status(INTERNAL_SERVER_ERROR);
    res!.send(e.message);
  }
};

const app = express();
const txCoordinator = new TxCoordinator<
  GatewayToClicheRequest, ClicheResponse<string>, express.Response>(txConfig);

// Handle API requests
// `projects` has all keys in `usedCliches` plus the name of the current app
const projects: Set<string> = setOfUsedCliches(dvConfig);
projects.add(dvConfig.name);

// `dstTable` is a table of the form clicheAlias[-clicheAlias]* -> port
// If cliche A is contained in cliche B the key for B in the dst table is A-B
const dstTable = _.mapKeys(
  buildDstTable(dvConfig),
  (unusedValue, k) => `${dvConfig.name}-${k}`);
if (dvConfig.config && dvConfig.config.wsPort) {
  dstTable[dvConfig.name] = dvConfig.config.wsPort;
}

console.log(`Using dst table ${JSON.stringify(dstTable)}`);

interface Dict {
  [key: string]: string;
}

interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}

interface GatewayRequest {
  from: string[];
  reqId: string;
  runId?: string | undefined;
  path?: string | undefined;
  options?: RequestOptions;
}

interface GatewayToClicheRequest extends GatewayRequest {
  url: string;
  method: string;
  body: string;
}

const INTERNAL_SERVER_ERROR = 500;


app.use('/api', bodyParser.json(), async (req, res, next) => {
  try {
    await processRequest(req, res, next);
  } catch (e) {
    console.error(
      `Something bad happened when processing req` +
      ` ${JSON.stringify(req.query)}: ${e.stack}`);
    res.status(INTERNAL_SERVER_ERROR)
      .send();
  }
});

async function processRequest(req, res, next): Promise<void> {
  const gatewayRequest: GatewayRequest = {
    from: JSON.parse(req.query.from),
    reqId: uuid(),
    runId: req.query.runId,
    path: req.query.path,
    options: req.query.options ? JSON.parse(req.query.options) : undefined
  };
  // Validate request
  if (!req.query.from) {
    res.status(INTERNAL_SERVER_ERROR)
      .send('No from specified');

    return;
  }
  console.log(
    `Req from ${gatewayRequest.from} projects is ` +
    JSON.stringify(Array.from(projects.values())));
  const to = getDst(dvConfig.name, gatewayRequest.from, projects);
  if (!(to in dstTable)) {
    res.status(INTERNAL_SERVER_ERROR)
      .send(`Invalid to: ${to}, my dstTable is ${stringify(dstTable)}`);

    return;
  }

  const actionPath = actionHelper.getActionPath(
    gatewayRequest.from, projects);
  if (!actionHelper.actionPathIsValid(actionPath)) {
    res.status(INTERNAL_SERVER_ERROR)
      .send(
        `Invalid action path: ${actionPath}, my actionConfig is ` +
        actionHelper.toString());

    return;
  }


  const runId = gatewayRequest.runId;
  console.log(
    'Processing request:' + `to: ${to}, port: ${dstTable[to]}, ` +
    `action path: ${actionPath}, runId: ${runId}` +
    (actionHelper.isDvTx(actionPath) ?
      `, dvTxId: ${runId}` : ' not part of a tx'));

  const gatewayToClicheRequest = {
    ...gatewayRequest,
    ...{
      url: `http://localhost:${dstTable[to]}`,
      method: req.method,
      body: req.body
    }
  };

  if (req.method === 'GET' || !actionHelper.isDvTx(actionPath)) {
    const clicheRes: ClicheResponse<string> = await forwardRequest<string>(
      gatewayToClicheRequest);
    res.status(clicheRes.status);
    res.send(clicheRes.text);
  } else {
    if (!runId) {
      throw new Error('run id undefined');
    }
    /* Temporarily deactivate txs
    await txCoordinator.processMessage(
        runId, actionPathToId(actionPath), gatewayToClicheRequest, res);
    */
    const clicheRes: ClicheResponse<string> = await forwardRequest<string>(
      gatewayToClicheRequest);
    res.status(clicheRes.status);
    res.send(clicheRes.text);
  }
}


const ACTION_PATH_SEP = ':';

function actionPathToId(actionPath: string[]): string {
  return actionPath.join(ACTION_PATH_SEP);
}

function idToActionPath(id: string): string[] {
  return id.split(ACTION_PATH_SEP);
}

/**
 *  Forwards to the cliche the given request.
 */
async function forwardRequest<T>(gatewayRequest: GatewayToClicheRequest)
  : Promise<ClicheResponse<T>> {
  if (gatewayRequest.path) {
    gatewayRequest.url += gatewayRequest.path;
  }
  let clicheReq = request(gatewayRequest.method, gatewayRequest.url);
  if (gatewayRequest.options) {
    if (gatewayRequest.options.params) {
      clicheReq = clicheReq.query(gatewayRequest.options.params);
    }
    if (gatewayRequest.options.headers) {
      clicheReq = clicheReq.set(gatewayRequest.options.headers);
    }
  }
  clicheReq.send(gatewayRequest.body);
  let response: request.Response;
  try {
    response = await clicheReq;
  } catch (err) {
    response = err.response;
  }
  if (!response) {
    console.error(
      `Got an undefined response for cliche request
      ${JSON.stringify(clicheReq)}`);
  }

  return { status: response.status, text: JSON.parse(response.text) };
}

// Serve SPA
app.use(express.static(distFolder));
app.get('*', ({}, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Listen
const port = config.wsPort;
txCoordinator.start()
  .then(() => {
    app.listen(port, async () => {
      console.log(`Running gateway on port ${port}`);
      console.log(`Using config ${stringify(dvConfig)}`);
      console.log(`Using action table ${actionHelper}`);
      console.log(`Serving ${distFolder}`);
    });
  });


// `from`: originatingAction-action-....-action
function getDst(thisProject: string, from: string[], projects: Set<string>)
  : string {
  let lastProjectSeen;
  const seenProjects: string[] = [];
  for (const node of from) {
    const name = node.toLowerCase();
    if (name === 'dv-include') {
      if (lastProjectSeen !== thisProject) {
        seenProjects.push(thisProject);
      }
      break;
    }
    const project = name.split('-')[0];
    if (projects.has(project) && lastProjectSeen !== project) {
      seenProjects.push(project);
      lastProjectSeen = project;
    }
  }

  return seenProjects.reverse()
    .join('-');
}

function setOfUsedCliches(dvConfig: DvConfig): Set<string> {
  const ret = new Set<string>();
  if (!dvConfig.usedCliches) {
    return ret;
  }

  for (const usedClicheKey of Object.keys(dvConfig.usedCliches)) {
    ret.add(usedClicheKey);
    for (const usedUsedClicheKey of setOfUsedCliches(
      dvConfig.usedCliches[usedClicheKey])) {
      ret.add(usedUsedClicheKey);
    }
  }

  return ret;
}

function buildDstTable(dvConfig: DvConfig): {[dst: string]: string} {
  const ret = {};
  if (!dvConfig.usedCliches) {
    return ret;
  }
  for (const usedClicheKey of Object.keys(dvConfig.usedCliches)) {
    const usedCliche = dvConfig.usedCliches[usedClicheKey];
    const usedClichesDstTable = _.mapKeys(
      buildDstTable(usedCliche), (unusedValue, k) => `${usedClicheKey}-${k}`);
    _.assign(
      ret, usedClichesDstTable, {[usedClicheKey]: usedCliche.config.wsPort});
  }

  return ret;
}

function stringify(json: any) {
  return JSON.stringify(json, undefined, JSON_INDENTATION);
}
