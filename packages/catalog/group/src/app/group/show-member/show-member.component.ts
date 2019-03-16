import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';


import { API_PATH } from '../group.config';
import { Member } from '../shared/group.model';

interface MemberRes {
  data: { member: Member };
  errors: { message: string }[];
}


@Component({
  selector: 'group-show-member',
  templateUrl: './show-member.component.html'
})
export class ShowMemberComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // Provide one of the following: id or member
  @Input() id: string | undefined;
  @Input() member: Member | undefined;
  @Output() loadedMember = new EventEmitter();

  @Input() showId = true;
  // TODO: Make true, but update all group show actions and apps that use them
  @Input() showGroups = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

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
      this.gs.get<MemberRes>(this.apiPath, {
        params: {
          inputs: {
            id: this.id
          },
          extraInfo: {
            returnFields: `
              id
              groupIds
            `
          }
        }
      })
        .pipe(map((res: MemberRes) => res.data.member))
        .subscribe((member) => {
          this.member = member;
          this.loadedMember.emit(member);
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.member && this.showGroups && this.id && this.gs);
  }
}
