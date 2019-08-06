import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';


/**
 *  This component is intended to be used with `callback`.
 *
 *  When a user clicks on a `callback-link`, `callback-link`
 *  records the current URL and navigates to the component
 *  given by `href`. In the href component you are supposed
 *  to include a `callback` component, which will cause a
 *  navigation to the saved URL when it runs.
 */
@Component({
  selector: 'dv-callback-link',
  templateUrl: './callback-link.component.html'
})
export class CallbackLinkComponent implements OnInit {
  currentUrl: string;
  @Input() href: string;

  @Input() callbackPath: string | undefined;
  @Input() callbackParams: {[key: string]: any} | undefined;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  get callbackUrl(): string {
    return (this.callbackPath) ? this.buildUrl() : this.router.url;
  }

  buildUrl() {
    const newParams = _.mapValues(this.callbackParams, JSON.stringify);
    const url = this.router
      .createUrlTree(
        [this.callbackPath], { queryParams: newParams });

    return url.toString();
  }
}
