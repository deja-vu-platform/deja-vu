import * as program from 'commander';
import * as path from 'path';
import * as _ from 'lodash';
import { ng, projectName, isCliche, modulePath } from './dv';


program
  .version('0.0.1')
  .arguments('<name>')
  .action(name => {
    if (typeof name !== 'string') {
      console.log('Name is required');
      return;
    }
    console.log(`Creating new action ${name}`);
    const projName = projectName();
    const componentName = isCliche() ? path.join(projName, name) : name;
    ng(['generate', 'component', componentName]);

    console.log('Add action to module exports');
    console.log(
      `Edit ${modulePath(projName)}.ts:\n
         - add "${componentClassName(name)}" to the exports array\n
       This will be automated in the future`);
  })
  .parse(process.argv);


function componentClassName(actionName: string): string {
  return _.chain(actionName).camelCase().capitalize().value() + 'Component';
}
