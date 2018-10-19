export interface LabelDoc {
  id: string;
  itemIds?: string[];
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-label' | 'add-labels-to-item';
}

export interface LabelsInput {
  itemId?: string;
}

export interface ItemsInput {
  labelIds?: string[];
}

export interface AddLabelsToItemInput {
  itemId: string;
  labelIds: string[];
}
