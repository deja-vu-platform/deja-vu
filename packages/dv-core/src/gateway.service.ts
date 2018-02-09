import { ElementRef, Renderer2, Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DV_CONFIG, DvConfig } from './dv.config';
import {Observable} from 'rxjs/Rx';


export type RequestOptions = {[field: string]: string};

export class GatewayService {
  to: string;

  constructor(
    private gatewayUrl: string, projects: Set<string>,
    private http: HttpClient, renderer: Renderer2,
    private from: ElementRef) {
    let node = from.nativeElement;
    let lastProjectSeen;
    const seenProjects: string[] = [];
    while (node) {
      const name = node.nodeName.toLowerCase();
      const project = name.split('-')[0];
      if (projects.has(project) && lastProjectSeen != project) {
        seenProjects.push(project);
        lastProjectSeen = project;
      }
      node = renderer.parentNode(node);
    }
    this.to = seenProjects.reverse().join('-');
  }

  get<T>(path?: string, options?: RequestOptions): Observable<T> {
    console.log(`Sending get from ${this.from.nativeElement} to ${this.to}`);
    return this.http.get<T>(
      this.gatewayUrl, { params: this.buildParams(this.to, path, options) });
  }

  post<T>(
    path?: string, body?: string, options?: RequestOptions): Observable<T> {
    console.log(`Sending post from ${this.from.nativeElement} to ${this.to}`);
    return this.http.post<T>(
      this.gatewayUrl, body,
      { params: this.buildParams(this.to, path, options) });
  }

  private buildParams(to: string, path?: string, options?: RequestOptions)
    : HttpParams {
    const params = new HttpParams();
    params.set('to', to);
    if (path) {
      params.set('path', path);
    }
    if (options) {
      params.set('options', JSON.stringify(options));
    }
    return params;
  }
}

@Injectable()
export class GatewayServiceFactory {
  gatewayUrl: string;
  projects: Set<string>;

  constructor(
    @Inject(DV_CONFIG) dvConfig: DvConfig, private http: HttpClient,
    private renderer: Renderer2) {
    this.gatewayUrl = dvConfig.gatewayUrl;
    this.projects = this.setOfUsedCliches(dvConfig);
    this.projects.add(dvConfig.name);
  }

  private setOfUsedCliches(dvConfig: DvConfig): Set<string>{
    const ret = new Set<string>();
    if (!dvConfig.usedCliches) {
      return ret;
    }

    for (const usedClicheKey of Object.keys(dvConfig.usedCliches)) {
      ret.add(usedClicheKey);
      for (const usedUsedClicheKey of this.setOfUsedCliches(
        dvConfig.usedCliches[usedClicheKey])) {
        ret.add(usedUsedClicheKey);
      }
    }
    return ret;
  }

  for(from: ElementRef) {
    return new GatewayService(
      this.gatewayUrl, this.projects, this.http, this.renderer, from);
  }
}
