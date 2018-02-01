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

/** Executes `tsc` synchronously **/
export function tsc(args: string[], cwd?: string): void {
  cmd('tsc', args, cwd);
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

// Assumes cwd is not the project root
export function installAndConfigureGateway(name: string) {
  console.log('Install gateway');
  // npm(['install', '../../dv-gateway'], name);
  npm(['install', 'concurrently', '--save-dev'], name);

  console.log('Initialize dvconfig file');
  writeFileOrFail(
    path.join(name, DVCONFIG_FILE_PATH),
    JSON.stringify({
      name: name,
      watch: true,
      gatewayPort: 3000
    }, undefined, JSON_SPACE)
  );

  console.log('Add npm script to serve');
  updateJsonFile(path.join(name, 'package.json'), pkg => {
    pkg.scripts['dv-start'] = 'todo start no server';
    pkg.scripts['dv-start-watch'] = 'todo watch no server';
    return pkg;
  });
}


program
  .version('0.0.1')
  .command('new <type>', 'create a new app or cliché')
  .command('generate <type>', 'runs a specific generator')
  .command('install <name>', 'install a cliché')
  .command('uninstall <name>', 'uninstall a cliché')
  .command('serve', 'serve the app')
  .command(
    'package', 'package the cliché so that it can be used in other projects')
  .action(cmd => {
    // There seems to be something wrong with commander because if we do
    // `package` with a subcommand it doesn't work unless the user provides args
    if (cmd == 'package') {
      console.log('Packaging cliche');
      npm(['run', NG_PACKAGR.npmScriptKey]);
      console.log('Building server');
      tsc([], SERVER_SRC_FOLDER);
      console.log('Done');
    } else if (cmd == 'serve') {
      console.log('Serving app');
      serve();
    }
  }) 
  .parse(process.argv);


function serve() {
  const dvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  // build-server
  // for each added cliche including the current one we have a start and start
  // and watch npm scripts and here we ran the correct option depending on the
  // configuration
  // dv-serve
  // dv-start
  // dv-start-and-watch
  if (dvConfig.start && dvConfig.watch) {
    // do tsc -p first so that nodemon doesn't crash
    console.log('Build server');
    tsc(['-p', SERVER_SRC_FOLDER]);

    console.log('Serve and watch for source changes');
    // this could be one script
  // ng build -w
  // tsc -p .. -w
  // "\"nodemon -w dist/server dist/server/server.js -- --config ${dvConfig.config}\""
  } else if (dvConfig.start && !dvConfig.watch) {
    // ng build
    // tsc -p
    // could be another one:
    // node dist/server/server.js
  } else if (!dvConfig.start && dvConfig.watch) {
    // ng build -w
  }
  // tsc -p
  // if watch is true
  // ng build -w
  // tsc -p .. -w
  // "\"nodemon -w dist/server dist/server/server.js -- --port 3000\"";
  /*
  'concurrently \"ng build -w\" " +
    `\"tsc -p ${SERVER_SRC_FOLDER} -w\" ` +
    "";*/
  // run gateway
  // gateway has a watch option for local packages and the curr cliche
  // consistent with tsc -w (it watches for changes to usedCliches)
  // better to have gateway and spawner separate
  // port is part of the config
    /*
    "\"nodemon -w dist/server dist/server/server.js -- --port 3000\"";*/
} 
