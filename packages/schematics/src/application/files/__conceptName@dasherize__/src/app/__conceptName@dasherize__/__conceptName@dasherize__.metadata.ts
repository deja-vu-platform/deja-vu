import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all concept components here
import { Create<%= classify(conceptName) %>Component } from './create-<%= dasherize(conceptName) %>/create-<%= dasherize(conceptName) %>.component';
export { Create<%= classify(conceptName) %>Component };
import { Delete<%= classify(conceptName) %>Component } from './delete-<%= dasherize(conceptName) %>/delete-<%= dasherize(conceptName) %>.component';
export { Delete<%= classify(conceptName) %>Component };
import { Show<%= classify(conceptName) %>Component } from './show-<%= dasherize(conceptName) %>/show-<%= dasherize(conceptName) %>.component';
export { Show<%= classify(conceptName) %>Component };
import { Update<%= classify(conceptName) %>Component } from './update-<%= dasherize(conceptName) %>/update-<%= dasherize(conceptName) %>.component';
export { Update<%= classify(conceptName) %>Component };


// add all concept components here
const allComponents = [
  Create<%= classify(conceptName) %>Component, Delete<%= classify(conceptName) %>Component,
  Show<%= classify(conceptName) %>Component, Update<%= classify(conceptName) %>Component
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
