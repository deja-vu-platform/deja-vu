import { Component, Input } from '@angular/core';

import { ActionInstance } from '../datatypes';

export const modules = {
  toolbar: [
    // default elements
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ header: 1 }, { header: 2 }],
    [{ list: 'ordered'}, { list: 'bullet' }],
    [{ script: 'sub'}, { script: 'super' }],
    [{ indent: '-1'}, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ size: ['small', false, 'large', 'huge'] }],
    // tslint:disable-next-line no-magic-numbers
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ['clean'],
    ['link', 'image', 'video'],
    // custom elements
    ['output']
  ],
  output: {
    containerSelector: '.ql-output'
  }
};


@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent {
  @Input() actionInstance: ActionInstance;
  readonly modules = modules;

  onContentChanged({ html }) {
    this.actionInstance['data'] = html;
  }
}
