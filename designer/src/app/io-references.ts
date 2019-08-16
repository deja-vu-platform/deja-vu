/**
 * For determining which components and their inputs/outputs are referenced by
 * expressions.
 */

import * as _ from 'lodash';
import { AppComponentDefinition, ComponentInstance, InInput } from './datatypes';
import compileDvExpr from './expression.compiler';

export interface Reference {
  component: ComponentInstance; // from for in, by for out
  ioName: string;
}

export interface InReferences {
  [componentID: string]: {
    [ioName: string]: Reference[];
  };
}

// the dual of InReferences
export interface OutReferences {
  [componentID: string]: Reference[];
}

export function resolveName(
  name: string,
  appComponentInstance: ComponentInstance,
  inInput?: InInput
) {
  if (!(appComponentInstance.of instanceof AppComponentDefinition)) {
    throw new Error('Component is not an app component.');
  }
  const appComponentDefinition: AppComponentDefinition = appComponentInstance.of;

  // parse the name
  let ioName: string;
  let fromComponent: ComponentInstance;
  if (name[0].startsWith('$')) {
    // getting an input from above
    ioName = name.slice(1); // strip leading '$'
    if (inInput && inInput.of.of.componentInputs[inInput.name][ioName]) {
      // getting an input from within an component input
      fromComponent = inInput.of;
    } else if (appComponentDefinition.inputs.includes(ioName)) {
      // getting an input from the parent
      fromComponent = appComponentInstance;
    }
  } else {
    // getting an output from a sibling
    let conceptN: string;
    let componentN: string;
    [conceptN, componentN, ioName] = name.split('.');
    const maybeFA = appComponentDefinition.findChild(conceptN, componentN);
    if (maybeFA && maybeFA.of.outputs.includes(ioName)) {
      fromComponent = maybeFA;
    }
  }

  return {
    fromComponent,
    ioName
  };
}

export default function findReferences(appComponentInstance: ComponentInstance) {
  if (!(appComponentInstance.of instanceof AppComponentDefinition)) {
    throw new Error('Component is not an app component.');
  }
  const appComponentDefinition: AppComponentDefinition = appComponentInstance.of;

  const inReferences: InReferences = {};
  const outReferences: OutReferences = {};
  appComponentDefinition
    .getChildren(true)
    .forEach((component: ComponentInstance) => {
      component.walkInputs(true, (inputName, inputValue, ofComponent, inInput) => {
        if (!_.isString(inputValue)) { return; }
          let compiledDvExpr;
          try {
            compiledDvExpr = compileDvExpr(inputValue);
          } catch (e) {
            console.error(
              `Coulnd't find references for expression "${inputValue}",` +
              `used in component "${component.of.name}" for input "${inputName}"`);
            console.error(e);

            return;
          }
        const { names } = compiledDvExpr;
        names.forEach((name) => {
          const { fromComponent, ioName } = resolveName(
            name,
            appComponentInstance,
            inInput
          );
          if (fromComponent) {
            let ioInReferences = (inReferences[ofComponent.id] || {})[inputName];
            if (!ioInReferences) {
              ioInReferences = [];
              _.set(inReferences, [ofComponent.id, inputName], ioInReferences);
            }
            if (!ioInReferences.find((r) =>
              r.ioName === ioName && r.component.id === fromComponent.id
            )) {
              ioInReferences.push({ component: fromComponent, ioName });
            }
            let componentOutReferences = outReferences[fromComponent.id];
            if (!componentOutReferences) {
              componentOutReferences = [];
              outReferences[fromComponent.id] = componentOutReferences;
            }
            if (!componentOutReferences.find((r) => (
              r.ioName === ioName && r.component.id === ofComponent.id
            ))) {
              componentOutReferences.push({ ioName, component: ofComponent });
            }
          }
        });
      });
    });

  return { inReferences, outReferences };
}
