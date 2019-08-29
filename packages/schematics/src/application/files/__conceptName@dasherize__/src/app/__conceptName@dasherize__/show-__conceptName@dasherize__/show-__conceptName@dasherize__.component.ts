import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { Observable } from 'rxjs/Observable';
import { map, take } from 'rxjs/operators';

import { API_PATH } from '../<%= dasherize(conceptName) %>.config';
import { <%= classify(conceptName) %> } from '../shared/<%= dasherize(conceptName) %>.model';

interface Show<%= classify(conceptName) %>Res {
  data: { <%= camelize(conceptName) %>: <%= classify(conceptName) %> };
}


@Component({
  selector: '<%= dasherize(conceptName) %>-show-<%= dasherize(conceptName) %>',
  templateUrl: './show-<%= dasherize(conceptName) %>.component.html'
})
export class Show<%= classify(conceptName) %>Component implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or <%= conceptName %>
  @Input() id: string | undefined;
  @Input() <%= camelize(conceptName) %>: <%= classify(conceptName) %> | undefined;
  @Output() loaded<%= classify(conceptName) %> = new EventEmitter();

  @Input() showId = true;
  @Input() showContent = true;

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
      this.gs.get<Show<%= classify(conceptName) %>Res>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              ${this.showId ? 'id' : ''}
              ${this.showContent ? 'content' : ''}
            `
          }
        },
      })
      .pipe(map((res: Show<%= classify(conceptName) %>Res) => res.data.<%= camelize(conceptName) %>))
      .subscribe((<%= camelize(conceptName) %>) => {
        this.<%= camelize(conceptName) %> = <%= camelize(conceptName) %>;
        this.loaded<%= classify(conceptName) %>.emit(<%= camelize(conceptName) %>);
      });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.<%= camelize(conceptName) %> && this.id && this.gs);
  }
}
