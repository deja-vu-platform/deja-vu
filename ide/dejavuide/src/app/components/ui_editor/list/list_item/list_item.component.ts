
import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, LinkBaseWidget } from '../../../../models/widget/widget';
import { DeleteDialogComponent } from './delete_dialog.component';
import { ProjectService } from '../../../../services/project.service';
// import { WidgetComponent } from '../../widget/widget.component';

// List item needs drag-and-drop
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;


@Component({
  selector: 'dv-list-item',
  templateUrl: './list_item.component.html',
  styleUrls: ['./list_item.component.css']
})
export class ListItemComponent implements OnInit, AfterViewInit {
  @Input() isDraggable = false;
  @Input() isDeletable = true;
  @Input() createNew = false;
  @Input() isTemplate = false;
  @Input() widget: Widget;
  @ViewChild('ghost', {read: ElementRef}) ghost: ElementRef;
  dragging = false;
  innerShown = false;
  renameVisible = false;
  el: HTMLElement;

  innerWidgets: Widget[];
  constructor(
    el: ElementRef,
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    const userApp = this.projectService.getProject().getUserApp();
    this.innerWidgets = this.widget.getInnerWidgetIds()
      .map(id => userApp.getWidget(id));
  }

  ngAfterViewInit() {
    if (this.isDraggable) {
      $(this.el).draggable(
        { opacity: 1,
          revert: 'invalid',
          cursorAt: {top: 0, left: 0},
          helper: (e, ui) => {
              const widgetContainer = $(this.ghost.nativeElement).clone();
              widgetContainer.css({
                display: 'block',
                visibility: 'visible',
              });
              return widgetContainer;
          },
          appendTo: '.work-surface',
          cursor: '-webkit-grabbing',
          scroll: true,
          snap: '.grid-cell, .grid-x, .grid-y',
          snapTolerance: 10,
          start: (e, ui) => {
              // $('.grid').css({
              //     visibility: 'visible'
              // });
              // $('.grid-line').css({
              //     visibility: 'hidden'
              // });
              ui.helper.dvWidget = this.widget;
              ui.helper.new = this.createNew;
              ui.helper.template = this.isTemplate;
              this.dragging = true;
          },
          drag: (event, ui) => {
              // grid.detectGridLines(ui.helper);
          },
          stop: (event, ui) => {
              // $('.grid').css({
              //     visibility: 'hidden'
              // });
              // $('.grid-line').css({
              //     visibility: 'hidden'
              // });
              // var widgetId = draggingWidget.meta.id;
              // var isNewWidget = $(ui.helper).data('newcomponent');
              // if (!isNewWidget) {
              //     var widgetContainerOld = $('#'+containerRef+'_' + widgetId + '_old');
              //     if (!$(ui.helper).data('dropped')) {// not properly dropped!
              //         widgetContainerOld.attr('id', containerRef+'_' + widgetId);
              //         widgetContainerOld.css({
              //             opacity: 1,
              //         });
              //     } else { // properly dropped
              //         widgetContainerOld.remove();
              //     }
              // } else {
              //     delete userApp.widgets.unused[widgetId];
              //     $("#user-components-list").find("[data-componentid='" + widgetId + "']").remove();
              // }
              // listDisplay.refresh();
              this.dragging = false;
          }
      });
    }
  }

  handleDelete(): void {
    if (this.isDeletable) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '250px',
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteUserWidget();
        }
      });
    }
  }

  toggleShow() {
    this.innerShown = !this.innerShown;
  }

  widgetSelected() {
    console.log('widget clicked');
    this.projectService.updateSelectedWidget(this.widget);
  }

  renameStart(event) {
    this.renameVisible = !this.createNew;
  }

  rename(event) {
    this.widget.setName(event.target.value);
    this.projectService.widgetUpdated();
  }

  private deleteUserWidget() {
    console.log('clicked delete');
    const userApp = this.projectService.getProject().getUserApp();
    // TODO either disallow the selected widget to be deleted, or
    // update the worksurface reference to null if it is deleted

    userApp.removeWidget(this.widget.getId());
    this.projectService.widgetUpdated();
  }
}

