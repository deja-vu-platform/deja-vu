import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { v4 as uuid } from 'uuid';


@Component({
  selector: 'dv-id',
  template: ``
})
export class IdComponent implements OnInit {
  @Output() id = new EventEmitter<string>();

  ngOnInit() {
    this.id.emit(uuid());
  }
}
