import { ElementRef, Injectable } from '@angular/core';

import { ConfigService, ConfigServiceFactory } from './config.service';
import { GatewayService, GatewayServiceFactory } from './gateway.service';
import { RefreshService } from './refresh.service';
import { RunService } from './run.service';
import { StorageService } from './storage.service';
import { SubscriptionService } from './subscription.service';
import { WaiterService, WaiterServiceFactory } from './waiter.service';


/**
 * Service aggregator
 */
@Injectable()
export class DvService {
  public gateway: GatewayService;
  public waiter: WaiterService;
  public config: ConfigService;

  constructor(
    private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory,
    private csf: ConfigServiceFactory,
    public readonly run: RunService,
    public readonly storage: StorageService,
    public readonly sub: SubscriptionService,
    public readonly refresh: RefreshService) {
  }

  register(elem: ElementRef, component, waitOn, refresh?: () => void) {
    this.gateway = this.gsf.for(elem);
    this.waiter = this.wsf.for(component, waitOn);
    this.config = this.csf.createConfigService(elem);
    this.run.register(elem, component);
    if (this.refresh) {
      this.refresh.register(component, refresh);
    }
  }
}
