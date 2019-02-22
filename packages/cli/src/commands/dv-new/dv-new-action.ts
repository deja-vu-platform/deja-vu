import * as _ from 'lodash';
import {
  isInNgProjectRoot,
  getDvPackageName,
  metadataPath,
  ng,
  projectName
} from '../../utils';


exports.command = 'action <name>';
exports.desc = 'create a new action';
exports.handler = ({ name }) => {
  if (!isInNgProjectRoot()) {
    console.log('Please run this command from the root of a cliché directory.');
    return;
  }

  console.log(`Creating new action ${name}`);

  const clicheName = projectName();
  const schematicsPkgName = getDvPackageName('schematics');
  ng(['generate', `${schematicsPkgName}:action`, `--clicheName=${clicheName}`,
    `--actionName=${name}`]);

  const componentName = componentClassName(name);
  console.log(
    `Edit ${metadataPath(clicheName)}.ts:
    - add the line:
      import { ${componentName} } from './${name}/${name}.component'\n
    - add "${componentName}" to the exports and the allComponents array
This will be automated in the future.`);
};

function componentClassName(actionName: string): string {
  return _.chain(actionName)
    .camelCase()
    .upperFirst()
    .value() + 'Component';
}
