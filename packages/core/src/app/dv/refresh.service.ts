import { Injectable } from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';


@Injectable()
export class RefreshService {
  constructor(private readonly router: Router) {}

  register(refresh: () => void): () => void {
    const destroyed = new Subject<any>();
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(destroyed))
      .subscribe(refresh);

    return () => {
      destroyed.next();
      destroyed.complete();
    };
  }
}
