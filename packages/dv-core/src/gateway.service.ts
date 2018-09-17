import {
  ElementRef, Renderer2, RendererFactory2, InjectionToken, Inject, Injectable
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { RUN_ID_ATTR } from './run.service';

import * as _ from 'lodash';


export type Dict = {[field: string]: string};
export interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}
export const GATEWAY_URL = new InjectionToken<string>('gateway.url');

export const OF_ATTR = 'dvOf';

export class GatewayService {
  fromStr: string;

  constructor(
    private gatewayUrl: string, private http: HttpClient, renderer: Renderer2,
    private from: ElementRef) {
    let node = from.nativeElement;
    const seenNodes: string[] = [];
    while (node && node.getAttribute) {
      let name = node.nodeName.toLowerCase();
      const dvOf: string = node.getAttribute(OF_ATTR);
      if (dvOf) {
        name = dvOf + name.substring(name.indexOf('-'));
      }
      seenNodes.push(name);

      const classAttr = node.getAttribute('class');
      let dvClass: string | null = null;
      if (!_.isEmpty(classAttr)) {
        for (const cssClass of classAttr.split()) {
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
    this.fromStr = JSON.stringify(seenNodes);
  }

  get<T>(path?: string, options?: RequestOptions): Observable<T> {
    console.log(
      `Sending get from ${this.from.nativeElement.nodeName.toLowerCase()}`);
    return this.http.get<T>(
      this.gatewayUrl, {
        params: this.buildParams(path, options)
      });
  }

  /** If the body is an Object it will be converted to JSON **/
  post<T>(
    path?: string, body?: string | Object, options?: RequestOptions): Observable<T> {
    console.log(
      `Sending post from ${this.from.nativeElement.nodeName.toLowerCase()}`);
    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
    return this.http.post<T>(
      this.gatewayUrl, body, {
        params: this.buildParams(path, options),
        headers: new HttpHeaders({'Content-type': 'application/json'})
      });
    }


  private buildParams(path?: string, options?: RequestOptions)
    : {[params: string]: string} {
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
  private renderer: Renderer2;
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

  /** This method should be called onInit (or after) **/
  // Calling `for` in before onInit can cause problems because the component
  // might not be attached to the dom (thus making it impossible to find the
  // parents of the from element).
  // TODO: I think this is the problem but I should investigate more
  for(from: ElementRef) {
    return new GatewayService(this.gatewayUrl, this.http, this.renderer, from);
  }
}
