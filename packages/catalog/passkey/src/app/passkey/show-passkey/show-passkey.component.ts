import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../passkey.config';
import { Passkey } from '../shared/passkey.model';


interface PasskeyRes {
  data: { passkey: Passkey };
}

@Component({
  selector: 'passkey-show-passkey',
  templateUrl: './show-passkey.component.html'
})
export class ShowPasskeyComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // Provide one of the following: id, code or passkey
  @Input() id: string | undefined;
  @Input() passkey: Passkey | undefined;

  // Presentation outputs
  @Input() showId = true;
  @Input() showCode = true;

  @Output() loadedPasskey = new EventEmitter();

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<PasskeyRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showCode ? 'code' : ''}
            `
          }
        }
      });
      this.passkey = res.data.passkey;
      this.loadedPasskey.emit(this.passkey);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.passkey && this.id && this.dvs);
  }
}
