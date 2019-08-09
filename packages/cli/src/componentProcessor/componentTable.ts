import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ComponentAst, getComponentAst } from './componentAst';


export interface ComponentsConfig {
  readonly include?: string[];
  readonly exclude?: string[];
  readonly names?: ComponentNameForFilePath[];
}

export interface ComponentTable {
  [tag: string]: ComponentAst;
}

export interface ComponentNameForFilePath {
  for: string;
  use: string;
}


const DEFAULT = [ '**' ] ;
const IGNORE = [
  'node_modules/**', 'dist/**', 'pkg/**', '**/!(*.html)', '**/index.html' ];


export function getComponentTable(
  projectName: string, rootDirectory: string,
  componentsConfig: ComponentsConfig | undefined,
  // the name of the used cliches (not the aliases)
  usedCliches: ReadonlyArray<string>): ComponentTable {
  const fpToNameMap = _.reduce(
    _.get(componentsConfig, 'names'),
    (fpToNameMapAccumulator, value: ComponentNameForFilePath) => {
      fpToNameMapAccumulator[value.for] = value.use;

      return fpToNameMapAccumulator;
    }, {});

  return _.reduce(
    filesToParse(rootDirectory, componentsConfig),
    (componentTable: ComponentTable, fp: string): ComponentTable => {
      const componentName = _.get(
        fpToNameMap, fp, getComponentNameFromFilePath(fp, projectName));
      componentTable[componentName] = getComponentAst(
        projectName, componentName, usedCliches,
        fs.readFileSync(fp, { encoding: 'utf8' }));

      return componentTable;
    }, {});
}

/**
 *  @returns the component name corresponding to the given file path. It assumes
 *  that the path follows the convention `component-name.something-else.html`
 */
function getComponentNameFromFilePath(fp: string, projectName: string) {
  return projectName + '-' +
    path.basename(fp)
      .split('.')[0];
}

function filesToParse(
  rootDirectory: string, componentsConfig: ComponentsConfig | undefined): string[] {
  const globs = <string[]> _.get(componentsConfig, 'include', DEFAULT);

  return htmlFilesFromGlobs(globs, rootDirectory, componentsConfig);
}

function htmlFilesFromGlobs(
  globs: string[], rootDirectory: string,
  componentsConfig: ComponentsConfig | undefined): string[] {
  const globOptions = {
    cwd: rootDirectory,
    ignore: [ ...IGNORE, ...<string[]> _.get(componentsConfig, 'exclude', []) ],
    nodir: true
  };

  return _.flatMap(globs, (pattern) => glob.sync(pattern, globOptions));
}
