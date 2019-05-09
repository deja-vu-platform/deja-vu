import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { User } from '../shared/authentication.model';

import { API_PATH } from '../authentication.config';


@Component({
  selector: 'authentication-show-user',
  templateUrl: './show-user.component.html',
  styleUrls: ['./show-user.component.css']
})
export class ShowUserComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  @Input() id: string | undefined;
  @Input() user: User | undefined;
  @Output() loadedUser = new EventEmitter<User>();

  @Input() showId = false;
  @Input() showUsername = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<{ data: any }>(this.apiPath, {
        params: {
          inputs: { id: this.id },
          extraInfo: {
            returnFields: `
              id
              username
            `
          }
        }
      })
        .subscribe((res) => {
          const userById = res.data.userById;
          if (userById) {
            this.user = res.data.userById;
          }
          this.loadedUser.emit(this.user);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id && !this.user);
  }
}
