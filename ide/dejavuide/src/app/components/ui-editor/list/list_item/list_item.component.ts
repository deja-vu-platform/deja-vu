
import { Component, Input, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { MatDialog } from '@angular/material';

import { Cliche } from '../../../../models/cliche/cliche';
import { Widget, BaseWidget, UserWidget, LinkBaseWidget } from '../../../../models/widget/widget';
import { DeleteDialogComponent } from './delete_dialog.component';
import { ProjectService } from '../../../../services/project.service';

// List item needs drag-and-drop
import * as jQuery from 'jquery';
import 'jquery-ui-dist/jquery-ui';

const $ = <any>jQuery;


@Component({
  selector: 'dv-list-item',
  templateUrl: './list_item.component.html',
  styleUrls: ['./list_item.component.css']
})
export class ListItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isDraggable = false;
  @Input() isDeletable = true;
  @Input() createNew = false;
  @Input() isTemplate = false;
  @Input() widget: Widget;
  @ViewChild('ghost', {read: ElementRef}) ghost: ElementRef;
  innerShown = false;
  renameVisible = false;
  selected: Observable<boolean>;
  el: HTMLElement;

  private subscriptions = [];

  innerWidgets: Observable<Widget[]>;
  constructor(
    el: ElementRef,
    public dialog: MatDialog,
    private projectService: ProjectService
  ) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.innerWidgets = this.widget.innerWidgetIds
      .map(ids => this.projectService.getWidgets(ids));

    this.selected = this.projectService.selectedWidget
      .map(widget => widget.getId() === this.widget.getId());
  }

  ngAfterViewInit() {
    // TODO grid interaction when dragging
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
              ui.helper.dvWidget = this.widget;
              ui.helper.new = this.createNew;
              ui.helper.template = this.isTemplate;
          },
      });
    }
  }

  handleDelete(): void {
    if (this.isDeletable) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '250px',
      });

      this.subscriptions.push(
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.deleteUserWidget();
          }
        }));
    }
  }

  toggleShow() {
    this.innerShown = !this.innerShown;
  }

  renameStart(event) {
    this.renameVisible = !this.createNew;
  }

  rename(event) {
    this.widget.setName(event.target.value);
  }

  private deleteUserWidget() {
    console.log('clicked delete');
    // TODO either disallow the selected widget to be deleted, or
    // update the worksurface reference to null if it is deleted

    this.projectService.deleteWidget(this.widget);
    this.projectService.userAppUpdated();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}

