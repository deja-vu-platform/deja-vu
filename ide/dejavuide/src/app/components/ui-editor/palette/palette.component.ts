import { Component, OnDestroy } from '@angular/core';

import { PaletteService } from '../../../services/palette.service';

declare const jscolor: any;

// Some colors:
const WHITE = 'FFFFFF';
const BLACK = '000000';

const PALETTE_SIZE = 4;

@Component({
  selector: 'dv-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.css'],
})
export class PaletteComponent implements OnDestroy {
  // possible sources http://jscolor.com/, http://www.w3schools.com/colors/colors_picker.asp
  // http://jscolor.com/examples/


  // pickerObject = new jscolor($('<div>')[0]); // Needs an object to bind to
  palette = [];
  currentColors = [];

  selectedPaletteEltNum = -1;
  private subscriptions = [];

  constructor(private paletteService: PaletteService) {
    // TODO get the palette to load
    this.loadPalette();

    this.subscriptions.push(
      this.paletteService.newColorListener.subscribe(color => {
        this.addNewColorToCurrentColors(color);
      }));
  }

  addNewColorToCurrentColors (color, idx?) {
    // if real color;
    // const realColor = this.pickerObject.fromString(color); // returns true if it's a real color string
    if (true /*realColor*/) {
      if (idx || idx === 0) { // index given
        if (idx >= 0 && idx < this.currentColors.length) {
          this.currentColors[idx] = color;
        }
      } else {
        this.currentColors.push(color);
        if (this.currentColors.length > PALETTE_SIZE) {
          this.currentColors.shift(); // keeping a max size
        }
      }
    }
  }

  currentColorClick(i: number) {
    if (this.selectedPaletteEltNum >= 0) {
      this.palette[this.selectedPaletteEltNum] = this.currentColors[i];
      this.savePalette(); // TODO fixme
      this.selectedPaletteEltNum = -1;
    }
  }

  paletteDblclick(i: number) {
    if (this.selectedPaletteEltNum === i) {
      this.selectedPaletteEltNum = -1;
    } else {
      this.selectedPaletteEltNum = i;
    }
  }

  loadPalette (palette?) {
    this.currentColors = [];
    this.palette = palette ? JSON.parse(JSON.stringify(palette)) : [];

    for (let  i = 0; i < PALETTE_SIZE; i++) {
      this.currentColors.push(WHITE);
      if (i >= this.palette.length) {
        this.palette.push(WHITE);
      }
    }
    // TODO this is just for testing
    this.currentColors = [
      '#823110',
      '#334281',
      '#148352',
      '#357423'
    ];
  }

  colorPicked(event) {
    console.log('color picked', event);
  }

  private savePalette() {
    // userApp.properties.palette = JSON.parse(JSON.stringify(this.palette));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
