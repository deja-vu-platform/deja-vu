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
  isAction,
  isInput,
  outputToNgField
} from './shared';

import * as assert from 'assert';

import * as _ from 'lodash';
import { ActionInputCompiler } from '../../action-input/action-input.compiler';
import { ActionCompiler, CompiledAction } from '../action.compiler';


// Some HTML attributes don't have corresponding properties. For these,
// we need to avoid turning the attribute into a property.
// TODO: find the complete list
const ATTRS_NO_PROP = new Set(['colspan', 'rowspan']);

function nonInputMemberAccessToField(
  fullMemberAccess: string, symbolTable: ActionSymbolTable) {
  const clicheOrActionAlias = _
    .split(fullMemberAccess, '.', 1)[0];
  const stEntry: StEntry | undefined = symbolTable[clicheOrActionAlias];
  if (stEntry === undefined) {
    throw new Error(
      `Symbol ${clicheOrActionAlias} not found in ` +
      `symbol table ${pretty(symbolTable)}`);
  }

  let clicheName: string, actionName: string, output: string;
  let alias: string | undefined;
  let memberAccesses: string;
  switch (stEntry.kind) {
    case 'cliche':
      clicheName = clicheOrActionAlias;
      [ actionName, output ] = fullMemberAccess
        .slice(clicheName.length + 1)
        .split('.', 2);
      memberAccesses = fullMemberAccess
        .slice(clicheName.length + actionName.length +
          output.length + 2);
      break;
    case 'action':
      clicheName = stEntry.of;
      actionName = stEntry.actionName;
      alias = clicheOrActionAlias;
      output = fullMemberAccess
        .slice(alias.length + 1)
        .split('.', 1)[0];
      if (output.endsWith('?')) {
        output = output.slice(0, -1);
        memberAccesses = '?' + fullMemberAccess
          .slice(alias.length + output.length + 2);
      } else {
        memberAccesses = fullMemberAccess
          .slice(alias.length + output.length + 1);
      }
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
    const tagIsNgComponent = isAction(transformedActionName);
    let outputs = [];
    if (tagIsNgComponent && transformedActionName !== 'dv-action') {
      const maybeAlias: string[] | null = transformedElementName
        .match(/dvAlias="(.*)"/);
      const alias = (maybeAlias !== null) ? maybeAlias[1] : undefined;


      if (transformedActionName === 'dv-tx' && alias !== undefined) {
        throw new Error(`dv.tx can't be aliased`);
      }

      const actionEntry: ActionStEntry | undefined = getStEntryForNgComponent(
        transformedActionName, symbolTable, alias);
      if (actionEntry === undefined) {
        assert.fail(
          `No entries for ${transformedActionName}, alias ${alias}` +
          ` symbol table ${pretty(symbolTable)}`);
      }

      outputs = _
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
    }

    let attrsString = _
      .join(_.concat(attrs.toNgTemplate(), outputs), ' ');

    if (transformedActionName === 'dv-if') {
      transformedActionName = 'div';
      transformedElementName = transformedElementName.replace('dv-if ', 'div ');
      attrsString = attrsString.replace('[condition]=', '*ngIf=');
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
  const binOpToStr = (leftExpr, op, rightExpr) => {
    const opTransformMap = { gt: '>', 'gt=': '>=', lt: '<', 'lt=': '<=' };
    const transformedOpString = opTransformMap[op.sourceString] ?
      opTransformMap[op.sourceString] : op.sourceString;

    return `${leftExpr.toNgTemplate()} ` +
      `${transformedOpString} ${rightExpr.toNgTemplate()}`;
  };

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
      if (isAction(elementName)) {
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

        if (elementName.trim() === 'dv-if') {
          elementName = 'div';
        }
      }

      return open.sourceString + elementName + close.sourceString;
    },
    VoidElement: tagTransform,
    Attribute: (attributeNameNode, _eq, expr) => {
      const attrName = attributeNameNode.sourceString;

      return ATTRS_NO_PROP.has(attrName) ?
        `${attrName}=${expr.sourceString}` :
        `[${attributeNameToInput(attrName)}]="${expr.toNgTemplate()}"`;
    },
    Content_text: (text) => text.sourceString,
    Content_element: (element) => element.toNgTemplate(),
    Content_interpolation: (interpolation) => interpolation.toNgTemplate(),
    Interpolation: (_cb1, expr, _cb2) => `{{ ${expr.toNgTemplate()} }}`,
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
    Expr_prop: recurse, Expr_literal: recurse,
    Expr_input: (input) => input.toNgTemplate(),
    Expr_element: transformActionInput(
      appName, symbolTable, actionInputs, context),
    Expr_parens: (_op, expr, _cp) => `(${expr.toNgTemplate()})`,

    UnExpr_not: (_not, expr) => `!${expr.toNgTemplate()}`,

    BinExpr_plus: binOpToStr, BinExpr_minus: binOpToStr,
    BinExpr_mul: binOpToStr, BinExpr_div: binOpToStr,
    BinExpr_mod: binOpToStr,

    BinExpr_lt: binOpToStr, BinExpr_gt: binOpToStr,
    BinExpr_le: binOpToStr, BinExpr_ge: binOpToStr,

    BinExpr_eq: binOpToStr, BinExpr_neq: binOpToStr,
    BinExpr_and: binOpToStr, BinExpr_or: binOpToStr,

    TerExpr: (cond, _q, ifTrue, _c, ifFalse) =>
      `${cond.toNgTemplate()} ? ${ifTrue.toNgTemplate()} : ` +
    ifFalse.toNgTemplate(),
    PropExpr_io: (nameOrInputNode, _dot, namesNode) => {
      const nameOrInput = nameOrInputNode.sourceString;
      const names = namesNode.sourceString;
      const fullMemberAccess = nameOrInput + names;
      if (isInput(nameOrInput)) {
        return `${nameOrInputNode.toNgTemplate()}${names}`;
      }

      return nonInputMemberAccessToField(fullMemberAccess, symbolTable);
    },
    PropExpr_dynamic: (e1, _sqb1, e2, _s1b2) =>
      `${e1.toNgTemplate()}[${e2.toNgTemplate()}]`,
    PropExpr_static: (e, nav, name) =>
      e.toNgTemplate() + nav.toNgTemplate() + name.toNgTemplate(),
    Literal_number: (numberNode) => numberNode.sourceString,
    Literal_text: (stringLiteral) => stringLiteral.toNgTemplate(),
    stringLiteral_doubleQuote: (_oq, text, _cq) =>
      // We are going to be wrapping text in double quotes, so we need to escape
      // unescaped double quotes (in addition to unescaped single quotes)
      '\'' + text.sourceString
        .replace(/([^\\])"/g, '$1\\"')
        .replace(/([^\\])'/g, '$1\\\'') + '\'',
    stringLiteral_singleQuote: (_oq, text, _cq) =>
      '\'' + text.sourceString
        .replace(/([^\\])"/g, '$1\\"')
        .replace(/([^\\])'/g, '$1\\\'') + '\'',
    Literal_true: (trueNode) => trueNode.sourceString,
    Literal_false: (falseNode) => falseNode.sourceString,
    Literal_obj: (objLiteral) => objLiteral.toNgTemplate(),
    ObjectLiteral_noTrailingComma: (openCb, propAssignments, closeCb) =>
      openCb.sourceString +
      propAssignments
        .asIteration()
        .toNgTemplate()
        .join(', ') +
      closeCb.sourceString,
    ObjectLiteral_trailingComma: (openCb, propAssignments, _comma, closeCb) =>
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
    PropAssignment: (prop, _c, expr) =>
    `${prop.toNgTemplate()}: ${expr.toNgTemplate()}`,
    Prop_noQuote: (name) => name.sourceString,
    Prop_withQuotes: (stringLiteral) => `'${stringLiteral
        .sourceString
        .slice(1, -1)}'`,
    nav: (nav) => nav.sourceString,
    name: (l, rest) => l.sourceString + rest.sourceString
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
        `${k}: ${isInput(inputsObj[k]) ?
          inputToNgField(inputsObj[k]) :
          nonInputMemberAccessToField(inputsObj[k], symbolTable)}`)
      .join(', ') + ' }';

    return `{
      type: ${classNameToNgField(compiledAction.className)},
      tag: ${compiledAction.selector},
      inputs: ${inputsStr}
    }`;
  };
}
