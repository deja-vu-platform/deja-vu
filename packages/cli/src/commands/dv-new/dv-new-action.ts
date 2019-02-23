import {
  isInNgProjectRoot,
  getDvPackageName,
  ng,
  projectName
} from '../../utils';

// TODO: add option to add the new action to the README
exports.command = 'action <name>';
exports.desc = 'create a new action';
exports.builder = {
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
};
exports.handler = ({ name, skipAppComponentHtml, skipMetadataImport }) => {
  if (!isInNgProjectRoot()) {
    console.log('Please run this command from the root of a cliché directory.');
    return;
  }

  console.log(`Creating new action ${name}`);

  const clicheName = projectName();
  const schematicsPkgName = getDvPackageName('schematics');

  ng(['generate',
    `${schematicsPkgName}:action`,
    `--clicheName=${clicheName}`,
    `--actionName=${name}`,
    getOptionalFlag(skipAppComponentHtml, '--skipAppComponentHtml'),
    getOptionalFlag(skipMetadataImport, '--skipMetadataImport')]);
};

function getOptionalFlag(flag: boolean, flagName: string) {
  return flag ? `--${flagName}` : '';
}
