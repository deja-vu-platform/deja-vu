import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { User } from '../shared/authentication.model';

import { API_PATH } from '../authentication.config';


@Component({
  selector: 'authentication-show-user',
  templateUrl: './show-user.component.html',
  styleUrls: ['./show-user.component.css']
})
export class ShowUserComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() id: string;
  @Input() user: User;
  username: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    if (this.user) {
      this.username = this.user.username;
    } else {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{ data: any }>(this.apiPath, {
        params: {
          query: `query {
            userById(id: "${this.id}") {
              username
            }
          }`
        }
      })
      .subscribe((res) => {
        const userById = res.data.userById;
        if (userById) {
          this.username = res.data.userById.username;
        }
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id && !this.user);
  }
}
