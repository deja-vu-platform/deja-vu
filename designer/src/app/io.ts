import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  ActionDefinition,
  ActionInstance,
  AppActionDefinition
} from './datatypes';

export class ActionIO {
  private readonly rep: { [ioName: string]: BehaviorSubject<any> } = {};

  getSubject(ioName: string): BehaviorSubject<any> {
    if (!this.rep[ioName]) {
      this.rep[ioName] = new BehaviorSubject<any>(undefined);
    }

    return this.rep[ioName];
  }

}

export class ScopeIO {
  private readonly rep: { [actionID: string]: ActionIO } = {};

  setActionIO(action: ActionInstance, actionIO: ActionIO): void {
    this.rep[action.id] = actionIO;
  }

  getActionIO(action: ActionInstance): ActionIO {
    if (!this.rep[action.id]) {
      this.setActionIO(action, new ActionIO());
    }

    return this.rep[action.id];
  }

  getSubject(action: ActionInstance, ioName: string): BehaviorSubject<any> {
    const actionIO = this.getActionIO(action);

    return actionIO.getSubject(ioName);
  }
}

/**
 * Links child inputs and parent outputs to the child outputs and parent inputs
 * referenced in expressions they are set to.
 * Returns the subscriptions so they can be unsubscribed when no longer needed.
 * IMPORTANT: call in ngAfterViewInit
 */
export function linkChildren(
  parentInstance: ActionInstance,
  scopeIO: ScopeIO
): Subscription[] {
  let parentDefinition: AppActionDefinition;
  if (parentInstance.of instanceof AppActionDefinition) {
    parentDefinition = parentInstance.of;
  } else {
    throw new TypeError(
      `Action Instance ${parentInstance.fqtag} is not of App Action`);
  }

  const subscriptions: Subscription[] = [];
  parentDefinition.children.forEach((child) => {
    // todo: parent outputs

    child.of.inputs.forEach((input) => {
      const toSubject = scopeIO.getSubject(child, input);
      const inputStr = child.inputSettings[input];

      if (inputStr) {
        // if they specified an output (e.g. dv.gen-id.id) then subscribe
        const [clicheN, actionN, ioN, ...objectPath] = inputStr.split('.');

        let fromAction = parentDefinition.findChild(clicheN, actionN);
        let fromSubjectList: 'inputs' | 'outputs';
        if (fromAction) {
          fromSubjectList = 'outputs';
        } else if (
          parentInstance.from.name === clicheN
          && parentInstance.of.name === actionN
        ) {
          fromAction = parentInstance;
          fromSubjectList = 'inputs';
        }

        if (fromAction && fromAction.of[fromSubjectList].indexOf(ioN) >= 0) {
          const sub = scopeIO.getSubject(fromAction, ioN)
            .subscribe((val) => {
              toSubject.next(_.get(val, objectPath, val));
            });
          subscriptions.push(sub);
        } else {
          toSubject.next(inputStr); // just pass the string as-is
        }

        // TODO: full expression support

      }
    });
  });

  return subscriptions;
}
