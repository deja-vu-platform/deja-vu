import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit,
  Output
} from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { RunService, StorageService } from '@deja-vu/core';


@Component({
  selector: 'authentication-logged-in',
  templateUrl: './logged-in.component.html'
})
export class LoggedInComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() user = new EventEmitter();

  destroyed = new Subject<any>();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router, private ss: StorageService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.rs.eval(this.elem);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rs.eval(this.elem);
    });
  }

  async dvOnEval(): Promise<void> {
    const user = this.ss.getItem(this.elem, 'user');
    if (user) {
      this.user.emit(user);
    } else {
      this.user.emit(null);
      throw new Error('No user is logged in');
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
