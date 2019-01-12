import { DV_ACTION, DV_ACTION_NAME_ATTR } from './shared';

import * as _ from 'lodash';


export function getActionName() {
  const invalidActionNameValue = 'the value of the action name should be text';
  const err = (_expr) => { throw new Error(invalidActionNameValue); };
  return {
    Element: (element) => element.getActionName(),
    NormalElement: (startTag, _content, _endTag) => startTag.getActionName(),
    VoidElement: (_open, _elementName, _attrs, _close) => {
      throw new Error('Action should start with a dv.action tag');
    },
    StartTag: (_open, elementName, attributes, _close): string | null => {
      if (elementName.getActionName() === DV_ACTION) {
        const attrValues: string[] = _.compact(attributes.getActionName());
        if (attrValues.length === 0) {
          throw new Error('Missing action name');
        }

        return attrValues[0];
      }
      return null;
    },
    ElementName_action: (actionNameMaybeAlias): string | null =>
      actionNameMaybeAlias.getActionName(),
    ActionNameMaybeAlias: (actionName, _maybeAlias): string | null =>
      actionName.sourceString,
    Attribute: (name, _eq, expr): string | null => {
      if (name.sourceString === DV_ACTION_NAME_ATTR) {
        return expr.getActionName();
      }
      return null;
    },
    Expr_un: err, Expr_bin: err, Expr_ter: err, Expr_input: err,
    Expr_element: err,
    Expr_literal: (literal) => literal.getActionName(),
    Literal_number: err, Literal_true: err, Literal_false: err,
    Literal_obj: (_openCb, _props, _closeCb) => {
      throw new Error(invalidActionNameValue);
    },
    Literal_array: (_openSb, _exprs, _closeSb) => {
      throw new Error(invalidActionNameValue);
    },
    Literal_text: (_openQuote, text, _closeQuote) => text.sourceString
  };
}
