import { ElementRef, Injectable } from '@angular/core';
import * as _ from 'lodash';
import { NodeUtils } from './node.utils';

@Injectable()
export class StorageService {

  private getClicheAlias(elem: ElementRef) {
    return NodeUtils.GetClicheAliasOfNode(elem.nativeElement);
  }

  setItem(elem: ElementRef, key: string, value: any) {
    const itemKey = `${this.getClicheAlias(elem)}-${key}`;
    localStorage.setItem(itemKey, JSON.stringify(value));
  }

  getItem(elem: ElementRef, key: string) {
    const itemKey = `${this.getClicheAlias(elem)}-${key}`;

    return JSON.parse(localStorage.getItem(itemKey));
  }

  removeItem(elem: ElementRef, key: string) {
    const itemKey = `${this.getClicheAlias(elem)}-${key}`;
    localStorage.removeItem(itemKey);
  }

}
