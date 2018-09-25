import { InjectionToken } from '@angular/core';

export interface TransferConfig {
  balanceType: 'money' | 'items';
}

export interface ItemCount {
  itemId: string;
  count: number;
}

export const API_PATH = new InjectionToken<string>('api.path');
export const CONFIG = new InjectionToken<TransferConfig>('config');
