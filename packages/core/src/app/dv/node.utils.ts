import * as _ from 'lodash';

const OF_ATTR = 'dvOf';
const ALIAS_ATTR = 'dvAlias';
const CLASS_ATTR = 'class';


export class NodeUtils {
  private static GetClicheFromTag(tag: string): string {
    return tag.substring(0, tag.indexOf('-'));
  }

  private static GetActionFromTag(tag: string): string {
    return tag.substring(tag.indexOf('-') + 1);
  }

  private static GetAttribute(node, attribute: string): string | undefined {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
    if (node.hasAttribute(attribute)) {
      return node.getAttribute(attribute);
    }

    return undefined;
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

  static IsAction(node): boolean {
    // No HTML tag has a hyphen
    return _.includes(NodeUtils.GetTag(node), '-');
  }

  static GetClicheAliasOfNode(node): string {
    const clicheOfTag = NodeUtils.GetClicheFromTag(NodeUtils.GetTag(node));
    const dvAlias = NodeUtils.GetAttribute(node, ALIAS_ATTR);
    const dvOf = NodeUtils.GetAttribute(node, OF_ATTR);

    return !_.isEmpty(dvAlias) ?
      dvAlias :
      (!_.isEmpty(dvOf) ? dvOf : clicheOfTag);
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
}