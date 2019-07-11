import { Renderer2 } from '@angular/core';

import * as _ from 'lodash';

export const OF_ATTR = 'dvOf';
const ALIAS_ATTR = 'dvAlias';
const CLASS_ATTR = 'class';

const ACTION_ID_ATTR = '_dvActionId';
const RUN_ID_ATTR = '_dvRunId';
const IS_APP_ACTION_ATTR = '_dvIsAppAction';


export class NodeUtils {
  private static GetClicheFromTag(tag: string): string {
    return tag.substring(0, tag.indexOf('-'));
  }

  private static GetActionFromTag(tag: string): string {
    return tag.substring(tag.indexOf('-') + 1);
  }

  private static GetTag(node): string {
    return node.nodeName.toLowerCase();
  }

  private static GetFqTag(tag: string, dvAlias: string, dvOf: string): string {
    if (!_.isEmpty(dvAlias)) {
      return dvAlias;
    } else if (!_.isEmpty(dvOf)) {
      return dvOf + '-' + NodeUtils.GetActionFromTag(tag);
    } else {
      return tag;
    }
  }

  static GetAttribute(node, attribute: string): string | undefined {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
    if (node.hasAttribute && node.hasAttribute(attribute)) {
      return node.getAttribute(attribute);
    }

    return undefined;
  }

  static SetActionId(node, actionId: string): void {
    node.setAttribute(ACTION_ID_ATTR, actionId);
  }

  static GetActionId(node): string | undefined {
    return NodeUtils.GetAttribute(node, ACTION_ID_ATTR);
  }

  static SetRunId(node, runId: string): void {
    node.setAttribute(RUN_ID_ATTR, runId);
  }

  static GetRunId(node): string | undefined {
    return NodeUtils.GetAttribute(node, RUN_ID_ATTR);
  }

  static HasRunId(node): boolean {
    return node.hasAttribute(RUN_ID_ATTR);
  }

  static RemoveRunId(node): void {
    node.removeAttribute(RUN_ID_ATTR);
  }

  static IsAction(node): boolean {
    // No HTML tag has a hyphen
    return _.includes(NodeUtils.GetTag(node), '-') && !NodeUtils.GetTag(node).startsWith('mat-');
  }

  static IsAppAction(node): boolean {
    return node.hasAttribute(IS_APP_ACTION_ATTR);
  }

  static MarkAsAppAction(node): void {
    node.setAttribute(IS_APP_ACTION_ATTR, '');
  }

  static GetClicheAliasOfNode(node): string {
    const clicheOfTag = NodeUtils.GetClicheFromTag(NodeUtils.GetTag(node));
    const dvOf = NodeUtils.GetAttribute(node, OF_ATTR);

    return !_.isEmpty(dvOf) ? dvOf : clicheOfTag;
  }

  static GetFqTagOfNode(node): string {
    const tag = NodeUtils.GetTag(node);
    const dvAlias = NodeUtils.GetAttribute(node, ALIAS_ATTR);
    const dvOf = NodeUtils.GetAttribute(node, OF_ATTR);

    return NodeUtils.GetFqTag(tag, dvAlias, dvOf);
  }

  static GetCssClassesOfNode(node): string[] {
    const classAttr = NodeUtils.GetAttribute(node, CLASS_ATTR);

    return _.isEmpty(classAttr) ? [] : classAttr!.split(' ');
  }

  static SetOfOfNode(node, value: string) {
    node.setAttribute(OF_ATTR, value);
  }

  static WalkUpFromNode(
    node, renderer: Renderer2,
    breakFn?: (node: any) => boolean, visitFn?: (node: any) => void) {
    // 'document' doesn't have `getAttribute`
    while (node && node.getAttribute) {
      if (breakFn && breakFn(node)) {
        break;
      }
      if (visitFn) {
        visitFn(node);
      }

      let dvClass: string | null = null;
      for (const cssClass of NodeUtils.GetCssClassesOfNode(node)) {
        const match = /dv-parent-is-(.*)/i.exec(cssClass);
        dvClass = match ? match[1] : null;
      }
      if (dvClass !== null) {
        node = renderer.selectRootElement('.dv-' + dvClass);
      } else {
        node = renderer.parentNode(node);
      }
    }
  }

  static GetAppActionNodeContainingNode(node, renderer: Renderer2): any | null {
    let appActionNode = null;
    NodeUtils.WalkUpFromNode(node, renderer, (visitNode) => {
      if (NodeUtils.IsAppAction(visitNode)) {
        appActionNode = visitNode;

        return true;
      }

      return false;
    });

    return appActionNode;
  }
}
