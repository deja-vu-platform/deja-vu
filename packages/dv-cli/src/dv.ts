#!/usr/bin/env node
import * as program from 'commander';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';


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

program
  .version('0.0.1')
  .command('new <type>', 'create a new app, cliché, or action')
  .command('install <name>', 'install a cliché')
  .command('uninstall <name>', 'uninstall a cliché')
  .command(
    'package', 'package the cliché so that it can be used in other projects')
  .action(cmd => {
    // There seems to be something wrong with commander because if we do
    // `package` with a subcommand it doesn't work unless the user provides args
    if (cmd == 'package') {
      console.log('Packaging cliche');
      npm(['run', NG_PACKAGR.npmScriptKey]);
    }
  }) 
  .parse(process.argv);
