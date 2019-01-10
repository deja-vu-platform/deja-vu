import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ElementRef, Inject, Injectable, InjectionToken, Renderer2, RendererFactory2
} from '@angular/core';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { NUM_COHORTS_ATTR, RUN_ID_ATTR } from './run.service';

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

enum Method {
  GET = 'GET',
  POST = 'POST'
}

interface Request {
  method: Method;
  path?: string;
  body?: string | Object;
  options?: RequestOptions;
}

const headers = new HttpHeaders({'Content-type': 'application/json'});


/**
 * Class for batching transaction requests.
 */
class TxRequest {
  private requests: Request[] = [];
  private subjects: Subject<any>[] = [];

  constructor(private gatewayUrl: string, private http: HttpClient) { }

  /**
   * Add a request to the batch.
   * Returned observable resolves with response (after send is called)
   */
  add<T>(request: Request): Observable<T> {
    this.requests.push(request);
    const subject = new Subject<T>();
    this.subjects.push(subject);

    return subject.asObservable();
  }

  /**
   * Send all of the requests.
   */
  send() {
    return this.http.post<[]>(
      this.gatewayUrl, this.requests, { headers, params: { isTx: '1' } }
    )
      .do((responses) => {
        responses.forEach((response, i) => {
          this.subjects[i].next(response);
          this.subjects[i].complete();
        });
      });
  }

  get size() {
    return this.subjects.length;
  }
}


export class GatewayService {
  private static txBatches: { [txId: string]: TxRequest} = {};

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
    return this.request<T>({
      path,
      options,
      body: undefined,
      method: Method.GET
    });
  }

  /**
   * If the body is an Object it will be converted to JSON
   */
  post<T>(path?: string, body?: string | Object, options?: RequestOptions) {
    return this.request<T>({
      path,
      options,
      body,
      method: Method.POST
    });
  }

  private request<T>(request: Request): Observable<T> {
    const { method, path, body, options } = request;
    console.log(
      `Sending ${method} from ${this.from.nativeElement.nodeName.toLowerCase()}`
    );

    const params = this.buildParams(path, options);
    const numCohorts = parseInt(params.numCohorts, 10);
    if (numCohorts > 0) {
      let txRequest = GatewayService.txBatches[params.txId];
      if (txRequest === undefined) {
        txRequest = new TxRequest(this.gatewayUrl, this.http);
        GatewayService.txBatches[params.txId] = txRequest;
      }

      const individualResponseObservable = txRequest.add<T>(request);
      if (txRequest.size > numCohorts) {
        txRequest
          .send()
          .subscribe(() => {
            delete GatewayService.txBatches[params.txId];
          });
      }

      return individualResponseObservable;
    }

    switch (method) {
      case Method.GET:
        return this.http.get<T>(
          this.gatewayUrl,
          { params }
        );
      case Method.POST:
        const strBody = typeof body === 'object' ? JSON.stringify(body) : body;

        return this.http.post<T>(
          this.gatewayUrl,
          strBody,
          { params, headers }
        );
    }
  }

  private buildParams(path?: string, options?: RequestOptions)
    : {[params: string]: string} {
    const params = {
      from: this.fromStr,
      runId: this.from.nativeElement.getAttribute(RUN_ID_ATTR),
      numCohorts: this.from.nativeElement.getAttribute(NUM_COHORTS_ATTR)
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
