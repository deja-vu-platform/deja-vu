import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';


const collectionPath = path.join(__dirname, '../collection.json');
const actionName = 'test action';
const dasherizedActionName = 'test-action';
const clicheName = 'clichename';

describe('action', () => {
  it('works', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic(
      'action', { actionName, clicheName }, Tree.empty());

    expect(tree.files).toEqual([
      `/src/app/${clicheName}/${dasherizedActionName}/${dasherizedActionName}.component.css`,
      `/src/app/${clicheName}/${dasherizedActionName}/${dasherizedActionName}.component.html`,
      `/src/app/${clicheName}/${dasherizedActionName}/${dasherizedActionName}.component.spec.ts`,
      `/src/app/${clicheName}/${dasherizedActionName}/${dasherizedActionName}.component.ts`
    ]);
  });
});
