export interface LabelDoc {
  id: string;
  itemIds?: string[];
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
