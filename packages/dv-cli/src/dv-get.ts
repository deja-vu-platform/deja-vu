import * as program from 'commander';
import * as _ from 'lodash';
import { readFileOrFail, DVCONFIG_FILE_PATH } from './dv';


program
  .version('0.0.1')
  // hyphen if name has more than one word
  .arguments('<key>')
  .action((key: string) => {
    const dvConfig = JSON.parse(readFileOrFail(DVCONFIG_FILE_PATH));
    console.log(JSON.stringify(_.get(dvConfig, key)));
  })
  .parse(process.argv);
