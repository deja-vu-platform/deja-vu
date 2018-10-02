import * as program from 'commander';
import {
  ng, npm, writeFileOrFail, updatePackage,
  NG_PACKAGR, ENTRY_FILE_PATH, modulePath,
  JSON_SPACE, installAndConfigureGateway
} from './dv';
import * as path from 'path';
import * as _ from 'lodash';


program
  .version('0.0.1')
  .arguments('<name> <pathToDv>')
  .action((name, pathToDv) => {
    console.log(`Creating new cliche ${name}`);
    ng(['new', name, '--prefix', name]);

    console.log(`Create module ${name}`);
    ng(['generate', 'module', name], name);

    installAndConfigureGateway(name, pathToDv);

    console.log('Move angular to peerDependencies');
    updatePackage(pkg => {
      pkg.peerDependencies = _.assign(pkg.peerDependencies, pkg.dependencies);
      pkg.devDependencies = _.assign(pkg.devDependencies, pkg.dependencies);
      pkg.dependencies = {};
      return pkg;
    }, name);

    console.log('Install ng-packagr');
    npm(['install', 'ng-packagr', '--save-dev'], name);

    console.log('Create ng-packagr config file');
    writeFileOrFail(
      path.join(name, NG_PACKAGR.configFilePath),
      JSON.stringify(NG_PACKAGR.configFileContents, undefined, JSON_SPACE));

    console.log('Create ng-packagr entry file');
    writeFileOrFail(
      path.join(name, ENTRY_FILE_PATH),
      `export * from \'${modulePath(name)}\';`);

    console.log('Add npm script to package');
    updatePackage(pkg => {
      pkg.scripts[NG_PACKAGR.npmScriptKey] = NG_PACKAGR.npmScriptValue;
      pkg.scripts[`dv-package-${name}`] = 'dv package';
      pkg.scripts[`dv-package-watch-${name}`] = (
        `chokidar src/app/${name} server -c 'npm run dv-package-${name}'`);
      return pkg;
    }, name);
  })
  .parse(process.argv);
