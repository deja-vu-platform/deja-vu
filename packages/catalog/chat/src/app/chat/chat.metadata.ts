import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all cliché components here
import { ShowChatComponent } from './show-chat/show-chat.component';
export { ShowChatComponent };
import { CreateMessageComponent } from './create-message/create-message.component';
export { CreateMessageComponent };
import { ShowMessageComponent } from './show-message/show-message.component';
export { ShowMessageComponent };
import { DeleteMessageComponent } from './delete-message/delete-message.component';
export { DeleteMessageComponent };
import { UpdateMessageComponent } from './update-message/update-message.component';
export { UpdateMessageComponent };


// add all cliché components here
const allComponents = [
  ShowChatComponent, CreateMessageComponent, ShowMessageComponent,
  DeleteMessageComponent, UpdateMessageComponent
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
