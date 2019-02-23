import {
  isInNgProjectRoot,
  getDvPackageName,
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
};
