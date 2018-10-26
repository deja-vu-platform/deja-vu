import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';
import * as glob from 'glob';

import * as _ from 'lodash';
import { SymbolTable } from './symbolTable';
import { ActionCompiler } from './actionCompiler';


interface DvConfig {
  name: string;
  config?: any;
  gateway?: { config?: any };
  usedCliches?: { [as: string]: ClicheInfo };
  actions?: { app?: ActionsConfig };
  routes?: { path: string, action: string }[];
}

interface ActionsConfig {
  readonly include?: string[];
  readonly exclude?: string[];
}

interface ClicheInfo {
  name?: string;
  config?: any;
}

// consistent with the functions in the cli
// TODO: find a way to reuse?

const DEFAULT = [ '**' ] ;
const IGNORE = [
  'node_modules/**', 'dist/**', 'pkg/**', '**/!(*.html)', '**/index.html' ];

function filesToParse(
  rootDirectory: string, actionsConfig: ActionsConfig | undefined): string[] {
  const globs = _.get(actionsConfig, 'include', DEFAULT);

  return htmlFilesFromGlobs(globs, rootDirectory, actionsConfig);
}

function htmlFilesFromGlobs(
  globs: string[], rootDirectory: string,
  actionsConfig: ActionsConfig | undefined): string[] {
  const globOptions = {
    cwd: rootDirectory,
    ignore: [ ...IGNORE, ..._.get(actionsConfig, 'exclude', []) ],
    nodir: true
  };

  return _.flatMap(globs, (pattern) => glob.sync(pattern, globOptions));
}


export class DvCompiler {
  static DVCONFIG_FILE_PATH = 'dvconfig.json';

  private readonly actionCompiler: ActionCompiler = new ActionCompiler();
  private readonly symbolTable: SymbolTable;


  /**
   * Compile a Déjà Vu application
   *
   * @param projectDir the directory containing the dv app files. There must be
   *                   a `dvconfig.json` file at the root
   * @param cacheDir directory to use read and update compiled files
   */
  static Compile(projectDir: string, cacheDir: string) {
    const compilerForProject = new DvCompiler(projectDir, cacheDir);
    compilerForProject.compile();
  }

  private constructor(
    private readonly projectDir: string, private readonly cacheDir: string) {}

  compile() {
    const dvConfigPath: string = path
      .join(this.projectDir, DvCompiler.DVCONFIG_FILE_PATH);
    const dvConfigContents: string = readFileSync(dvConfigPath, 'utf8');
    const dvConfig: DvConfig = JSON.parse(dvConfigContents);

    this.symbolTable[dvConfig.name] = { kind: 'app' };
    const aliasToClicheNameMap = _.mapValues(
      dvConfig.usedCliches, (value: ClicheInfo, alias: string) => {
        return {
          kind: 'cliche',
          clicheName: _.get(value, 'name', alias)
        };
      });
    _.extend(this.symbolTable, aliasToClicheNameMap);

    const htmlFilesToParse = filesToParse(
      this.projectDir, dvConfig.actions.app);
    for (const actionFilePath of htmlFilesToParse) {
      const actionContents = readFileSync(actionFilePath, 'utf8');
      this.actionCompiler.compile(
        dvConfig.name, actionContents, this.symbolTable);
    }
  }
}
