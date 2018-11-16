import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent {
  // type is TextWidget but this would create a circular dependency
  @Input() widget: any = { content: '' };

  constructor() { }

  onContentChanged({ html }) {
    this.widget.content = html;
  }
}
