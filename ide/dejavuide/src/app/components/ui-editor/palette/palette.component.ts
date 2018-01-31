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

  colorPicked(index, event) {
    // TODO updating this.palette refreshes the cells, which unselects them
    // this is probably not desired behavior

    // console.log('color picked', event);
    // this.palette[index] = event;
    // this.savePalette(); // TODO fixme
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
