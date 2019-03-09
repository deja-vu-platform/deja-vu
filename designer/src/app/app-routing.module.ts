import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DesignerComponent } from './designer/designer.component';

const routes: Routes = [
  { path: '**', component: DesignerComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
