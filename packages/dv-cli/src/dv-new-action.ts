import * as program from 'commander';
import * as path from 'path';
import * as _ from 'lodash';
import { ng, projectName, isCliche, modulePath } from './dv';


program
  .version('0.0.1')
  .arguments('<name>')
  .action(name => {
    console.log(`Creating new action ${name}`);
    const componentName = isCliche() ? path.join(projectName(), name) : name;
    ng(['generate', 'component', componentName]);

    console.log('Add action to event module exports');
    console.log(
      `Edit ${modulePath(name)}:\n
         - add "${componentClassName(name)}" to the exports array\n
       This will be automated in the future`);
  })
  .parse(process.argv);


function componentClassName(actionName: string): string {
  return _.chain(actionName).camelCase().capitalize().value() + 'Component';
}
