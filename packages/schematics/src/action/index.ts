import { strings } from '@angular-devkit/core';
import {
  apply,
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  template,
  mergeWith,
  filter,
  url
} from '@angular-devkit/schematics';
import * as cheerio from 'cheerio';
import * as ts from 'typescript';
import { appendToArrayDeclaration, insertImport } from '../utils/ast-utils';
import { InsertChange } from '../utils/change';


export function action(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const templateSource = apply(url('./files'), [
        template({
          ...strings,
          ...options,
        }),
        filter((path) => !path.endsWith('.DS_Store') && !tree.exists(path))
    ]);
    
    return chain([
      mergeWith(templateSource),
      addComponentToMetadata(options),
      addToAppComponentHtml(options)
    ])(tree, _context);
  };
}

function getFileText(tree: Tree, filePath: string): string {
  const text = tree.read(filePath);
  if (text === null) {
    throw new SchematicsException(`File ${filePath} does not exist.`);
  }
  return text.toString('utf-8');
}

function readIntoSourceFile(tree: Tree, filePath: string): ts.SourceFile {
  const sourceText = getFileText(tree, filePath);

  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
}

function getMetadataPath(clicheName: string): string {
  const dasherizedName = strings.dasherize(clicheName);
  return `/src/app/${dasherizedName}/${dasherizedName}.metadata.ts`;
}

function addComponentToMetadata(options: any): Rule {
  return (tree: Tree) => {
    if (options.skipMetadataImport) {
      return tree;
    }
    const metadataPath = getMetadataPath(options.clicheName);
    const source = readIntoSourceFile(tree, metadataPath);

    const componentPath = `./${strings.dasherize(options.actionName)}/`
                          + strings.dasherize(options.actionName)
                          + '.component';
    const componentName = `${strings.classify(options.actionName)}Component`;
    
    const changeRecorder = tree.beginUpdate(metadataPath);

    const declarationChange = insertImport(
      source, metadataPath, componentName, componentPath);
    if (declarationChange instanceof InsertChange) {
      changeRecorder.insertLeft(declarationChange.pos, declarationChange.toAdd);
    }

    const arrayChange = appendToArrayDeclaration(
      source, 'allComponents', componentName);
    if (arrayChange instanceof InsertChange) {
      changeRecorder.insertLeft(arrayChange.pos, arrayChange.toAdd);
    }

    tree.commitUpdate(changeRecorder);
    return tree;
  };
}

function addToAppComponentHtml(options: any): Rule {
  return (tree: Tree) => {
    if (options.skipAppComponentHtml) {
      return tree;
    }
    const filePath = '/src/app/app.component.html';
    const $ = cheerio.load(getFileText(tree, filePath));
    const actionComponentSelector =
      `${options.clicheName}-${strings.dasherize(options.actionName)}`
    const componentHtml =
      `  <h2>${options.actionName}</h2>\n` +
      `  <${actionComponentSelector}></${actionComponentSelector}>\n`;
    $('div[class=container]').append(componentHtml);

    // only take the contents of the body since cheerio .html() adds extra
    // html, head, body tags that we don't want
    // https://github.com/cheeriojs/cheerio/issues/1031
    const updatedText = $('body').html();
    tree.overwrite(filePath, updatedText ? updatedText as string : '');
    return tree;
  }
}