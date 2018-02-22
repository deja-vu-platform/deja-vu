import { Component, Input, Output, ElementRef, EventEmitter, ViewChild, OnInit, OnDestroy} from '@angular/core';

import { PaletteService } from '../services/palette.service';

// jscolor is a 3rd party package that lets gives you a color picker to select
// colors from.
declare const jscolor: any;

@Component({
  selector: 'dv-palette-cell',
  templateUrl: './palette-cell.component.html',
  styleUrls: ['./cell.component.css'],
})
export class PaletteCellComponent implements OnInit, OnDestroy {
  @ViewChild('colorInput', {read: ElementRef}) private colorInputElt: ElementRef;
  @Input() color;
  selected = false;
  picker: any;
  @Output() colorPicked = new EventEmitter<string>();

  subscriptions = [];

  constructor(private paletteService: PaletteService) {}

  ngOnInit() {
    this.picker = new jscolor(this.colorInputElt.nativeElement);
    this.picker.closable = true;
    this.picker.closeText = 'X';
    this.picker.fromString(this.color || '#000000');

    this.subscriptions.push(
      this.paletteService.newColorListener.subscribe(color => {
        if (this.selected) {
          console.log('new color: selected cell', color);
          this.color = color;
          this.picker.fromString(this.color);
          this.colorPicked.emit(this.color);
        }
      })
    );

    this.subscriptions.push(
      this.paletteService.paletteColorListener.subscribe(color => {
        if (this.selected) {
          console.log('palette color: selected cell', color);
          this.color = color;
          this.picker.fromString(this.color);
          this.colorPicked.emit(this.color);
        }
      })
    );
  }

  colorChange(event) {
    event.stopPropagation();
    this.color = this.picker.toHEXString();
    this.colorPicked.emit(this.color);
    this.paletteService.newColor(this.color);
  }

  colorClicked() {
    console.log(this.color);
    this.paletteService.paletteColorClicked(this.color);
  }

  select() {
    this.selected = !this.selected;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
