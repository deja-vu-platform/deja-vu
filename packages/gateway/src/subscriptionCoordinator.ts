import { ExecutionResult } from 'graphql';
import {
  SubscriptionClient, OperationOptions, Observable
} from 'subscriptions-transport-ws';
import * as WebSocket from 'ws';


export class SubscriptionCoordinator {
  private readonly wsClientTable: { [url: string]: SubscriptionClient } = {};

  forwardRequest(url: string, request: Object): Observable<ExecutionResult> {
    return this.getClient(url).request(request);
  }

  private getClient(url: string): SubscriptionClient {
    if (!this.wsClientTable[url]) {
      const newClient = this.initializeClient(url);
      this.wsClientTable[url] = newClient;
    }

    return this.wsClientTable[url];
  }

  private initializeClient(url: string): SubscriptionClient {
    return new SubscriptionClient(url,
    {
      reconnect: true,
      connectionParams: {
        // TODO
      },
    }, WebSocket)
    .use([
      {
        applyMiddleware: (options: OperationOptions, next) => {
          // query is required by SubscriptionClient
          // but will be set by each cliche based on the action name
          if (!options.query) {
            options.query = 'to be set';
          }
          console.log('gateway subscription coord middleware');
          console.log(options);
          next();
        }
      }
    ]);
  }
}
