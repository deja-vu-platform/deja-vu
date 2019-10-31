import { existsSync, readFileSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';

import * as _ from 'lodash';
import { ComponentCompiler } from '../component/component.compiler';
import { SymbolTable } from '../symbolTable';
import { NgAppBuilder } from './builders/ng-app.builder';


interface DvConfig {
  name: string;
  config?: any;
  gateway?: { config?: any };
  usedConcepts?: { [as: string]: ConceptInfo };
  components?: { app?: ComponentsConfig };
  routes?: { path: string, component: string }[];
}

interface ComponentsConfig {
  readonly include?: string[];
  readonly exclude?: string[];
}

interface ConceptInfo {
  name?: string;
  config?: any;
}

// consistent with the functions in the cli
// TODO: find a way to reuse?

const DEFAULT = [ '**' ] ;
const IGNORE = [
  'node_modules/**', 'dist/**', 'pkg/**', '**/!(*.html)', '**/index.html' ];

function filesToParse(
  rootDirectory: string,
  componentsConfig: ComponentsConfig | undefined): string[] {
  const globs = _.get(componentsConfig, 'include', DEFAULT);

  return htmlFilesFromGlobs(globs, rootDirectory, componentsConfig);
}

function htmlFilesFromGlobs(
  globs: string[], rootDirectory: string,
  componentsConfig: ComponentsConfig | undefined): string[] {
  const globOptions = {
    cwd: rootDirectory,
    ignore: [ ...IGNORE, ..._.get(componentsConfig, 'exclude', []) ],
    nodir: true
  };

  return _.flatMap(globs, (pattern) => glob.sync(pattern, globOptions));
}


export class AppCompiler {
  static DVCONFIG_FILE_PATH = 'dvconfig.json';

  private readonly componentCompiler = new ComponentCompiler();
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
    const aliasToConceptNameMap = _.mapValues(
      dvConfig.usedConcepts, (value: ConceptInfo, alias: string) => {
        return {
          kind: 'concept',
          conceptName: _.get(value, 'name', alias)
        };
      });
    _.extend(this.symbolTable, aliasToConceptNameMap);

    const usedConcepts: string[] = _
      .chain(dvConfig.usedConcepts)
      .toPairs()
      .map(([conceptAlias, conceptConfig]) =>
        _.get(conceptConfig, 'name', conceptAlias))
      .uniq()
      .value();

    const ngAppBuilder = new NgAppBuilder(appName, dvConfigContents);
    _.each(usedConcepts, (usedConcept: string) => {
      // TODO: get the current version instead of hard-coding a value
      ngAppBuilder.addDependency(usedConcept, '0.0.1');
    });

    if (dvConfig.routes !== undefined) {
      for (const route of dvConfig.routes) {
        const selector = `${appName}-${route.component}`;
        ngAppBuilder.addRoute(route.path, selector);
      }
    }

    const globalStyleFileScss = path.join(this.projectDir, 'src', 'styles.scss');
    const globalStyleScss: string = existsSync(globalStyleFileScss) ?
      readFileSync(globalStyleFileScss, 'utf8') : '';

    // Read user defined css and compile it into scss
    const globalStyleFileCss = path.join(this.projectDir, 'src', 'styles.css');
    const globalStyleCss: string = existsSync(globalStyleFileCss) ?
      readFileSync(globalStyleFileCss, 'utf8') : '';
    ngAppBuilder.setGlobalStyle(globalStyleScss.concat(globalStyleCss));

    const faviconFile = path.join(this.projectDir, 'favicon.ico');
    if (existsSync(faviconFile)) {
      ngAppBuilder.setFavicon(faviconFile);
    }

    const assetsDir = path.join(this.projectDir, 'src', 'assets');
    if (existsSync(assetsDir)) {
      ngAppBuilder.setAppAssetsDir(assetsDir);
    }

    const componentsConfig = (dvConfig.components !== undefined) ?
      dvConfig.components.app : undefined;
    const htmlFilesToParse = filesToParse(this.projectDir, componentsConfig);
    for (const componentFilePath of htmlFilesToParse) {
      try {
        const componentContents = readFileSync(
          path.join(this.projectDir, componentFilePath), 'utf8');

        const componentStylePath = path.join(this.projectDir,
          _.replace(componentFilePath, '.html', '.css'));
        const componentStyle = existsSync(componentStylePath) ?
          readFileSync(componentStylePath, 'utf8') : '';

        const pages = _.map(dvConfig.routes, 'component');
        const compiledComponent = this.componentCompiler.compile(
          dvConfig.name, componentContents, this.symbolTable,
          componentStyle, pages);
        ngAppBuilder.addComponent(
          compiledComponent.name, compiledComponent.className,
          compiledComponent.ngComponent, compiledComponent.ngTemplate);
        for (const componentInput of compiledComponent.componentInputs) {
          ngAppBuilder.addComponent(
            componentInput.name, componentInput.className,
            componentInput.ngComponent, componentInput.ngTemplate);
        }
      } catch (e) {
        console.error(`Error in component ${componentFilePath}`);
        throw e;
      }
    }

    ngAppBuilder.build(this.cacheDir, this.installDependencies);
  }
}
