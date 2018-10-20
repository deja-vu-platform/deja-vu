export interface Pending {
  _pending?: PendingDoc;
}

export interface ObjectDoc extends Pending {
  [field: string]: any;
}

export interface PendingDoc {
  reqId: string;
}
