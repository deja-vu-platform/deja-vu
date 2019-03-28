import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
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
export class ShowPasskeyComponent implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id, code or passkey
  @Input() id: string | undefined;
  @Input() passkey: Passkey | undefined;

  // Presentation outputs
  @Input() showId = true;
  @Input() showCode = true;

  @Output() loadedPasskey = new EventEmitter();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<PasskeyRes>(this.apiPath, {
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
      })
      .pipe(map((res: PasskeyRes) => res.data.passkey))
      .subscribe((passkey) => {
        this.passkey = passkey;
        this.loadedPasskey.emit(passkey);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.passkey && this.id && this.gs);
  }
}
