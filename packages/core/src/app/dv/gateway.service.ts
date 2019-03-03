import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ElementRef, Inject, Injectable, InjectionToken, Renderer2, RendererFactory2
} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import * as _ from 'lodash';

import { NodeUtils } from './node.utils';

import { RunService } from './run.service';


export interface Dict {
  [field: string]: any;
}

export interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}
export const GATEWAY_URL = new InjectionToken<string>('gateway.url');

const SUCCESS = 200;

export enum Method {
  GET = 'GET',
  POST = 'POST'
}

export interface Params {
  from: string;
  runId: string;
  path?: string;
  options?: string;
  [s: string]: string; // won't actually ever have more but typing expects this
}

export interface ChildRequest {
  method: Method;
  body: string | Object;
  query: Params;
}

interface ChildResponse {
  status: number;
  body: Object;
}


const headers = new HttpHeaders({ 'Content-type': 'application/json' });


/**
 * Class for batching transaction requests.
 */
export class TxRequest {
  // info that would have been sent by each action individually
  private requests: ChildRequest[] = [];
  // observables given to the actions to post responses to
  private subjects: Subject<any>[] = [];
  // the number of actions in this transaction that have posted
  private numActionsDone = 0;
  // the number of actions in the transaction
  // this is known only in the runService so it must be set after construction
  private numActionsTotal: number;

  constructor(
    private gatewayUrl: string,
    private http: HttpClient,
    private fromNode: any,
    private renderer: Renderer2,
    private rs: RunService
  ) { }

  /**
   * Set the number of actions that are part of the tx
   * The tx request will never be sent until this is done
   */
  setNumActions(numActions: number): void {
    this.numActionsTotal = numActions;
    if (this.isReady()) {
      this.send();
    }
  }

  /**
   * Add a request to the batch.
   * Returned observable resolves with response (after send is called)
   */
  postRequest<T>(chReq?: ChildRequest): Observable<T> {
    const subject = new Subject<T>();
    this.requests.push(chReq);
    this.subjects.push(subject);
    this.postNoRequest();

    return subject.asObservable();
  }

  /**
   * Report an action in the tx group as not sending a request
   */
  postNoRequest(): void {
    this.numActionsDone += 1;
    if (this.isReady()) {
      this.send();
    }
  }

  /**
   * Whether or not the request is ready to send
   */
  private isReady(): boolean {
    return (
      this.numActionsTotal !== undefined
      && this.numActionsDone === this.numActionsTotal
    );
  }

  /**
   * Gets the context for this tx request.
   * The context is a map `field -> value` for all the fields of the app action
   * containing the tx. Only fields that can be referenced in template exprs
   * are included (e.g., `ngOnInit` is not part of the context)
   */
  private getContext(): { [field: string]: any } {
    const appActionNode = NodeUtils
      .GetAppActionNodeContainingNode(this.fromNode, this.renderer);
    if (appActionNode === null) {
      throw new Error(
        `App node for ${NodeUtils.GetFqTagOfNode(this.fromNode)} not found`);
    }
    const actionId = NodeUtils.GetActionId(appActionNode);
    const actionInstance = this.rs.getActionInstance(actionId);
    if (actionInstance === null) {
      throw new Error(
        `Action instance for id ${actionId} not found`);
    }

    // TODO: get the exact fields of the context that we need from the
    //  source code and send only those (instead of sending everything)

    // keys retains only enumerable properties
    const contextKeys = _.without(_.keys(actionInstance), 'rs', 'elem');

    const context = _.pickBy(
      // Output fields are implemented with getters and setters, which are not
      // returned by `keys`. The internal field has an extra '_'. So if we
      // ran into a field with 3 underscores we rename it to strip the first
      // one so that it matches how it is used in the source html. This also
      // has the side effect that it will clobber the `EventEmitter` value,
      // which we don't need to send
      _.mapKeys(
        _.pick(actionInstance, contextKeys),
        (_value, key: string) => key.startsWith('___') ? key.slice(1) : key),
      (value) => _.isArray(value) || _.isPlainObject(value) ||
        _.isBoolean(value) || _.isNumber(value) || _.isString(value) ||
        value === undefined || value === null);

    return context;
  }

  /**
   * Send all of the requests.
   */
  private send(): void {
    // not in transaction: just send it
    if (this.numActionsTotal === 1) {
      const { method, body, query: params } = this.requests[0];
      let obs: Observable<any> = null;
      switch (method) {
        case Method.GET:
          obs = this.http.get(
            this.gatewayUrl,
            { params }
          );
          break;
        case Method.POST:
          obs = this.http.post(
            this.gatewayUrl,
            typeof body === 'object' ? JSON.stringify(body) : body,
            { params, headers }
          );
          break;
      }
      const subject = this.subjects[0];
      obs.subscribe(
        (resBody) => {
          subject.next(resBody);
          subject.complete();
        },
        (error) => {
          subject.error(error);
          subject.complete();
        }
      );
    } else {
      this.http.post<ChildResponse[]>(
        this.gatewayUrl,
        { context: this.getContext(), requests: this.requests },
        { headers, params: { isTx: '1' } }
      )
        .subscribe(
          (responses) => {
            responses.forEach(({ status, body }, i) => {
              if (status === SUCCESS) {
                this.subjects[i].next(body);
              } else {
                this.subjects[i].error({
                  status,
                  error: body
                });
              }
              this.subjects[i].complete();
            });
          });
    }
    // this object will never be used again so we can drop the reference
    delete GatewayService.txBatches[NodeUtils.GetRunId(this.fromNode)];
  }

}


export class GatewayService {
  static txBatches: { [txId: string]: TxRequest } = {};
  fromStr: string;

  constructor(
    private gatewayUrl: string,
    private http: HttpClient,
    private renderer: Renderer2,
    private rs: RunService,
    private from: ElementRef
  ) {
    this.fromStr = this.generateFromStr();
  }

  /**
   * An action must call get, post, or noRequest exactly once
   */

  get<T>(path?: string, options?: RequestOptions) {
    return this.request<T>(
      Method.GET,
      path,
      undefined,
      options
    );
  }

  post<T>(path?: string, body?: string | Object, options?: RequestOptions) {
    return this.request<T>(
      Method.POST,
      path,
      body,
      options
    );
  }

  noRequest() {
    const runId = NodeUtils.GetRunId(this.from.nativeElement);
    const txRequest = this.getTxReq(runId);
    txRequest.postNoRequest();
  }

  protected isAction(node: Element): boolean {
    return NodeUtils.IsAction(node);
  }

  /**
   * Action path.
   */
  protected generateFromStr(): string {
    let node = this.from.nativeElement;
    const seenActionNodes: string[] = [];
    while (node && node.getAttribute) {
      if (this.isAction(node)) {
        seenActionNodes.push(NodeUtils.GetFqTagOfNode(node));
      }

      let dvClass: string | null = null;
      for (const cssClass of NodeUtils.GetCssClassesOfNode(node)) {
        const match = /dv-parent-is-(.*)/i.exec(cssClass);
        dvClass = match ? match[1] : null;
      }
      if (dvClass !== null) {
        node = this.renderer.selectRootElement('.dv-' + dvClass);
      } else {
        node = this.renderer.parentNode(node);
      }
    }

    return JSON.stringify(_.reverse(seenActionNodes));
  }

  /**
   * Gets a TxRequest for runId or makes a new one
   */
  public getTxReq(runId?: string): TxRequest {
    let txRequest = GatewayService.txBatches[runId];
    if (txRequest === undefined) {
      txRequest = new TxRequest(
        this.gatewayUrl, this.http, this.from.nativeElement,
        this.renderer, this.rs);
      if (runId) {
        GatewayService.txBatches[runId] = txRequest;
      }
    }

    return txRequest;
  }

  private request<T>(
    method: Method,
    path?: string,
    body?: string | Object,
    options?: RequestOptions
  ): Observable<T> {
    console.log(`Sending ${method} from ${this.getActionName()}`);

    const params = this.buildParams(path, options);

    const txRequest = this.getTxReq(params.runId);

    const individualResponseObservable = txRequest.postRequest<T>({
      method,
      body,
      query: params
    });

    if (!params.runId) {
      txRequest.setNumActions(1);
    }

    return individualResponseObservable;
  }

  private buildParams(path?: string, options?: RequestOptions): Params {
    const params = {
      from: this.fromStr,
      fullActionName: this.getActionName(),
      runId: NodeUtils.GetRunId(this.from.nativeElement)
    };
    if (path) {
      params['path'] = path;
    }
    if (options) {
      params['options'] = JSON.stringify(options);
    }

    return params;
  }

  private getActionName(): string {
    return this.from.nativeElement.nodeName.toLowerCase();
  }
}


export class DesignerGatewayService extends GatewayService {

  constructor(
    gatewayUrl: string,
    http: HttpClient,
    renderer: Renderer2,
    rs: RunService,
    from: ElementRef
  ) {
    super(gatewayUrl, http, renderer, rs, from);
  }

  protected isAction(node: Element): boolean {
    return _.get(node, ['dataset', 'isaction']) === 'true';
  }

  get fromStr() {
    return this.generateFromStr();
  }

  // necessary because GatewayService tries setting fromStr in the constructor
  set fromStr(_s) { }

}


@Injectable()
export class GatewayServiceFactory {
  private readonly renderer: Renderer2;
  constructor(
    @Inject(GATEWAY_URL) private gatewayUrl: string, private http: HttpClient,
    rendererFactory: RendererFactory2, private rs: RunService) {
    // https://github.com/angular/angular/issues/17824
    // It seems like while you can get Renderer2 injected in components it
    // doesn't work for services. The workaround is to get the factory injected
    // and use it to create a renderer.
    // If you pass null null to `createRenderer` it returns the default renderer
    // without creating a new one
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  // This method should be called onInit (or after)
  // Calling `for` in before onInit can cause problems because the component
  // might not be attached to the dom (thus making it impossible to find the
  // parents of the from element).
  // TODO: I think this is the problem but I should investigate more
  for(from: ElementRef): GatewayService {
    const cls = window['dv-designer'] ? DesignerGatewayService : GatewayService;

    return new cls(this.gatewayUrl, this.http, this.renderer, this.rs, from);
  }
}
