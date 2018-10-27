import { readFileSync, writeFileSync, existsSync } from 'fs';

import * as assert from 'assert';

import * as path from 'path';

import {
  ActionStEntry, ActionSymbolTable, ClicheStEntry, InputStEntry, EntryKind,
  OutputStEntry, pretty, StEntry, SymbolTable, ActionSymbolTableStEntry
} from './symbolTable';

import * as _ from 'lodash';

const ohm = require('ohm-js');

const DV_ACTION = 'dv.action';
const DV_ACTION_NAME_ATTR = 'name';


export class ActionCompiler {
  private readonly grammar;
  private readonly semantics;

  private static FilterKind(kind: EntryKind, symbolTable: ActionSymbolTable)
    : ActionSymbolTableStEntry[] {
    return _
      .chain(symbolTable)
      .values()
      .map((e) => { console.log(pretty(e)); return e;})
      .filter((entry) => entry.kind === kind)
      .value();
  }

  private static GetNgFieldsFromEntries(
    entries: InputStEntry[] | OutputStEntry[]): string[] {
    return _.map(
      entries,
      (entry: InputStEntry | OutputStEntry): string =>
        entry.kind === 'input' ? entry.ngInputField : entry.ngOutputField);
  }

  private static GetNgFields(
    kind: 'input' | 'output', symbolTable: ActionSymbolTable): string[] {
    return ActionCompiler.GetNgFieldsFromEntries(
      <InputStEntry[] | OutputStEntry[]> ActionCompiler
        .FilterKind(kind, symbolTable));
  }

  private static GetActionNameOperation() {
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
      Expr_un: err, Expr_bin: err, Expr_name: err, Expr_input: err,
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

  private static SaveUsedActionsOperation(symbolTable: ActionSymbolTable) {
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
            .split(actionNameNode.sourceString, '.');
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

  private static SaveInputsOperation(symbolTable: ActionSymbolTable) {
    const recurse = (expr) => expr.saveInputs();
    const binOpRecurse = (leftExpr, _op, rightExpr) => {
      leftExpr.saveInputs();
      rightExpr.saveInputs();
    };

    return {
      Element: (element) => element.saveInputs(),
      NormalElement: (startTag, content, _endTag) => {
        startTag.saveInputs();
        content.saveInputs();
      },
      VoidElement: (_open, _elementName, attributes, _close) =>
        attributes.saveInputs(),
      StartTag: (_open, _elementName, attributes, _close) =>
        attributes.saveInputs(),
      Attribute: (_attributeName, _eq, expr) => expr.saveInputs(),

      Expr_un: recurse, Expr_bin: recurse, Expr_member: recurse,
      Expr_literal: recurse,
      Expr_name: (_name) =>  {},
      Expr_input: (inputNode) => {
        const input = inputNode.sourceString;
        symbolTable[input] = { kind: 'input' };
      },
      Expr_element: (element) => {}, // TODO

      UnExpr_not: (_not, expr) => expr.saveInputs(),
      BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
      BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,

      MemberExpr: binOpRecurse,

      Literal_number: (number) => {},
      Literal_text: (_openQuote, _text, _closeQuote) => {},
      Literal_true: (_true) => {}, Literal_false: (_false) => {},
      Literal_obj: (_openCb, propAssignments, _closeCb) =>
        propAssignments.saveInputs(),
      Literal_array: (_openSb, exprs, _closeSb) => exprs.saveInputs(),
      Content_element: (element) => element.saveInputs(),
      Content_text: (_text) => {},
      name: (_letter, _rest)  => {}
    };
  }

  private static CheckForErrorsOperation(symbolTable: ActionSymbolTable) {
    // TODO:
    // - no closing tags without a matching open tag
  }

  /**
   * Parse attribute exprs to discover the used outputs of included actions.
   *
   * For the time being, instead of figuring out what the real outputs of a
   * cliché action are, we parse the attribute exprs to discover what outputs
   * are used and save this information in the symbol table. If the user is
   * using an output that doesn't exist, ng will throw an error later.
   *
   * It is useful to know what outputs are used so that when we are converting
   * an action node to its corresponding ng template node we can bind the
   * used output.
   */
  private static SaveUsedOutputsOperation(symbolTable: ActionSymbolTable) {
    const recurse = (expr) => expr.saveUsedOutputs();
    const binOpRecurse = (leftExpr, _op, rightExpr) => {
      leftExpr.saveUsedOutputs();
      rightExpr.saveUsedOutputs();
    };

    return {
      Element: (element) => element.saveUsedOutputs(),
      NormalElement: (startTag, content, _endTag) => {
        startTag.saveUsedOutputs();
        content.saveUsedOutputs();
      },
      VoidElement: (_open, _elementName, attributes, _close) =>
        attributes.saveUsedOutputs(),
      StartTag: (_open, _elementName, attributes, _close) =>
        attributes.saveUsedOutputs(),
      Attribute: (_attributeName, _eq, expr) => expr.saveUsedOutputs(),

      Expr_un: recurse, Expr_bin: recurse, Expr_member: recurse,
      Expr_literal: recurse,
      Expr_name: (name) => name.sourceString,
      Expr_input: (input) => input.sourceString,
      Expr_element: (element) => {}, // TODO

      UnExpr_not: (_not, expr) => expr.saveUsedOutputs(),
      BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
      BinExpr_and: binOpRecurse, BinExpr_or: binOpRecurse,
      MemberExpr: (nameOrInputNode, _dot, namesNode) =>  {
        const nameOrInput = nameOrInputNode.sourceString;
        const names = namesNode.sourceString;
        const fullMemberAccess = nameOrInput + names;
        if (ActionCompiler.IsInput(nameOrInput)) {
          return;
        }
        const [ clicheOrActionAlias, ...rest ] = _.split(fullMemberAccess, '.');
        if (!_.has(symbolTable, clicheOrActionAlias)) {
          throw new Error(
            `${clicheOrActionAlias} not found in ` +
            `symbol table ${pretty(symbolTable)}`);
        }
        const stEntry: StEntry = symbolTable[clicheOrActionAlias];
        switch (stEntry.kind) {
          case 'cliche':
            const clicheName = clicheOrActionAlias;
            const [ actionName, output ] = rest;
            if (!_.has(stEntry, `symbolTable.${actionName}`)) {
              throw new Error(
                `${clicheName}.${actionName} not found in ` +
              `symbol table ${pretty(symbolTable)}`);
            }
            _.set(
              stEntry.symbolTable[actionName], `symbolTable.${output}`,
              { kind: 'output' });
            break;
          case 'action':
            _.set(stEntry, `symbolTable.${rest[0]}`, { kind: 'output' });
            break;
          default:
            // nothing
            break;
        }
      },

      Literal_number: (number) => {},
      Literal_text: (_openQuote, _text, _closeQuote) => {},
      Literal_true: (_true) => {}, Literal_false: (_false) => {},
      Literal_obj: (_openCb, propAssignments, _closeCb) =>
        propAssignments.saveUsedOutputs(),
      Literal_array: (_openSb, exprs, _closeSb) => exprs.saveUsedOutputs(),
      Content_element: (element) => element.saveUsedOutputs(),
      Content_text: (_text) => {}
    };
  }

  private static IsInput(name: string) {
    return _.startsWith(name, '$');
  }

  private static ToNgTemplateOperation(symbolTable: ActionSymbolTable) {
    const tagTransform = (open, elementName, attrs, close): string => {
      const transformedElementName = elementName.toNgTemplate();
      const transformedActionName = _.split(transformedElementName, ' ', 1)[0];
      const tagIsNgComponent = ActionCompiler.IsNgComponent(transformedActionName);
      let attrsString;
      if (tagIsNgComponent && transformedActionName !== 'dv-action') {
        const maybeAlias: string[] | null = transformedElementName
          .match(/dvAlias="(.*)"/);
        const alias = (maybeAlias !== null) ? maybeAlias[1] : undefined;

        const actionEntry: ActionStEntry | undefined = ActionCompiler
          .GetStEntryForNgComponent(transformedActionName, symbolTable, alias);
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
              const ngOutputField = ActionCompiler.OutputToNgField(
                actionEntry.of, actionEntry.actionName, outputKey, alias);
/*
              assert.ok(
                _.has(entry, `symbolTable.${outputKey}`),
                `Didn't find ${outputKey} in ${pretty(entry)}`);
              const outputEntry = entry.symbolTable[outputKey];
              assert.ok(outputEntry.kind === 'output');
              (<OutputStEntry> outputEntry).ngOutputField = ngOutputField;
               */
              outputEntry.ngOutputField = ngOutputField;

              return `(${outputKey})="${ngOutputField}=$event"`;
            });

        attrsString = _
          .join(_.concat(attrs.toNgTemplate(), outputs), ' ');
      } else {
        attrsString = attrs.sourceString;
      }

      return open.sourceString +
        transformedElementName + ' ' +
        attrsString +
        close.sourceString;
    };
    const recurse = (expr) => expr.toNgTemplate();
    const binOpRecurse = (leftExpr, op, rightExpr) =>
      `${leftExpr.toNgTemplate()} ${op} ${rightExpr.saveUsedOutputs()}`;

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
      EndTag: (open, elementName, close): string =>
        open.sourceString + elementName.toNgTemplate() + close.sourceString,
      VoidElement: tagTransform,
      Attribute: (attributeNameNode, eq, expr) => {
        // If we got to this point we know that this is an attribute of an
        // action => with the exception of the html class attribute, the attr
        // should be converted to an ng input
        const attributeName = attributeNameNode.sourceString;
        const newAttributeName = (attributeName === 'class') ?
          attributeName : `[${attributeName}]`;

        return `${newAttributeName}${eq.sourceString}"${expr.toNgTemplate()}"`;
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
      Expr_un: recurse, Expr_bin: recurse, Expr_member: recurse,
      Expr_literal: recurse,
      Expr_name: (name) => name.sourceString,
      Expr_input: (input) => {
        const inputEntry = symbolTable[input.sourceString];
        assert.ok(
          inputEntry !== undefined,
          `Didn't find input ${input.sourceString} in ${pretty(symbolTable)}`);
        assert.ok(
          inputEntry.kind === 'input', `Unexpected entry kind ${inputEntry.kind}`);
        const ngInputField = ActionCompiler.InputToNgField(input.sourceString);
        (<InputStEntry> inputEntry).ngInputField = ngInputField;

        return ngInputField;
      },
      Expr_element: (element) => {}, // TODO
      UnExpr_not: (_not, expr) => `!${expr.toNgTemplate()}`,
      BinExpr_plus: binOpRecurse, BinExpr_minus: binOpRecurse,
      BinExpr_and: (leftExpr, and, rightExpr) =>
        `${leftExpr.toNgTemplate()} && ${rightExpr.toNgTemplate()}`,
      BinExpr_or: (leftExpr, and, rightExpr) =>
        `${leftExpr.toNgTemplate()} || ${rightExpr.toNgTemplate()}`,
      MemberExpr: (nameOrInputNode, dot, namesNode) => {
        const nameOrInput = nameOrInputNode.sourceString;
        const names = namesNode.sourceString;
        const fullMemberAccess = nameOrInput + names;
        if (ActionCompiler.IsInput(nameOrInput)) {
          return `${nameOrInputNode.toNgTemplate()}${names}`;
        }
        const [ clicheOrActionAlias, ...rest ] = _.split(fullMemberAccess, '.');
        const stEntry: StEntry = symbolTable[clicheOrActionAlias];
        let clicheName: string, actionName: string, output: string;
        let alias: string | undefined;
        let memberAccesses: string[];
        switch (stEntry.kind) {
          case 'cliche':
            clicheName = clicheOrActionAlias;
            [ actionName, output, ...memberAccesses ] = rest;
            break;
          case 'action':
            clicheName = stEntry.of;
            actionName = stEntry.actionName;
            alias = clicheOrActionAlias;
            [ output, ...memberAccesses ] = rest;
            break;
          default:
            throw new Error(`Unexpected entry ${stEntry.kind}`);
        }

        const outputField = ActionCompiler.OutputToNgField(
          clicheName, actionName, output, alias);

        const memberAccessStr = _.isEmpty(memberAccesses) ?
          '' : `.${_.join(memberAccesses, '.')}`;
        return `${outputField}${memberAccessStr}`;
      },

      Literal_number: (number) => `${number.sourceString}`,
      Literal_text: (_openQuote, text, _closeQuote) =>
        '\'' + text.sourceString + '\'',
      Literal_true: (trueNode) => `${trueNode.sourceString}`,
      Literal_false: (falseNode) => `${falseNode.sourceString}`,
      Literal_obj: (openCb, propAssignments, closeCb) =>
        openCb.sourceString + propAssignments.toNgTemplate() +
        closeCb.sourceString,
      Literal_array: (openSb, exprs, closeSb) =>
        openSb.sourceString + exprs.saveUsedOutputs() + closeSb.sourceString,
    };
  }

  private static InputToNgField(input: string) {
    return `__ngInput__${input.substr(1)}`;
  }

  private static IsNgComponent(name: string): boolean {
    return _.includes(name, '-');
  }

  private static GetStEntryForNgComponent(
    ngComponentName: string, symbolTable: ActionSymbolTable, alias?: string)
    : ActionStEntry | undefined {
    const [ clicheName, actionName ] = _.split(ngComponentName, /-(.+)/ );
    const stPath = (alias === undefined) ?
      `${clicheName}.symbolTable.${actionName}` : alias;

    return <ActionStEntry | undefined> _.get(symbolTable, stPath);
  }

  private static OutputToNgField(
    clicheName: string, actionName: string, output: string, alias?: string) {
    const aliasStr = (alias === undefined) ? '' : `_${alias}`;

    return `__ngOutput__${clicheName}_${actionName}_${output}${aliasStr}`;
  }

  constructor() {
    const grammarPath = path.join(__dirname, 'dv.ohm');
    this.grammar = ohm.grammar(readFileSync(grammarPath, 'utf-8'));
    this.semantics = this.grammar.createSemantics();
  }

  compile(appName: string, actionContents: string, symbolTable: SymbolTable) {
    const thisActionSymbolTable: ActionSymbolTable = {};
    this.semantics
      .addOperation(
        'getActionName', ActionCompiler.GetActionNameOperation())
      .addOperation(
        'saveUsedActions', ActionCompiler
          .SaveUsedActionsOperation(thisActionSymbolTable))
      .addOperation('saveUsedOutputs', ActionCompiler
        .SaveUsedOutputsOperation(thisActionSymbolTable))
      .addOperation('saveInputs', ActionCompiler
        .SaveInputsOperation(thisActionSymbolTable))
      .addOperation(
        'toNgTemplate', ActionCompiler
          .ToNgTemplateOperation(thisActionSymbolTable));

    const matchResult = this.grammar.match(actionContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error:' + matchResult.message);
    }
    const s = this.semantics(matchResult);
    const thisActionName = s.getActionName();
    console.log('Got action name' + thisActionName);
    console.log(JSON.stringify(symbolTable));
    s.saveUsedActions(); // mutates thisActionSymbolTable
    _.set(symbolTable, [appName, thisActionName], {
      kind: 'action',
      symbolTable: thisActionSymbolTable
    });
    s.saveUsedOutputs();
    s.saveInputs();
    console.log(JSON.stringify(symbolTable));
    const ngTemplate = s.toNgTemplate();
    const ngComponentBuilder = new NgComponentBuilder(
      appName, thisActionName, ngTemplate);

    const fields: string[] =  _
      .chain(ActionCompiler.FilterKind('cliche', thisActionSymbolTable))
      .map((clicheEntry: ClicheStEntry): ActionStEntry[] =>
        <ActionStEntry[]> ActionCompiler
          .FilterKind('action', clicheEntry.symbolTable))
      .flatten()
      .map((clicheEntry: ActionStEntry): string[] =>
        ActionCompiler.GetNgFields('output', clicheEntry.symbolTable))
      .flatten()
      .value();
    const ngComponent = ngComponentBuilder
      .withInputs(ActionCompiler.GetNgFields('input', thisActionSymbolTable))
      .withOutputs(ActionCompiler.GetNgFields('output', thisActionSymbolTable))
      .withFields(fields)
      .build();
    console.log(ngComponent);
  }
}


class NgComponentBuilder {
  private inputs: string[] = [];
  private outputs: string[] = [];
  private fields: string[] = [];
  private style = '';

  private static GetClassName(actionName: string): string {
    return `${_.upperFirst(_.camelCase(actionName))}Component`;
  }

  private static GetSelector(appName: string, actionName: string): string {
    return `${appName}-${actionName}`;
  }

  constructor(
    private readonly appName: string,
    private readonly actionName: string, private readonly template: string) {}

  withInputs(inputs: string[]): NgComponentBuilder {
    this.inputs = inputs;
    return this;
  }

  withOutputs(outputs: string[]): NgComponentBuilder {
    this.outputs = outputs;
    return this;
  }

  withFields(fields: string[]): NgComponentBuilder {
    this.fields = fields;
    return this;
  }

  withStyle(style: string): NgComponentBuilder {
    this.style = style;
    return this;
  }

  build(): string {
    const selector = NgComponentBuilder
      .GetSelector(this.appName, this.actionName);
    const className = NgComponentBuilder.GetClassName(this.actionName);
    const outputFields = _.map(
      this.outputs, (output: string) =>
        `@Output() ${output} = new EventEmitter();`);
    const inputFields = _.map(
      this.inputs,  (input: string) => `@Input() ${input};`);
    const fields = _.map(this.fields, (field: string) => `${field};`);
    return `
      import { Component } from '@angular/core';

      @Component({
        selector: "${selector}",
        template: \`${this.template}\`,
        style: \`${this.style}\`
      })
      export class ${className} {
        ${outputFields.join('\n  ')}
        ${inputFields.join('\n  ')}
        ${fields.join('\n  ')}
      }
    `;
  }
}
