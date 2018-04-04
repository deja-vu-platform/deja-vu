import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';


@Component({
  selector: 'authentication-show-user',
  templateUrl: './show-user.component.html',
  styleUrls: ['./show-user.component.css']
})
export class ShowUserComponent implements OnInit, OnChanges {
  @Input() id: string;
  username: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (!this.gs || !this.id) {
      return;
    }
    this.gs.get<{ data: any }>('/graphql', {
      params: {
        query: `query {
          userById(id: "${this.id}") {
            username
          }
        }`
      }
    })
    .subscribe((res) => {
      this.username = res.data.userById.username;
    });
  }
}
