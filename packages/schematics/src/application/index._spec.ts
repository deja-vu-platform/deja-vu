import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';


const collectionPath = path.join(__dirname, '../collection.json');
const clicheName = 'clichename';

describe('component', () => {
  it('works', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic(
      'application', { clicheName }, Tree.empty());

    expect(tree.files.length)
      .not
      .toEqual(0);
    tree.files.forEach((file) => expect(file)
      .toContain(clicheName));
  });
});
