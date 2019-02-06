import {
  Component, ElementRef, EventEmitter,
  Input, OnInit
} from '@angular/core';
import { OnExec, RunService } from '@dejavu-lang/core';

import * as _ from 'lodash';

import { AuthenticationService } from '../shared/authentication.service';


@Component({
  selector: 'authentication-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit, OnExec {
  @Input() buttonLabel = 'Sign Out';

  constructor(
    private elem: ElementRef, private rs: RunService,
    private authenticationService: AuthenticationService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  signOut() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.authenticationService.signOut();
  }
}
