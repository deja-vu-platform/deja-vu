import { ActionSymbolTable } from "../../symbolTable";


export function saveOutputs(symbolTable: ActionSymbolTable) {
  return {
    Element: (element) => element.saveOutputs(),
    NormalElement: (startTag, _content, _endTag) => startTag.saveOutputs(),
    VoidElement: (_open, _elementName, attributes, _close) =>
      attributes.saveOutputs(),
    StartTag: (_open, _elementName, attributes, _close) =>
      attributes.saveOutputs(),
    Attribute: (attributeNameNode, _eq, expr) => {
      const attributeName = attributeNameNode.sourceString;
      if (attributeName.endsWith('$')) {
        const outputField = attributeName.slice(0, -1);
        symbolTable[outputField] = {
          kind: 'app-output',
          ngOutputField: outputField,
          expr: expr.toNgTemplate()
        };
      }
    }
  };
}