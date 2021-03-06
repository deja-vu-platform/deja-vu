import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subject } from 'rxjs/Subject';
import { v4 as uuid } from 'uuid';

import { BaseParams, GATEWAY_URL } from './gateway.service';


interface SubscriptionParams extends BaseParams {
  subscriptionId: string;
}

interface Subscription extends SubscriptionParams {}


@Injectable()
export class SubscriptionService {
  private websocket: WebSocketSubject<any>;
  private componentSubscriptions: {[key: string]: Subject<any>} = {};

  constructor(@Inject(GATEWAY_URL) private gatewayUrl: string) {
    this.websocket = WebSocketSubject.create(`ws://${gatewayUrl}`);
    this.websocket.subscribe(
      (msg) => this.handleMessage(msg),
      (err) => console.log(err),
      () => console.log('complete')
    );
  }

  subscribe<T>(request: Object, baseParams: BaseParams): Observable<T> {
    const params: SubscriptionParams = this.buildParams(baseParams);
    const subscriptionId = params.subscriptionId;
    const subject = new ReplaySubject<T>();
    this.componentSubscriptions[subscriptionId] = subject;

    const subscription: Subscription = Object.assign(params, request, {
      extraInfo: {
        action: 'subscribe',
        ...request['extraInfo']
      }
    });

    this.sendSubscription(subscription);
    console.log('Subscription for: ' + subscriptionId);
    console.log(subscription);

    return subject.asObservable();
  }

  private buildParams(baseParams: BaseParams): SubscriptionParams {
    const subscriptionId = uuid();

    return Object.assign({}, baseParams, { subscriptionId });
  }

  private sendSubscription(subscription: Subscription) {
    this.getWebSocket()
      .next(JSON.stringify(subscription));
  }

  private handleMessage(msg): void {
    console.log('Message received from gateway: %s',
      JSON.stringify(msg));
    if (msg.subscriptionId && this.componentSubscriptions[msg.subscriptionId]) {
      this.componentSubscriptions[msg.subscriptionId].next(msg.data);
    }
  }

  private getWebSocket(): WebSocketSubject<any> {
    if (this.websocket.closed) {
      this.websocket = this.createWebSocket();
    }

    return this.websocket;
  }

  private createWebSocket(): WebSocketSubject<any> {
    return WebSocketSubject.create(`ws://${this.gatewayUrl}`);
  }
}
