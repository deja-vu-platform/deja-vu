import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectExplorerComponent } from './project-explorer/project-explorer.component';

import { UiEditorComponent } from './ui-editor/ui-editor.component';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';

const appRoutes: Routes = [
  { path: 'projects', component: ProjectExplorerComponent},
  { path: 'ui-editor', component: UiEditorComponent},
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { useHash: true,
        enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
