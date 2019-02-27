import {
  ElementRef, Injectable, Renderer2, RendererFactory2
} from '@angular/core';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { GatewayService } from './gateway.service';

import { NodeUtils } from './node.utils';


// To indicate run failure, return a rejected promise
export type onRun = () => Promise<any> | any;
// res is the value the promise returned in `dvOnExec` or `dvOnEval` resolved to
export type onSuccess = (res?: any) => void;
// reason is the error that caused the failure
export type onFailure = (reason: Error) => void;

export interface OnExec {
  dvOnExec: onRun;
}

export interface OnExecSuccess {
  dvOnExecSuccess: onSuccess;
}

export interface OnExecFailure {
  dvOnExecFailure: onFailure;
}

export interface OnEval {
  dvOnEval: onRun;
}

export interface OnEvalSuccess {
  dvOnEvalSuccess: onSuccess;
}

export interface OnEvalFailure {
  dvOnEvalFailure: onFailure;
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
    onSuccess: 'dvOnEvalSuccess',
    onFailure: 'dvOnEvalFailure'
  },
  exec: {
    onRun: 'dvOnExec',
    onSuccess: 'dvOnExecSuccess',
    onFailure: 'dvOnExecFailure'
  }
};


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
   */
  register(elem: ElementRef, action: any) {
    const actionId = uuid();
    const node = elem.nativeElement;
    NodeUtils.SetActionId(node, actionId);
    this.actionTable[actionId] = {action: action, node: node};
  }

  registerAppAction(elem: ElementRef, action: any) {
    this.register(elem, action);
    NodeUtils.MarkAsAppAction(elem.nativeElement);
  }

  getActionInstance(actionId: string): any | null {
    return _.get(this.actionTable[actionId], 'action', null);
  }

  /**
   * Cause the action given by `elem` to execute.
   */
  async exec(elem: ElementRef) {
    this.run('exec', elem);
  }

  /**
   * Cause the action given by `elem` to evaluate.
   */
  async eval(elem: ElementRef) {
    this.run('eval', elem);
  }

  private getTargetAction(initialNode) {
    let node = initialNode;
    let targetAction = node;

    // 'document' doesn't have `getAttribute`
    while (node && node.getAttribute) {
      if (RunService.IsDvTx(node)) {
        targetAction = node;
        break;
      }
      node = this.renderer.parentNode(node);
    }

    return targetAction;
  }

  private async run(runType: RunType, elem: ElementRef) {
    const targetAction = this.getTargetAction(elem.nativeElement);
    if (NodeUtils.HasRunId(targetAction)) {
      console.log(
        `Skipping ${runType} since the same one is already in progress`);

      return;
    }
    const id = uuid();
    NodeUtils.SetRunId(targetAction, id);
    let runResultMap: RunResultMap | undefined;
    try {
      runResultMap = await this.callDvOnRun(runType, targetAction, id);
    } catch (error) {
      console.error(`Got error on ${runType} ${id}: ${error.message}`);
      this.callDvOnRunFailure(runType, targetAction, error);
      NodeUtils.RemoveRunId(targetAction);
    }
    if (runResultMap) { // no error
      this.callDvOnRunSuccess(runType, targetAction, runResultMap);
      NodeUtils.RemoveRunId(targetAction);
    }
  }

  /**
   * Walks the dom starting from `node` calling `onAction` with the action info
   * when an action is encountered. No child of actions are traversed.
   */
  private walkActions(node, onAction: (actionInfo, str?) => void): void {
    const actionId = NodeUtils.GetActionId(node);
    if (!actionId) {
      // node is not a dv-action (e.g., it's a <div>) or is dv-tx
      _.each(node.childNodes, (n) => this.walkActions(n, onAction));

      return;
    }
    const target = this.actionTable[actionId];
    onAction(target, actionId);
  }

  private async callDvOnRun(
    runType: RunType, node, id: string): Promise<RunResultMap> {
    const dvOnRun = runFunctionNames[runType].onRun;
    const runs: Promise<RunResultMap>[] = [];

    // run the action, or each action in tx with the same RUN ID
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action[dvOnRun]) {
        NodeUtils.SetRunId(actionInfo.node, id);
        runs.push(
          Promise
            .resolve(actionInfo.action[dvOnRun]())
            .then((result) => ({[actionId]: result})));
      }
    });

    // send the request, if relevant
    if (GatewayService.txBatches[id]) {
      GatewayService.txBatches[id].send();
      delete GatewayService.txBatches[id];
    }

    const resultMaps: RunResultMap[] = await Promise.all(runs);

    return _.assign({}, ...resultMaps);
  }

  private callDvOnRunSuccess(
    runType: RunType, node, runResultMap: RunResultMap): void {
    const dvOnRun = runFunctionNames[runType].onRun;
    const dvOnSuccess = runFunctionNames[runType].onSuccess;
    this.walkActions(node, (actionInfo, actionId) => {
      if (actionInfo.action[dvOnRun]) {
        NodeUtils.RemoveRunId(actionInfo.node);
      }
      if (actionInfo.action[dvOnSuccess]) {
        actionInfo.action[dvOnSuccess](runResultMap[actionId]);
      }
    });
  }

  private callDvOnRunFailure(runType: RunType, node, reason): void {
    this.walkActions(node, (actionInfo) => {
      const dvOnRun = runFunctionNames[runType].onRun;
      const dvOnFailure = runFunctionNames[runType].onFailure;
      if (actionInfo.action[dvOnRun]) {
        NodeUtils.RemoveRunId(actionInfo.node);
      }
      if (actionInfo.action[dvOnFailure]) {
        actionInfo.action[dvOnFailure](reason);
      }
    });
  }
}
