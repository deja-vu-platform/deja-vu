export type EntryKind = 'concept' | 'app' | 'component' | 'output' | 'input' |
  'app-output';

export interface ConceptStEntry {
  kind: 'concept';
  symbolTable?: SymbolTable<ComponentStEntry>;
  conceptName?: string;
}

export interface AppStEntry {
  kind: 'app';
  symbolTable?: SymbolTable<ComponentStEntry>;
}

export interface ComponentStEntry {
  kind: 'component';
  symbolTable?: ComponentSymbolTable;
  // Because components can be aliased, we always record the concept and component name
  of?: string;
  componentName?: string;
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
  ConceptStEntry | AppStEntry | ComponentStEntry | OutputStEntry | InputStEntry |
  AppOutputStEntry;

export type ComponentSymbolTableStEntry =
  ConceptStEntry | ComponentStEntry | OutputStEntry | InputStEntry |
  AppStEntry | AppOutputStEntry;

/**
 * Each component has its own symbol table to keep track of the symbols that can
 * appear in attribute exprs.
 */
export type ComponentSymbolTable = SymbolTable<ComponentSymbolTableStEntry>;


export interface SymbolTable<T = AppStEntry | ConceptStEntry> {
  [symbol: string]: T;
}

export function pretty(obj: object) {
  return JSON.stringify(obj, null, 2);
}
