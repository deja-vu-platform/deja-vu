import { ElementRef, Inject, Injectable, InjectionToken } from '@angular/core';

import * as _ from 'lodash';
import { NodeUtils } from "./node.utils";


export const USED_CLICHES_CONFIG = new InjectionToken<string>(
  'usedClichesConfig');


@Injectable()
export class ConfigService {
  constructor(
    @Inject(USED_CLICHES_CONFIG) private readonly _usedClichesConfig) {}

  getConfig<T>(forNode: ElementRef): T {
    const alias = NodeUtils.GetClicheAliasOfNode(forNode.nativeElement);

    const usedCliche = _.get(this._usedClichesConfig, alias);
    if (usedCliche === undefined) {
      throw new Error(`Cliche ${alias} not found`);
    }

    return usedCliche.config;
  }
}