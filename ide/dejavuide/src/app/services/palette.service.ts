import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class PaletteService {
  newColorListener = new ReplaySubject<string>(1);
  newColor(color: string) {
    this.newColorListener.next(color);
  }
}
