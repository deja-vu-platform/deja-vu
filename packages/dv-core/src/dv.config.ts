import { InjectionToken } from '@angular/core';

export const DV_CONFIG = new InjectionToken<DvConfig>('dv.config');

export interface DvConfig {
  name: string;
  gatewayUrl: string;
  usedCliches: {[as: string]: DvConfig};
}
