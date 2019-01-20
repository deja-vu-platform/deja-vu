import { Component, Input } from '@angular/core';
import { ActionInstance } from '../datatypes';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent {
  @Input() actionInstance: ActionInstance;

  constructor() { }

  onContentChanged({ html }) {
    this.actionInstance['data'] = html;
  }
}
