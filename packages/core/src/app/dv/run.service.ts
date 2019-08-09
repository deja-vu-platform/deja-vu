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

interface ComponentInfo {
  component: any;
  node: any;
}

interface RunResultMap {
  [componentId: string]: any;
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
  private componentTable: {[id: string]: ComponentInfo} = {};

  private static IsDvTx(node: Element) {
    return (
      node.nodeName.toLowerCase() === 'dv-tx'
      || (
        window['dv-designer']
        && _.get(node, ['dataset', 'iscomponent']) === 'true'
        && node.getAttribute('dvAlias') === 'dv-tx'
      )
    );
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
   * Register a new component. Should be called on init. Only components that can be
   * Exec are required to be registered.
   */
  register(elem: ElementRef, component: any) {
    const componentId = uuid();
    const node = elem.nativeElement;
    NodeUtils.SetComponentId(node, componentId);
    this.componentTable[componentId] = {component: component, node: node};
  }

  registerAppComponent(elem: ElementRef, component: any) {
    this.register(elem, component);
    NodeUtils.MarkAsAppComponent(elem.nativeElement);
  }

  getComponentInstance(componentId: string): any | null {
    return _.get(this.componentTable[componentId], 'component', null);
  }

  /**
   * Cause the component given by `elem` to execute.
   */
  async exec(elem: ElementRef) {
    this.run('exec', elem);
  }

  /**
   * Cause the component given by `elem` to evaluate.
   */
  async eval(elem: ElementRef) {
    this.run('eval', elem);
  }

  private getTargetComponent(initialNode) {
    let parentComponent = initialNode;
    do {
      parentComponent = this.renderer.parentNode(parentComponent);
    } while (parentComponent && parentComponent.getAttribute &&
    !NodeUtils.IsComponent(parentComponent));

    return RunService.IsDvTx(parentComponent) ? parentComponent : initialNode;
  }

  private async run(runType: RunType, elem: ElementRef) {
    const targetComponent = this.getTargetComponent(elem.nativeElement);
    const targetComponentFqTag = NodeUtils.GetFqTagOfNode(targetComponent);
    console.log(`Target component is ${targetComponentFqTag}`);
    if (NodeUtils.HasRunId(targetComponent)) {
      console.log(
        `Skipping ${runType} since the same one is already in progress`);

      return;
    }
    const id = uuid();
    NodeUtils.SetRunId(targetComponent, id);
    let runResultMap: RunResultMap | undefined;
    try {
      runResultMap = await this.callDvOnRun(runType, targetComponent, id);
    } catch (error) {
      console.error(
        `Got error on ${runType} ${id} ` +
        `(${targetComponentFqTag}): ${error.message}`);
      this.removeRunIds(runType, targetComponent);
      this.callDvOnRunFailure(runType, targetComponent, error);
    }
    if (runResultMap) { // no error
      this.removeRunIds(runType, targetComponent);
      this.callDvOnRunSuccess(runType, targetComponent, runResultMap);
    }
  }

  /**
   * Walks the dom starting from `node` calling `onComponent` with the component info
   * when an component is encountered. No child of components are traversed.
   */
  private walkComponents(node, onComponent: (componentInfo, str?) => void): void {
    const componentId = NodeUtils.GetComponentId(node);
    if (!componentId) {
      // node is not a dv-component (e.g., it's a <div>) or is dv-tx
      _.each(node.childNodes, (n) => this.walkComponents(n, onComponent));

      return;
    }
    const target = this.componentTable[componentId];
    onComponent(target, componentId);
  }

  private async callDvOnRun(
    runType: RunType, node, id: string): Promise<RunResultMap> {
    const dvOnRun = runFunctionNames[runType].onRun;
    const runs: Promise<RunResultMap>[] = [];

    // run the component, or each component in tx with the same RUN ID
    this.walkComponents(node, (componentInfo, componentId) => {
      if (componentInfo.component[dvOnRun]) {
        NodeUtils.SetRunId(componentInfo.node, id);
        runs.push(
          Promise
            .resolve(componentInfo.component[dvOnRun]())
            .then((result) => ({[componentId]: result})));
      }
    });

    // send the request, if relevant
    if (GatewayService.txBatches[id]) {
      GatewayService.txBatches[id].setNumComponents(runs.length);
    }

    const resultMaps: RunResultMap[] = await Promise.all(runs);

    return _.assign({}, ...resultMaps);
  }

  private removeRunIds(runType: RunType, node): void {
    NodeUtils.RemoveRunId(node);
    const dvOnRun = runFunctionNames[runType].onRun;
    this.walkComponents(node, (componentInfo) => {
      if (componentInfo.component[dvOnRun]) {
        NodeUtils.RemoveRunId(componentInfo.node);
      }
    });
  }

  private callDvOnRunSuccess(
    runType: RunType, node, runResultMap: RunResultMap): void {
    const dvOnSuccess = runFunctionNames[runType].onSuccess;
    this.walkComponents(node, (componentInfo, componentId) => {
      if (componentInfo.component[dvOnSuccess]) {
        componentInfo.component[dvOnSuccess](runResultMap[componentId]);
      }
    });
  }

  private callDvOnRunFailure(runType: RunType, node, reason): void {
    this.walkComponents(node, (componentInfo) => {
      const dvOnFailure = runFunctionNames[runType].onFailure;
      if (componentInfo.component[dvOnFailure]) {
        componentInfo.component[dvOnFailure](reason);
      }
    });
  }
}
