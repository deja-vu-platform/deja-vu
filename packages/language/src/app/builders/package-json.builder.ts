import * as _ from 'lodash';


export class PackageJsonBuilder {
  private readonly usedCliches: Set<string> = new Set();

  constructor(private readonly appName: string) {}

  addUsedCliche(clicheName: string): PackageJsonBuilder {
    this.usedCliches.add(clicheName);

    return this;
  }

  addUsedCliches(clicheNames: ReadonlyArray<string>): PackageJsonBuilder {
    for (const clicheName of clicheNames) {
      this.addUsedCliche(clicheName);
    }

    return this;
  }

  build(): string {
    const clichePackages = _
      .map(Array.from(this.usedCliches), (usedCliche: string) =>
        `"${usedCliche}: "0.0.1"`);
    return `
      {
        "name": "${this.appName}",
        "scripts": {
          "start": "dv serve",
          "concurrently": "concurrently",
          "tsc": "tsc"
        },
        "dependencies": {
          "@angular/animations": "^5.2.0",
          "@angular/cdk": "^5.2.1",
          "@angular/common": "^5.2.0",
          "@angular/compiler": "^5.2.0",
          "@angular/core": "^5.2.0",
          "@angular/forms": "^5.2.0",
          "@angular/http": "^5.2.0",
          "@angular/material": "^5.2.1",
          "@angular/material-moment-adapter": "^5.2.1",
          "@angular/platform-browser": "^5.2.0",
          "@angular/platform-browser-dynamic": "^5.2.0",
          "@angular/router": "^5.2.0",
          "cliche-server": "file:../../packages/cliche-server",
          "core-js": "^2.4.1",
          "dv-core": "file:../../packages/dv-core/pkg",
          "dv-gateway": "file:../../packages/dv-gateway",
          "moment": "^2.20.1",
          "rxjs": "^5.5.6",
          "zone.js": "^0.8.19",
          ${clichePackages.join(',')}
          "bootstrap": "^4.0.0"
        },
        "devDependencies": {
          "@angular/cli": "1.6.5",
          "@angular/compiler-cli": "^5.2.0",
          "@angular/language-service": "^5.2.0",
          "concurrently": "^3.5.1",
          "nodemon": "^1.14.12",
          "ts-node": "~4.1.0",
          "tslint": "~5.9.1",
          "typescript": "~2.5.3"
        }
      }
    `;
  }
}
