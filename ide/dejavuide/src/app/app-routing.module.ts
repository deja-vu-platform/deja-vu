import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectExplorerComponent } from './components/project-explorer/project-explorer.component';

import { UiEditorComponent } from './components/ui-editor/ui-editor.component';
import { PageNotFoundComponent } from './components/common/page-not-found/page-not-found.module';

const appRoutes: Routes = [
  { path: 'projects', component: ProjectExplorerComponent},
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
