/// <reference path="../typings/tsd.d.ts" />
import * as http from "http";

export class RestBus {
  private _name: string;

  constructor(name: string, private _hostname: string, private _port: number) {
    this._name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // If no info fn is provided we resort to taking all params from the req
  // If no action is given we use the action of the req
  crud(rel: String, info?) {
    return (req, res, next) => {
      console.log(`attempting to reach bus at ${this._hostname}:${this._port}`);
      const options = {
        hostname: this._hostname,
        port: this._port,
        method: req.method,
        path: `/${this._name}/${rel}`
      };
      console.log(JSON.stringify(options));

      const bus_req = http.request(options);
      bus_req.on("response", res => {
        let body = "";
        res.on("data", d => { body += d; });
        res.on("end", () => {
          console.log(`got ${body} back from the bus`);
          next();
        });
      });
      bus_req.on("error", err => next(err));
      bus_req.end();
    };
  }

  /*
  private paramExtractor(req): Object {
    console.log(JSON.stringify(req.params));
    return {};
  }
  */
}
