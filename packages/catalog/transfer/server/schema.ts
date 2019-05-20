export interface ItemCount {
  id: string;
  count: number;
}

export interface AccountDoc<Balance> {
  id: string;
  balance: Balance;
}

export interface TransferDoc<Balance> {
  id: string;
  fromId?: string;
  toId: string;
  amount: Balance;
}

export interface AddToBalanceInput<Balance> {
  accountId: string;
  amount: Balance;
}

export interface CreateTransferInput<Balance> {
  id: string;
  fromId: string;
  toId: string;
  amount: Balance;
}

export interface TransfersInput {
  fromId?: string;
  toId?: string;
}
