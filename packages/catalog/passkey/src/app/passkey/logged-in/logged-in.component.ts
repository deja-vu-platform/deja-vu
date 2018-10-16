import {
  AfterViewInit, Component, ElementRef,
  EventEmitter, Input, OnInit, Output
} from '@angular/core';

import { RunService } from 'dv-core';

import { PasskeyService } from '../shared/passkey.service';

@Component({
  selector: 'passkey-logged-in',
  template: ''
})
export class LoggedInComponent implements OnInit, AfterViewInit {
  @Output() passkey = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private passkeyService: PasskeyService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => {
        const passkey = this.passkeyService.getSignedInPasskey();

      if (passkey) {
        this.passkey.emit(passkey);
      }
    });
  }
}
