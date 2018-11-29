import * as _ from 'lodash';
import { readFileOrFail, DVCONFIG_FILE_PATH } from '../dv';


exports.command = 'get <key>';
exports.desc = 'get a value from the configuration';
exports.handler = ({ key }) => {
  const dvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  console.log(JSON.stringify(_.get(dvConfig, key)));
};
