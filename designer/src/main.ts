import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Quill from 'quill';

import { AppModule } from './app/app.module';
import { Output } from './app/output';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

Quill.register('modules/output', Output);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.log(err));
