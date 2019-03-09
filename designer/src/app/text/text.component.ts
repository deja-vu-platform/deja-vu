import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

import { ActionInstance } from '../datatypes';

export const modules = {
  toolbar: [
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
    ['link', 'image', 'video', 'output']
  ],
  output: {
    containerSelector: '.ql-output'
  }
};

// same as component inputs
export interface DialogData {
  actionInstance: ActionInstance;
  readOnly: boolean;
}

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent implements OnInit, OnDestroy {
  @Input() readonly actionInstance: ActionInstance;
  @Input() readonly readOnly: boolean = true;
  readonly modules = modules;
  private html: string;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data?: DialogData
  ) {
    if (data) {
      this.actionInstance = data.actionInstance;
      this.readOnly = data.readOnly;
    }
  }

  ngOnInit() {
    if (!this.readOnly) {
      this.html = this.actionInstance['data'];
    }
  }

  onContentChanged({ html }) {
    if (!this.readOnly) {
      this.html = html;
    }
  }

  ngOnDestroy() {
    if (!this.readOnly) {
      this.actionInstance['data'] = this.html;
    }
  }
}
