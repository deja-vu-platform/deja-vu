


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
}

export interface OutputStEntry {
  kind: 'output';
}

export interface InputStEntry {
  kind: 'input';
}

export type StEntry = ClicheStEntry | AppStEntry | ActionStEntry |
  OutputStEntry | InputStEntry;

/**
 * Each action has its own symbol table to keep track of the symbols that can
 * appear in attribute exprs.
 */
export type ActionSymbolTable = SymbolTable<
  OutputStEntry | ActionStEntry | InputStEntry | ClicheStEntry>;


export interface SymbolTable<T = AppStEntry | ClicheStEntry> {
  [symbol: string]: T;
}

