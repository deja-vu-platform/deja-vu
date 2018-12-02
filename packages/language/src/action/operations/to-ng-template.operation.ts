import {
  ActionStEntry,
  ActionSymbolTable, ClicheStEntry,
  InputStEntry,
  OutputStEntry,
  pretty,
  StEntry, SymbolTable
} from '../../symbolTable';

import {
  attributeNameToInput,
  classNameToNgField,
  getStEntryForNgComponent,
  inputToNgField,
  isInput,
  isNgComponent,
  outputToNgField
} from './shared';

import * as assert from 'assert';

import * as _ from 'lodash';
import { ActionInputCompiler } from '../../action-input/action-input.compiler';
import { ActionCompiler, CompiledAction } from '../action.compiler';


function nonInputMemberAccessToField(
  fullMemberAccess: string, symbolTable: ActionSymbolTable) {
  const clicheOrActionAlias = _
    .split(fullMemberAccess, '.', 1)[0];
  const stEntry: StEntry = symbolTable[clicheOrActionAlias];
  let clicheName: string, actionName: string, output: string;
  let alias: string | undefined;
  let memberAccesses: string;
  switch (stEntry.kind) {
    case 'cliche':
      clicheName = clicheOrActionAlias;
      [ actionName, output ] = fullMemberAccess
        .slice(clicheOrActionAlias.length + 1)
        .split('.', 2);
      memberAccesses = fullMemberAccess
        .slice(clicheOrActionAlias.length + actionName.length +
          output.length + 2);
      break;
    case 'action':
      clicheName = stEntry.of;
      actionName = stEntry.actionName;
      alias = clicheOrActionAlias;
      output = fullMemberAccess
        .slice(clicheOrActionAlias.length + 1)
        .split('.', 1)[0];
      memberAccesses = fullMemberAccess
        .slice(clicheOrActionAlias.length + output.length + 1);
      break;
    default:
      throw new Error(`Unexpected entry ${stEntry.kind}`);
  }

  const outputField = outputToNgField(
    clicheName, actionName, output, alias);

  return `${outputField}${memberAccesses}`;
}


export function toNgTemplate(
  appName: string, symbolTable: ActionSymbolTable,
  actionInputs: CompiledAction[], context: SymbolTable) {
  const tagTransform = (open, elementName, attrs, close): string => {
    let transformedElementName = elementName.toNgTemplate();
    let transformedActionName = _.split(transformedElementName, ' ', 1)[0];
    const tagIsNgComponent = isNgComponent(transformedActionName);
    let attrsString;
    if (tagIsNgComponent && transformedActionName !== 'dv-action') {
      const maybeAlias: string[] | null = transformedElementName
        .match(/dvAlias="(.*)"/);
      const alias = (maybeAlias !== null) ? maybeAlias[1] : undefined;

      const actionEntry: ActionStEntry | undefined = getStEntryForNgComponent(
        transformedActionName, symbolTable, alias);
      if (actionEntry === undefined) {
        assert.fail(
          `No entries for ${transformedActionName}, alias ${alias}` +
          ` symbol table ${pretty(symbolTable)}`);
      }

      const outputs = _
        .map(actionEntry.symbolTable,
          (outputEntry: OutputStEntry, outputKey: string) => {
            assert.ok(
              actionEntry.of !== undefined,
              `Expected entry ${pretty(actionEntry)} to have an "of"`);
            assert.ok(
              actionEntry.actionName !== undefined,
              `Expected entry ${pretty(actionEntry)} to have an "actionName"`);
            const ngOutputField = outputToNgField(
              actionEntry.of, actionEntry.actionName, outputKey, alias);

            outputEntry.ngOutputField = ngOutputField;

            return `(${outputKey})="${ngOutputField}=$event"`;
          });

      attrsString = _
        .join(_.concat(attrs.toNgTemplate(), outputs), ' ');


      const clicheAlias = _.split(transformedActionName, '-', 1)[0];
      if (clicheAlias !== 'dv' && clicheAlias !== appName) {
        const clicheContextEntry = context[clicheAlias];
        if (clicheContextEntry === undefined) {
          throw new Error(`Cliché ${clicheAlias} not found`);
        }
        assert.ok(clicheContextEntry.kind === 'cliche',
          `Unexpected entry type ${clicheContextEntry.kind} ` +
          `for cliche ${clicheAlias}`);
        const clicheName = (<ClicheStEntry>clicheContextEntry).clicheName;
        if (clicheName !== clicheAlias) {
          const elemRest = transformedElementName
            .slice(transformedElementName.indexOf('-'));
          transformedElementName = clicheName + elemRest +
            ` dvOf="${clicheAlias}"`;
          const actionRest = transformedActionName
            .slice(transformedActionName.indexOf('-'));
          transformedActionName = clicheName + actionRest;
        }
      }
    } else {
      attrsString = attrs.sourceString;
    }


    // Close void elements
    const closeStr = (tagIsNgComponent && close.sourceString === '/>') ?
      `></${transformedActionName}>` : close.sourceString;

    return open.sourceString +
      transformedElementName + ' ' +
      attrsString +
      closeStr;
  };
  const recurse = (expr) => expr.toNgTemplate();
  const binOpRecurse = (leftExpr, op, rightExpr) =>
    `${leftExpr.toNgTemplate()} ${op.sourceString} ${rightExpr.toNgTemplate()}`;

  return {
    Element: (element): string => element.toNgTemplate(),
    NormalElement: (startTag, contentNode, endTag): string => {
      const startTagNg = startTag.toNgTemplate();
      const content = _.join(contentNode.toNgTemplate(), ' ');
      if (_.startsWith(startTagNg, '<dv-action')) {
        return content;
      }

      return startTagNg + content + endTag.toNgTemplate();
    },
    StartTag: tagTransform,
    EndTag: (open, elementNameNode, close): string => {
      let elementName = elementNameNode.toNgTemplate();
      if (isNgComponent(elementName)) {
        const clicheAlias = _.split(elementName, '-', 1)[0];
        if (clicheAlias !== 'dv' && clicheAlias !== appName) {
          const clicheContextEntry = context[clicheAlias];
          if (clicheContextEntry === undefined) {
            throw new Error(`Cliché ${clicheAlias} not found`);
          }
          assert.ok(clicheContextEntry.kind === 'cliche',
            `Unexpected entry type ${clicheContextEntry.kind} ` +
            `for cliche ${clicheAlias}`);
          const clicheName = (<ClicheStEntry> clicheContextEntry).clicheName;
          if (clicheName !== clicheAlias) {
            const rest = elementName
              .slice(elementName.indexOf('-'));
            elementName = clicheName + rest;
          }
        }
      }

      return open.sourceString + elementName + close.sourceString;
    },
    VoidElement: tagTransform,
    Attribute: (attributeNameNode, eq, expr) => {
      // If we got to this point we know that this is an attribute of an
      // action => with the exception of the html class attribute, the attr
      // should be converted to an ng input
      const attributeName = attributeNameNode.sourceString;
      const newAttributeName = (attributeName === 'class') ?
        attributeName : `[${attributeNameToInput(attributeName)}]`;
      const exprStr = (attributeName === 'class') ?
        expr.sourceString : `"${expr.toNgTemplate()}"`;

      return newAttributeName + eq.sourceString + exprStr;
    },
    Content_text: (text) => text.sourceString,
    Content_element: (element) => element.toNgTemplate(),
    ElementName_action: (actionNameMaybeAlias) =>
      actionNameMaybeAlias.toNgTemplate(),
    ElementName_html: (name) => name.sourceString,
    ActionNameMaybeAlias: (actionName, maybeAliasNode) => {
      const maybeAlias = maybeAliasNode.toNgTemplate();
      const dvAlias: string | undefined =
        (!_.isEmpty(maybeAlias)) ? `dvAlias="${maybeAlias}"` : '';
      const transformedActionName = _
        .replace(actionName.sourceString, '.', '-');

      return `${transformedActionName} ${dvAlias}`;
    },
    Alias: (_as, alias) => alias.sourceString,
    Expr_un: recurse, Expr_bin: recurse, Expr_ter: recurse,
    Expr_member: recurse, Expr_literal: recurse,
    Expr_input: (input) => input.toNgTemplate(),
    Expr_element: transformActionInput(
      appName, symbolTable, actionInputs, context),
    Expr_parens: (_op, expr, _cp) => `(${expr.toNgTemplate()})`,

    UnExpr_not: (_not, expr) => `!${expr.toNgTemplate()}`,
    BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
    BinExpr_and: (leftExpr, _and, rightExpr) =>
      `${leftExpr.toNgTemplate()} && ${rightExpr.toNgTemplate()}`,
    BinExpr_or: (leftExpr, _and, rightExpr) =>
      `${leftExpr.toNgTemplate()} || ${rightExpr.toNgTemplate()}`,
    BinExpr_is: (leftExpr, _is, rightExpr) =>
      `${leftExpr.toNgTemplate()} === ${rightExpr.toNgTemplate()}`,
    TerExpr: (cond, _q, ifTrue, _c, ifFalse) =>
      `${cond.toNgTemplate()} ? ${ifTrue.toNgTemplate()} : ` +
      ifFalse.toNgTemplate(),
    MemberExpr: (nameOrInputNode, _dot, namesNode) => {
      const nameOrInput = nameOrInputNode.sourceString;
      const names = namesNode.sourceString;
      const fullMemberAccess = nameOrInput + names;
      if (isInput(nameOrInput)) {
        return `${nameOrInputNode.toNgTemplate()}${names}`;
      }

      return nonInputMemberAccessToField(fullMemberAccess, symbolTable);
    },

    Literal_number: (numberNode) => numberNode.sourceString,
    Literal_text: (_openQuote, text, _closeQuote) =>
      '\'' + text.sourceString + '\'',
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments
        .asIteration()
        .toNgTemplate()
        .join(', ') +
      closeCb.sourceString,
    Literal_array: (openSb, exprs, closeSb) =>
      openSb.sourceString +
      exprs
        .asIteration()
        .toNgTemplate()
        .join(', ') +
      closeSb.sourceString,
    input: (sbNode, inputNameNode) => {
      const input = `${sbNode.sourceString}${inputNameNode.sourceString}`;
      const inputEntry = <InputStEntry> symbolTable[input];
      assert.ok(
        inputEntry !== undefined,
        `Didn't find input ${input} in ${pretty(symbolTable)}`);
      assert.ok(
        inputEntry.kind === 'input',
        `Unexpected entry kind ${inputEntry.kind}`);
      const ngInputField = inputToNgField(input);
      if (!_.has(inputEntry, 'ngInputField')) {
        inputEntry.ngInputField = ngInputField;
      }

      return ngInputField;
    },
    PropAssignment: (name, _c, expr) =>
      `${name.sourceString}: ${expr.toNgTemplate()}`
  };
}

function transformActionInput(
  appName: string, symbolTable: ActionSymbolTable,
  actionInputs: CompiledAction[], context: SymbolTable) {

  return (element) => {
    const actionInputCompiler = new ActionInputCompiler();
    const compiledActionInput = actionInputCompiler
      .compile(element.sourceString, symbolTable);

    const actionCompiler = new ActionCompiler();

    const compiledAction = actionCompiler
      .compile(appName, compiledActionInput.action, context);

    actionInputs.push(compiledAction);

    const inputsObj = _
      .reduce(
        compiledActionInput.inputsFromContext, (obj, inputFromContext) => {
        obj[inputToNgField(inputFromContext.input)] = inputFromContext.field;

        return obj;
      }, {});

    const inputsStr = '{ ' + _
      .map(_.keys(inputsObj), (k: string) =>
        `${k}: ${nonInputMemberAccessToField(inputsObj[k], symbolTable)}`)
      .join(', ') + ' }';

    return `{
      type: ${classNameToNgField(compiledAction.className)},
      tag: ${compiledAction.selector},
      inputs: ${inputsStr}
    }`;
  };
}
