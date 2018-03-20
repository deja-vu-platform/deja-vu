export interface Market {
  id: string;
}

export interface Party {
  id: string;
  balance: number;
}

export interface Good {
  id: string;
  name: string;
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
  status: string;
}

export interface CompoundTransaction {
  id: string;
  transactions: Transaction[];
  totalPrice: number;
}
