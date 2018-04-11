export interface Item {
  id: string;
  labels?: Label[];
}

export interface Label {
  id: string;
  items?: Item[];
}
