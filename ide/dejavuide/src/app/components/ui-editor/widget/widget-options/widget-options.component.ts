import { Component, Input, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';

import { Widget, UserWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';
import { PaletteService } from '../../../../services/palette.service';


declare const jscolor: any;

const COLOR = 'color';
const BACKGROUND = 'background';

@Component({
  selector: 'dv-widget-options',
  templateUrl: './widget-options.component.html',
  styleUrls: ['./tooltip.css']
})
export class WidgetOptionsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('textInput', {read: ElementRef}) private textInputElt: ElementRef;
  @ViewChild('bgInput', {read: ElementRef}) private bgInputElt: ElementRef;
  @Input() editDisabled = false;
  @Input() widget: Widget;

  @Output() applyChanges = new EventEmitter<boolean>();
  tooltipVisible = false;

  pickerText;
  textColorEditing = false;
  pickerBg;
  bgColorEditing = false;

  subscriptions = [];

  constructor (
    private projectService: ProjectService,
    private paletteService: PaletteService) {
  }

  ngAfterViewInit () {
    const localStyles = this.widget.getLocalCustomStyles();

    this.pickerText = new jscolor(this.textInputElt.nativeElement);
    this.pickerText.closable = true;
    this.pickerText.closeText = 'X';
    this.pickerText.fromString(localStyles[COLOR] || '#000000');

    this.pickerBg = new jscolor(this.bgInputElt.nativeElement);
    this.pickerBg.closable = true;
    this.pickerBg.closeText = 'X';
    this.pickerBg.fromString(localStyles[BACKGROUND] || '#FFFFFF');

    this.subscriptions.push(
      this.paletteService.paletteColorListener.subscribe(color => {
        if (this.textColorEditing) {
          this.pickerText.fromString(color);
          this.widget.updateCustomStyle(COLOR, color);
          this.textColorEditing = false;
        }
        if (this.bgColorEditing) {
          this.pickerBg.fromString(color);
          this.widget.updateCustomStyle(BACKGROUND, color);
          this.bgColorEditing = false;
        }
      })
    );
  }

  clearStyles() {
    this.widget.removeCustomStyle();
  }

  showTooltip() {
    this.tooltipVisible = true;
  }

  tooltipClose(apply: boolean) {
    this.tooltipVisible = false;
    this.applyChanges.emit(apply);
  }

  createTemplate() {
    const userApp = this.projectService.getUserApp();
    const copies = this.widget.makeCopy(userApp);
    userApp.setAsTemplate(copies[0]);
    // TODO this might not be the appropriate thing to do or the place to do it
    // But it doesn't make sense for templates to have a position other
    // than (0,0)
    copies[0].resetPosition();
    this.projectService.userAppUpdated();
  }

  delete() {
    this.projectService.deleteWidget(this.widget);
    this.projectService.userAppUpdated();
  }

  unlink() {
    this.projectService.unlinkWidget(this.widget);
    this.projectService.userAppUpdated();
  }

  moveUp() {
    const userApp = this.projectService.getUserApp();
    const parent = this.projectService.getParentWidget(this.widget);
    parent.changeInnerWidgetOrderByOne(userApp, this.widget, true);
  }

  moveDown() {
    const userApp = this.projectService.getUserApp();
    const parent = this.projectService.getParentWidget(this.widget);
    parent.changeInnerWidgetOrderByOne(userApp, this.widget, false);
  }

  openTextPicker(event) {
    event.stopPropagation();
    this.textInputElt.nativeElement.focus();
    this.pickerText.show();
  }

  textColorChange(event) {
    event.stopPropagation();
    const color = this.pickerText.toHEXString();
    this.paletteService.newColor(color);
    this.widget.updateCustomStyle(COLOR, color);
  }

  openBgPicker(event) {
    event.stopPropagation();
    this.bgInputElt.nativeElement.focus();
    this.pickerBg.show();
  }

  bgColorChange(event) {
    event.stopPropagation();
    const color = this.pickerBg.toHEXString();
    this.paletteService.newColor(color);
    this.widget.updateCustomStyle(BACKGROUND, color);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
