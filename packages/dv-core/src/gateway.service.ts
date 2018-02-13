import {
  ElementRef, Renderer2, RendererFactory2, InjectionToken, Inject, Injectable
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';


export type Dict = {[field: string]: string};
export interface RequestOptions {
  params?: Dict;
  headers?: Dict;
}
export const GATEWAY_URL = new InjectionToken<string>('gateway.url');


export class GatewayService {
  fromStr: string;

  constructor(
    private gatewayUrl: string, private http: HttpClient, renderer: Renderer2,
    private from: ElementRef) {
    let node = from.nativeElement;
    const seenNodes: string[] = [];
    while (node) {
      const name = node.nodeName.toLowerCase();
      seenNodes.push(name);
      node = renderer.parentNode(node);
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

  post<T>(
    path?: string, body?: string, options?: RequestOptions): Observable<T> {
    console.log(`Sending post from ${this.from.nativeElement}`);
    return this.http.post<T>(
      this.gatewayUrl, body, {
        params: this.buildParams(path, options)
      });
    }


  private buildParams(path?: string, options?: RequestOptions)
    : {[params: string]: string} {
    const params = {from: this.fromStr};
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
  renderer: Renderer2;
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

  for(from: ElementRef) {
    return new GatewayService(this.gatewayUrl, this.http, this.renderer, from);
  }
}
