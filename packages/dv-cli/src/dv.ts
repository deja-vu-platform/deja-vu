#!/usr/bin/env node
import * as program from 'commander';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';
import * as _ from 'lodash';


/** Executes `ng` synchronously **/
export function ng(args: string[], cwd?: string): void {
  cmd('ng', args, cwd);
}

/** Executes `npm` synchronously **/
export function npm(args: string[], cwd?: string): void {
  cmd('npm', args, cwd);
}

function cmd(cmd: string, args: string[], cwd?: string): void {
  const c = spawnSync(cmd, args, { stdio: 'inherit', cwd: cwd });
  if (c.error) {
    throw new Error(`Failed to run "${cmd}": ${c.error}`);
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

export const APP_MODULE_PATH = path.join('src', 'app', 'app.module.ts');
export const ENTRY_FILE_PATH = 'public_api.ts';

/**
 * ng-packagr constants
 * https://github.com/dherges/ng-packagr
 **/
export const NG_PACKAGR = {
  configFilePath: 'ng-package.json',
  configFileContents: {
    '$schema': path.join('.', 'node_modules', 'ng-packagr', 'ng-package.schema.json'),
    'lib': {
      'entryFile': ENTRY_FILE_PATH
    },
    'dest': 'pkg'
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

export function updatePackage(
  updateFn: (pkg: any) => any, dir?: string): void {
  const pkgPath: string = dir ? path.join(dir, 'package.json') : 'package.json';
  updateJsonFile(pkgPath, updateFn);
}

export function updateJsonFile(
  path: string, updateFn: (curr: any) => any): void {
  const obj = JSON.parse(readFileOrFail(path));
  const newObj = updateFn(obj);
  writeFileOrFail(path, JSON.stringify(newObj, undefined, JSON_SPACE));
}

export function startGatewayCmd(configFilePath: string): string {
  return 'node ' + path.join('node_modules', 'dv-gateway', 'dist', 'gateway.js') +
    ` --configFilePath ${configFilePath}`;
}

export function startServerCmd(
  watch: boolean, serverDistFolder: string, configKey: string,
  asFlagValue?: string): string {
  const cmd = watch ? `nodemon -w ${serverDistFolder}` : 'node';
  const eoc = watch ? '--' : '';
  const script = path.join(serverDistFolder, 'server.js');
  return `if [ -f ${script} ]; then ${cmd} ${script}` +
    ` ${eoc} --config \"\`dv get ${configKey}\`\"` +
    (asFlagValue ? `--as ${asFlagValue}` : '') + '; ' +
    'else echo "No file"; fi;';
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

function buildCmd(cmd: string, projectFolder?: string): string {
  return projectFolder ? `(cd ${projectFolder}; ${cmd})` : cmd;
}

export function concurrentlyCmd(...cmds: string[]): string {
  let cmdStr = '';
  for (const cmd of cmds) {
    cmdStr += ` \"${cmd}\"`;
  }
  return `concurrently ${cmdStr}`;
}

const PKGS_FOLDER = 'packages';
const GATEWAY_PORT = 3000;
const GATEWAY_FOLDER = path.join(PKGS_FOLDER, 'dv-gateway');
export const START_THIS_GATEWAY_CMD = startGatewayCmd(DVCONFIG_FILE_PATH);

const CORE_FOLDER = path.join(PKGS_FOLDER, 'dv-core');

// Assumes cwd is not the project root
// All apps and clichés need a gateway even if there are no servers because it
// is what serves the SPA
export function installAndConfigureGateway(name: string, pathToDv: string) {
  console.log('Install gateway and dv-core');
  npm([
    'install', path.join('..', pathToDv, GATEWAY_FOLDER),
    path.join('..', pathToDv, CORE_FOLDER, NG_PACKAGR.configFileContents.dest),
    '--save'
  ], name);
  console.log('Install build-related packages');
  npm(['install', 'concurrently', 'chokidar-cli', 'nodemon', '--save-dev'], name);

  console.log('Initialize dvconfig file');
  const initialConfig: DvConfig = {
    name: name, gateway: { name: "gateway", config: { wsPort: GATEWAY_PORT } }
  };
  writeFileOrFail(
    path.join(name, DVCONFIG_FILE_PATH),
    JSON.stringify(initialConfig, undefined, JSON_SPACE)
  );

  console.log('Add npm script to serve');
  updateJsonFile(path.join(name, 'package.json'), pkg => {
    pkg.scripts[`dv-start-gateway`] = START_THIS_GATEWAY_CMD;
    pkg.scripts[`dv-build-${name}`] = buildFeCmd(false);
    pkg.scripts[`dv-build-watch-${name}`] = buildFeCmd(true);
    pkg.scripts['concurrently'] = 'concurrently';
    pkg.scripts['tsc'] = 'tsc';
    return pkg;
  });

  // https://github.com/dherges/ng-packagr/issues/335
  ng(['set', 'defaults.build.preserveSymlinks', 'true'], name);
}

export interface DvConfig {
  name: string;
  startServer?: boolean;
  watch?: boolean;
  config?: any;
  gateway?: DvConfig;
  usedCliches?: { [as: string]: DvConfig };
}

program
  .version('0.0.1')
  .command('new <type>', 'create a new app or cliché')
  .command('generate <type>', 'runs a specific generator')
  .command('install <name>', 'install a cliché')
  .command('uninstall <name>', 'uninstall a cliché')
  .command('get <key>', 'get a value from the configuration')
  .command('package', 'package a cliche')
  .command('serve', 'serve the app')
  .command(
    'package', 'package the cliché so that it can be used in other projects')
  .action(subcmd => {
    // There seems to be something wrong with commander because if we do
    // `package` with a subcommand it doesn't work unless the user provides args
    if (subcmd == 'package') {
      console.log('Packaging cliche');
      const clicheName: string = JSON
        .parse(readFileOrFail(DVCONFIG_FILE_PATH)).name;
      npm(['run', `dv-package-${clicheName}`]);


      updatePackage(pkg => {
        pkg.peerDependencies['dv-gateway'] = 'file:' +
          path.join('..', pkg.peerDependencies['dv-gateway'].slice('file:'.length));
        return pkg;
      }, NG_PACKAGR.configFileContents.dest);
      console.log('Done');
      process.exit(0); // commander sucks
    } else if (subcmd == 'serve') {
      const config: DvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
      console.log('Serving app');
      // for now, serve everything (including all dep cliches)

      const currentProject = _
        .pick(config, ['name', 'startServer', 'watch', 'config']);

      const clichesToWatch: string[] = _
        .chain(config.usedCliches)
        .entries()
        .filter(e => e[1].watch)
        .map(e => e[0])
        .value();

      console.log('Build everything');
      const pkgScripts: string[] = _.map(
        clichesToWatch, clicheName => `dv-package-${clicheName}`);
      if (pkgScripts.length > 1) {
        cmd('npm', [
          'run', 'concurrently', '--',
          ..._.map(pkgScripts, pkgScript => `"npm run ${pkgScript}"`)]);
      } else if (pkgScripts.length == 1) {
        cmd('npm', ['run', pkgScripts[0]]);
      }
      cmd('npm', ['run', `dv-build-${config.name}`]);

      console.log('Start build and serve watchers');
      const buildWatchCmds = _
        .chain(clichesToWatch)
        .map(clicheName => `npm run dv-package-watch-${clicheName}`)
        .concat(`npm run dv-build-watch-${config.name}`)
        .value();
      const reinstallWatchCmds = _
        .chain(clichesToWatch)
        .map(clicheName => `npm run dv-reinstall-watch-${clicheName}`)
        .value();

      const buildStartServerCmd = (name: string, watch?: boolean) => {
        return 'npm run dv-start' + (watch ? '-watch' : '') + `-${name}`;
      };
      const startServerOfCurrentProjectCmd = buildStartServerCmd(
        currentProject.name, currentProject.watch);
      const startServerCmds = _
        .chain(config.usedCliches)
        .entries()
        .filter(e => e[1].startServer)
        .map(e => buildStartServerCmd(e[0], e[1].watch))
        .concat(startServerOfCurrentProjectCmd)
        .value();

      const allBuildAndWatchCmds: string[] = _
        .chain(buildWatchCmds)
        .concat(reinstallWatchCmds)
        .concat(startServerCmds)
        .concat('npm run dv-start-gateway')
        .map(cmd => `"${cmd}"`)
        .value();
      cmd('npm', ['run', 'concurrently', '--', ...allBuildAndWatchCmds]);

      process.exit(0); // commander sucks
    }
  })
  .parse(process.argv);
