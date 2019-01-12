export interface ItemCount {
  id: string;
  count: number;
}

export interface PendingTransfer<Balance> {
  updateId: string;
  transfer: TransferDoc<Balance>;
}

export interface AccountDoc<Balance> {
  id: string;
  balance: Balance;
  /*
   * This field exists if the account itself is pending.
   * This could be because it's the first time we are seeing a transfer from/to
   * this account. If the transfer ends up being aborted, we'll delete
   * the account.
   */
  pending?: string;
  // This field exists if the account has a pending transfer
  pendingTransfer?: PendingTransfer<Balance>;
}

export interface AccountPendingDoc<Balance> {
  id: string;
  balance: Balance;
  pending: string;
  pendingTransfer: PendingTransfer<Balance>;
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
