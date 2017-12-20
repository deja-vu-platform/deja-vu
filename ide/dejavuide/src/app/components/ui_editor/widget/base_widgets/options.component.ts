import { Component, Input } from '@angular/core';

import { Widget, UserWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

@Component({
  selector: 'dv-widget-options',
  templateUrl: './options.component.html',
})
export class WidgetOptionsComponent {
  @Input() editDisabled = false;
  @Input() widget: Widget;

  constructor (private projectService: ProjectService) {}

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
    this.unlinkWidgetFromParent();
    const userApp = this.projectService.getProject().getUserApp();
    userApp.removeUnusedWidget(this.widget.getId());
    this.projectService.widgetUpdated();
  }

  unlink() {
    this.unlinkWidgetFromParent();
    this.projectService.widgetUpdated();
  }

  moveUp() {
    console.log('move down clicked');
    console.log(this.widget.getParentId());
  }

  moveDown() {
    console.log('move down clicked');
  }

  private unlinkWidgetFromParent() {
    const parentId = this.widget.getParentId();
    const userApp = this.projectService.getProject().getUserApp();
    const parent = userApp.getWidget(parentId) as UserWidget;
    parent.removeInnerWidget(this.widget.getId());
  }

}
