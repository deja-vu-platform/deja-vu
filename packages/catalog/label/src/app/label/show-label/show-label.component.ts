import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Label } from '../shared/label.model';

@Component({
  selector: 'label-show-label',
  templateUrl: './show-label.component.html',
  providers: [ DatePipe ]
})
export class ShowLabelComponent {
  @Input() label: Label;
}
