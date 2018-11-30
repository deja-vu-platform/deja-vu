import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ActionAst, getActionAst } from './actionAst';


export interface ActionsConfig {
  readonly include?: string[];
  readonly exclude?: string[];
  readonly names?: ActionNameForFilePath[];
}

export interface ActionTable {
  [tag: string]: ActionAst;
}

export interface ActionNameForFilePath {
  for: string;
  use: string;
}


const DEFAULT = [ '**' ] ;
const IGNORE = [
  'node_modules/**', 'dist/**', 'pkg/**', '**/!(*.html)', '**/index.html' ];


export function getActionTable(
  projectName: string, rootDirectory: string,
  actionsConfig: ActionsConfig | undefined,
  // the name of the used cliches (not the aliases)
  usedCliches: ReadonlyArray<string>): ActionTable {
  const fpToNameMap = _.reduce(
    _.get(actionsConfig, 'names'),
    (fpToNameMapAccumulator, value: ActionNameForFilePath) => {
      fpToNameMapAccumulator[value.for] = value.use;

      return fpToNameMapAccumulator;
    }, {});

  return _.reduce(
    filesToParse(rootDirectory, actionsConfig),
    (actionTable: ActionTable, fp: string): ActionTable => {
      const actionName = _.get(
        fpToNameMap, fp, getActionNameFromFilePath(fp, projectName));
      actionTable[actionName] = getActionAst(
        projectName, actionName, usedCliches,
        fs.readFileSync(fp, { encoding: 'utf8' }));

      return actionTable;
    }, {});
}

/**
 *  @returns the action name corresponding to the given file path. It assumes
 *  that the path follows the convention `action-name.something-else.html`
 */
function getActionNameFromFilePath(fp: string, projectName: string) {
  return projectName + '-' +
    path.basename(fp)
      .split('.')[0];
}

function filesToParse(
  rootDirectory: string, actionsConfig: ActionsConfig | undefined): string[] {
  const globs = <string[]> _.get(actionsConfig, 'include', DEFAULT);

  return htmlFilesFromGlobs(globs, rootDirectory, actionsConfig);
}

function htmlFilesFromGlobs(
  globs: string[], rootDirectory: string,
  actionsConfig: ActionsConfig | undefined): string[] {
  const globOptions = {
    cwd: rootDirectory,
    ignore: [ ...IGNORE, ...<string[]> _.get(actionsConfig, 'exclude', []) ],
    nodir: true
  };

  return _.flatMap(globs, (pattern) => glob.sync(pattern, globOptions));
}
