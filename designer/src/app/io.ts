import * as expressions from 'angular-expressions';
import * as _ from 'lodash';
import * as ohm from 'ohm-js';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ActionInstance,
  AppActionDefinition,
  InInput
} from './datatypes';
import grammarString from './expression.grammar.ohm';

/**
 * `-` is legal in dv but not ng
 * `$` is legal in ng but not dv
 *   ($ is used in dv but not considered part of a name)
 */
function dvToNgName(dvName: string) {
  return dvName.replace(/-/g, '$');
}
const grammar = ohm.grammar(grammarString);
const semantics = grammar.createSemantics();
/**
 * Converts a DV expression to an Ng expression
 */
semantics.addOperation('toNgExpr', {
  _iter: (args) => args.map((arg) => arg.toNgExpr())
    .join(''),
  _nonterminal: (args) => args.map((arg) => arg.toNgExpr())
    .join(''),
  _terminal: function() { return this.sourceString; },
  name: (leadingLetter, rest) => dvToNgName(
    leadingLetter.toNgExpr() + rest.toNgExpr()
  ),
  BinExpr_lt: (left, lt, right) => left.toNgExpr() + '<' + right.toNgExpr(),
  BinExpr_gt: (left, gt, right) => left.toNgExpr() + '>' + right.toNgExpr(),
  BinExpr_le: (left, le, right) => left.toNgExpr() + '<=' + right.toNgExpr(),
  BinExpr_ge: (left, ge, right) => left.toNgExpr() + '>=' + right.toNgExpr()
});
/**
 * Returns an array of strings, the names (inputs & outputs)
 *    referenced in the expression
 */
semantics.addOperation('getNames', {
  _iter: (args) => args.map((arg) => arg.getNames())
    .flat(),
  _nonterminal: (args) => args.map((arg) => arg.getNames())
    .flat(),
  _terminal: () => [],
  MemberExpr: function(nameOrInput, nav) { return [this.sourceString]; },
  input: function(dollarSign, name) { return [this.sourceString]; }
});

interface InReferences {
  [actionID: string]: {
    [ioName: string]: {
      fromAction: ActionInstance;
      ioName: string
    }[];
  };
}

// the dual of InReferences
interface OutReferences {
  [actionID: string]: {
    byAction: ActionInstance,
    ioName: string;
  }[];
}


export class ActionIO {
  private readonly subjects: { [ioName: string]: BehaviorSubject<any> } = {};

  getSubject(ioName: string): BehaviorSubject<any> {
    if (!this.subjects[ioName]) {
      const subject = new BehaviorSubject<any>(undefined);
      this.subjects[ioName] = subject;
    }

    return this.subjects[ioName];
  }

}

export class ScopeIO {
  // populated in app.module.ts to avoid cyclic imports
  static actionInstanceComponent: any;

  private readonly rep: { [actionID: string]: ActionIO } = {};

  private subscriptions: Subscription[] = [];
  private actionInstance: ActionInstance;

  readonly inReferences: InReferences = {};
  readonly outReferences: OutReferences = {};

  get actionDefinition(): AppActionDefinition {
    return this.actionInstance.of as AppActionDefinition;
  }

  /**
   * Public because used to link scopes when an app action is instantiated
   * in another app action
   */
  setActionIO(action: ActionInstance, actionIO: ActionIO): void {
    this.rep[action.id] = actionIO;
  }

  /**
   * Get only the I/O settings of a single action
   * Public so setActionIO can be used
   */
  getActionIO(action: ActionInstance): ActionIO {
    if (!this.rep[action.id]) {
      this.setActionIO(action, new ActionIO());
    }

    return this.rep[action.id];
  }

  /**
   * Get the RxJS subject for a single input/output
   * Public so values can be sent to / gotten from cliche actions
   * And because we need some values (e.g. hidden)
   */
  getSubject(action: ActionInstance, ioName: string): BehaviorSubject<any> {
    const actionIO = this.getActionIO(action);

    return actionIO.getSubject(ioName);
  }

  /**
   * Take an instance of an app action
   * and set up subscriptions so that all values flow to/between
   * this action and its children as they should
   * This also sets the context to the action you give it
   */
  link(actionInstance: ActionInstance): void {
    this.unlink();
    this.actionInstance = actionInstance;
    this.resolveReferences();

    // child inputs (expression or action)
    this.actionDefinition.getChildren(false)
      .forEach((c) => { this.sendInputs(c); });

    // parent outputs (expression)
    this.actionDefinition.outputSettings.forEach((io) => {
      this.sendExpression(io.value, actionInstance, io.name);
    });
  }

  /**
   * Unset the action and delete all I/O links
   */
  unlink() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this.actionInstance = undefined;
  }

  /**
   * Examine the input settings of this app action's children
   * (and their inputted actions) and this action's output settings
   * to find all references to inputs / outputs of other actions
   */
  resolveReferences() {
    // initialize / clear state
    // the IDs of actions in scope
    const actions = [
      this.actionInstance,
      ...this.actionDefinition.getChildren(true)
    ];
    const ids = new Set(actions.map((a) => a.id));
    // delete all records of actions no longer in the scope
    [this.outReferences, this.inReferences].forEach((obj) => {
      Object.keys(obj)
        .filter((id) => !ids.has(id))
        .forEach((id) => delete obj[id]);
    });
    // create empty records for all actions in the scope
    actions.forEach((action) => {
      if (this.inReferences[action.id] === undefined) {
        this.inReferences[action.id] = {};
        action.of.inputs.forEach((inputName) => {
          this.inReferences[action.id][inputName] = [];
        });
      } else {
        Object.keys(this.inReferences[action.id])
          .forEach((inputName) => {
            this.inReferences[action.id][inputName].length = 0;
          });
      }
      if (this.outReferences[action.id] === undefined) {
        this.outReferences[action.id] = [];
      } else {
        this.outReferences[action.id].length = 0;
      }
    });
  }

  /**
   * Gets the action's input settings, resolves the values,
   *   and sends them to the IO subjects
   */
  private sendInputs(toAction: ActionInstance, inInput?: InInput) {
    toAction.of.inputs.forEach((input) => {
      const toSubject = this.getSubject(toAction, input);
      const inputVal = toAction.inputSettings[input];
      if (inputVal) {
        if (_.isString(inputVal)) {
          this.sendExpression(inputVal, toAction, input, inInput);
        } else {
          const newInInput: InInput = { of: toAction, name: input };
          this.sendInputs(inputVal, newInInput);
          this.sendAction(inputVal, toSubject, newInInput);
        }
      } else {
        toSubject.next(undefined);
      }
    });
  }

  /**
   * @param expr an expression
   * @param toSubject where to send its value
   * @param inInput given if this expression is going to a replacing action
   * If the expression cannot be parsed it just sends the raw string
   */
  private sendExpression(
    expr: string,
    toAction: ActionInstance,
    toIO: string,
    inInput?: InInput
  ) {
    const parsedExpr = semantics(grammar.match(expr));
    const names: string[] = parsedExpr.getNames();
    const ngExpr: string = parsedExpr.toNgExpr();
    const evaluate: (scope: Object) => any = expressions.compile(ngExpr);
    const scope = {};
    const toSubject = this.getSubject(toAction, toIO);
    const sendValue = () => toSubject.next(evaluate(scope));

    names.forEach((name) => {
      // parse the name
      let ioName: string;
      let fromAction: ActionInstance;
      let objectPath: string[];
      const splitName = name.replace(/\?/g, '')
        .split('.');
      const fromAbove = splitName[0].startsWith('$');
      if (fromAbove) {
        // getting an input from above
        [ioName, ...objectPath] = splitName;
        ioName = ioName.slice(1); // strip leading '$'
        if (inInput && inInput.of.of.actionInputs[inInput.name][ioName]) {
          // getting an input from within an action input
          fromAction = inInput.of;
        } else if (this.actionInstance.of.inputs.includes(ioName)) {
          // getting an input from the parent
          fromAction = this.actionInstance;
        }
      } else {
        // getting an output from a sibling
        let clicheN: string;
        let actionN: string;
        [clicheN, actionN, ioName, ...objectPath] = splitName;
        const maybeFromAction = this.actionDefinition
          .findChild(clicheN, actionN);
        if (maybeFromAction && maybeFromAction.of.outputs.includes(ioName)) {
          fromAction = maybeFromAction;
        }
      }

      if (!fromAction) { return; }

      // save references (so they can be displayed in the UI)
      if (!this.inReferences[toAction.id][toIO].find((r) =>
        r.ioName === ioName && r.fromAction.id === fromAction.id
      )) {
        this.inReferences[toAction.id][toIO].push({ fromAction, ioName });
      }
      if (!this.outReferences[fromAction.id].find((r) =>
        r.ioName === ioName && r.byAction.id === toAction.id
      )) {
        this.outReferences[fromAction.id].push({
          ioName,
          byAction: toAction
        });
      }

      // add current value to scope
      let objectToModify: Object;
      const subject = this.getSubject(fromAction, ioName);
      if (fromAbove) {
        objectToModify = scope;
        ioName = '$' + ioName;
      } else {
        const clicheName = dvToNgName(fromAction.from.name);
        const actionName = dvToNgName(fromAction.of.name);
        scope[clicheName] = scope[clicheName] || {};
        scope[clicheName][actionName] = scope[clicheName][actionName] || {};
        objectToModify = scope[clicheName][actionName];
      }
      objectToModify[ioName] = subject.value;
      const sub = subject.subscribe((value) => {
        objectToModify[ioName] = value;
        sendValue();
      });
      this.subscriptions.push(sub);
    });

    sendValue();
  }

  /**
   * @param action an action instance
   * @param toSubject where to send a component to render
   */
  private sendAction(
    action: ActionInstance,
    toSubject: BehaviorSubject<any>,
    inInput?: InInput
  ) {
    toSubject.next({
      type: ScopeIO.actionInstanceComponent,
      inputs: {
        actionInstance: action,
        actionIO: this.getActionIO(action),
        extraInputs: inInput.of.of.actionInputs[inInput.name],
        extraInputsScope: this.getActionIO(inInput.of)
      }
    });
  }

}
