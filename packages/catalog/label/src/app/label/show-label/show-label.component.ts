import { Component, Input, OnInit } from '@angular/core';
import { Label } from '../shared/label.model';

@Component({
  selector: 'label-show-label',
  templateUrl: './show-label.component.html',
  styleUrls: ['./show-label.component.css']
})
export class ShowLabelComponent implements OnInit {
  @Input() label: Label;

  constructor() { }

  ngOnInit() {
  }
}
