import {
  ElementRef, Renderer2, RendererFactory2, Injectable
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';


// To abort the run, return a rejected promise
export type onRun = () => Promise<any> | any;
// res is the value the promise returned in `dvOnExec` or `dvOnEval` resolved to
export type onCommit = (res?: any) => void;
// reason is the error that caused the abort
export type onAbort = (reason: Error) => void;

export interface OnExec {
  dvOnExec: onRun;
}

export interface OnExecCommit {
  dvOnExecCommit: onCommit;
}

export interface OnExecAbort {
  dvOnExecAbort: onAbort;
}

export interface OnEval {
  dvOnEval: onRun;
}

export interface OnEvalCommit {
  dvOnEvalCommit: onCommit;
}

export interface OnEvalAbort {
  dvOnEvalAbort: onAbort;
}

interface ActionInfo {
  action: any;
  node: any;
}

interface RunResultMap {
  [actionId: string]: any;
}

type RunType = 'eval' | 'exec';

const runFunctionNames = {
  eval: {
    onRun: 'dvOnEval',
    onCommit: 'dvOnEvalCommit',
    onAbort: 'dvOnEvalAbort'
  },
  exec: {
    onRun: 'dvOnExec',
    onCommit: 'dvOnExecCommit',
    onAbort: 'dvOnExecAbort'
  }
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
   * Exec are required to be registered.
   **/
  register(elem: ElementRef, action: any) {
    const actionId = uuid();
    const node = elem.nativeElement;
    node.setAttribute(ACTION_ID_ATTR, actionId);
    this.actionTable[actionId] = {action: action, node: node};
  }

  private getTargetAction(initialNode) {
    let node = initialNode;
    let targetAction = node;

    while (node && node.getAttribute) { // 'document' doesn't have `getAttribute`
      if (RunService.IsDvTx(node)) {
        targetAction = node;
        break;
      }
      node = this.renderer.parentNode(node);
    }
    return targetAction;
  }

  private async run(runType: RunType, targetAction, id: string) {
    let runResultMap: RunResultMap | undefined;
    try {
      runResultMap = await this.callDvOnRun(runType, targetAction, id);
    } catch (error) {
      console.error(`Got error on ${runType} ${id}: ${error.message}`);
      this.callDvOnRunAbort(runType, targetAction, error);
      targetAction.removeAttribute(RUN_ID_ATTR);
    }
    if (runResultMap) { // no error
      this.callDvOnRunCommit(runType, targetAction, runResultMap);
      targetAction.removeAttribute(RUN_ID_ATTR);
    }
  }

  /**
   * Cause the action given by `elem` to execute.
   **/
  async exec(elem: ElementRef) {
    const targetAction = this.getTargetAction(elem.nativeElement);
    const execId = uuid();
    this.run('exec', targetAction, execId);
  }

  async eval(elem: ElementRef) {
    const targetAction = this.getTargetAction(elem.nativeElement);
    if (targetAction.hasAttribute(RUN_ID_ATTR)) {
      console.log("skipping eval because another one is already in progress");
      return;
    }
    const evalId = uuid();
    targetAction.setAttribute(RUN_ID_ATTR, evalId);
    this.run('eval', targetAction, evalId);
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

  private async callDvOnRun(runType: RunType, node, id: string): Promise<RunResultMap> {
    const dvOnRun = runFunctionNames[runType].onRun;
    const execs: Promise<RunResultMap>[] = [];
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action.dvOnExec) {
        actionInfo.node.setAttribute(RUN_ID_ATTR, id);
        execs.push(
          Promise
            .resolve(actionInfo.action[dvOnRun]())
            .then(result => ({[actionId]: result})));
      }
    });
    const resultMaps: RunResultMap[] = await Promise.all(execs);
    return _.assign({}, ...resultMaps);
  }

  private callDvOnRunCommit(
    runType: RunType, node, runResultMap: RunResultMap): void {
    const dvOnRun = runFunctionNames[runType].onRun;
    const dvOnCommit = runFunctionNames[runType].onCommit;
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action[dvOnRun]) {
        actionInfo.node.removeAttribute(RUN_ID_ATTR);
      }
      if (actionInfo.action[dvOnCommit]) {
        actionInfo.action[dvOnCommit](runResultMap[actionId]);
      }
    });
  }

  private callDvOnRunAbort(runType: RunType, node, reason): void {
    this.walkActions(node, (actionInfo) => {
      const dvOnRun = runFunctionNames[runType].onRun;
      const dvOnAbort = runFunctionNames[runType].onCommit;
      if (actionInfo.action[dvOnRun]) {
        actionInfo.node.removeAttribute(RUN_ID_ATTR);
      }
      if (actionInfo.action[dvOnAbort]) {
        actionInfo.action[dvOnAbort](reason);
      }
    });
  }

}
