import * as _ from 'lodash';
import { BehaviorSubject, Subscription } from 'rxjs';
import { AppActionDefinition } from './datatypes';

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
  private readonly rep: { [fqtag: string]: ActionIO } = {};

  getSubject(fqtag: string, ioName: string): BehaviorSubject<any> {
    if (!this.rep[fqtag]) {
      this.rep[fqtag] = new ActionIO;
    }

    return this.rep[fqtag].getSubject(ioName);
  }

  getActionIO(fqtag: string): ActionIO {
    if (!this.rep[fqtag]) {
      this.rep[fqtag] = new ActionIO;
    }

    return this.rep[fqtag];
  }

  setActionIO(fqtag: string, actionIO: ActionIO): void {
    this.rep[fqtag] = actionIO;
  }
}

/**
 * Links child inputs and parent outputs to the child outputs and parent inputs
 * referenced in expressions they are set to.
 * Returns the subscriptions so they can be unsubscribed when no longer needed.
 * IMPORTANT: call in ngAfterViewInit
 */
export function linkChildren(
  parent: AppActionDefinition,
  scopeIO: ScopeIO
): Subscription[] {
  const subscriptions: Subscription[] = [];
  parent.children.forEach((child) => {
    child.of.inputs.forEach((input) => {
      const toSubject = scopeIO.getSubject(child.fqtag, input);
      const inputStr = child.inputSettings[input];

      if (inputStr) {
        // if they specified an output (e.g. dv.gen-id.id) then subscribe
        const [clicheN, actionN, outputN, ...objectPath] = inputStr.split('.');
        const fromAction = parent.findChild(clicheN, actionN);
        if (fromAction && fromAction.of.outputs.indexOf(outputN) >= 0) {
          const sub = scopeIO.getSubject(fromAction.fqtag, outputN)
            .subscribe((val) => {
              toSubject.next(_.get(val, objectPath, val));
            });
          subscriptions.push(sub);
        } else {
          toSubject.next(inputStr); // just pass the string as-is
        }

        // TODO: getting parent input

        // TODO: full expression support

      }
    });
  });

  return subscriptions;
}
