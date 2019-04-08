import * as path from 'path';
import {
  cmd,
  getDvPackageName,
  getSchematicsPath,
  isInNgProjectRoot,
  ng,
  yarn
} from '../../utils';


exports.command = 'cliche <name>';
exports.desc = 'create a new cliché';
exports.builder = (yargs) => yargs.option('pathToDv', {
  default: 'deja-vu',
  describe: 'the location of the Déjà Vu monorepo',
  nargs: 1,
  type: 'string'
});
exports.handler = ({ name, pathToDv }) => {
  if (isInNgProjectRoot()) {
    console.log(
      'Error: You cannot run this command inside of an Angular project.');
    return;
  }
  console.log(`Creating new cliché ${name}`);

  // hack to find the schematics from outside the dv monorepo
  const schematicsPath = getSchematicsPath(pathToDv);
  const schematicsPkgName = getDvPackageName('schematics');
  yarn(['link', '--silent'], schematicsPath);
  yarn(['link', '--silent', schematicsPkgName]);

  try {
    const catalogPath = `${pathToDv}/packages/catalog/`;
    // create outside monorepo first to satisfy new Angular project constraints,
    // then move it to the catalog
    ng(['new', `--collection=${schematicsPkgName}`,
      `--clicheName=${name}`]);
    cmd('mv', [name, catalogPath]);

    // install and package new cliche
    const clichePath = path.join(catalogPath, name);
    yarn([], clichePath);
    console.log(`Cliché ${name} successfully created at ${clichePath}`);

  } finally {
    // undo the hack
    yarn(['unlink', '--silent'], schematicsPath);
  }
};
