import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-widget-options',
  templateUrl: './options.component.html',
})
export class WidgetOptionsComponent {
  @Input() editDisabled = false;

  clearStyles() {
    console.log('clear styles clicked');
  }

  showTooltip() {
    console.log('show tooltip clicked');
    // container.find('.tooltip').addClass('open');
  }

  createTemplate() {
    console.log('create template clicked');
    // var copy = createUserWidgetCopy(widget);
    // userApp.addTemplate(copy);
    // listDisplay.refresh();
  }

  delete() {
    console.log('delete clicked');
  }

  unlink() {
    console.log('unlink clicked');
  }

  moveUp() {
    console.log('move down clicked');
  }

  moveDown() {
    console.log('move down clicked');
  }

}
