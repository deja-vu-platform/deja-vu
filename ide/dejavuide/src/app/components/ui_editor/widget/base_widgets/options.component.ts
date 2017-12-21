import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import { Widget, UserWidget } from '../../../../models/widget/widget';
import { ProjectService } from '../../../../services/project.service';

declare const jscolor: any;

@Component({
  selector: 'dv-widget-options',
  templateUrl: './options.component.html',
})
export class WidgetOptionsComponent implements AfterViewInit {
  @ViewChild('textInput', {read: ElementRef}) private textInputElt: ElementRef;
  @ViewChild('bgInput', {read: ElementRef}) private bgInputElt: ElementRef;
  @Input() editDisabled = false;
  @Input() widget: Widget;

  pickerText;
  pickerBg;

  constructor (private projectService: ProjectService) {}

  ngAfterViewInit () {
    this.pickerText = new jscolor(this.textInputElt.nativeElement);
    this.pickerText.closable = true;
    this.pickerText.closeText = 'X';
    this.pickerText.fromString('000000');

    this.pickerBg = new jscolor(this.bgInputElt.nativeElement);
    this.pickerBg.closable = true;
    this.pickerBg.closeText = 'X';
    this.pickerBg.fromString('FFFFFF');
  }

  clearStyles() {
    this.widget.removeCustomStyle();
    this.projectService.widgetUpdated();
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
    const parent = this.getParentWidget();
    parent.changeInnerWidgetOrderByOne(this.widget, true);
    this.projectService.widgetUpdated();
  }

  moveDown() {
    const parent = this.getParentWidget();
    parent.changeInnerWidgetOrderByOne(this.widget, false);
    this.projectService.widgetUpdated();
  }

  private unlinkWidgetFromParent() {
    const parent = this.getParentWidget();
    parent.removeInnerWidget(this.widget.getId());
  }

  private getParentWidget(): UserWidget {
    const parentId = this.widget.getParentId();
    const userApp = this.projectService.getProject().getUserApp();
    return userApp.getWidget(parentId) as UserWidget;
  }

  openTextPicker(event) {
    event.stopPropagation();
    this.pickerText.show();
  }

  textColorChange(event) {
    event.stopPropagation();
    const color = this.pickerText.toHEXString();
    this.widget.updateCustomStyle('color', color);
    this.projectService.widgetUpdated();
  }

  openBgPicker(event) {
    event.stopPropagation();
    this.pickerBg.show();
  }

  bgColorChange(event) {
    event.stopPropagation();
    const color = this.pickerBg.toHEXString();
    this.widget.updateCustomStyle('background', color);
    this.projectService.widgetUpdated();
  }
}



// var setUpTextOptions = function(container, widget, outermostWidget){
//   var customStyles = {};
//   var targetId = widget.meta.id;
//   if (outermostWidget){ // FIXME make more robust
//       customStyles = getCustomStyles(widget);
//   }

//   var fontSizeOption = $('<li><div>Font Size: </div></li>');
//   var fontWeightOption = $('<li><div>Font Weight: </div></li>');
//   var fontSizeInput = $('<input class="font-size-input">');
//   var fontWeightInput = $('<input class="font-weight-input">');
//   var fontSizeSetButton = $('<button class="btn font-size-set-button">Set</button>');
//   var fontWeightSetButton = $('<button class="btn font-size-set-button">Set</button>');

//   var fontSize = customStyles['font-size'] || '14px'; // TODO
//   fontSizeInput.val(fontSize);

//   var fontWeight = customStyles['font-weight'] || '100'; // TODO
//   fontWeightInput.val(fontWeight);


//   fontSizeOption.append(fontSizeInput).append(fontSizeSetButton);
//   fontWeightOption.append(fontWeightInput).append(fontWeightSetButton);
//   container.find('.inner-component-custom-style-dropdown').append(fontSizeOption).append(fontWeightOption);


//   fontSizeSetButton.click(function(){
//       let value = fontSizeInput.val();
//       if (!isNaN(parseInt(value))){
//           updateCustomStyles(outermostWidget, targetId, {'font-size': value + 'px'});
//           refreshContainerDisplay(false, container, currentZoom);

//       }

//   });

//   fontWeightSetButton.click(function(){
//       let value = fontWeightInput.val();
//       if (!isNaN(parseInt(value))){
//           updateCustomStyles(outermostWidget, targetId, {'font-weight': value});
//           refreshContainerDisplay(false, container, currentZoom);

//       }
//   });

// };

// let setUpColorOptions = function(container, widget, outermostWidget){
//   let customStyles = {};
//   let targetId = widget.meta.id;
//   if (outermostWidget){
//       customStyles = getCustomStyles(widget);
//   }

//   let textColorOption = $('<li><div>Text Color: </div></li>');
//   let bgColorOption = $('<li><div>Background Color: </div></li>');
//   let textColorInput = $('<input class="color-input">');
//   let bgColorInput = $('<input class="color-input">');
//   textColorOption.append(textColorInput);
//   bgColorOption.append(bgColorInput);

//   let makeOnColorChangeFunction = function(type){
//       return function(color) {
//           let newStyle = {};
//           newStyle[type] = color;
//           updateCustomStyles(outermostWidget, targetId, newStyle);
//           refreshContainerDisplay(false, container, currentZoom);
//       };
//   };

//   style.setUpInnerWidgetTextColor(textColorInput, customStyles['color'], makeOnColorChangeFunction('color'));
//   style.setUpInnerWidgetBGColor(bgColorInput, customStyles['background-color'],  makeOnColorChangeFunction('background-color'));

//   container.find('.inner-component-custom-style-dropdown').append(textColorOption).append(bgColorOption);
// };



// that.setUpInnerWidgetTextColor = function(textColorInput, customColor, onChange){
//   var pickerText = new jscolor(textColorInput[0]);
//   pickerText.closable = true;
//   pickerText.closeText = 'X';
//   textColorInput.change(function(e){
//       e.stopPropagation();
//       var color = pickerText.toHEXString();
//       addNewColorToCurrentColors(color);
//       onChange(color);
//   });
//   var textColor = customColor || BLACK;
//   pickerText.fromString(textColor);

// };

// that.setUpInnerWidgetBGColor = function(bgColorInput, customColor, onChange){
//   var pickerBG = new jscolor(bgColorInput[0]);
//   pickerBG.closable = true;
//   pickerBG.closeText = 'X';
//   bgColorInput.change(function(e){
//       e.stopPropagation();
//       var color = pickerBG.toHEXString();
//       addNewColorToCurrentColors(color);
//       onChange(color);
//   });

//   var bgColor = customColor || WHITE;
//   pickerBG.fromString(bgColor);
// };
