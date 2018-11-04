import { ActionStEntry, ActionSymbolTable } from '../../symbolTable';

import * as _ from 'lodash';


export const DV_ACTION = 'dv.action';
export const DV_ACTION_NAME_ATTR = 'name';

export function isInput(name: string) {
  return _.startsWith(name, '$');
}

export function inputToNgField(input: string) {
  return `__ngInput__${input.substr(1)}`;
}

export function isNgComponent(name: string): boolean {
  return _.includes(name, '-');
}

export function classNameToNgField(name: string): string {
  return `__actionInput__${_.camelCase(name)}`;
}

export function getStEntryForNgComponent(
  ngComponentName: string, symbolTable: ActionSymbolTable, alias?: string)
  : ActionStEntry | undefined {
  const [ clicheName, actionName ] = _.split(ngComponentName, /-(.+)/ );
  const stPath = (alias === undefined) ?
    `${clicheName}.symbolTable.${actionName}` : alias;

  return <ActionStEntry | undefined> _.get(symbolTable, stPath);
}

export function outputToNgField(
  clicheName: string, actionName: string, output: string, alias?: string) {
  const aliasStr = (alias === undefined) ? '' : `_${alias}`;

  return `__ngOutput__${clicheName}_${actionName}_${output}${aliasStr}`;
}
