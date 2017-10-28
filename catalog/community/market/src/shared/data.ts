import {Atom} from "client-bus";

export interface Market {}

export interface MarketAtom extends Party, Atom {}

export interface Party {
  balance: number;
}

export interface PartyAtom extends Party, Atom {}

export interface Good {
  name: string;
  seller: PartyAtom;
  price: number;
  supply: number;
  market: MarketAtom;
}

export interface GoodAtom extends Good, Atom {}

export interface Transaction {
  good: GoodAtom;
  buyer: PartyAtom;
  seller: PartyAtom;
  price: number;
  quantity: number;
  market: MarketAtom;
}

export interface TransactionAtom extends Transaction, Atom {}

export interface CompoundTransaction {
  transactions: Transaction[];
  status: string;
}

export interface CompoundTransactionAtom extends CompoundTransaction, Atom {}
