import {
  Component, OnInit, Output, EventEmitter, ElementRef
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import { RunService, OnAfterCommit } from './run.service';


@Component({
  selector: 'dv-id',
  template: ``
})
export class IdComponent implements OnInit, OnAfterCommit {
  @Output() id = new EventEmitter<string>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.id.emit(uuid());
  }

  dvOnAfterCommit() {
    this.id.emit(uuid());
  }
}
