import {
  isInNgProjectRoot,
  getDvPackageName,
  ng,
  projectName
} from '../../utils';

// TODO: add option to add the new action to the README
// TODO: add option to add relevant server code
exports.command = 'action <type> <entityName> [actionName]';
exports.desc = 'create a new action';
exports.builder = (yargs) => yargs
  .positional('type', {
    choices: ['blank', 'create', 'delete', 'show', 'update'],
    describe: 'The type of the action to create'
  })
  .positional('entityName', {
    describe: 'The name of the entity on which to perform the action'
  })
  .positional('actionName', {
    describe: 'The name of the action to create, ' +
      'which defaults to `type-entityName` if not provided'
  })
  .options({
    skipAppComponentHtml: {
      default: false,
      describe: 'When set, the new action will not be added to the app.component.html file.',
      type: 'boolean'
    },
    skipMetadataImport: {
      default: false,
      describe: 'When set, the new action will not be added to the metadata file.',
      type: 'boolean'
    }
  });
;
exports.handler = ({ type, entityName, actionName,
  skipAppComponentHtml, skipMetadataImport }) => {
  if (!isInNgProjectRoot()) {
    console.log(
      'Error: Please run this command from the root of a cliché directory.');
    return;
  }

  const actualActionName = actionName ? actionName : `${type}-${entityName}`;
  console.log(`Creating new action ${actualActionName}`);

  const clicheName = projectName();
  const schematicsPkgName = getDvPackageName('schematics');

  ng(['generate',
    `${schematicsPkgName}:action`,
    `--actionName=${actualActionName}`,
    `--clicheName=${clicheName}`,
    `--entityName=${entityName}`,
    `--type=${type}`,
    getOptionalFlag(skipAppComponentHtml, '--skipAppComponentHtml'),
    getOptionalFlag(skipMetadataImport, '--skipMetadataImport')]);
};

function getOptionalFlag(flag: boolean, flagName: string) {
  return flag ? `--${flagName}` : '';
}
