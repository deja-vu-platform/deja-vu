export enum TransactionStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Canceled = 'Canceled'
}

export interface Party {
  id: string;
  balance?: number;
}

export interface Good {
  id?: string;
  seller?: Party;
  price?: number;
  supply?: number;
  marketId?: string;
}

export interface Transaction {
  id: string;
  good: Good;
  buyer: Party;
  seller: Party;
  pricePerGood: number;
  quantity: number;
  marketId: string;
  status: TransactionStatus;
}

export interface CompoundTransaction {
  id: string;
  transactions: Transaction[];
  totalPrice: number;
  status: TransactionStatus;
}
