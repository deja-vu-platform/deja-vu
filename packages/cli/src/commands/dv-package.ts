import { copySync, existsSync } from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import {
  COMPONENT_TABLE_FILE_NAME,
  componentTable,
  cmd,
  DvConfig,
  DVCONFIG_FILE_PATH, NG_PACKAGR,
  readFileOrFail,
  writeFileOrFail,
  yarn
} from '../utils';

exports.command = 'package';
exports.desc = 'package a concept';
exports.handler = () => {
  const config: DvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  console.log('Packaging concept');
  yarn([`dv-package-${config.name}`]);

  const pkgDir = NG_PACKAGR.configFileContents.dest;
  writeFileOrFail(
    path.join(pkgDir, COMPONENT_TABLE_FILE_NAME),
    componentTable(config, _.get(config.components, 'package')));
  copySync(DVCONFIG_FILE_PATH, path.join(pkgDir, DVCONFIG_FILE_PATH));

  const assetsDir = path.join('src', 'app', config.name, 'assets');
  if (existsSync(assetsDir)) {
    console.log('Copying assets');
    copySync(
      assetsDir,
      path.join(pkgDir, 'assets'));
  }

  // compodoc does not support absolute paths
  const cwd = path.resolve(__dirname, '..', '..'); // cli root folder
  const pathToConceptDir = path.relative(cwd, path.resolve('.'));
  const pathToTsconfig = existsSync(path.join('src', 'tsconfig.app.json'))
    ? path.join(pathToConceptDir, 'src', 'tsconfig.app.json')
    : path.join(pathToConceptDir, 'tsconfig.json');  // core has diff structure
  try {
    cmd(
      'yarn',
      [
        'compodoc',
        '--exportFormat=json',
        `--tsconfig=${pathToTsconfig}`,
        `--output=${path.join(pathToConceptDir, pkgDir)}`,
        '--minimal',
        '--disableSourceCode',
        '--disableDomTree',
        '--disableTemplateTab',
        '--silent'
      ],
      {
        // silent doesn't really work so we just send all output to
        // /dev/null on Unix or NUL on Windows
        // (we have silent anyways for performance reasons)
        stdio: 'ignore',
        // use cli compodoc so it doesn't need to be a dep of every concept
        cwd
      }
    );
    console.log('Created documentation');
  } catch (e) {
    console.warn('Could not document concept', config.name);
  }

  console.log('Done');
};
