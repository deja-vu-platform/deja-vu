import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UiEditorComponent } from './ui-editor.component';
import { WorkSurfaceComponent } from './worksurface/worksurface.component';

const widgetsRoutes: Routes = [
  { path: 'ui-editor',
    component: UiEditorComponent,
    children: [
    {
      path: ':id',
      component: WorkSurfaceComponent
    }
  ]}
];

@NgModule({
  imports: [
    RouterModule.forChild(widgetsRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class WidgetRoutingModule { }
