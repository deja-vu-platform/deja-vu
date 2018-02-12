import { Component, OnInit } from '@angular/core';
import { v4 as uuid } from 'uuid';


@Component({
  selector: 'dv-tx',
  template: `
    <input name="txId" type="hidden" value="{{id}}">
    <ng-content></ng-content>
  `
})
export class TxComponent implements OnInit {
  id: string;

  ngOnInit() {
    this.id = uuid();
  }
}
