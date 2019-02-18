import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import { OnEval, RunService } from '@deja-vu/core';

import { PasskeyService } from '../shared/passkey.service';

@Component({
  selector: 'passkey-logged-in',
  template: ''
})
export class LoggedInComponent implements OnInit, AfterViewInit, OnEval {
  @Input() isGuest = false;

  @Output() passkey = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private passkeyService: PasskeyService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => this.rs.eval(this.elem));
  }

  async dvOnEval(): Promise<void> {
    const passkey = this.passkeyService.getSignedInPasskey(this.isGuest);

    if (passkey) {
      this.passkey.emit(passkey);
    } else {
      throw new Error('No user is logged in');
    }
  }
}
