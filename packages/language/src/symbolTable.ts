export type EntryKind = 'cliche' | 'app' | 'action' | 'output' | 'input' |
  'app-output';

export interface ClicheStEntry {
  kind: 'cliche';
  symbolTable?: SymbolTable<ActionStEntry>;
  clicheName?: string;
}

export interface AppStEntry {
  kind: 'app';
  symbolTable?: SymbolTable<ActionStEntry>;
}

export interface ActionStEntry {
  kind: 'action';
  symbolTable?: ActionSymbolTable;
  // Because actions can be aliased, we always record the cliche and action name
  of?: string;
  actionName?: string;
}

export interface OutputStEntry {
  kind: 'output';
  // The field used in the ng component to store the output value
  ngOutputField?: string;
}

export interface AppOutputStEntry {
  kind: 'app-output';
  // The field used in the ng component to store the output value
  ngOutputField?: string;
  expr?: string;
}

export interface InputStEntry {
  kind: 'input';
  // The field used in the ng component to store the input value
  ngInputField?: string;
}

export type StEntry =
  ClicheStEntry | AppStEntry | ActionStEntry | OutputStEntry | InputStEntry |
  AppOutputStEntry;

export type ActionSymbolTableStEntry =
  ClicheStEntry | ActionStEntry | OutputStEntry | InputStEntry |
  AppOutputStEntry;

/**
 * Each action has its own symbol table to keep track of the symbols that can
 * appear in attribute exprs.
 */
export type ActionSymbolTable = SymbolTable<ActionSymbolTableStEntry>;


export interface SymbolTable<T = AppStEntry | ClicheStEntry> {
  [symbol: string]: T;
}

export function pretty(obj: object) {
  return JSON.stringify(obj, null, 2);
}
