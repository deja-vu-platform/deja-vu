#!/usr/bin/env node
import * as program from 'commander';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';


/** Executes `ng` synchronously **/
export function ng(args: string[], cwd?: string): void {
  cmd('ng', args, cwd);
}

/** Executes `npm` synchronously **/
export function npm(args: string[], cwd?: string): void {
  cmd('npm', args, cwd);
}

function cmd(cmd: string, args: string[], cwd?: string): void {
  const c = spawnSync(cmd, args, {stdio: 'inherit', cwd: cwd});
  if (c.error) {
    throw new Error(`Failed to run ${cmd}: ${c.error}`);
  }
  if (c.status !== 0) {
    throw new Error(`${cmd} exited with code ${c.status}`);
  }
}

export function writeFileOrFail(file: string, data: string) {
  writeFileSync(file, data, 'utf8');
}

export function readFileOrFail(file: string): string {
  return readFileSync(file, 'utf8');
}

export const ENTRY_FILE_PATH = 'public_api.ts';

/**
 * ng-packagr constants
 * https://github.com/dherges/ng-packagr
 **/
export const NG_PACKAGR = {
  configFilePath: 'ng-package.json',
  configFileContents:  {
    '$schema': './node_modules/ng-packagr/ng-package.schema.json',
    'lib': {
      'entryFile': ENTRY_FILE_PATH
    }
  },
  npmScriptKey: 'packagr',
  npmScriptValue: 'ng-packagr -p ng-package.json'
};


const NG_CLI_CONFIG_FILE = '.angular-cli.json';
export const DVCONFIG_FILE_PATH = 'dvconfig.json';

/**
 * @return the name of the current project
 **/
export function projectName(): string {
  const data = readFileOrFail(NG_CLI_CONFIG_FILE);
  return JSON.parse(data).project.name;
}

/**
 * @return True if the current project is a cliché or False if it's an app
 **/
export function isCliche(): boolean {
  return existsSync(NG_PACKAGR.configFilePath);
}

/**
 * @return the path to the module file for the given name
 */
export function modulePath(name: string): string {
  return `./src/app/${name}/${name}.module`;
}

export const SERVER_SRC_FOLDER = 'server';
export const SERVER_DIST_FOLDER = path.join('dist', 'server');

// The number of space characters to use as whitespace when writing JSON
export const JSON_SPACE = 2;

export function updateDvConfig(updateFn: (dvConfig: any) => any): void {
  updateJsonFile(DVCONFIG_FILE_PATH, updateFn);
}

export function updatePackage(updateFn: (pkg: any) => any): void {
  updateJsonFile('package.json', updateFn);
}

export function updateJsonFile(
  path: string, updateFn: (curr: any) => any): void {
  const obj = JSON.parse(readFileOrFail(path));
  const newObj = updateFn(obj);
  writeFileOrFail(path, JSON.stringify(newObj, undefined, JSON_SPACE));
}

export function startGatewayCmd(configFilePath: string): string {
  return 'node node_modules/dv-gateway/dist/gateway.js' +
    ` --configFilePath ${configFilePath}`;
}

export function startServerCmd(
  watch: boolean, serverDistFolder: string, configKey: string,
  asFlagValue?: string): string {
  let cmd = watch ? `nodedemon -w ${serverDistFolder}`: 'node';
  return `${cmd} ${serverDistFolder}/server.js` +
    ` --config \`dv get ${configKey}\`` +
      (asFlagValue ? `--as ${asFlagValue}` : '');
}

export function buildFeCmd(watch: boolean, projectFolder?: string): string {
  return buildCmd(watch, 'ng build', projectFolder);
}

export function buildServerCmd(watch: boolean, projectFolder?: string): string {
  return buildCmd(watch, 'tsc', projectFolder);
}

function buildCmd(watch: boolean, cmd: string, projectFolder?: string): string {
  let ret = cmd + (watch ? ' -w' : '');
  if (projectFolder) {
    ret = `(cd ${projectFolder}; ${ret})`;
  }
  return ret;
}

export function concurrentlyCmd(...cmds: string[]): string {
  let cmdStr = '';
  for (const cmd of cmds) {
    cmdStr += ` \"${cmd}\"`;
  }
  return `concurrently ${cmdStr}`;
}

const GATEWAY_PORT = 3000;
export const START_THIS_GATEWAY_CMD = startGatewayCmd(DVCONFIG_FILE_PATH);

// Assumes cwd is not the project root
// All apps and clichés need a gateway even if there are no servers because it
// is what serves the SPA
export function installAndConfigureGateway(
  name: string, pathToGateway: string) {
  console.log('Install gateway');
  npm(['install', '../' + pathToGateway, '--save'], name);
  npm(['install', 'concurrently', '--save-dev'], name);

  console.log('Initialize dvconfig file');
  writeFileOrFail(
    path.join(name, DVCONFIG_FILE_PATH),
    JSON.stringify({
      name: name,
      watch: true,
      gatewayPort: GATEWAY_PORT
    }, undefined, JSON_SPACE)
  );

  console.log('Add npm script to serve');
  updateJsonFile(path.join(name, 'package.json'), pkg => {
    pkg.scripts[`dv-start-gateway`] = START_THIS_GATEWAY_CMD;
    pkg.scripts[`dv-build-${name}`] = buildFeCmd(false);
    pkg.scripts[`dv-build-watch-${name}`] = buildFeCmd(true);
    return pkg;
  });
}


program
  .version('0.0.1')
  .command('new <type>', 'create a new app or cliché')
  .command('generate <type>', 'runs a specific generator')
  .command('install <name>', 'install a cliché')
  .command('uninstall <name>', 'uninstall a cliché')
  .command('get <key>', 'get a value from the configuration')
  .command('serve', 'serve the app')
  .command(
    'package', 'package the cliché so that it can be used in other projects')
  .action(cmd => {
    const config = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));

    // There seems to be something wrong with commander because if we do
    // `package` with a subcommand it doesn't work unless the user provides args
    if (cmd == 'package') {
      console.log('Packaging cliche');
      npm(['run', NG_PACKAGR.npmScriptKey]);
      npm(['run', 'dv-build-cl']);
      console.log('Done');
    } else if (cmd == 'serve') {
      console.log('Serving app');
      // for now, serve everything (including all dep cliches)
      for (const c in config.usedCliches) {
        // spawn npm run dv-build-watch-c
        // spawn npm run dv-start-watch-c
      }
      // span dv-build-watch-name
      // span dv-start-watch-name
    } 
  }) 
  .parse(process.argv);
