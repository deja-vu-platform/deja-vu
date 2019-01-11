import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ElementRef, Inject, Injectable, InjectionToken, Renderer2, RendererFactory2
} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { RUN_ID_ATTR } from './run.service';

import * as _ from 'lodash';


export interface Dict {
  [field: string]: any;
}

export interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}
export const GATEWAY_URL = new InjectionToken<string>('gateway.url');

export const OF_ATTR = 'dvOf';
export const ALIAS_ATTR = 'dvAlias';
const CLASS_ATTR = 'class';
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


const headers = new HttpHeaders({'Content-type': 'application/json'});


/**
 * Class for batching transaction requests.
 */
export class TxRequest {
  private requests: ChildRequest[] = [];
  private subjects: Subject<any>[] = [];

  constructor(private gatewayUrl: string, private http: HttpClient) { }

  /**
   * Add a request to the batch.
   * Returned observable resolves with response (after send is called)
   */
  add<T>(chReq: ChildRequest): Observable<T> {
    this.requests.push(chReq);
    const subject = new Subject<T>();
    this.subjects.push(subject);

    return subject.asObservable();
  }

  /**
   * Send all of the requests.
   */
  send(): void {
    // not in transaction: just send it
    if (this.size === 1) {
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
        this.requests,
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
  }

  get size() {
    return this.subjects.length;
  }
}


export class GatewayService {
  static txBatches: { [txId: string]: TxRequest} = {};

  fromStr: string;

  private static GetAttribute(node, attribute: string): string | undefined {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
    if (node.hasAttribute(attribute)) {
      return node.getAttribute(attribute);
    }

    return undefined;
  }

  private static GetTag(node): string {
   return node.nodeName.toLowerCase();
  }

  private static IsAction(node): boolean {
    // No HTML tag has a hyphen
    return _.includes(GatewayService.GetTag(node), '-');
  }

  private static GetFqTag(tag, dvAlias, dvOf): string {
    if (!_.isEmpty(dvAlias)) {
      return dvAlias;
    } else if (!_.isEmpty(dvOf)) {
      return dvOf + tag.substring(tag.indexOf('-'));
    } else {
      return tag;
    }
  }

  private static GetFqTagFromNode(node): string {
    const tag = GatewayService.GetTag(node);
    const dvAlias = GatewayService.GetAttribute(node, ALIAS_ATTR);
    const dvOf = GatewayService.GetAttribute(node, OF_ATTR);

    return GatewayService.GetFqTag(tag, dvAlias, dvOf);
  }

  constructor(
    private gatewayUrl: string, private http: HttpClient, renderer: Renderer2,
    private from: ElementRef) {
    let node = from.nativeElement;
    const seenActionNodes: string[] = [];
    while (node && node.getAttribute) {
      if (GatewayService.IsAction(node)) {
       seenActionNodes.push(GatewayService.GetFqTagFromNode(node));
      }

      const classAttr = GatewayService.GetAttribute(node, CLASS_ATTR);
      let dvClass: string | null = null;
      if (!_.isEmpty(classAttr)) {
        for (const cssClass of classAttr!.split(' ')) {
          const match = /dv-parent-is-(.*)/i.exec(cssClass);
          dvClass = match ? match[1] : null;
        }
      }
      if (dvClass !== null) {
        node = renderer.selectRootElement('.dv-' + dvClass);
      } else {
        node = renderer.parentNode(node);
      }
    }
    this.fromStr = JSON.stringify(_.reverse(seenActionNodes));
  }

  get<T>(path?: string, options?: RequestOptions) {
    return this.request<T>(
      Method.GET,
      path,
      undefined,
      options
    );
  }

  /**
   * If the body is an Object it will be converted to JSON
   */
  post<T>(path?: string, body?: string | Object, options?: RequestOptions) {
    return this.request<T>(
      Method.POST,
      path,
      body,
      options
    );
  }

  private request<T>(
    method: Method,
    path?: string,
    body?: string | Object,
    options?: RequestOptions
  ): Observable<T> {
    console.log(
      `Sending ${method} from ${this.from.nativeElement.nodeName.toLowerCase()}`
    );

    const params = this.buildParams(path, options);

    let txRequest = GatewayService.txBatches[params.runId];
    if (txRequest === undefined) {
      txRequest = new TxRequest(this.gatewayUrl, this.http);
      if (params.runId) {
        GatewayService.txBatches[params.runId] = txRequest;
      }
    }

    const individualResponseObservable = txRequest.add<T>({
      method,
      body,
      query: params
    });

    if (!params.runId) {
      txRequest.send();
    }

    return individualResponseObservable;
  }

  private buildParams(path?: string, options?: RequestOptions): Params {
    const params = {
      from: this.fromStr,
      runId: this.from.nativeElement.getAttribute(RUN_ID_ATTR)
    };
    if (path) {
      params['path'] = path;
    }
    if (options) {
      params['options'] = JSON.stringify(options);
    }

   return params;
  }
}


@Injectable()
export class GatewayServiceFactory {
  private readonly renderer: Renderer2;
  constructor(
    @Inject(GATEWAY_URL) private gatewayUrl: string, private http: HttpClient,
    rendererFactory: RendererFactory2) {
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
  for(from: ElementRef) {
    return new GatewayService(this.gatewayUrl, this.http, this.renderer, from);
  }
}
