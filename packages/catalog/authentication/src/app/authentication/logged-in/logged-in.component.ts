import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory } from '@deja-vu/core';


@Component({
  selector: 'authentication-logged-in',
  templateUrl: './logged-in.component.html'
})
export class LoggedInComponent implements AfterViewInit, OnInit, OnDestroy {
  @Output() user = new EventEmitter();

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withRefreshCallback(() => { this.dvs.eval(); })
      .build();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.dvs.eval();
    });
  }

  async dvOnEval(): Promise<void> {
    const user = this.dvs.getItem('user');
    if (user) {
      this.user.emit(user);
    } else {
      this.user.emit(null);
      throw new Error('No user is logged in');
    }
  }

  ngOnDestroy() {
    this.dvs.onDestroy();
  }
}
