import { Component, Input, Output, ElementRef, ViewChild, OnInit } from '@angular/core';

import { PaletteService } from '../services/palette.service';

// TODO: consolidate the instances of jscolor so that it is called from one
// angular component
// jscolor is a 3rd party package that lets gives you a color picker to select
// colors from.
declare const jscolor: any;

@Component({
  selector: 'dv-current-color-cell',
  templateUrl: './current-color-cell.component.html',
  styleUrls: ['./cell.component.css'],
})
export class CurrentColorCellComponent implements OnInit {
  @ViewChild('colorInput', {read: ElementRef}) private colorInputElt: ElementRef;
  @Input() color;

  picker: any;

  constructor(private paletteService: PaletteService) {}

  ngOnInit() {
    this.picker = new jscolor(this.colorInputElt.nativeElement);
    this.picker.showOnClick = false;
    this.picker.fromString(this.color || '#000000');
  }

  colorClicked(event) {
    this.paletteService.paletteColorClicked(this.color);
  }
}
