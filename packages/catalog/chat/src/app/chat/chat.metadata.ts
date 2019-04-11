import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all cliché actions here
import { CreateChatComponent } from './create-chat/create-chat.component';
export { CreateChatComponent };
import { DeleteChatComponent } from './delete-chat/delete-chat.component';
export { DeleteChatComponent };
import { ShowChatComponent } from './show-chat/show-chat.component';
export { ShowChatComponent };
import { UpdateChatComponent } from './update-chat/update-chat.component';
export { UpdateChatComponent };


// add all cliché actions here
const allComponents = [
  CreateChatComponent, DeleteChatComponent,
  ShowChatComponent, UpdateChatComponent
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
