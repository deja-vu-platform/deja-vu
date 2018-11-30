import { copySync } from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import {
  ACTION_TABLE_FILE_NAME,
  actionTable,
  DvConfig,
  DVCONFIG_FILE_PATH,
  NG_PACKAGR,
  npm,
  readFileOrFail,
  updatePackage,
  writeFileOrFail
} from '../dv';


exports.command = 'package';
exports.desc = 'package a cliché';
exports.handler = () => {
  const config: DvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  console.log('Packaging cliche');
  npm(['run', `dv-package-${config.name}`]);

  updatePackage((pkg) => {
    if (_.has(pkg, 'peerDependencies.dv-gateway')) {
      const newGatewayPath = path.join(
        '..', pkg['peerDependencies']['dv-gateway'].slice('file:'.length));
      pkg['peerDependencies']['dv-gateway'] = `file:${newGatewayPath}`;
    }

    return pkg;
  }, NG_PACKAGR.configFileContents.dest);

  writeFileOrFail(
    path.join('pkg', ACTION_TABLE_FILE_NAME),
    actionTable(config, _.get(config.actions, 'package')));
  copySync(DVCONFIG_FILE_PATH, path.join('pkg', DVCONFIG_FILE_PATH));
  console.log('Done');
};
