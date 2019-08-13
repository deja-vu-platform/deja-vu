import { ElementRef, Injectable } from '@angular/core';
import * as _ from 'lodash';
import { NodeUtils } from './node.utils';

@Injectable()
export class StorageService {

  private getConceptAlias(elem: ElementRef) {
    return NodeUtils.GetConceptAliasOfNode(elem.nativeElement);
  }

  setItem(elem: ElementRef, key: string, value: any) {
    const itemKey = `${this.getConceptAlias(elem)}-${key}`;
    localStorage.setItem(itemKey, JSON.stringify(value));
  }

  getItem(elem: ElementRef, key: string) {
    const itemKey = `${this.getConceptAlias(elem)}-${key}`;

    return JSON.parse(localStorage.getItem(itemKey));
  }

  removeItem(elem: ElementRef, key: string) {
    const itemKey = `${this.getConceptAlias(elem)}-${key}`;
    localStorage.removeItem(itemKey);
  }

}
