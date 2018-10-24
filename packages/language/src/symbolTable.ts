
export interface ClicheStEntry {
  kind: 'cliche';
  symbolTable?: SymbolTable<ActionStEntry>;
  clicheName: string;
}

export interface AppStEntry {
  kind: 'app';
  symbolTable?: SymbolTable<ActionStEntry>;
}

export interface ActionStEntry {
  kind: 'action';
  symbolTable?: SymbolTable<OutputStEntry>;
}

export interface OutputStEntry {
  kind: 'output';
}

export interface InputStEntry {
  kind: 'input';
}

export interface SymbolTable<T = AppStEntry | ClicheStEntry | InputStEntry> {
  [symbol: string]: T;
}

