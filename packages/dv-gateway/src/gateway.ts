import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as minimist from 'minimist';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'superagent';

import { TxCoordinator, TxConfig, Vote } from './txCoordinator';


interface Config {
  dbHost: string;
  dbPort: number;
  wsPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

interface ActionInfo {
  childActions: {[childActionName: string]: ActionInfo};
}

interface RootAction {
  rootName: string;
  childActions: {[childActionName: string]: ActionInfo};
}

interface DvConfig {
  name: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway: { config: Config };
  usedCliches?: {[as: string]: DvConfig};
  actionTree?: RootAction;
}

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `gateway-db`,
  reinitDbOnStartup: true
};


function getDvConfig(): DvConfig {
  const argv = minimist(process.argv);
  const configFilePath = argv.configFilePath;
  const dvConfig: DvConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));
  console.log(`Using dv config ${JSON.stringify(dvConfig, undefined, 2)}`);
  return dvConfig;
}

const dvConfig: DvConfig = getDvConfig();
const config: Config = {...DEFAULT_CONFIG, ...dvConfig.gateway.config};

interface VotePayload {
  status: number;
  text: string;
}

const txConfig: TxConfig<
  GatewayToClicheRequest, VotePayload, express.Response> = {
  dbHost: config.dbHost,
  dbPort: config.dbPort,
  dbName: config.dbName,
  reinitDbOnStartup: config.reinitDbOnStartup,
  sendCommitToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    gcr.path = '/commit' + gcr.path;
    return forwardRequest(gcr).then(unusedResp => undefined);
  },
  sendAbortToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    gcr.path = '/abort' +  gcr.path;
    return forwardRequest(gcr).then(unusedResp => undefined);
  },
  sendVoteToCohort: (gcr: GatewayToClicheRequest): Promise<Vote<VotePayload>> => {
    gcr.path = '/vote' + gcr.path;
    return forwardRequest<Vote<string>>(gcr)
      .then((resp: {status: number; text: Vote<string>}): Vote<VotePayload> => {
        return {
          result: resp.text.result,
          payload: { status: resp.status, text: resp.text.payload }
        };
      });
  },
  sendAbortToClient: (gcr: GatewayToClicheRequest, res?: express.Response) => {
    res!.status(500);
    res!.send('the tx this action is part of aborted');
  },
  sendToClient: (payload: VotePayload, res?: express.Response) =>  {
    res!.status(payload.status);
    res!.send(payload.text);
  },
  getCohorts: (cohortId: string) => {
    // would also need the actionConfig
    return ['foo', 'bar'];
  }
};

const app = express();
const txCoordinator = new TxCoordinator<
  GatewayToClicheRequest, VotePayload, express.Response>(txConfig);

// Handle API requests
// projects contains all keys in `usedCliches` plus the name of the current app
const projects: Set<string> = setOfUsedCliches(dvConfig);
projects.add(dvConfig.name);

// dstTable is a table of the form clicheAlias[-clicheAlias]* -> port
// If cliche A is contained in cliche B the key for B in the dst table is A-B
const dstTable = _.mapKeys(
  buildDstTable(dvConfig),
  (unusedValue, k) => `${dvConfig.name}-${k}`);
if (dvConfig.config && dvConfig.config.wsPort) {
  dstTable[dvConfig.name] = dvConfig.config.wsPort;
}

console.log(`Using dst table ${JSON.stringify(dstTable)}`);

type Dict = {[key: string]: string};

interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}

interface GatewayRequest {
  from: string[];
  runId?: string | undefined;
  path?: string | undefined;
  options?: RequestOptions;
}

interface GatewayToClicheRequest extends GatewayRequest {
  url: string;
  method: string;
  body: string;
}


app.use('/api', bodyParser.json(), async (req, res, next) => {
  const gatewayRequest: GatewayRequest = {
    from: JSON.parse(req.query.from),
    runId: req.query.runId,
    path: req.query.path,
    options: req.query.options ? JSON.parse(req.query.options) : undefined
  };
  // Validate request
  if (!req.query.from) {
    res.status(500).send('No from specified');
    return;
  }
  console.log(
    `Req from ${gatewayRequest.from} projects is ` +
    JSON.stringify(Array.from(projects.values())));
  const to = getDst(dvConfig.name, gatewayRequest.from, projects);
  if (!(to in dstTable)) {
    res.status(500).send(
      `Invalid to: ${to}, my dstTable is ` +
      JSON.stringify(dstTable, undefined, 2));
    return;
  }
  const actionPath = getActionPath(gatewayRequest.from, projects);
  if (!actionPathIsValid(actionPath, dvConfig.actionTree)) {
    res.status(500).send(
      `Invalid action path: ${actionPath}, my actionConfig is ` +
      JSON.stringify(dvConfig.actionTree, undefined, 2));
    return;
  }


  const runId = gatewayRequest.runId;
  console.log(
    'Processing request:' + `to: ${to}, port: ${dstTable[to]}, ` +
    `action path: ${actionPath}, runId: ${runId}` +
    (isDvTx(actionPath) ? `, dvTxId: ${runId}` : 'not part of a tx'));

  const gatewayToClicheRequest = {
    ...gatewayRequest,
    ...{
     url: `http://localhost:${dstTable[to]}`,
     method: req.method,
     body: req.body
    }
  };
  if (!isDvTx(actionPath)) {
    const clicheRes: {status: number, text: string} = await forwardRequest<string>(gatewayToClicheRequest);
    res.status(clicheRes.status);
    res.send(clicheRes.text);
  } else {
    if (!runId) {
      throw new Error('run id undefined');
    }
    await txCoordinator
      .processMessage(runId, actionPath.join('-'), gatewayToClicheRequest, res);
  }
});

/**
 *  Forwards to the cliche the given request.
 **/
async function forwardRequest<T>(gatewayRequest: GatewayToClicheRequest)
  : Promise<{status: number, text: T}> {
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
  const response: request.Response = await clicheReq.end();
  console.log(`Got back ${JSON.stringify(response)}`);
  return {status: response.status, text: JSON.parse(response.text)};
}

// Serve SPA
const distFolder = path.join(process.cwd(), 'dist');
app.use(express.static(distFolder));
app.get('*', ({}, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Listen
const port = config.wsPort;
app.listen(port, () => {
  console.log(`Running gateway on port ${port}`);
  console.log(`Using config ${JSON.stringify(dvConfig, undefined, 2)}`);
  console.log(`Serving ${distFolder}`);
});




/**
 *  Checks that the given `actionPath` corresponds to a valid path according
 *  to `actionConfig`.
 */
function actionPathIsValid(
  actionPath: string[], actionTree: (RootAction | undefined)): boolean {
  // For now, if the action tree is undefined we don't do any validation
  if (!actionTree) {
    return true;
  } else if (_.isEmpty(actionPath)) {
    return false;
  } else if (actionPath[0] !== actionTree.rootName) {
    return false;
  } else if (actionPath.length === 1) {
    return true;
  }

  return _actionPathIsValid(actionPath.slice(1), actionTree);
}

function _actionPathIsValid(actionPath: string[], action: ActionInfo): boolean {
  if (_.isEmpty(action.childActions)) {
    return false;
  }
  const next = actionPath[0];
  if (actionPath.length === 1) {
    return next in action.childActions;
  }

  if (!(next in action.childActions)) {
    return false;
  }
  return _actionPathIsValid(actionPath.slice(1), action.childActions[next]);
}

// returns an array [action_1, action_2, ..., action_n] representing an action
// path from action_1 to action_n where action_n is the action that originated
// the request.
// Note: dv-* actions are included
// In other words, it filters non-dv nodes from `from`
function getActionPath(from: string[], projects: Set<string>): string[]{
  return _.chain(from)
    .map((node) => node.toLowerCase())
    .filter((name) => {
      const project = name.split('-')[0];
      return projects.has(project) || project === 'dv';
    })
    .reverse()
    .value();
}

function isDvTx(actionPath: string[]) {
  return _.includes(actionPath, 'dv-tx');
}

// from: originatingAction-action-....-action
function getDst(thisProject: string, from: string[], projects: Set<string>)
  : string {
  let lastProjectSeen;
  const seenProjects: string[] = [];
  for (const node of from) {
    // if you see dv-include break
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
  return seenProjects.reverse().join('-');
}

function setOfUsedCliches(dvConfig: DvConfig): Set<string>{
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
    _.assign(ret, usedClichesDstTable, {[usedClicheKey]: usedCliche.config.wsPort});
  }
  return ret;
}
