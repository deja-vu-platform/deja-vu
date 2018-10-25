import {
  ElementRef, Renderer2, RendererFactory2, Injectable
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';


export interface OnExec {
  // To abort the exec return a rejected promise
  dvOnExec: () => Promise<any> | any;
}

export interface OnExecCommit {
  // res is the value the promise returned in `dvOnExec` resolved to
  dvOnExecCommit: (res?: any) => void;
}

export interface OnExecAbort {
  // reason is the error that caused the abort
  dvOnExecAbort: (reason: Error) => void;
}

interface ActionInfo {
  action: any;
  node: any;
}

interface ExecResultMap {
  [actionId: string]: any;
}

const ACTION_ID_ATTR = '_dvActionId';
export const EXEC_ID_ATTR = '_dvExecId';


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
   * Exec are required to be registered.
   **/
  register(elem: ElementRef, action: any) {
    const actionId = uuid();
    const node = elem.nativeElement;
    node.setAttribute(ACTION_ID_ATTR, actionId);
    this.actionTable[actionId] = {action: action, node: node};
  }

  /**
   * Cause the action given by `elem` to execute.
   **/
  async exec(elem: ElementRef) {
    let node = elem.nativeElement;
    let targetAction = node;

    while (node && node.getAttribute) { // 'document' doesn't have `getAttribute`
      if (RunService.IsDvTx(node)) {
        targetAction = node;
        break;
      }
      node = this.renderer.parentNode(node);
    }
    const execId = uuid();
    let execResultMap: ExecResultMap | undefined;
    try {
      execResultMap = await this.callDvOnExec(targetAction, execId);
    } catch (error) {
      console.error(`Got error on exec ${execId}: ${error.message}`);
      this.callDvOnExecAbort(targetAction, error);
    }
    if (execResultMap) { // no error
      this.callDvOnExecCommit(targetAction, execResultMap);
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

  private async callDvOnExec(node, id: string): Promise<ExecResultMap> {
    const execs: Promise<ExecResultMap>[] = [];
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action.dvOnExec) {
        actionInfo.node.setAttribute(EXEC_ID_ATTR, id);
        execs.push(
          Promise
            .resolve(actionInfo.action.dvOnExec())
            .then(result => ({[actionId]: result})));
      }
    });
    const resultMaps: ExecResultMap[] = await Promise.all(execs);
    return _.assign({}, ...resultMaps);
  }

  private callDvOnExecCommit(node, execResultMap: ExecResultMap): void {
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action.dvOnExec) {
        actionInfo.node.removeAttribute(EXEC_ID_ATTR);
      }
      if (actionInfo.action.dvOnExecCommit) {
        actionInfo.action.dvOnExecCommit(execResultMap[actionId]);
      }
    });
  }

  private callDvOnExecAbort(node, reason): void {
    this.walkActions(node, (actionInfo) => {
      if (actionInfo.action.dvOnExec) {
        actionInfo.node.removeAttribute(EXEC_ID_ATTR);
      }
      if (actionInfo.action.dvOnExecAbort) {
        actionInfo.action.dvOnExecAbort(reason);
      }
    });
  }

}
