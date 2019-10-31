import { EventEmitter, Injectable, SimpleChanges  } from '@angular/core';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


export class WaiterService {
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  private fieldChange = new EventEmitter<string>();
  private activeWaits = new Set<string>();

  constructor(
    private readonly fieldContainer: any,
    private readonly waitOn: string[] | undefined) { }

  /**
   * @return true if the waiter is already waiting on all fields that changed
   */
  processChanges(changes: SimpleChanges): boolean {
    let shouldLoad = true;
    if (!_.isEmpty(this.waitOn)) {
      for (const field of this.waitOn) {
        if (changes[field] && !_.isNil(changes[field].currentValue)) {
          console.log(`Waiter service done waiting for: ${field} ` +
            `(value ${JSON.stringify(this.fieldContainer[field])})`);
          this.fieldChange.emit(field);
        }
      }

      shouldLoad = false;
      for (const fieldThatChanged of _.keys(changes)) {
        if (!this.activeWaits.has(fieldThatChanged)) {
          shouldLoad = true;
        }
      }
    }

    return shouldLoad;
  }

  async maybeWait(): Promise<void> {
    if (!_.isEmpty(this.waitOn)) {
      await Promise.all(_.chain(this.waitOn)
        .filter((field) => _.isNil(this.fieldContainer[field]))
        .tap((fs) => {
          this.activeWaits = new Set(fs);
          if (!_.isEmpty(fs)) {
            console.log(`Waiter service waiting for: ${JSON.stringify(fs)}`);
          }

          return fs;
        })
        .map((fieldToWaitFor) => this.fieldChange
          .pipe(filter((field) => field === fieldToWaitFor), take(1))
          .toPromise())
        .value());
    }
  }
}

@Injectable()
export class WaiterServiceFactory {
  /**
   * For now the waiter service doesn't support dynamic waitOn values
   */
  for(fieldContainer: {[fname: string]: any}, waitOn: string[]): WaiterService {
    return new WaiterService(fieldContainer, waitOn);
  }
}
