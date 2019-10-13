#!/usr/bin/env node

import { existsSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
const yargs = require('yargs'); // tslint:disable-line no-var-requires

import { AppCompiler } from '@deja-vu/compiler';

import {
  COMPONENT_TABLE_FILE_NAME,
  componentTable,
  cmd,
  DvConfig,
  DVCONFIG_FILE_PATH,
  locateConceptPackage,
  readFileOrFail,
  startGatewayCmd,
  startServerCmd,
  writeFileOrFail
} from './utils';


const CACHE_DIR = '.dv';

function startServerCmdOfConcept() {
  return startServerCmd(path.join('dist', 'server'), 'config');
}

function startServerCmdOfUsedConcept(
  concept: string | undefined,
  alias: string
): string {
  const conceptFolder = (concept === undefined) ? alias : concept;
  // Concepts specify as a main their typings (so that when apps do `import
  // 'concept'` it works) . To get to their folder we need to go up a dir
  const serverDistFolder = path
    .join(path.dirname(locateConceptPackage(conceptFolder)), '..', 'server');
  const configKey = `usedConcepts.${alias}.config`;
  const asFlagValue = (alias !== concept) ? alias : undefined;

  return startServerCmd(serverDistFolder, configKey, asFlagValue);
}

function calledFromCatalog(): boolean {
  return path.basename(path.dirname(process.cwd())) === 'catalog';
}

function calledFromNgApp(): boolean {
  return path.basename(process.cwd()) === '.dv';
}

// tslint:disable no-unused-expression
yargs.commandDir('commands')
  .completion('completion', 'generate the bash completion script')
  .recommendCommands()
  .demandCommand(1, 'You must provide a single command to run')
  .command('serve', 'serve the app', {}, () => {
    console.log('Serving');
    let config: DvConfig;
    try {
      config = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
    } catch (e) {
      console.error(`Error parsing config file ${e.message}`);
      throw e;
    }
    if (!calledFromCatalog() && !calledFromNgApp()) {
      console.log('Serving app');
      AppCompiler.Compile('.', CACHE_DIR);
      process.chdir(CACHE_DIR);
    }
    if (calledFromNgApp()) {
      console.log('Called from a .dv directory. Serving DV compiled app');
    }
    // Serve everything (including all dep concepts)
    cmd('npm', ['run', `dv-build-${config.name}`]);
    writeFileOrFail(
      path.join('dist', COMPONENT_TABLE_FILE_NAME),
      componentTable(config, _.get(config.components, 'app')));
    const startServerOfCurrentProjectCmd =
      (existsSync(path.join('dist', 'server'))) ?
      [ startServerCmdOfConcept() ] : [];
    const startServerCmds = _
      .chain(config.usedConcepts)
      .entries()
      .map((e) => startServerCmdOfUsedConcept(e[1].name, e[0]))
      .concat(startServerOfCurrentProjectCmd)
      .value();

    const allStartCmds: string[] = _
      .chain(startServerCmds)
      .concat(startGatewayCmd('dvconfig.json'))
      .map((startCmd) => `"${startCmd}"`)
      .value();
    cmd('npm', ['run', 'concurrently', '--', ...allStartCmds]);
  })
  .help()
  .argv;
