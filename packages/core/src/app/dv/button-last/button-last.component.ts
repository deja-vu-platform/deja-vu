import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { RunService, OnExec } from '../run.service';


@Component({
  selector: 'dv-button-last',
  templateUrl: './button-last.component.html'
})
export class ButtonLastComponent implements OnInit, OnExec {
  @Input() disabled = false;
  @Input() of: any;
  @Output() last = new EventEmitter<any>();

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.last.emit(this.of);
  }
}
