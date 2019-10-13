import { spawnSync, SpawnSyncOptions } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ComponentsConfig, getComponentTable } from './componentProcessor/componentTable';

export const COMPONENT_TABLE_FILE_NAME = 'componentTable.json';
export const DVCONFIG_FILE_PATH = 'dvconfig.json';
export const DV_PACKAGE_PREFIX = '@deja-vu';
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
      entryFile: 'public_api.ts'
    },
    dest: 'pkg'
  },
  npmScriptValue: 'ng-packagr -p ng-package.json'
};

const INDENT_NUM_SPACES = 2;
const NG_CLI_CONFIG_FILE = '.angular-cli.json';
const PKGS_FOLDER = 'packages';

/**
 * Executes `ng` synchronously
 */
export function ng(args: string[], cwd?: string): void {
  cmd('ng', args, { cwd });
}

/**
 * Executes `yarn` synchronously
 */
export function yarn(args: string[], cwd?: string): void {
  cmd('yarn', args, { cwd });
}

/**
 * Wrapper for child_process.spawnSync which adds error handling
 * and support for Windows
 */
export function cmd(
  command: string,
  args?: string[],
  options?: SpawnSyncOptions
): void {
  // Windows users must include `shell: true` for the cli to work
  // TODO: Remove `shell: true` in the future
  options = { stdio: 'inherit', shell: true, ...options };
  const c = spawnSync(command, args, options);
  if (c.error) {
    throw new Error(`Failed to run "${command}": ${c.error}`);
  }
  if (c.status !== 0) {
    throw new Error(`${command} exited with code ${c.status}`);
  }
}

export function writeFileOrFail(file: string, data: string) {
  writeFileSync(file, data, 'utf8');
}

export function readFileOrFail(file: string): string {
  return readFileSync(file, 'utf8');
}

export function isInNgProjectRoot(): boolean {
  return existsSync(NG_CLI_CONFIG_FILE);
}

/**
 * @return the name of the current project
 */
export function projectName(): string {
  const data = readFileOrFail(NG_CLI_CONFIG_FILE);

  return JSON.parse(data).project.name;
}

/**
 * @return the path to the module file for the given name
 */
export function modulePath(name: string): string {
  return path.join('.', 'src', 'app', `${name}`, `${name}.module`);
}

/**
 * @return the path to the metadata file for the given name
 */
export function metadataPath(name: string): string {
  return path.join('.', 'src', 'app', `${name}`, `${name}.metadata`);
}

/**
 * @param  pathToDv path to the root of the dv monorepo
 * @return the path to the dv schematics
 */
export function getSchematicsPath(pathToDv: string): string {
  return path.join(pathToDv, PKGS_FOLDER, 'schematics');
}

export function startGatewayCmd(configFilePath: string): string {
  return 'node ' + path.join(locatePackage('@deja-vu/gateway')) +
    ` --configFilePath ${configFilePath}`;
}

export function startServerCmd(
  serverDistFolder: string, configKey: string, asFlagValue?: string): string {
  const script = path.join(serverDistFolder, 'server.js');

  return `node ${script} --config '\`dv get ${configKey}\`'` +
    (asFlagValue ? ` --as ${asFlagValue}` : '');
}

export function buildFeCmd(projectFolder?: string): string {
  return buildCmd('ng build', projectFolder);
}

export function buildServerCmd(projectFolder?: string): string {
  const serverPkg = path.join('.', 'pkg', 'server');
  const cpSchema = 'cp server/schema.graphql' + serverPkg;

  return buildCmd(
    `tsc -p server --outDir ${serverPkg} && ${cpSchema}`, projectFolder);
}

function buildCmd(cmdS: string, projectFolder?: string): string {
  return projectFolder ? `(cd ${projectFolder}; ${cmdS})` : cmdS;
}

/*
 * @return the main file of the given package or its folder if it has no 'main'
 */
export function locatePackage(pkg: string) {
  const paths = require.resolve.paths(pkg);
  paths.push(path.join(process.cwd(), '.dv', 'node_modules'));

  return require.resolve(pkg, { paths: paths });
}

export function locateConceptPackage(pkg: string) {
  return locatePackage(`@deja-vu/${pkg}`);
}

export function getDvPackageName(name: string) {
  return `${DV_PACKAGE_PREFIX}/${name}`;
}

export function concurrentlyCmd(...cmds: string[]): string {
  let cmdStr = '';
  for (const c of cmds) {
    cmdStr += ` \"${c}\"`;
  }

  return `concurrently ${cmdStr}`;
}

export interface DvConfig {
  name?: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway?: DvConfig;
  usedConcepts?: { [as: string]: DvConfig };
  components?: { package?: ComponentsConfig, app?: ComponentsConfig };
  routes?: { path: string, component: string }[];
}

export function componentTable(
  config: DvConfig, componentsConfig: ComponentsConfig | undefined): string {
  const usedConceptNames = new Set(
    _.map(_.toPairs(config.usedConcepts),
      ([alias, usedConceptConfig]: [string, DvConfig]): string => _.get(
        usedConceptConfig, 'name', alias)));
  const gotComponentTable = getComponentTable(
    config.name, process.cwd(), componentsConfig, Array.from(usedConceptNames));

  return JSON.stringify(gotComponentTable, null, INDENT_NUM_SPACES);
}
