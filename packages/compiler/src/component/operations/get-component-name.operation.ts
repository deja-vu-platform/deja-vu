import { DV_COMPONENT, DV_COMPONENT_NAME_ATTR } from './shared';

import * as _ from 'lodash';


export function getComponentName() {
  const invalidComponentNameValue = 'the value of the component name should be text';
  const err = (_expr) => { throw new Error(invalidComponentNameValue); };

  return {
    Element: (element) => element.getComponentName(),
    NormalElement: (startTag, _content, _endTag) => startTag.getComponentName(),
    VoidElement: (_open, _elementName, _attrs, _close) => {
      throw new Error('Component should start with a dv.component tag');
    },
    StartTag: (_open, elementName, attributes, _close): string | null => {
      if (elementName.getComponentName() === DV_COMPONENT) {
        const attrValues: string[] = _.compact(attributes.getComponentName());
        if (attrValues.length === 0) {
          throw new Error('Missing component name');
        }

        return attrValues[0];
      }

      return null;
    },
    ElementName_component: (componentNameMaybeAlias): string | null =>
      componentNameMaybeAlias.getComponentName(),
    ComponentNameMaybeAlias: (componentName, _maybeAlias): string | null =>
      componentName.sourceString,
    Attribute: (name, _eq, expr): string | null => {
      if (name.sourceString === DV_COMPONENT_NAME_ATTR) {
        return expr.getComponentName();
      }

      return null;
    },
    Expr_un: err, Expr_bin: err, Expr_ter: err, Expr_input: err,
    Expr_element: err,
    Expr_literal: (literal) => literal.getComponentName(),
    Literal_number: err, Literal_true: err, Literal_false: err,
    Literal_obj: (_objLiteral) => {
      throw new Error(invalidComponentNameValue);
    },
    Literal_array: (_openSb, _exprs, _closeSb) => {
      throw new Error(invalidComponentNameValue);
    },
    Literal_text: (stringLiteral) => stringLiteral.getComponentName(),
    stringLiteral_doubleQuote: (_oq, text, _cq) => text.sourceString,
    stringLiteral_singleQuote: (_oq, text, _cq) => text.sourceString
  };
}
