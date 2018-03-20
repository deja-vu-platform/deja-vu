import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { RunService } from './run.service';


@Component({
  selector: 'dv-button',
  template: `
    <button mat-button type="button" 
      [disabled]="!valid" (click)="onClick()">
        <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent implements OnInit {
  @Input() valid = true;

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.run(this.elem);
  }
}
