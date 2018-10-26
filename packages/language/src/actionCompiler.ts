import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';

import {
  ActionSymbolTable, ClicheStEntry,
  StEntry, SymbolTable
} from './symbolTable';

import * as _ from 'lodash';

const ohm = require('ohm-js');

const DV_ACTION = 'dv.action';
const DV_ACTION_NAME_ATTR = 'name';

export class ActionCompiler {
  private readonly grammar;
  private readonly semantics;

  private static GetActionName() {
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
      ActionNameMaybeAlias: (actionName, _as, _alias): string | null =>
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

  private static SaveSymbolsOperation(symbolTable: ActionSymbolTable) {
    return {
      Element: (element) => element.saveSymbols(),
      NormalElement: (startTag, content, _endTag) => {
        startTag.saveSymbols();
        content.saveSymbols();
      },
      VoidElement: (_open, elementName, _attributes, _close) =>
        elementName.saveSymbols(),
      StartTag: (_open, elementName, _attributes, _close) =>
        elementName.saveSymbols(),
      ElementName_action: (actionNameMaybeAlias) =>
        actionNameMaybeAlias.saveSymbols(),
      ElementName_html: (_name) => { }, Content_text: (_text) => { },
      Content_element: (element) => element.saveSymbols(),
      ActionNameMaybeAlias: (actionName, _as, maybeAlias) => {
        const alias = maybeAlias[0];
        if (alias !== undefined) {
          symbolTable[alias.sourceString] = { kind: 'action' };
        } else {
          actionName.saveSymbols();
        }
      },
      actionName: (clicheAliasNode, _dot, actionNameNode) => {
        const clicheAlias = clicheAliasNode.sourceString;
        const actionName = actionNameNode.sourceString;
        if (!_.has(symbolTable, clicheAlias)) {
          symbolTable[clicheAlias] = { kind: 'cliche' };
        }
        if (!_.has(symbolTable[clicheAlias], 'symbolTable')) {
          (<ClicheStEntry> symbolTable[clicheAlias]).symbolTable = {};
        }
        (<ClicheStEntry> symbolTable[clicheAlias])
          .symbolTable[actionName] = { kind: 'action' };
      }
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
          throw new Error(`${clicheOrActionAlias} not found`);
        }
        const stEntry: StEntry = symbolTable[clicheOrActionAlias];
        switch (stEntry.kind) {
          case 'cliche':
            const clicheName = clicheOrActionAlias;
            const [ actionName, output ] = rest;
            if (!_.has(stEntry, `symbolTable.${actionName}`)) {
              throw new Error(`${clicheName}.${actionName} not found`);
            }
            _.set(
              stEntry.symbolTable[actionName], `symbolTable.${output}`,
              { kind: 'output' });
            break;
          case 'action':
            _.set(
              stEntry.symbolTable[actionName], `symbolTable.${output}`,
              { kind: 'output' });
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

  private static ToNgTemplateOperation(symbolTable: SymbolTable) {
    // only look at actions. for exprs that are not text you do
    // [attr]="${expr.ToNgTemplateOperation()}"
    // everything stays the same (replace and for && and or for ||)
    // until you find a input -> replace the $ with input
    // with the dot you have to:
    // if the left st entry is an input -> let the dot be
    // if the left st entry is a cliche or actionAlias => it is an output =>
    // replace the whole thing with its "output name"

    // Also, you need to see if someone is using your output, if
    // so you do (outputName)="foo=$event" -> this means we need to record the
    // used outputs in the symbol table
    return {
      Element: (element) => { return; }
    };
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
        'getActionName', ActionCompiler.GetActionName())
      .addOperation(
        'saveSymbols', ActionCompiler
          .SaveSymbolsOperation(thisActionSymbolTable))
      .addOperation('saveUsedOutputs', ActionCompiler
          .SaveUsedOutputsOperation(thisActionSymbolTable))
      .addOperation(
        'toNgTemplate', ActionCompiler.ToNgTemplateOperation(symbolTable));

    const matchResult = this.grammar.match(actionContents);
    if (matchResult.failed()) {
      throw new Error('Syntax error:' + matchResult.message);
    }
    const s = this.semantics(matchResult);
    const thisActionName = s.getActionName();
    console.log('Got action name' + thisActionName);
    console.log(JSON.stringify(symbolTable));
    s.saveSymbols(); // mutates thisActionSymbolTable
    _.set(symbolTable, [appName, thisActionName], {
      kind: 'action',
      symbolTable: thisActionSymbolTable
    });
    s.saveUsedOutputs();
    s.toNgTemplate();
    console.log(JSON.stringify(symbolTable));
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
        ${outputFields.join()}
        ${inputFields.join()}
        ${fields.join()}
      }
    `;
  }
}
