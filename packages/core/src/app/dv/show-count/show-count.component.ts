import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { RunService } from '../run.service';


@Component({
  selector: 'dv-show-count',
  templateUrl: './show-count.component.html'
})
export class ShowCountComponent implements OnInit {
  @Input() array: any[];

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }
}
