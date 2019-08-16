import { ExecutionResult } from 'graphql';
import {
  Observable, OperationOptions, SubscriptionClient
} from 'subscriptions-transport-ws';
import * as WebSocket from 'ws';


export class SubscriptionCoordinator {
  private readonly wsClientTable: { [url: string]: SubscriptionClient } = {};

  forwardRequest(url: string, request: Object): Observable<ExecutionResult> {
    return this.getClient(url).request(request);
  }

  unsubscribeAll() {
    Object.keys(this.wsClientTable)
      .forEach((url: string) => {
        this.wsClientTable[url].unsubscribeAll();
        delete this.wsClientTable[url];
      });
  }

  private getClient(url: string): SubscriptionClient {
    if (!this.wsClientTable[url]) {
      const newClient = this.initializeClient(url);
      this.wsClientTable[url] = newClient;
    }

    return this.wsClientTable[url];
  }

  private initializeClient(url: string): SubscriptionClient {
    return new SubscriptionClient(url, {
      reconnect: true
    }, WebSocket)
    .use([
      {
        applyMiddleware: (options: OperationOptions, next) => {
          // query is required by SubscriptionClient
          // but will be set by each concept based on the component name
          if (!options.query) {
            options.query = 'to be set';
          }
          next();
        }
      }
    ]);
  }
}
