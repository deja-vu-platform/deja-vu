import * as _ from 'lodash';
import * as path from 'path';
import {
  ENTRY_FILE_PATH,
  installAndConfigureGateway,
  JSON_SPACE,
  modulePath,
  ng,
  NG_PACKAGR,
  npm,
  updatePackage,
  writeFileOrFail
} from '../../utils';


exports.command = 'cliche <name> <pathToDv>';
exports.desc = 'create a new cliché';
exports.handler = ({ name, pathToDv }) => {
  console.log(`Creating new cliche ${name}`);
  ng(['new', name, '--prefix', name]);

  console.log(`Create module ${name}`);
  ng(['generate', 'module', name], name);

  installAndConfigureGateway(name, pathToDv);

  console.log('Move angular to peerDependencies');
  updatePackage((pkg) => {
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
  updatePackage((pkg) => {
    pkg.scripts[NG_PACKAGR.npmScriptKey] = NG_PACKAGR.npmScriptValue;
    pkg.scripts[`dv-package-${name}`] = 'dv package';
    pkg.scripts[`dv-package-watch-${name}`] = (
      `chokidar src/app/${name} server -c 'npm run dv-package-${name}'`);

    return pkg;
  }, name);
};
