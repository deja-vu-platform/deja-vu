import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as minimist from 'minimist';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'superagent';


interface DvConfig {
  name: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gatewayPort?: number;
  usedCliches?: {[as: string]: DvConfig};
}

// Get DvConfig
const argv = minimist(process.argv);
const configFilePath = argv.configFilePath;
const dvConfig: DvConfig = JSON.parse(readFileSync(configFilePath, 'utf8'));
console.log(`Using dv config ${JSON.stringify(dvConfig, undefined, 2)}`);

const app = express();

// Handle API requests
const projects: Set<string> = setOfUsedCliches(dvConfig);
projects.add(dvConfig.name);

let dstTable = buildDstTable(dvConfig);
dstTable = _.mapKeys(dstTable, (unusedValue, k) => `${dvConfig.name}-${k}`);
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
  path?: string;
  options?: RequestOptions;
}

app.use('/api', bodyParser.json(), (req, res, next) => {
  const gatewayRequest: GatewayRequest = {
    from: JSON.parse(req.query.from),
    path: req.query.path,
    options: req.query.options ? JSON.parse(req.query.options) : undefined
  };
  if (!req.query.from) {
    res.status(500).send('No from specified');
    return next();
  }
  console.log(
    `Req from ${gatewayRequest.from} projects is ` +
    JSON.stringify(Array.from(projects.values())));
  const to = getDst(gatewayRequest.from, projects);
  if (!(to in dstTable)) {
    res.status(500).send(`Invalid to: ${to}`);
    return next();
  }
  console.log(`to:${to}, port: ${dstTable[to]}`);
  let url = `http://localhost:${dstTable[to]}`;
  if (gatewayRequest.path) {
    url += gatewayRequest.path;
  }
  let clicheReq = request(req.method, url);
  if (gatewayRequest.options) {
    if (gatewayRequest.options.params) {
      clicheReq = clicheReq.query(gatewayRequest.options.params);
    }
    if (gatewayRequest.options.headers) {
      clicheReq = clicheReq.set(gatewayRequest.options.headers);
    }
  }
  clicheReq.send(req.body);
  clicheReq.end((clicheErr, clicheRes) => {
    if (clicheErr) {
      console.log(`Got back ${JSON.stringify(clicheErr)}`);
      const send = clicheErr.text ? clicheErr.text : clicheErr.response.text;
      res.status(clicheErr.status).send(send);
    } else {
      console.log(`Got back ${JSON.stringify(clicheRes)}`);
      const send = clicheRes.text ? clicheRes.text : clicheErr.response.text;
      res.status(clicheRes.status).send(send);
    }
    next();
  });
});

// Serve SPA
const distFolder = path.join(process.cwd(), 'dist');
app.use(express.static(distFolder));
app.get('*', ({}, res) => {
  res.sendFile(path.join(distFolder, 'index.html'));
});

// Listen
const port = dvConfig.gatewayPort;
app.listen(port, () => {
  console.log(`Running gateway on port ${port}`);
  console.log(`Using config ${JSON.stringify(dvConfig, undefined, 2)}`);
  console.log(`Serving ${distFolder}`);
});


// Utility functions

// from: originatingAction-action-....-action
function getDst(from: string[], projects: Set<string>): string {
  let lastProjectSeen;
  const seenProjects: string[] = [];
  for (const node of from) {
    const name = node.toLowerCase();
    const project = name.split('-')[0];
    if (projects.has(project) && lastProjectSeen != project) {
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
