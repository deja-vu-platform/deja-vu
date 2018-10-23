import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent {
  @Input() widget: any;

  constructor() { }

  onContentChanged({ html }) {
    this.widget.content = html;
  }
}
