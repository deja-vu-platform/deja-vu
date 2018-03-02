import {
  ElementRef, Renderer2, RendererFactory2, Injectable
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';


export interface OnRun {
  dvOnRun: (id: string) => Promise<void>;
}

interface ActionInfo {
  action: any;
  node: any;
}

const ACTION_ID_ATTR = '_dvActionId';


@Injectable()
export class RunService {
  private renderer: Renderer2;
  private actionTable: {[id: string]: ActionInfo} = {};

  constructor(
    rendererFactory: RendererFactory2) {
    // https://github.com/angular/angular/issues/17824
    // It seems like while you can get Renderer2 injected in components it
    // doesn't work for services. The workaround is to get the factory injected
    // and use it to create a renderer.
    // If you pass null null to `createRenderer` it returns the default renderer
    // without creating a new one
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  register(elem: ElementRef, action: any) {
    const actionId = uuid();
    const node = elem.nativeElement;
    node.setAttribute(ACTION_ID_ATTR, actionId);
    this.actionTable[actionId] = {action: action, node: node};
  }

  run(elem: ElementRef) {
    let node = elem.nativeElement;
    let targetAction = node;
    
    while (node && node.getAttribute) {
      debugger;
      const parentActionId = node.getAttribute(ACTION_ID_ATTR);
      if (parentActionId !== undefined && node.nodeName === 'dv-compound') {
        targetAction = node;
      }
      node = this.renderer.parentNode(node);
    }
    this.callDvOnRun(targetAction, uuid());
  }

  private callDvOnRun(node, id: string): Promise<void> {
    const actionId = node.getAttribute(ACTION_ID_ATTR);
    const target = this.actionTable[actionId];
    if (actionId === undefined || target.node.nodeName === 'dv-compound') {
      return Promise.all(_.map(node.childNodes, n => this.callDvOnRun(n, id)))
        .then(unused => undefined);
    }

    if (target.action.dvOnRun) {
      return target.action.dvOnRun(id);
    }
    return Promise.resolve();
  }
}
