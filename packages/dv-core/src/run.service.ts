import {
  ElementRef, Renderer2, RendererFactory2, Injectable
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';


// put a new txId attribute and not force the user to wire the id along
export interface OnRun {
  // To abort the run return a rejected promise
  dvOnRun: (id: string) => Promise<any> | any;
}

interface ActionInfo {
  action: any;
  node: any;
}

const ACTION_ID_ATTR = '_dvActionId';
export const RUN_ID_ATTR = '_dvRunId';


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

  /**
   * Register a new action. Should be called on init. Only actions that can be
   * run are required to be registered.
   **/
  register(elem: ElementRef, action: any) {
    const actionId = uuid();
    const node = elem.nativeElement;
    node.setAttribute(ACTION_ID_ATTR, actionId);
    this.actionTable[actionId] = {action: action, node: node};
  }

  /**
   * Cause the action given by `elem` to run.
   **/
  run(elem: ElementRef) {
    let node = elem.nativeElement;
    let targetAction = node;
    
    while (node && node.getAttribute) { // 'document' doesn't have `getAttribute`
      if (this.isDvTx(node)) {
        targetAction = node;
      }
      node = this.renderer.parentNode(node);
    }
    this.callDvOnRun(targetAction, uuid());
  }

  private callDvOnRun(node, id: string): Promise<void> {
    const actionId = node.getAttribute ?
      node.getAttribute(ACTION_ID_ATTR) : undefined;
    if (!actionId) {
      // node is not a dv-action (e.g., it's a <div>) or is dv-tx
      return Promise.all(_.map(node.childNodes, n => this.callDvOnRun(n, id)))
        .then(unused => undefined);
    }

    const target = this.actionTable[actionId];
    if (target.action.dvOnRun) {
      target.node.setAttribute(RUN_ID_ATTR, id);
      return target.action.dvOnRun();
    }
    return Promise.resolve();
  }

  private isDvTx(node) {
    return node.nodeName.toLowerCase() === 'dv-tx';
  }
}
