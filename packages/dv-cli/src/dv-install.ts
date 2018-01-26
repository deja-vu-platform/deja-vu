import * as program from 'commander';
import * as _ from 'lodash';
import { npm } from './dv';


const APP_MODULE_PATH = 'src/app/app.module.ts';

program
  .version('0.0.1')
  // hyphen if name has more than one word
  .arguments('<name> [loc]')
  .action((name, loc) => {
    console.log(`Installing cliché ${name}`);
    if (loc) {
      console.log(`From location ${loc}`);
    } else {
      throw new Error('Not supported yet');
    }
    npm(['install', loc]);

    console.log('Modify the app module');
    console.log(
      `Edit ${APP_MODULE_PATH}:\n
         - add "import { ${moduleClassName(name)} } from '${name}';"\n
         - add "${moduleClassName(name)}" to the imports array\n
       This will be automated in the future`);
  })
  .parse(process.argv);


function moduleClassName(clicheName: string): string {
  return _.chain(clicheName).camelCase().capitalize().value() + 'Module';
}
