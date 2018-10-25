import {
  Component, OnInit, Output, EventEmitter, ElementRef
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import { RunService, OnExecCommit } from '../run.service';


@Component({
  selector: 'dv-id',
  templateUrl: './id.component.html'
})
export class IdComponent implements OnInit, OnExecCommit {
  @Output() id = new EventEmitter<string>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.id.emit(uuid());
  }

  dvOnExecCommit() {
    this.id.emit(uuid());
  }
}
