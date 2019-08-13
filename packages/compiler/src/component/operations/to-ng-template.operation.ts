import {
  ComponentStEntry,
  ComponentSymbolTable, ConceptStEntry,
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
  isComponent,
  isInput,
  outputToNgField
} from './shared';

import * as assert from 'assert';

import * as _ from 'lodash';
import { ComponentInputCompiler } from '../../component-input/component-input.compiler';
import { ComponentCompiler, CompiledComponent } from '../component.compiler';


// Some HTML attributes don't have corresponding properties. For these,
// we need to avoid turning the attribute into a property.
// TODO: find the complete list
const ATTRS_NO_PROP = new Set(['colspan', 'rowspan']);

function nonInputMemberAccessToField(
  fullMemberAccess: string, symbolTable: ComponentSymbolTable) {
  const conceptOrComponentAlias = _
    .split(fullMemberAccess, '.', 1)[0];
  const stEntry: StEntry | undefined = symbolTable[conceptOrComponentAlias];
  if (stEntry === undefined) {
    throw new Error(
      `Symbol ${conceptOrComponentAlias} not found in ` +
      `symbol table ${pretty(symbolTable)}`);
  }

  let conceptName: string, componentName: string, output: string;
  let alias: string | undefined;
  let memberAccesses: string;
  switch (stEntry.kind) {
    case 'concept':
      conceptName = conceptOrComponentAlias;
      [ componentName, output ] = fullMemberAccess
        .slice(conceptName.length + 1)
        .split('.', 2);
      memberAccesses = fullMemberAccess
        .slice(conceptName.length + componentName.length +
          output.length + 2);
      break;
    case 'component':
      conceptName = stEntry.of;
      componentName = stEntry.componentName;
      alias = conceptOrComponentAlias;
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
    conceptName, componentName, output, alias);

  return `${outputField}${memberAccesses}`;
}

export function toNgTemplate(
  appName: string, symbolTable: ComponentSymbolTable,
  componentInputs: CompiledComponent[], context: SymbolTable) {
  const tagTransform = (open, elementName, attrs, close): string => {
    let transformedElementName = elementName.toNgTemplate();
    let transformedComponentName = _.split(transformedElementName, ' ', 1)[0];
    const tagIsNgComponent = isComponent(transformedComponentName);
    let outputs = [];
    if (tagIsNgComponent && transformedComponentName !== 'dv-component') {
      const maybeAlias: string[] | null = transformedElementName
        .match(/dvAlias="(.*)"/);
      const alias = (maybeAlias !== null) ? maybeAlias[1] : undefined;


      if (transformedComponentName === 'dv-tx' && alias !== undefined) {
        throw new Error(`dv.tx can't be aliased`);
      }

      const componentEntry: ComponentStEntry | undefined = getStEntryForNgComponent(
        transformedComponentName, symbolTable, alias);
      if (componentEntry === undefined) {
        assert.fail(
          `No entries for ${transformedComponentName}, alias ${alias}` +
          ` symbol table ${pretty(symbolTable)}`);
      }

      outputs = _
        .map(componentEntry.symbolTable,
          (outputEntry: OutputStEntry, outputKey: string) => {
            assert.ok(
              componentEntry.of !== undefined,
              `Expected entry ${pretty(componentEntry)} to have an "of"`);
            assert.ok(
              componentEntry.componentName !== undefined,
              `Expected entry ${pretty(componentEntry)} to have a "componentName"`);
            const ngOutputField = outputToNgField(
              componentEntry.of, componentEntry.componentName, outputKey, alias);

            outputEntry.ngOutputField = ngOutputField;

            return `(${outputKey})="${ngOutputField}=$event"`;
          });

      const conceptAlias = _.split(transformedComponentName, '-', 1)[0];
      if (conceptAlias !== 'dv' && conceptAlias !== appName) {
        const conceptContextEntry = context[conceptAlias];
        if (conceptContextEntry === undefined) {
          throw new Error(`Cliché ${conceptAlias} not found`);
        }
        assert.ok(conceptContextEntry.kind === 'concept',
          `Unexpected entry type ${conceptContextEntry.kind} ` +
          `for concept ${conceptAlias}`);
        const conceptName = (<ConceptStEntry>conceptContextEntry).conceptName;
        if (conceptName !== conceptAlias) {
          const elemRest = transformedElementName
            .slice(transformedElementName.indexOf('-'));
          transformedElementName = conceptName + elemRest +
            ` dvOf="${conceptAlias}"`;
          const componentRest = transformedComponentName
            .slice(transformedComponentName.indexOf('-'));
          transformedComponentName = conceptName + componentRest;
        }
      }
    }

    let attrsString = _
      .join(_.concat(attrs.toNgTemplate(), outputs), ' ');

    if (transformedComponentName === 'dv-if') {
      transformedComponentName = 'div';
      transformedElementName = transformedElementName.replace('dv-if ', 'div ');
      attrsString = attrsString.replace('[condition]=', '*ngIf=');
    }


    // Close void elements
    const closeStr = (tagIsNgComponent && close.sourceString === '/>') ?
      `></${transformedComponentName}>` : close.sourceString;

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
      if (_.startsWith(startTagNg, '<dv-component')) {
        return content;
      }

      return startTagNg + content + endTag.toNgTemplate();
    },
    StartTag: tagTransform,
    EndTag: (open, elementNameNode, close): string => {
      let elementName = elementNameNode.toNgTemplate();
      if (isComponent(elementName)) {
        const conceptAlias = _.split(elementName, '-', 1)[0];
        if (conceptAlias !== 'dv' && conceptAlias !== appName) {
          const conceptContextEntry = context[conceptAlias];
          if (conceptContextEntry === undefined) {
            throw new Error(`Cliché ${conceptAlias} not found`);
          }
          assert.ok(conceptContextEntry.kind === 'concept',
            `Unexpected entry type ${conceptContextEntry.kind} ` +
            `for concept ${conceptAlias}`);
          const conceptName = (<ConceptStEntry> conceptContextEntry).conceptName;
          if (conceptName !== conceptAlias) {
            const rest = elementName
              .slice(elementName.indexOf('-'));
            elementName = conceptName + rest;
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
    ElementName_component: (componentNameMaybeAlias) =>
      componentNameMaybeAlias.toNgTemplate(),
    ElementName_html: (name) => name.sourceString,
    ComponentNameMaybeAlias: (componentName, maybeAliasNode) => {
      const maybeAlias = maybeAliasNode.toNgTemplate();
      const dvAlias: string | undefined =
        (!_.isEmpty(maybeAlias)) ? `dvAlias="${maybeAlias}"` : '';
      const transformedComponentName = _
        .replace(componentName.sourceString, '.', '-');

      return `${transformedComponentName} ${dvAlias}`;
    },
    Alias: (_as, alias) => alias.sourceString,
    Expr_un: recurse, Expr_bin: recurse, Expr_ter: recurse,
    Expr_prop: recurse, Expr_literal: recurse,
    Expr_input: (input) => input.toNgTemplate(),
    Expr_element: transformComponentInput(
      appName, symbolTable, componentInputs, context),
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

function transformComponentInput(
  appName: string, symbolTable: ComponentSymbolTable,
  componentInputs: CompiledComponent[], context: SymbolTable) {

  return (element) => {
    const componentInputCompiler = new ComponentInputCompiler();
    const compiledComponentInput = componentInputCompiler
      .compile(element.sourceString, symbolTable);

    const componentCompiler = new ComponentCompiler();

    const compiledComponent = componentCompiler
      .compile(appName, compiledComponentInput.component, context);

    componentInputs.push(compiledComponent);

    const inputsObj = _
      .reduce(
        compiledComponentInput.inputsFromContext, (obj, inputFromContext) => {
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
      type: ${classNameToNgField(compiledComponent.className)},
      tag: '${compiledComponent.selector}',
      inputs: ${inputsStr}
    }`;
  };
}
