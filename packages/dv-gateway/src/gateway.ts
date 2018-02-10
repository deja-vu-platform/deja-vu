import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as minimist from 'minimist';
import { readFileSync } from 'fs';
import * as path from 'path';


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

const app = express();

// Handle API requests
const projects: Set<string> = setOfUsedCliches(dvConfig);
projects.add(dvConfig.name);

app.use('/api', bodyParser.json(), (req, res, next) => {
  if (!req.query.from) {
    res.status(500).send('No from specified');
    return next();
  }
  try {
    const to = getDst(JSON.parse(req.query.from), projects);
    // reject invalid action or forward
    console.log(`to:${to}`);
    return next();
  } catch(e) {
    res.status(500).send(`Malformed 'from': ${e}`);
    return next();
  }
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
    for (const usedUsedClicheKey of this.setOfUsedCliches(
      dvConfig.usedCliches[usedClicheKey])) {
      ret.add(usedUsedClicheKey);
    }
  }
  return ret;
}

  /*
function buildDstTable(dvConfig: DvConfig): {[dst: string]: string} {
  return {};
}*/
