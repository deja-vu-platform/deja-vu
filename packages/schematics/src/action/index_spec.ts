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
      'action', {
        actionName,
        clicheName,
        skipAppComponentHtml: true,
        skipMetadataImport: true
      }, Tree.empty());

    const actionFilePathPrefix =
      `/src/app/${clicheName}/${dasherizedActionName}/${dasherizedActionName}`;

    expect(tree.files)
      .toEqual([
        `${actionFilePathPrefix}.component.css`,
        `${actionFilePathPrefix}.component.html`,
        `${actionFilePathPrefix}.component.spec.ts`,
        `${actionFilePathPrefix}.component.ts`
      ]);
  });
});
