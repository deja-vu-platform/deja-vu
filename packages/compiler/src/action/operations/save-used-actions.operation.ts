import { ActionSymbolTable, ClicheStEntry } from '../../symbolTable';

import * as _ from 'lodash';
import { NAV_SPLIT_REGEX } from './shared';


export function saveUsedActions(symbolTable: ActionSymbolTable) {
  return {
    Element: (element) => element.saveUsedActions(),
    NormalElement: (startTag, content, _endTag) => {
      startTag.saveUsedActions();
      content.saveUsedActions();
    },
    VoidElement: (_open, elementName, _attributes, _close) =>
      elementName.saveUsedActions(),
    StartTag: (_open, elementName, _attributes, _close) =>
      elementName.saveUsedActions(),
    ElementName_action: (actionNameMaybeAlias) =>
      actionNameMaybeAlias.saveUsedActions(),
    ElementName_html: (_name) => { }, Content_text: (_text) => { },
    Content_element: (element) => element.saveUsedActions(),
    ActionNameMaybeAlias: (actionNameNode, maybeAliasNode) => {
      const maybeAlias = maybeAliasNode.saveUsedActions();
      if (!_.isEmpty(maybeAlias)) {
        const [ clicheName, actionName ] = _
          .split(actionNameNode.sourceString, NAV_SPLIT_REGEX);
        symbolTable[maybeAlias] = {
          kind: 'action',
          of: clicheName,
          actionName: actionName
        };
      } else {
        actionNameNode.saveUsedActions();
      }
    },
    Alias: (_as, alias) => alias.sourceString,
    actionName: (clicheAliasNode, _dot, actionNameNode) => {
      const clicheAlias = clicheAliasNode.sourceString;
      const actionName = actionNameNode.sourceString;
      if (!_.has(symbolTable, clicheAlias)) {
        symbolTable[clicheAlias] = { kind: 'cliche' };
      }
      const clicheEntry = <ClicheStEntry> symbolTable[clicheAlias];
      _.set(clicheEntry, `symbolTable.${actionName}`, {
        kind: 'action',
        of: clicheAlias,
        actionName: actionName
      });
    }
  };
}
