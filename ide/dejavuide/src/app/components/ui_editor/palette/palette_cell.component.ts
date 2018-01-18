import { Component, Input,Output, ElementRef, EventEmitter, ViewChild, OnInit } from '@angular/core';

declare const jscolor: any;

@Component({
  selector: 'dv-palette-cell',
  templateUrl: './palette_cell.component.html',
  styleUrls: ['./palette_cell.component.css'],
})
export class PaletteCellComponent implements OnInit {
  @ViewChild('colorInput', {read: ElementRef}) private colorInputElt: ElementRef;
  @Input() color;
  @Input() editable = false;
  picker: any;
  @Output() colorPicked = new EventEmitter<string>();

  ngOnInit() {
    if (this.editable) {
      this.picker = new jscolor(this.colorInputElt.nativeElement);
      this.picker.closable = true;
      this.picker.closeText = 'X';
      this.picker.fromString(this.color || '000000');
    }
  }

  colorChange(event) {
    if (this.editable) {
      event.stopPropagation();
      this.color = this.picker.toHEXString();
      this.colorPicked.emit(this.color);
    }
  }
}
