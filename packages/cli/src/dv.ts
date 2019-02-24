#!/usr/bin/env node

import { existsSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
const yargs = require('yargs'); // tslint:disable-line no-var-requires

import { AppCompiler } from '@deja-vu/compiler';

import {
  ACTION_TABLE_FILE_NAME,
  actionTable,
  cmd,
  DvConfig,
  DVCONFIG_FILE_PATH,
  locateClichePackage,
  readFileOrFail,
  startGatewayCmd,
  startServerCmd,
  writeFileOrFail
} from './utils';


const CACHE_DIR = '.dv';

function startServerCmdOfCliche() {
  return startServerCmd(path.join('dist', 'server'), 'config');
}

function startServerCmdOfUsedCliche(
  cliche: string | undefined,
  alias: string
): string {
  const clicheFolder = (cliche === undefined) ? alias : cliche;
  // Cliches specify as a main their typings (so that when apps do `import
  // 'cliche'` it works) . To get to their folder we need to go up a dir
  const serverDistFolder = path
    .join(path.dirname(locateClichePackage(clicheFolder)), '..', 'server');
  const configKey = `usedCliches.${alias}.config`;
  const asFlagValue = (alias !== cliche) ? alias : undefined;

  return startServerCmd(serverDistFolder, configKey, asFlagValue);
}

// tslint:disable no-unused-expression
yargs.commandDir('commands')
  .completion('completion', 'generate the bash completion script')
  .recommendCommands()
  .demandCommand(1, 'You must provide a single command to run')
  .command('serve', 'serve the app', {}, () => {
    console.log('Serving');

    const config: DvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
    if (config.type === 'app') {
      console.log('Serving app');
      AppCompiler.Compile('.', CACHE_DIR);
      process.chdir(CACHE_DIR);
    }
    // Serve everything (including all dep cliches)
    cmd('npm', ['run', `dv-build-${config.name}`]);
    writeFileOrFail(
      path.join('dist', ACTION_TABLE_FILE_NAME),
      actionTable(config, _.get(config.actions, 'app')));
    const startServerOfCurrentProjectCmd =
      (existsSync(path.join('dist', 'server'))) ?
      [ startServerCmdOfCliche() ] : [];
    const startServerCmds = _
      .chain(config.usedCliches)
      .entries()
      .map((e) => startServerCmdOfUsedCliche(e[1].name, e[0]))
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
