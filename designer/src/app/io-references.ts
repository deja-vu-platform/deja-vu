/**
 * For determining which actions and their inputs/outputs are referenced by
 * expressions.
 */

import * as _ from 'lodash';
import { ActionInstance, AppActionDefinition, InInput } from './datatypes';
import compileDvExpr from './expression.compiler';

export interface Reference {
  action: ActionInstance; // from for in, by for out
  ioName: string;
}

export interface InReferences {
  [actionID: string]: {
    [ioName: string]: Reference[];
  };
}

// the dual of InReferences
export interface OutReferences {
  [actionID: string]: Reference[];
}

function resolveName(
  name: string,
  appActionInstance: ActionInstance,
  inInput?: InInput
) {
  if (!(appActionInstance.of instanceof AppActionDefinition)) {
    throw new Error('Action is not an app action.');
  }
  const appActionDefinition: AppActionDefinition = appActionInstance.of;

  // parse the name
  let ioName: string;
  let fromAction: ActionInstance;
  if (name[0].startsWith('$')) {
    // getting an input from above
    ioName = name.slice(1); // strip leading '$'
    if (inInput && inInput.of.of.actionInputs[inInput.name][ioName]) {
      // getting an input from within an action input
      fromAction = inInput.of;
    } else if (appActionDefinition.inputs.includes(ioName)) {
      // getting an input from the parent
      fromAction = appActionInstance;
    }
  } else {
    // getting an output from a sibling
    let clicheN: string;
    let actionN: string;
    [clicheN, actionN, ioName] = name.split('.');
    const maybeFA = appActionDefinition.findChild(clicheN, actionN);
    if (maybeFA && maybeFA.of.outputs.includes(ioName)) {
      fromAction = maybeFA;
    }
  }

  return {
    fromAction,
    ioName
  };
}

/**
 * For all children (and their inputted actions) of an app action
 * and the app action itself
 * find all parent inputs / sibling outputs referenced by each child input
 * and all child outputs referenced by each parent output
 *
 * @note This has the side-effect of auto-quoting all expressions which
 * reference names that do not exist.
 */
export default function findReferences(appActionInstance: ActionInstance) {
  if (!(appActionInstance.of instanceof AppActionDefinition)) {
    throw new Error('Action is not an app action.');
  }
  const appActionDefinition: AppActionDefinition = appActionInstance.of;

  const inReferences: InReferences = {};
  const outReferences: OutReferences = {};
  appActionDefinition
    .getChildren(true)
    .forEach((action) => {
      action.walkInputs(true, (inputName, inputValue, ofAction, inInput) => {
        if (!_.isString(inputValue)) { return; }

        let names: string[];
        try {
          names = compileDvExpr(inputValue).names;
        } catch (e) {
          // if the expression is not valid, apply automatic quotation
          ofAction.inputSettings[inputName] = JSON.stringify(inputValue);

          return;
        }

        const resolutions = names
          .map((name) => resolveName(name, appActionInstance, inInput))
          .filter(({ fromAction }) => !!fromAction);
        if (resolutions.length < names.length) {
          // if the expression is not valid, apply automatic quotation
          ofAction.inputSettings[inputName] = JSON.stringify(inputValue);

          return;
        }

        resolutions.forEach(({ fromAction, ioName }) => {
          let ioInReferences = (inReferences[ofAction.id] || {})[inputName];
          if (!ioInReferences) {
            ioInReferences = [];
            _.set(inReferences, [ofAction.id, inputName], ioInReferences);
          }
          if (!ioInReferences.find((r) =>
            r.ioName === ioName && r.action.id === fromAction.id
          )) {
            ioInReferences.push({ action: fromAction, ioName });
          }
          let actionOutReferences = outReferences[fromAction.id];
          if (!actionOutReferences) {
            actionOutReferences = [];
            outReferences[fromAction.id] = actionOutReferences;
          }
          if (!actionOutReferences.find((r) => (
            r.ioName === ioName && r.action.id === ofAction.id
          ))) {
            actionOutReferences.push({ ioName, action: ofAction });
          }
        });
      });
    });

  return { inReferences, outReferences };
}
