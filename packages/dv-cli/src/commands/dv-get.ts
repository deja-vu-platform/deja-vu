import * as _ from 'lodash';
import { DVCONFIG_FILE_PATH, readFileOrFail } from '../dv';


exports.command = 'get <key>';
exports.desc = 'get a value from the configuration';
exports.handler = ({ key }) => {
  const dvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
  console.log(JSON.stringify(_.get(dvConfig, key)));
};
