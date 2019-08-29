import { Renderer2 } from '@angular/core';

import * as _ from 'lodash';

export const OF_ATTR = 'dvOf';
const ALIAS_ATTR = 'dvAlias';
const CLASS_ATTR = 'class';
const PARENT_ID_ATTR = 'dvParentIs';

const COMPONENT_ID_ATTR = '_dvComponentId';
const RUN_ID_ATTR = '_dvRunId';
const IS_APP_COMPONENT_ATTR = '_dvIsAppComponent';


export class NodeUtils {
  private static GetConceptFromTag(tag: string): string {
    return tag.substring(0, tag.indexOf('-'));
  }

  private static GetComponentFromTag(tag: string): string {
    return tag.substring(tag.indexOf('-') + 1);
  }

  private static GetTag(node): string {
    return node.nodeName.toLowerCase();
  }

  private static GetFqTag(tag: string, dvAlias: string, dvOf: string): string {
    if (!_.isEmpty(dvAlias)) {
      return dvAlias;
    } else if (!_.isEmpty(dvOf)) {
      return dvOf + '-' + NodeUtils.GetComponentFromTag(tag);
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

  static SetComponentId(node, componentId: string): void {
    node.setAttribute(COMPONENT_ID_ATTR, componentId);
  }

  static GetComponentId(node): string | undefined {
    return NodeUtils.GetAttribute(node, COMPONENT_ID_ATTR);
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

  static IsComponent(node): boolean {
    // No HTML tag has a hyphen
    return _.includes(NodeUtils.GetTag(node), '-') &&
      !NodeUtils.GetTag(node)
        .startsWith('mat-');
  }

  static IsAppComponent(node): boolean {
    return node.hasAttribute(IS_APP_COMPONENT_ATTR);
  }

  static MarkAsAppComponent(node): void {
    node.setAttribute(IS_APP_COMPONENT_ATTR, '');
  }

  static GetConceptAliasOfNode(node): string {
    const conceptOfTag = NodeUtils.GetConceptFromTag(NodeUtils.GetTag(node));
    const dvOf = NodeUtils.GetAttribute(node, OF_ATTR);

    return !_.isEmpty(dvOf) ? dvOf : conceptOfTag;
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

      const parentAttr = NodeUtils.GetAttribute(node, PARENT_ID_ATTR);
      if (parentAttr !== undefined) {
        node = renderer.selectRootElement(`.dv-parent-${parentAttr}`);
      } else {
        node = renderer.parentNode(node);
      }
    }
  }

  static GetAppComponentNodeContainingNode(
    node, renderer: Renderer2): any | null {
    let appComponentNode = null;
    NodeUtils.WalkUpFromNode(node, renderer, (visitNode) => {
      if (NodeUtils.IsAppComponent(visitNode)) {
        appComponentNode = visitNode;

        return true;
      }

      return false;
    });

    return appComponentNode;
  }
}
