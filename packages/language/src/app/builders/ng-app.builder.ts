import {
  copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync
} from 'fs';
import * as path from 'path';

import * as _ from 'lodash';

import { spawnSync } from 'child_process';
import * as rimraf from 'rimraf';


interface Dependency {
  name: string;
  version: string;
}

interface Component {
  name: string;
  className: string;
  component: string;
  template: string;
}

interface Route {
  path: string;
  selector: string;
}

interface CacheRecord {
  name: string;
  dependencies: Dependency[];
  components: Component[];
  routes: Route[];
  globalStyle: string;
}


interface CacheRecordDiff {
  nameChanged: boolean;
  dependenciesChanged: boolean;
  componentsChanged: boolean;
  routesChanged: boolean;
  globalStyleChanged: boolean;
  prev: CacheRecord | undefined;
  curr: CacheRecord;
}

/**
 * Builder for Angular applications
 */
export class NgAppBuilder {
  private static readonly blueprintsPath = path.join(__dirname, 'blueprints');
  private static readonly cacheRecordFile = '.dvcache';

  private readonly dependencies: Dependency[] = [];
  private readonly components: Component[] = [];
  private readonly routes: Route[] = [];
  private globalStyle = '';
  private faviconPath: string | undefined;

  private static Replace(
    srcFile: string, srcExt: string, dstDir: string,
    replaceMap?: { [pattern: string]: string }) {
    const dst = path.join(dstDir, `${srcFile}.${srcExt}`);
    const src = path.join(
      this.blueprintsPath, `${srcFile}.blueprint.${srcExt}`);
    if (replaceMap === undefined) {
      writeFileSync(dst, readFileSync(src, 'utf8'));
    } else {
      const regex = new RegExp(Object.keys(replaceMap)
        .map((key) => `@@${key}`)
        .join('|'), 'gi');
      writeFileSync(
        dst,
        readFileSync(src, 'utf8')
          .replace(regex, (matched) => replaceMap[matched.substring(2)]));
    }
  }

  private static DepToModule(dep: string) {
    return `${_.capitalize(dep)}Module`;
  }

  private static DiffCacheRecord(
    prev: CacheRecord | undefined, curr: CacheRecord): CacheRecordDiff {
    const diff = {};
    _.each(_.keys(curr), (key) => {
      diff[`${key}Changed`] = (prev !== undefined) ?
        NgAppBuilder.ObjectCompare(prev[key], curr[key]) !== 0 : true;
      diff[`prev${_.capitalize(key)}`] = _.get(prev, key);
      diff[`curr${_.capitalize(key)}`] = curr[key];
    });

    return <CacheRecordDiff> diff;
  }

  private static ObjectCompare(a: any, b: any): number {
    return JSON.stringify(a)
      .localeCompare(JSON.stringify(b));
  }

  private static InstallDependencies(cacheDir: string) {
    // Windows users must include `shell: true` for the command to work
    // TODO: Remove `shell: true` in the future
    const c = spawnSync(
      'yarn', [], { stdio: 'inherit', cwd: cacheDir, shell: true });
    if (c.error) {
      throw new Error(`Failed to install dependencies: ${c.error}`);
    }
    if (c.status !== 0) {
      throw new Error(`Failed to install dependencies: status is ${c.status}`);
    }
  }

  constructor(
    private readonly appName: string,
    private readonly dvConfigContents: string) {}

  addDependency(name: string, version: string): NgAppBuilder {
    this.dependencies.push({ name: name, version: version });

    return this;
  }

  addComponent(
    name: string, className: string, component: string, template: string) {
    this.components.push({
      name: name, className: className, component: component, template: template
    });

    return this;
  }

  setGlobalStyle(style: string): NgAppBuilder {
    this.globalStyle = style;

    return this;
  }

  /**
   * Uses the file at the given path for the app favicon
   */
  setFavicon(faviconPath: string) {
    this.faviconPath = faviconPath;

    return this;
  }

  addRoute(route: string, selector: string) {
    this.routes.push({ path: route, selector: selector });

    return this;
  }

  build(cacheDir: string, installDependencies = true) {
    if (!_.includes(_.map(this.routes, 'path'), '')) {
      throw new Error(
        'Missing default route "". In your dvconfig.json file add:\n' +
        '"routes": [ {"path": "", "action": "your-main-action-here"} ]');
    }
    const srcDir = path.join(cacheDir, 'src');
    const appDir = path.join(srcDir, 'app');
    const assetsDir = path.join(srcDir, 'assets');

    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir);
    }

    if (!existsSync(srcDir)) {
      // | src/
      mkdirSync(srcDir);
      // | | main.ts
      NgAppBuilder.Replace('main', 'ts', srcDir);
      // | | polyfills.ts
      NgAppBuilder.Replace('polyfills', 'ts', srcDir);
      // | | tsconfig.ts
      NgAppBuilder.Replace('tsconfig', 'json', srcDir);
      // | | typings.d.ts
      NgAppBuilder.Replace('typings', 'd.ts', srcDir);
    }

    if (!existsSync(appDir)) {
      // | | app/
      mkdirSync(appDir);
      // | | | app.component.html
      NgAppBuilder.Replace('app.component', 'html', appDir);
      // | assets/
      mkdirSync(assetsDir);
    }

    const diff = this.updateCache(cacheDir);

    const selectorToComponent = _.reduce(
      this.components, (acc, c: Component) => {
        if (!c.name.startsWith('anonymous-')) {
          acc[`${this.appName}-${c.name}`] = c.className;
        }

        return acc;
      }, {});

    const replaceMap = {
      name: this.appName,
      dependencies: _
        .map(
          this.dependencies,
          (d: Dependency) => `"${d.name}": "${d.version}"`)
        .join(',\n'),
      componentImports: _
        .map(
          this.components,
          (c: Component) =>
            `import { ${c.className } } from './${c.name}/${c.name}.component'`)
        .join(';\n'),
      moduleImports: _
        .map(
          this.dependencies,
          (d: Dependency) =>
            `import { ${NgAppBuilder.DepToModule(d.name)} } from '${d.name}'`)
        .join(';\n'),
      components: _
        .map(this.components, 'className')
        .join(', '),
      assets: (_.isEmpty(this.dependencies) ? '' : ',\n') + _
        .map(
          this.dependencies,
          (d: Dependency) => `{
            "glob": "**/*", "input": "../node_modules/${d.name}/assets",
            "output": "./assets/${d.name}/"
          }`)
        .join(',\n'),
      routes: _
        .map(
          this.routes,
          (r: Route) => {
            const c = selectorToComponent[r.selector];
            if (c === undefined) {
              throw new Error(
                `Action for route "${r.path}" (${r.selector}) not found\n` +
              `Valid actions are: ${_.keys(selectorToComponent)}`);
            }

            return `{ path: "${r.path}", component: ${c} }`;
          })
        .join(', '),
      modules: _
        .map(_.map(this.dependencies, 'name'), NgAppBuilder.DepToModule)
        .join(', ')
    };

    // /
    // | package.json
    if (diff.nameChanged || diff.dependenciesChanged) {
      NgAppBuilder.Replace('package', 'json', cacheDir, replaceMap);
    }
    // | .angular-cli.json
    if (diff.nameChanged) {
      NgAppBuilder.Replace('.angular-cli', 'json', cacheDir, replaceMap);
    }
    // | dvconfig.json
    const newDvConfigContents = JSON.stringify(
      _.omit(JSON.parse(this.dvConfigContents), 'type'), null, 2);
    writeFileSync(path.join(cacheDir, 'dvconfig.json'), newDvConfigContents);

    // | src/
    // | | index.html
    if (diff.nameChanged) {
      NgAppBuilder.Replace('index', 'html', srcDir, replaceMap);
    }

    // | | app/
    // | | | app.component.ts
    if (diff.nameChanged) {
      NgAppBuilder.Replace('app.component', 'ts', appDir, replaceMap);
    }
    // | | | app.module.ts
    if (diff.componentsChanged || diff.routesChanged) {
      NgAppBuilder.Replace('app.module', 'ts', appDir, replaceMap);
    }

    if (diff.componentsChanged) {
      if (diff.prev !== undefined) {
        for (const component of diff.prev.components) {
          const componentDir = path.join(appDir, component.name);
          rimraf.sync(componentDir);
        }
      }
      for (const component of this.components) {
        const componentDir = path.join(appDir, component.name);
        if (!existsSync(componentDir)) {
          mkdirSync(componentDir);
        }
        writeFileSync(
          path.join(componentDir, `${component.name}.component.html`),
          component.template);
        writeFileSync(
          path.join(componentDir, `${component.name}.component.ts`),
          component.component);
      }
    }

    // | styles.css
    if (diff.globalStyleChanged || _.has(diff, 'prev.globalStyle')) {
      writeFileSync(path.join(srcDir, 'styles.css'), this.globalStyle);
    }

    // | favicon.ico
    if (this.faviconPath !== undefined) {
      copyFileSync(this.faviconPath, path.join(srcDir, 'favicon.ico'));
    }

    // | assets/
    // TODO

    if (installDependencies && diff.dependenciesChanged) {
      NgAppBuilder.InstallDependencies(cacheDir);
    }
  }

  private updateCache(cacheDir: string): CacheRecordDiff {
    const cacheFile = path.join(cacheDir, NgAppBuilder.cacheRecordFile);
    const cacheValues: CacheRecord | undefined = existsSync(cacheFile) ?
      JSON.parse(readFileSync(cacheFile, 'utf8')) : undefined;

    this.dependencies.sort(NgAppBuilder.ObjectCompare);
    this.components.sort(NgAppBuilder.ObjectCompare);
    this.routes.sort(NgAppBuilder.ObjectCompare);

    const currCache: CacheRecord = {
      name: this.appName,
      dependencies: this.dependencies,
      components: this.components,
      routes: this.routes,
      globalStyle: this.globalStyle
    };

    writeFileSync(cacheFile, JSON.stringify(currCache));

    return NgAppBuilder.DiffCacheRecord(cacheValues, currCache);
  }
}
