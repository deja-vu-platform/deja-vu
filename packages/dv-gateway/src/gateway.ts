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
  childActions?: {[childActionName: string]: ActionInfo};
}

interface RootAction {
  rootName: string;
  childActions?: {[childActionName: string]: ActionInfo};
}

interface DvConfig {
  name: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway: { config: Config };
  usedCliches?: {[as: string]: DvConfig};
  actionTree: RootAction;
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
  if (!argv.configFilePath) {
    throw new Error('No dvconfig given!');
  }
  const dvConfig: DvConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));
  console.log(`Using dv config ${JSON.stringify(dvConfig, undefined, 2)}`);
  if (!dvConfig.actionTree) {
    throw new Error('No action tree given');
  }
  return dvConfig;
}

const dvConfig: DvConfig = getDvConfig();
const config: Config = {...DEFAULT_CONFIG, ...dvConfig.gateway.config};

interface ClicheResponse<T> {
  status: number;
  text: T;
}

function newReqWith(prepend: string, gcr: GatewayToClicheRequest)
  : GatewayToClicheRequest {
  const ret: GatewayToClicheRequest = _.clone(gcr);
  ret.path = prepend + ret.path;
  return ret;
}

const txConfig: TxConfig<
  GatewayToClicheRequest, ClicheResponse<string>, express.Response> = {
  dbHost: config.dbHost,
  dbPort: config.dbPort,
  dbName: config.dbName,
  reinitDbOnStartup: config.reinitDbOnStartup,
  sendCommitToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    return forwardRequest(newReqWith('/commit', gcr))
      .then(unusedResp => undefined);
  },
  sendAbortToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
    return forwardRequest(newReqWith('/abort', gcr))
      .then(unusedResp => undefined);
  },
  sendVoteToCohort: (gcr: GatewayToClicheRequest)
    : Promise<Vote<ClicheResponse<string>>> => {
    return forwardRequest<Vote<string>>(newReqWith('/vote', gcr))
      .then((resp: ClicheResponse<Vote<string>>)
        : Vote<ClicheResponse<string>> => {
        const vote = {
          result: resp.text.result,
          payload: { status: resp.status, text: resp.text.payload }
        };
        console.log('Voted: ' + JSON.stringify(vote))
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
      res!.status(500);
      res!.send('the tx this action is part of aborted');
    }
  },
  sendToClient: (payload: ClicheResponse<string>, res?: express.Response) =>  {
    res!.status(payload.status);
    res!.send(payload.text);
  },
  getCohorts: (actionPathId: string) => {
    const actionPath = idToActionPath(actionPathId);
    const pathToDvTxNode = _.takeWhile(actionPath, a => (a) !== 'dv-tx');
    pathToDvTxNode.push('dv-tx');

    // We know that the action path is a valid one because if otherwise the tx
    // would have never been initiated in the first place
    const dvTxNode = getActionInfo(pathToDvTxNode, dvConfig.actionTree)!;

    const cohorts = _.map(
      _.keys(dvTxNode.childActions), (actionName: string) => actionPathToId(
        [...pathToDvTxNode, actionName]
      ));

    return cohorts;
  },
  onError: (e: Error, gcr: GatewayToClicheRequest, res?: express.Response) => {
    console.error(e);
    res!.status(500);
    res!.send(e.message);
  }
};

const app = express();
const txCoordinator = new TxCoordinator<
  GatewayToClicheRequest, ClicheResponse<string>, express.Response>(txConfig);

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
    (isDvTx(actionPath) ? `, dvTxId: ${runId}` : ' not part of a tx'));

  const gatewayToClicheRequest = {
    ...gatewayRequest,
    ...{
     url: `http://localhost:${dstTable[to]}`,
     method: req.method,
     body: req.body
    }
  };
  if (req.method === 'GET' || !isDvTx(actionPath)) {
    const clicheRes: ClicheResponse<string> = await forwardRequest<string>(
      gatewayToClicheRequest);
    res.status(clicheRes.status);
    res.send(clicheRes.text);
  } else {
    if (!runId) {
      throw new Error('run id undefined');
    }
    await txCoordinator.processMessage(
        runId, actionPathToId(actionPath), gatewayToClicheRequest, res);
  }
});


const ACTION_PATH_SEP = ':';

function actionPathToId(actionPath: string[]): string {
  return actionPath.join(ACTION_PATH_SEP);
}

function idToActionPath(id: string): string[] {
  return id.split(ACTION_PATH_SEP);
}

/**
 *  Forwards to the cliche the given request.
 **/
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
  const response: request.Response = await clicheReq;
  console.log(`Got back ${JSON.stringify(response)}`);
  return { status: response.status, text: JSON.parse(response.text) };
}

// Serve SPA
const distFolder = path.join(process.cwd(), 'dist');
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
      console.log(`Using config ${JSON.stringify(dvConfig, undefined, 2)}`);
      console.log(`Serving ${distFolder}`);
    });
  });


/**
 *  Checks that the given `actionPath` corresponds to a valid path according
 *  to `actionConfig`.
 */
function actionPathIsValid(
  actionPath: string[], actionTree: RootAction): boolean {
  return !!getActionInfo(actionPath, actionTree);
}

/**
 * Returns the ActionInfo corresponding to the last node of the action path or
 * undefined if none is found
 **/
function getActionInfo(
  actionPath: string[], actionTree: RootAction): ActionInfo | undefined {
  if (_.isEmpty(actionPath) || actionPath[0] !== actionTree.rootName) {
    return;
  } else if (actionPath.length === 1) {
    return actionTree;
  }

  return _getActionInfo(actionPath.slice(1), actionTree);
}

function _getActionInfo(actionPath: string[], action: ActionInfo)
  : ActionInfo | undefined {
  if (_.isEmpty(action.childActions)) {
    return;
  }
  const next = actionPath[0];
  if (actionPath.length === 1) {
    if (_.has(action.childActions, next)) {
      return action.childActions![next];
    } else {
      return;
    }
  }

  if (!_.has(action.childActions, next)) {
    return;
  }
  return _getActionInfo(actionPath.slice(1), action.childActions![next]);
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
