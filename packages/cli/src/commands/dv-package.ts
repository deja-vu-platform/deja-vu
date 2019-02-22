import { copySync, existsSync } from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import {
  ACTION_TABLE_FILE_NAME,
  actionTable,
  DvConfig,
  DVCONFIG_FILE_PATH, NG_PACKAGR,
  yarn,
  readFileOrFail,
  writeFileOrFail
} from '../utils';


exports.command = 'package';
exports.desc = 'package a cliché';
exports.handler = () => {
  const config: DvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  console.log('Packaging cliche');
  yarn([`dv-package-${config.name}`]);

  const pkgDir = NG_PACKAGR.configFileContents.dest;
  writeFileOrFail(
    path.join(pkgDir, ACTION_TABLE_FILE_NAME),
    actionTable(config, _.get(config.actions, 'package')));
  copySync(DVCONFIG_FILE_PATH, path.join(pkgDir, DVCONFIG_FILE_PATH));

  const assetsDir = path.join('src', 'app', config.name, 'assets');
  if (existsSync(assetsDir)) {
    console.log('Copying assets');
    copySync(
      assetsDir,
      path.join(pkgDir, 'assets'));
  }
  console.log('Done');
};
