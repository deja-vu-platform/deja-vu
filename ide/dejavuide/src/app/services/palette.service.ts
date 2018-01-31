import { Injectable } from '@angular/core';

// Just a subject since we only want reaction when a new event has happened
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PaletteService {
  // This is for the colors picked by picker
  // including the options picker and the palette cell picker
  newColorListener = new Subject<string>();

  // This is when a palette color is clicked (not picker selected)
  paletteColorListener = new Subject<string>();

  newColor(color: string) {
    this.newColorListener.next(color);
  }

  paletteColorClicked(color: string) {
    this.paletteColorListener.next(color);
  }
}
