export enum TransactionStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  Canceled = 'Canceled'
}

export interface Market {
  id: string;
}

export interface Party {
  id: string;
  balance: number;
}

export interface Good {
  id: string;
  seller: Party;
  price: number;
  supply: number;
  market: Market;
}

export interface Transaction {
  id: string;
  good: Good;
  buyer: Party;
  seller: Party;
  pricePerGood: number;
  quantity: number;
  market: Market;
  status: TransactionStatus;
}

export interface CompoundTransaction {
  id: string;
  transactions: Transaction[];
  totalPrice: number;
  status: TransactionStatus;
}
