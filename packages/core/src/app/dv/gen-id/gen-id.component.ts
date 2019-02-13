import {
  Component, OnInit, Output, EventEmitter, ElementRef
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import { RunService, OnExecSuccess } from '../run.service';


@Component({
  selector: 'dv-gen-id',
  templateUrl: './gen-id.component.html'
})
export class GenIdComponent implements OnInit, OnExecSuccess {
  @Output() id = new EventEmitter<string>();

  constructor(
    private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.id.emit(uuid());
  }

  dvOnExecSuccess() {
    this.id.emit(uuid());
  }
}
