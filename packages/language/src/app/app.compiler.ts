import { existsSync, readFileSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';

import * as _ from 'lodash';
import { ActionCompiler } from '../action/action.compiler';
import { SymbolTable } from '../symbolTable';
import { NgAppBuilder } from './builders/ng-app.builder';


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


export class AppCompiler {
  static DVCONFIG_FILE_PATH = 'dvconfig.json';

  private readonly actionCompiler: ActionCompiler = new ActionCompiler();
  private readonly symbolTable: SymbolTable = {};


  /**
   * Compile a Déjà Vu application
   *
   * @param projectDir the directory containing the dv app files. There must be
   *                   a `dvconfig.json` file at the root
   * @param cacheDir directory to use to read and update compiled files
   * @param installDependencies whether to install app dependencies or not
   */
  static Compile(
    projectDir: string, cacheDir: string, installDependencies = true) {
    const compilerForProject = new AppCompiler(
      projectDir, cacheDir, installDependencies);
    compilerForProject.compile();
  }

  private constructor(
    private readonly projectDir: string, private readonly cacheDir: string,
    private readonly installDependencies: boolean) {}

  compile() {
    console.log(`Using cache dir ${this.cacheDir}`);
    const dvConfigPath: string = path
      .join(this.projectDir, AppCompiler.DVCONFIG_FILE_PATH);
    const dvConfigContents: string = readFileSync(dvConfigPath, 'utf8');
    const dvConfig: DvConfig = JSON.parse(dvConfigContents);

    const appName = dvConfig.name;
    this.symbolTable[appName] = { kind: 'app' };
    const aliasToClicheNameMap = _.mapValues(
      dvConfig.usedCliches, (value: ClicheInfo, alias: string) => {
        return {
          kind: 'cliche',
          clicheName: _.get(value, 'name', alias)
        };
      });
    _.extend(this.symbolTable, aliasToClicheNameMap);

    const usedCliches: string[] = _
      .chain(dvConfig.usedCliches)
      .toPairs()
      .map(([clicheAlias, clicheConfig]) =>
        _.get(clicheConfig, 'name', clicheAlias))
      .value();

    const ngAppBuilder = new NgAppBuilder(appName, dvConfigContents);
    _.each(usedCliches, (usedCliche: string) => {
      // TODO: get the current version instead of hard-coding a value
      ngAppBuilder.addDependency(usedCliche, '0.0.1');
    });

    if (dvConfig.routes !== undefined) {
      for (const route of dvConfig.routes) {
        ngAppBuilder.addRoute(route.path, route.action);
      }
    }
    const globalStyleFile = path.join(this.projectDir, 'src', 'styles.css');
    const globalStyle: string = existsSync(globalStyleFile) ?
      readFileSync(globalStyleFile, 'utf8') : '';
    ngAppBuilder.setGlobalStyle(globalStyle);

    const faviconFile = path.join(this.projectDir, 'favicon.ico');
    if (existsSync(faviconFile)) {
      ngAppBuilder.setFavicon(faviconFile);
    }

    const actionsConfig = (dvConfig.actions !== undefined) ?
      dvConfig.actions.app : undefined;
    const htmlFilesToParse = filesToParse(this.projectDir, actionsConfig);
    for (const actionFilePath of htmlFilesToParse) {
      const actionContents = readFileSync(
        path.join(this.projectDir, actionFilePath), 'utf8');
      const compiledAction = this.actionCompiler.compile(
        dvConfig.name, actionContents, this.symbolTable);
      ngAppBuilder.addComponent(
        compiledAction.name, compiledAction.className,
        compiledAction.ngComponent, compiledAction.ngTemplate);
      for (const actionInput of compiledAction.actionInputs) {
        ngAppBuilder.addComponent(
          actionInput.name, actionInput.className,
          actionInput.ngComponent, actionInput.ngTemplate);
      }
    }

    ngAppBuilder.build(this.cacheDir, this.installDependencies);
  }
}
