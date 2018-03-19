import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'market-create-good-name',
  templateUrl: './create-good-name.component.html',
  styleUrls: ['./create-good-name.component.css'],
})
export class CreateGoodNameComponent {
  @Output() name: EventEmitter<string> = new EventEmitter<string>();

  updateName(event) {
      this.name.emit(event.target.value);
  }
}
