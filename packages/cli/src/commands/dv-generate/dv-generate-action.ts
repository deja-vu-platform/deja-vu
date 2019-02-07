import * as _ from 'lodash';
import * as path from 'path';
import { isCliche, modulePath, ng, projectName } from '../../utils';


exports.command = 'action <name>';
exports.desc = 'create a new action';
exports.handler = ({ name }) => {
  console.log(`Creating new action ${name}`);
  const projName = projectName();
  const componentName = isCliche() ? path.join(projName, name) : name;
  ng(['generate', 'component', componentName]);

  console.log('Add action to module exports');
  console.log(
    `Edit ${modulePath(projName)}.ts:\n
       - add "${componentClassName(name)}" to the exports array\n
     This will be automated in the future`);
};

function componentClassName(actionName: string): string {
  return _.chain(actionName)
    .camelCase()
    .upperFirst()
    .value() + 'Component';
}
