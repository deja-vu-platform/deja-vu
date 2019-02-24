import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';

interface Show<%= classify(clicheName) %>Res {
  data: { <%= camelize(clicheName) %>: any };
}


@Component({
  selector: '<%= dasherize(clicheName) %>-show-<%= dasherize(clicheName) %>',
  templateUrl: './show-<%= dasherize(clicheName) %>.component.html'
})
export class Show<%= classify(clicheName) %>Component implements AfterViewInit, OnChanges, OnEval,
OnInit {
  @Input() id: string;
  @Input() <%= camelize(clicheName) %>;
  @Output() loaded<%= classify(clicheName) %> = new EventEmitter();

  @Input() showId = true;

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
      this.gs.get<Show<%= classify(clicheName) %>Res>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
            `
          }
        },
      })
      .pipe(map((res: Show<%= classify(clicheName) %>Res) => res.data.<%= camelize(clicheName) %>))
      .subscribe((<%= camelize(clicheName) %>) => {
        this.<%= camelize(clicheName) %> = <%= camelize(clicheName) %>;
        this.loaded<%= classify(clicheName) %>.emit(<%= camelize(clicheName) %>);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.<%= camelize(clicheName) %> && this.id && this.gs);
  }
}
