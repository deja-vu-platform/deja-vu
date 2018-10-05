export interface Transfer {
  id: string;
  fromId?: string;
  toId: string;
  amount: any;
}

export interface ItemCount {
  itemId: string;
  count: number;
}
