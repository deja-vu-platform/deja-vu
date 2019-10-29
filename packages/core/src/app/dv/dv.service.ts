import { ElementRef, Injectable } from '@angular/core';

import { ConfigService, ConfigServiceFactory } from './config.service';
import {
  GatewayService, GatewayServiceFactory, RequestOptions
} from './gateway.service';
import { RefreshService } from './refresh.service';
import { RunService } from './run.service';
import { StorageService } from './storage.service';
import { SubscriptionService } from './subscription.service';
import { WaiterService, WaiterServiceFactory } from './waiter.service';


/**
 * Service aggregator
 */
@Injectable()
export class DvServiceFactory {
  constructor(
    private readonly gsf: GatewayServiceFactory,
    private readonly wsf: WaiterServiceFactory,
    private readonly csf: ConfigServiceFactory,
    private readonly run: RunService,
    private readonly storage: StorageService,
    private readonly sub: SubscriptionService,
    private readonly refresh: RefreshService) {
  }

  forComponent(component): DvServiceBuilder {
    return new DvServiceBuilder(
      component, this.gsf, this.wsf, this.csf, this.run, this.storage, this.sub,
      this.refresh);
  }
}

export class DvServiceBuilder {
  private defaultWaiter = false;
  private refreshCallback: (() => void) | undefined;

  constructor(
    private readonly component,
    private readonly gsf: GatewayServiceFactory,
    private readonly wsf: WaiterServiceFactory,
    private readonly csf: ConfigServiceFactory,
    private readonly run: RunService,
    private readonly storage: StorageService,
    private readonly sub: SubscriptionService,
    private readonly refresh: RefreshService) {
  }

  withDefaultWaiter(): DvServiceBuilder {
    this.defaultWaiter = true;

    return this;
  }

  // you must call onDestroy on ngOnDestroy if you register a refresh callback
  withRefreshCallback(refreshFn: () => void): DvServiceBuilder {
    this.refreshCallback = refreshFn;

    return this;
  }

  build(): DvService {
    const elem = this.component.elem;
    if (elem === undefined) {
      throw new Error(
        'Missing elem: add `elem: ElementRef` to your constructor');
    }
    const gateway = this.gsf.for(elem);
    const waiter = this.defaultWaiter ?
      this.wsf.for(this.component, this.component.waitOn) : undefined;
    const config = this.csf.createConfigService(elem);
    this.run.register(elem, this.component);
    const destroyFn = this.refreshCallback ?
      this.refresh.register(this.refreshCallback) : undefined;

    return new DvService(
      gateway, waiter, config, this.sub, elem, this.run, this.storage,
      destroyFn);
  }
}

export class DvService {
  constructor(
    public readonly gateway: GatewayService,
    public readonly waiter: WaiterService | undefined,
    public readonly config: ConfigService,
    public readonly sub: SubscriptionService,
    private readonly elem: ElementRef,
    private readonly run: RunService,
    private readonly storage: StorageService,
    private readonly destroyFn: (() => void) | undefined) {}

  onDestroy() {
    if (this.destroyFn) {
      this.destroyFn();
    }
  }

  exec(): void {
    this.run.exec(this.elem);
  }

  eval(): void {
    this.run.eval(this.elem);
  }

  setItem(key: string, value: any): void {
    this.storage.setItem(this.elem, key, value);
  }

  getItem(key: string): any {
    return this.storage.getItem(this.elem, key);
  }

  removeItem(key: string): void {
    this.storage.removeItem(this.elem, key);
  }

  removeItems(...keys: string[]): void {
    for (const key of keys) {
      this.storage.removeItem(this.elem, key);
    }
  }

  async waitAndGet<T>(path?: string, optionsFn?: () => RequestOptions)
      : Promise<T> {
    if (this.waiter === undefined) {
      throw new Error(`You called waitAndGet but there's no waiter.` +
        `You must add withDefaultWaiter to the dv service`);
    }
    await this.waiter.maybeWait();
    const options = optionsFn ? optionsFn() : undefined;

    return await this.gateway.get<T>(path, options)
      .toPromise();
  }

  async waitAndPost<T>(
    path?: string, bodyFn?: () => string | Object,
    optionsFn?: () => RequestOptions): Promise<T> {
    if (this.waiter === undefined) {
      throw new Error(`You called waitAndPost but there's no waiter.` +
        `You must add withDefaultWaiter to the dv service`);
    }
    await this.waiter.maybeWait();
    const body = bodyFn ? bodyFn() : undefined;
    const options = optionsFn ? optionsFn() : undefined;

    return await this.gateway.post<T>(path, body, options)
      .toPromise();
  }

  async get<T>(path?: string, options?: RequestOptions): Promise<T> {
    return await this.gateway.get<T>(path, options)
      .toPromise();
  }

  async post<T>(
    path?: string, body?: string | Object, options?: RequestOptions)
    : Promise<T> {
    return await this.gateway.post<T>(path, body, options)
      .toPromise();
  }

  noRequest(): void {
    this.gateway.noRequest();
  }
}
