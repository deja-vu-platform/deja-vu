import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ActionsConfig, getActionTable } from './actionProcessor/actionTable';

const INDENT_NUM_SPACES = 2;

/**
 * Executes `ng` synchronously
 */
export function ng(args: string[], cwd?: string): void {
  cmd('ng', args, cwd);
}

/**
 * Executes `npm` synchronously
 */
export function npm(args: string[], cwd?: string): void {
  cmd('npm', args, cwd);
}

export function cmd(cmdS: string, args: string[], cwd?: string): void {
  // Windows users must include `shell: true` for the cli to work
  // TODO: Remove `shell: true` in the future
  const c = spawnSync(cmdS, args, { stdio: 'inherit', cwd: cwd, shell: true });
  if (c.error) {
    throw new Error(`Failed to run "${cmdS}": ${c.error}`);
  }
  if (c.status !== 0) {
    throw new Error(`${cmdS} exited with code ${c.status}`);
  }
}

export function writeFileOrFail(file: string, data: string) {
  writeFileSync(file, data, 'utf8');
}

export function readFileOrFail(file: string): string {
  return readFileSync(file, 'utf8');
}

export const APP_MODULE_PATH = path.join('src', 'app', 'app.module.ts');
export const ENTRY_FILE_PATH = 'public_api.ts';

/**
 * ng-packagr constants
 * https://github.com/dherges/ng-packagr
 */
export const NG_PACKAGR = {
  configFilePath: 'ng-package.json',
  configFileContents: {
    $schema: path
      .join('.', 'node_modules', 'ng-packagr', 'ng-package.schema.json'),
    lib: {
      entryFile: ENTRY_FILE_PATH
    },
    dest: 'pkg'
  },
  npmScriptKey: 'packagr',
  npmScriptValue: 'ng-packagr -p ng-package.json'
};


const NG_CLI_CONFIG_FILE = '.angular-cli.json';
export const ACTION_TABLE_FILE_NAME = 'actionTable.json';
export const DVCONFIG_FILE_PATH = 'dvconfig.json';

/**
 * @return the name of the current project
 */
export function projectName(): string {
  const data = readFileOrFail(NG_CLI_CONFIG_FILE);

  return JSON.parse(data).project.name;
}

/**
 * @return True if the current project is a cliché or False if it's an app
 */
export function isCliche(): boolean {
  return existsSync(NG_PACKAGR.configFilePath);
}

/**
 * @return the path to the module file for the given name
 */
export function modulePath(name: string): string {
  return path.join('.', 'src', 'app', `${name}`, `${name}.module`);
}

export const SERVER_SRC_FOLDER = 'server';
export const SERVER_DIST_FOLDER = path.join('dist', 'server');

// The number of space characters to use as whitespace when writing JSON
export const JSON_SPACE = 2;

export function updateDvConfig(
  updateFn: (dvConfig: DvConfig) => DvConfig): void {
  updateJsonFile(DVCONFIG_FILE_PATH, updateFn);
}

export interface PackageJson {
  peerDependencies?: object;
  dependencies?: object;
  devDependencies?: object;
  scripts?: object;
}

/**
 * Update the package.json file
 *
 * @param updateFn the function to use to apply the update
 * @param dir where to look for a package.json file (defaults to the current
 *            working directory)
 */
export function updatePackage(
  updateFn: (pkg: PackageJson) => PackageJson, dir?: string): void {
  const pkgPath: string = dir ? path.join(dir, 'package.json') : 'package.json';
  updateJsonFile<PackageJson>(pkgPath, updateFn);
}

/**
 * Update a generic JSON file
 *
 * @param pathOfJsonFile the path to the JSON file to update
 * @param updateFn the function to use to apply the update
 */
export function updateJsonFile<T>(
  pathOfJsonFile: string, updateFn: (curr: T) => T): void {
  const obj = JSON.parse(readFileOrFail(pathOfJsonFile));
  const newObj = updateFn(obj);
  writeFileOrFail(
    pathOfJsonFile, JSON.stringify(newObj, undefined, JSON_SPACE));
}

export function startGatewayCmd(configFilePath: string): string {
  return 'node ' + path.join(locatePackage('@dejavu-lang/gateway')) +
    ` --configFilePath ${configFilePath}`;
}

export function startServerCmd(
  watch: boolean, serverDistFolder: string, configKey: string,
  asFlagValue?: string): string {
  const cmdS = watch ? `nodemon -w ${serverDistFolder}` : 'node';
  const eoc = watch ? '--' : '';
  const script = path.join(serverDistFolder, 'server.js');

  return `${cmdS} ${script} ${eoc} --config '\`dv get ${configKey}\`'` +
    (asFlagValue ? ` --as ${asFlagValue}` : '');
}

export function buildFeCmd(watch: boolean, projectFolder?: string): string {
  if (watch) {
    return `chokidar src node_modules -c 'ng build'`;
  }

  return buildCmd('ng build', projectFolder);
}

export function buildServerCmd(watch: boolean, projectFolder?: string): string {
  const cpSchema = 'cp schema.graphql' + path.join('..', 'dist', 'server');
  const maybeWatch = watch ? '-w' : '';

  return buildCmd(`tsc ${maybeWatch} && ${cpSchema}`, projectFolder);
}

function buildCmd(cmdS: string, projectFolder?: string): string {
  return projectFolder ? `(cd ${projectFolder}; ${cmdS})` : cmdS;
}

/*
 * @return the main file of the given package or its folder if it has no 'main'
 */
export function locatePackage(pkg: string) {
  return require.resolve(pkg);
}

export function concurrentlyCmd(...cmds: string[]): string {
  let cmdStr = '';
  for (const c of cmds) {
    cmdStr += ` \"${c}\"`;
  }

  return `concurrently ${cmdStr}`;
}

const PKGS_FOLDER = 'packages';
const GATEWAY_PORT = 3000;
const GATEWAY_FOLDER = path.join(PKGS_FOLDER, '@dejavu-lang/gateway');
export const START_THIS_GATEWAY_CMD = startGatewayCmd(DVCONFIG_FILE_PATH);

const CORE_FOLDER = path.join(PKGS_FOLDER, '@dejavu-lang/core');

// Assumes cwd is not the project root
// All apps and clichés need a gateway even if there are no servers because it
// is what serves the SPA
export function installAndConfigureGateway(name: string, pathToDv: string) {
  console.log('Install gateway and core');
  npm([
    'install', path.join('..', pathToDv, GATEWAY_FOLDER),
    path.join('..', pathToDv, CORE_FOLDER, NG_PACKAGR.configFileContents.dest),
    '--save'
  ], name);
  console.log('Install build-related packages');
  npm(
    ['install', 'concurrently', 'chokidar-cli', 'nodemon', '--save-dev'],
    name
  );

  console.log('Initialize dvconfig file');
  const initialConfig: DvConfig = {
    name: name, gateway: { config: { wsPort: GATEWAY_PORT } }
  };
  writeFileOrFail(
    path.join(name, DVCONFIG_FILE_PATH),
    JSON.stringify(initialConfig, undefined, JSON_SPACE)
  );

  console.log('Add npm script to serve');
  updatePackage((pkg) => {
    pkg.scripts[`dv-start-gateway`] = START_THIS_GATEWAY_CMD;
    pkg.scripts[`dv-build-${name}`] = buildFeCmd(false);
    pkg.scripts[`dv-build-watch-${name}`] = buildFeCmd(true);
    pkg.scripts['concurrently'] = 'concurrently';
    pkg.scripts['tsc'] = 'tsc';

    return pkg;
  }, name);

  // https://github.com/dherges/ng-packagr/issues/335
  ng(['set', 'defaults.build.preserveSymlinks', 'true'], name);
}

export interface DvConfig {
  name?: string;
  type?: 'cliche' | 'app';
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway?: DvConfig;
  usedCliches?: { [as: string]: DvConfig };
  actions?: { package?: ActionsConfig, app?: ActionsConfig };
  routes?: { path: string, action: string }[];
}

export function actionTable(
  config: DvConfig, actionsConfig: ActionsConfig | undefined): string {
  const usedClicheNames = new Set(
    _.map(_.toPairs(config.usedCliches),
      ([alias, usedClicheConfig]: [string, DvConfig]): string => _.get(
        usedClicheConfig, 'name', alias)));
  const gotActionTable = getActionTable(
    config.name, process.cwd(), actionsConfig, Array.from(usedClicheNames));

  return JSON.stringify(gotActionTable, null, INDENT_NUM_SPACES);
}
