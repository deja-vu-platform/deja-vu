import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all cliché actions here
import { Create<%= classify(clicheName) %>Component } from './create-<%= dasherize(clicheName) %>/create-<%= dasherize(clicheName) %>.component';
export { Create<%= classify(clicheName) %>Component };
import { Show<%= classify(clicheName) %>Component } from './show-<%= dasherize(clicheName) %>/show-<%= dasherize(clicheName) %>.component';
export { Show<%= classify(clicheName) %>Component };


// add all cliché actions here
const allComponents = [
  Create<%= classify(clicheName) %>Component, Show<%= classify(clicheName) %>Component
];

const metadata = {
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
