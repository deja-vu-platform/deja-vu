import { Component, OnDestroy } from '@angular/core';

import { PaletteService } from '../services/palette.service';

// jscolor is a 3rd party package that lets gives you a color picker to select
// colors from.
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
  }

  private savePalette() {
    // TODO
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
