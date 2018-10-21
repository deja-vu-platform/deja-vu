export interface Transfer {
  id: string;
  fromId?: string;
  toId: string;
  amount: Amount;
}

export interface ItemCount {
  id: string;
  count: number;
}

export type Amount = number | ItemCount[];
