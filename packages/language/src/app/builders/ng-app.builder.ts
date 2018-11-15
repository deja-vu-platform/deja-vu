import * as path from 'path'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'

import * as _ from 'lodash';


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
 component: string;
}


export class NgAppBuilder {
  private readonly dependencies: Dependency[] = [];
  private readonly components: Component[] = [];
  private readonly routes: Route[] = [];
  private static readonly blueprintsPath = path.join(__dirname, 'blueprints');

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
        .map(key => `@@${key}`)
        .join('|'), 'gi');
      writeFileSync(
        dst,
        readFileSync(src, 'utf8')
          .replace(regex, matched => replaceMap[matched.substring(2)]));
    }
  }

  private static DepToModule(dep: string) {
    return `${_.capitalize(dep)}Module`;
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

  addRoute(path: string, component: string) {
    this.routes.push({ path: path, component: component });

    return this;
  }

  build(dir: string) {
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
      routes: _
        .map(
          this.routes,
          (r: Route) => `{ path: ${r.path}, component: ${r.component} }`)
        .join(', '),
      modules: _
        .map(_.map(this.dependencies, 'name'), NgAppBuilder.DepToModule)
        .join(', '),
    };

    // /
    // | package.json
    NgAppBuilder.Replace('package', 'json', dir, replaceMap);
    // | .angular-cli.json
    NgAppBuilder.Replace('.angular-cli', 'json', dir, replaceMap);
    // | dvconfig.json
    writeFileSync(path.join(dir, 'dvconfig.json'), this.dvConfigContents);

    // | src/
    const srcDir = path.join(dir, 'src');
    mkdirSync(srcDir);
    // | | index.html
    NgAppBuilder.Replace('index', 'html', srcDir, replaceMap);
    // | | main.ts
    NgAppBuilder.Replace('main', 'ts', srcDir);
    // | | polyfills.ts
    NgAppBuilder.Replace('polyfills', 'ts', srcDir);
    // | | tsconfig.ts
    NgAppBuilder.Replace('tsconfig', 'json', srcDir);
    // | | typings.d.ts
    NgAppBuilder.Replace('typings', 'd.ts', srcDir);


    // | | app/
    const appDir = path.join(srcDir, 'app');
    mkdirSync(appDir);
    // | | | app.component.html
    NgAppBuilder.Replace('app.component', 'html', appDir, replaceMap);
    // | | | app.component.ts
    NgAppBuilder.Replace('app.component', 'ts', appDir, replaceMap);
    // | | | app.module.ts
    NgAppBuilder.Replace('app.module', 'ts', appDir, replaceMap);

    for (const component of this.components) {
      const componentDir = path.join(appDir, component.name);
      mkdirSync(componentDir);
      writeFileSync(
        path.join(componentDir, `${component.name}.component.html`),
        component.template);
      writeFileSync(
        path.join(componentDir, `${component.name}.component.ts`),
        component.component);
    }

    // | assets/
    const assetsDir = path.join(srcDir, 'assets');
    mkdirSync(assetsDir);
  }
}
