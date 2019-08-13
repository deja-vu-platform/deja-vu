import { ComponentStEntry, ComponentSymbolTable } from '../../symbolTable';

import * as _ from 'lodash';


export const DV_COMPONENT = 'dv.component';
export const DV_COMPONENT_NAME_ATTR = 'name';
export const NAV_SPLIT_REGEX = /(?:\.|\?\.)/;

export function isInput(name: string) {
  return _.startsWith(name, '$');
}

export function inputToNgField(input: string) {
  return input.substr(1);
}

// This one needs to match `inputToNgField`
export function attributeNameToInput(attributeName: string) {
  return attributeName;
}

export function isComponent(name: string): boolean {
  return _.includes(name, '-') && !name.startsWith('mat-');
}

export function classNameToNgField(name: string): string {
  return `__componentInput__${_.camelCase(name)}`;
}

export function getStEntryForNgComponent(
  ngComponentName: string, symbolTable: ComponentSymbolTable, alias?: string)
  : ComponentStEntry | undefined {
  const [ conceptName, componentName ] = _.split(ngComponentName, /-(.+)/ );
  const stPath = (alias === undefined) ?
    `${conceptName}.symbolTable.${componentName}` : alias;

  return <ComponentStEntry | undefined> _.get(symbolTable, stPath);
}

export function outputToNgField(
  conceptName: string, componentName: string, output: string, alias?: string) {
  const aliasStr = (alias === undefined) ? '' : `__${alias.replace(/-/g, '_')}`;
  const componentNameNoHyphens = componentName.replace(/-/g, '_');

  return `__ngOutput__${conceptName}__` +
    `${componentNameNoHyphens}__${output}${aliasStr}`;
}
