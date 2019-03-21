import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output
} from '@angular/core';

import { OnEval, RunService, StorageService } from '@deja-vu/core';

import { Passkey } from '../shared/passkey.model';

@Component({
  selector: 'passkey-logged-in',
  template: ''
})
export class LoggedInComponent implements OnInit, AfterViewInit, OnEval {
  @Output() passkey = new EventEmitter<Passkey>();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private ss: StorageService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => this.rs.eval(this.elem));
  }

  async dvOnEval(): Promise<void> {
    const passkey = this.ss.getItem(this.elem, 'passkey');

    if (passkey) {
      this.passkey.emit(passkey);
    } else {
      throw new Error('No user is logged in');
    }
  }
}
