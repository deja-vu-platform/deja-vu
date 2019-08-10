import {AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, Type} from '@angular/core';

import { ComponentValue, GatewayService,
  GatewayServiceFactory, OnEval, RunService } from '@deja-vu/core';

import { Group } from '../shared/group.model';
import { ShowMemberComponent } from '../show-member/show-member.component';

@Component({
  selector: 'group-show-group',
  templateUrl: './show-group.component.html',
  styleUrls: ['./show-group.component.css']
})
export class ShowGroupComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // One of `group` or `id` is required
  @Input() group: Group | undefined;
  @Input() id: string | undefined;

  @Input() showMembers = true;
  @Input() showGroupId = true;

  @Input() showMember: ComponentValue = {
    type: <Type<Component>> ShowMemberComponent
  };
  @Output() loadedGroup = new EventEmitter<Group>();

  showGroup;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
              private rs: RunService) {
    this.showGroup = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    if (!this.group && !!this.id) {
      this.load();
    }
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
      this.gs
        .get<{data: {group: Group}}> ('/graphql', {
          params: {
            inputs: { id: this.id },
            extraInfo: {
              returnFields: `
              id
              memberIds
            `
            }
          }
        })
        .subscribe((res) => {
          this.group = res.data.group;
          this.loadedGroup.emit(this.group);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
