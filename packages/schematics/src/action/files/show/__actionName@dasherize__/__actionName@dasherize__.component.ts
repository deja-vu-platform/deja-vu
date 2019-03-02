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
import { <%= classify(entityName) %> } from '../shared/<%= dasherize(clicheName) %>.model';

interface <%= classify(entityName) %>Res {
  data: { <%= camelize(entityName) %>: <%= classify(entityName) %> };
}


@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(actionName) %>',
  templateUrl: './<%= dasherize(actionName) %>.component.html'
})
export class <%= classify(actionName) %>Component implements AfterViewInit, OnChanges, OnEval,
OnInit {
  // Provide one of the following: id or <%= entityName %>
  @Input() id: string | undefined;
  @Input() <%= camelize(entityName) %>: <%= classify(entityName) %> | undefined;
  @Output() loaded<%= classify(entityName) %> = new EventEmitter();

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
      this.gs.get<<%= classify(entityName) %>Res>(this.apiPath, {
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
      .pipe(map((res: <%= classify(entityName) %>Res) => res.data.<%= camelize(entityName) %>))
      .subscribe((<%= camelize(entityName) %>) => {
        this.<%= camelize(entityName) %> = <%= camelize(entityName) %>;
        this.loaded<%= classify(entityName) %>.emit(<%= camelize(entityName) %>);
      });
    }
  }

  private canEval(): boolean {
    return !!(!this.<%= camelize(entityName) %> && this.id && this.gs);
  }
}
