import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { LabelBaseWidget } from '../../../../models/widget/widget';
import * as $ from 'jquery';

@Component({
  selector: 'dv-label-widget',
  templateUrl: './label_widget.component.html',
})
export class LabelWidgetComponent implements AfterViewInit {
  @ViewChild('edit', {read: ElementRef}) private editElt: ElementRef;

  @Input() widget: LabelBaseWidget;

  tooltipHidden = false;
  optionsHidden = true;

  updateText(event) {
    this.widget.setValue(event.target.innerText);
  }

  toggleOptions() {
    this.optionsHidden = !this.optionsHidden;
  }
  // applyChanges() {
  //   this.widget.setValue(this.value);
  // }

  ngAfterViewInit() {
    const elt = this.editElt.nativeElement;
    $(elt).on('mousedown', (event) => {
      event.stopPropagation();
      $(elt).focus();
    });

    // $(elt).blur(() => {
    // });
  }
}


// var buttonTrash = $('<li>' +
// '<a href="#" class="inner-component-trash">' +
// '<span class="glyphicon glyphicon-trash"></span>' +
// '</a>' +
// '</li>');

// // TODO should inner widgets be deletable/unlinkable?
// var buttonUnlink = $('<li>' +
// '<a href="#" class="inner-component-unlink">' +
// '<span>Unlink</span>' +
// '</a>' +
// '</li>');

// var buttonCreateTemplate = $('<li>' +
// '<a href="#" class="inner-component-unlink">' +
// '<span>Create Template</span>' +
// '</a>' +
// '</li>');

// var buttonMoveUp = $('<li>' +
// '<a href="#" class="inner-component-move-up">' +
// '<span>Move Up</span>' +
// '</a>' +
// '</li>');
// var buttonMoveDown = $('<li>' +
// '<a href="#" class="inner-component-move-up">' +
// '<span>Move Down</span>' +
// '</a>' +
// '</li>');

// buttonTrash.attr('id', 'inner-component-trash' + '_' + widget.meta.id);

// var dropdownMenu = optionsDropdown.find('.dropdown-menu');

// dropdownMenu
// .append(buttonEdit)
// .append('<li class="divider"></li>')
// .append(buttonStyle)
// .append('<li class="divider"></li>')
// .append(buttonCreateTemplate);

// if (!basic){
// dropdownMenu
// .append('<li class="divider"></li>')
// .append(buttonMoveUp)
// .append(buttonMoveDown);
// }

// if (!notDeletable){
// dropdownMenu
// .append('<li class="divider"></li>')
// .append(buttonUnlink)
// .append(buttonTrash);
// }
