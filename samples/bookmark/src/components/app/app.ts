import {Widget, ClientBus, field} from "client-bus";

import {Router} from "@angular/router";


@Widget({fqelement: "dv-samples-bookmark"})
export class AppComponent {
  signout_ok = {value: false, on_change: undefined};

  constructor(private _router: Router, client_bus: ClientBus) {
    client_bus.init(this, [field("signout_ok", "Boolean")]);

    this.signout_ok.on_change(() => {
      if (this.signout_ok.value) {
        this._router.navigateByUrl("/landing");
      }
    });
  }
}
