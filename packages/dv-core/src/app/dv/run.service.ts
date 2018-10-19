import {
  ElementRef, Renderer2, RendererFactory2, Injectable
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';


export interface OnRun {
  // To abort the run return a rejected promise
  dvOnRun: () => Promise<any> | any;
}

export interface OnAfterCommit {
  // res is the value the promise returned in `dvOnRun` resolved to
  dvOnAfterCommit: (res?: any) => void;
}

export interface OnAfterAbort {
  // reason is the error that caused the abort
  dvOnAfterAbort: (reason: Error) => void;
}

interface ActionInfo {
  action: any;
  node: any;
}

interface RunResultMap {
  [actionId: string]: any;
}

const ACTION_ID_ATTR = '_dvActionId';
export const RUN_ID_ATTR = '_dvRunId';


@Injectable()
export class RunService {
  private renderer: Renderer2;
  private actionTable: {[id: string]: ActionInfo} = {};

  private static IsDvTx(node) {
    return node.nodeName.toLowerCase() === 'dv-tx';
  }

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
  async run(elem: ElementRef) {
    let node = elem.nativeElement;
    let targetAction = node;

    while (node && node.getAttribute) { // 'document' doesn't have `getAttribute`
      if (RunService.IsDvTx(node)) {
        targetAction = node;
        break;
      }
      node = this.renderer.parentNode(node);
    }
    const runId = uuid();
    let runResultMap: RunResultMap | undefined;
    try {
      runResultMap = await this.callDvOnRun(targetAction, runId);
    } catch (error) {
      console.error(`Got error on run ${runId}: ${error.message}`);
      this.callDvOnAfterAbort(targetAction, error);
    }
    if (runResultMap) { // no error
      this.callDvOnAfterCommit(targetAction, runResultMap);
    }
  }

  /**
   * Walks the dom starting from `node` calling `onAction` with the action info
   * when an action is encountered. No child of actions are traversed.
   **/
  private walkActions(node, onAction: (ActionInfo, string?) => void): void {
    const actionId = node.getAttribute ?
      node.getAttribute(ACTION_ID_ATTR) : undefined;
    if (!actionId) {
      // node is not a dv-action (e.g., it's a <div>) or is dv-tx
      _.each(node.childNodes, n => this.walkActions(n, onAction));
      return;
    }
    const target = this.actionTable[actionId];
    onAction(target, actionId);
  }

  private async callDvOnRun(node, id: string): Promise<RunResultMap> {
    const runs: Promise<RunResultMap>[] = [];
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action.dvOnRun) {
        actionInfo.node.setAttribute(RUN_ID_ATTR, id);
        runs.push(
          Promise
            .resolve(actionInfo.action.dvOnRun())
            .then(result => ({[actionId]: result})));
      }
    });
    const resultMaps: RunResultMap[] = await Promise.all(runs);
    return _.assign({}, ...resultMaps);
  }

  private callDvOnAfterCommit(node, runResultMap: RunResultMap): void {
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action.dvOnRun) {
        actionInfo.node.removeAttribute(RUN_ID_ATTR);
      }
      if (actionInfo.action.dvOnAfterCommit) {
        actionInfo.action.dvOnAfterCommit(runResultMap[actionId]);
      }
    });
  }

  private callDvOnAfterAbort(node, reason): void {
    this.walkActions(node, (actionInfo) => {
      if (actionInfo.action.dvOnRun) {
        actionInfo.node.removeAttribute(RUN_ID_ATTR);
      }
      if (actionInfo.action.dvOnAfterAbort) {
        actionInfo.action.dvOnAfterAbort(reason);
      }
    });
  }

}
