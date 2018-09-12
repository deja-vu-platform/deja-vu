import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { RunService, OnRun } from './run.service';


@Component({
  selector: 'dv-button-last',
  template: `
    <button mat-button type="button"
      [disabled]="disabled" (click)="onClick()" class="mat-button">
        <ng-content></ng-content>
    </button>
  `
})
export class ButtonLastComponent implements OnInit, OnRun {
  @Input() disabled = false;
  @Input() of: any;
  @Output() last = new EventEmitter<any>();

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.last.emit(this.of);
  }
}
