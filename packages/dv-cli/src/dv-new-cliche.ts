import * as program from 'commander';
import {
  ng, npm, writeFileOrFail, readFileOrFail,
  NG_PACKAGR, ENTRY_FILE_PATH, modulePath,
  JSON_SPACE, installAndConfigureGateway
} from './dv';
import * as path from 'path';

program
  .version('0.0.1')
  .arguments('<name> <pathToGateway>')
  .action((name, pathToGateway) => {
    console.log(`Creating new cliche ${name}`);
    ng(['new', name, '--prefix', name]);

    console.log(`Create module ${name}`);
    ng(['generate', 'module', name], name);

    installAndConfigureGateway(name, pathToGateway);

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
    const pkgJsonPath = path.join(name, 'package.json');
    const pkgJson = JSON.parse(readFileOrFail(pkgJsonPath));
    pkgJson.scripts[NG_PACKAGR.npmScriptKey] = NG_PACKAGR.npmScriptValue;
    pkgJson.scripts[`dv-package-${name}`] = 'dv package';
    pkgJson.scripts[`dv-package-watch-${name}`] = (
      `chokidar 'src/app/${name}' 'server'` + ' | ' +
      `npm run dv-package-${name}`);
    writeFileOrFail(
      pkgJsonPath, JSON.stringify(pkgJson, undefined, JSON_SPACE));
  })
  .parse(process.argv);
