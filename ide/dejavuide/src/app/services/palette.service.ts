import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PaletteService {
  newColorListener = new Subject<string>();
  newColor(color: string) {
    this.newColorListener.next(color);
  }
}
