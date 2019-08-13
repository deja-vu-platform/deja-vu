import {
  isInNgProjectRoot,
  getDvPackageName,
  ng,
  projectName
} from '../../utils';

// TODO: add option to add the new component to the README
// TODO: add option to add relevant server code
exports.command = 'component <type> <entityName> [componentName]';
exports.desc = 'create a new component';
exports.builder = (yargs) => yargs
  .positional('type', {
    choices: ['blank', 'create', 'delete', 'show', 'update'],
    describe: 'The type of the component to create'
  })
  .positional('entityName', {
    describe: 'The name of the entity on which to perform the action, ' +
      'or the name of the component if the component type is "blank"'
  })
  .positional('componentName', {
    describe: 'The name of the component to create, ' +
      'which defaults to `type-entityName` if not provided and ' +
      'the component type is not "blank"'
  })
  .options({
    skipAppComponentHtml: {
      default: false,
      describe: 'When set, the new component will not be added to the app.component.html file.',
      type: 'boolean'
    },
    skipMetadataImport: {
      default: false,
      describe: 'When set, the new component will not be added to the metadata file.',
      type: 'boolean'
    }
  });
;
exports.handler = ({ type, entityName, componentName,
  skipAppComponentHtml, skipMetadataImport }) => {
  if (!isInNgProjectRoot()) {
    console.log(
      'Error: Please run this command from the root of a concept directory.');
    return;
  }

  const actualComponentName = type === 'blank' ? entityName :
    (componentName ? componentName : `${type}-${entityName}`);
  console.log(`Creating new component ${actualComponentName}`);

  const conceptName = projectName();
  const schematicsPkgName = getDvPackageName('schematics');

  ng(['generate',
    `${schematicsPkgName}:component`,
    `--componentName=${actualComponentName}`,
    `--conceptName=${conceptName}`,
    `--entityName=${entityName}`,
    `--type=${type}`,
    getOptionalFlag(skipAppComponentHtml, '--skipAppComponentHtml'),
    getOptionalFlag(skipMetadataImport, '--skipMetadataImport')]);
};

function getOptionalFlag(flag: boolean, flagName: string) {
  return flag ? `--${flagName}` : '';
}
