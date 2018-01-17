import { Component, Input } from '@angular/core';

import { UserWidget } from '../../../models/widget/widget';

declare const jscolor: any;

// Some colors:
const WHITE = 'FFFFFF';
const BLACK = '000000';
const PALETTE_SIZE = 16;
const CURRENT_COLORS_SIZE = 8;

const CURRENT_COLORS_CLASS = 'current-colors-elt';
const PALETTE_CLASS = 'palette-elt';

@Component({
  selector: 'dv-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.css'],
})
export class PaletteComponent {
  @Input() selectedPage: UserWidget;
  // possible sources http://jscolor.com/, http://www.w3schools.com/colors/colors_picker.asp
  // http://jscolor.com/examples/

  pickerObject = new jscolor($('<div>')[0]); // Needs an object to bind to
  palette = [];
  currentColors = [];

  paletteElt;
  currentColorsElt;

  selectedPaletteElt = null;

  constructor() {
    // TODO load palette function input
    this.loadPalette();
  }

  addNewColorToCurrentColors (color, idx?) {
    // if real color;
    const realColor = this.pickerObject.fromString(color); // returns true if it's a real color string
    if (realColor) {
      if (idx || idx === 0) { // index given
        if (idx >= 0 && idx < this.currentColors.length) {
          this.currentColors[idx] = color;
        }
      } else {
        this.currentColors.push(color);
        if (this.currentColors.length > CURRENT_COLORS_SIZE) {
          this.currentColors.shift(); // keeping a max size
        }
      }
    }
    this.updateElt(true);
  }

  // TODO function making palette and each cell a picker object

  // TODO what is this function doing?
  setUpStyleColors (userWidget) {
    // const  pickerText = $('#pick-color-text-input')[0]._jscLinkedInstance;
    // pickerText.fromString('000000');
    // const  pickerBG = $('#pick-color-bg-input')[0]._jscLinkedInstance;
    // pickerBG.fromString('87CEFA');

    // if (userWidget.properties.styles.custom) {
    //   const  overallStyles = userWidget.properties.styles.custom;
    //   const  textColor = overallStyles['color'] || '';
    //   pickerText.fromString(textColor);

    //   const  bgColor = overallStyles['background-color'] || '';
    //   pickerBG.fromString(bgColor);
    //   $('#' + workSurfaceRef + '_' + userWidget.meta.id).css({
    //     'background-color': bgColor,
    //   });
    // }
  }

  setUpPickerInputs () {
    const  inputText = $('#pick-color-text-input');
    const  pickerText = new jscolor(inputText[0]);
    pickerText.closable = true;
    pickerText.closeText = 'X';
    inputText.change(() => {
      const  color = pickerText.toHEXString();
      // this.setOverallStyleAndUpdateView('color', color, this.selectedPage);
      this.addNewColorToCurrentColors(color);
    });

    const  inputBG = $('#pick-color-bg-input');
    const  pickerBG = new jscolor(inputBG[0]);
    pickerBG.closable = true;
    pickerBG.closeText = 'X';
    inputBG.change(() => {
      const  color = pickerBG.toHEXString();
      // this.setOverallStyleAndUpdateView('background-color', color, this.selectedPage);
      $('#' + workSurfaceRef + '_' + this.selectedPage.getId()).css({
        'background-color': color,
      });
      this.addNewColorToCurrentColors(color);
    });

    $('#reset-overall-color').click(() => {
      // //delete this.selectedPage.properties.styles.custom;
      // widgetEditsManager.clearCustomProperties(this.selectedPage.meta.id, 'styles.custom');

      // style.setUpStyleColors(this.selectedPage);
      // for (const  id in this.selectedPage.innerWidgets) {
      //   const  container = $('#' + workSurfaceRef + '_' + this.selectedPage.meta.id).find('#' + containerRef + '_' + id);
      //   refreshContainerDisplay(false, container, currentZoom);
      // }
    });
  }

  setUpFontInputs() {
    $('.overall-text-size-input-set').click(() => {
      const value = $('.overall-text-size-input').val();
      if (!isNaN(parseInt(value, 10))) {
        // this.setOverallStyleAndUpdateView('font-size', value + 'px', this.selectedPage);
      }
    });

    $('.overall-text-weight-input-set').click(() => {
      const value = $('.overall-text-weight-input').val();
      if (!isNaN(parseInt(value, 10))) {
        // setOverallStyleAndUpdateView('font-weight', value, this.selectedPage);
      }
    });
  }

  setUpInnerWidgetTextColor (textColorInput, customColor, onChange) {
    const  pickerText = new jscolor(textColorInput[0]);
    pickerText.closable = true;
    pickerText.closeText = 'X';
    textColorInput.change((e) => {
      e.stopPropagation();
      const  color = pickerText.toHEXString();
      this.addNewColorToCurrentColors(color);
      onChange(color);
    });
    const  textColor = customColor || BLACK;
    pickerText.fromString(textColor);

  }


  setUpInnerWidgetBGColor (bgColorInput, customColor, onChange) {
    const  pickerBG = new jscolor(bgColorInput[0]);
    pickerBG.closable = true;
    pickerBG.closeText = 'X';
    bgColorInput.change((e) => {
      e.stopPropagation();
      const  color = pickerBG.toHEXString();
      this.addNewColorToCurrentColors(color);
      onChange(color);
    });

    const  bgColor = customColor || WHITE;
    pickerBG.fromString(bgColor);
  }

  private makePaletteElt (forCurrentColorsElt?) {
  const container = $('<div></div>');
  forCurrentColorsElt ? container.attr('id', 'current-colors') : container.attr('id', 'palette');
  const size = forCurrentColorsElt ? CURRENT_COLORS_SIZE : PALETTE_SIZE;
  for (let i = 0; i < size; i++) {
    const  elt = $('<div></div>');
    if (forCurrentColorsElt) {
      const  color = this.currentColors[i];
      const  makeOnClickFunction = (j) => {
        return () => {
          if (this.selectedPaletteElt) {
            const  idx = this.selectedPaletteElt.data('index');
            this.palette[idx] = this.currentColors[j];
            this.savePalette(userApp); // TODO fixme
            this.updateElt();
            this.selectedPaletteElt = null;
          }
        };
      };

      elt.attr('id', CURRENT_COLORS_CLASS + '_' + i)
        .data('index', i)
        .addClass(CURRENT_COLORS_CLASS)
        .css({
          'background-color': color,
        })
        .click(makeOnClickFunction(i));
    } else {
      elt.attr('id', PALETTE_CLASS + '_' + i)
        .data('index', i)
        .addClass(PALETTE_CLASS)
        .css({
          'background-color': this.palette[i],
        })
        .click(() => {
          // TODO maybe we'll have a selected component const iable
          // and if you click this, the color gets set to that color
          // console.log($(this).css('background-color'));
          this.selectedPaletteElt = $(this);
        });

    }
    container.prepend(elt);
  }

  return container;
}

  updateElt(forCurrentColors?) {
    const  size = forCurrentColors ? CURRENT_COLORS_SIZE : PALETTE_SIZE;
    const  source = forCurrentColors ? this.currentColors : this.palette;
    const  id = forCurrentColors ? CURRENT_COLORS_CLASS : PALETTE_CLASS;
    const  elt = forCurrentColors ? this.currentColorsElt : this.paletteElt;
    for (let  i = 0; i < size; i++) {
      elt.find('#' + id + '_' + i).css({
        'background-color': source[i],
      });
    }
  }


  loadPalette (userApp?) {
    this.currentColors = [];
    this.palette = [];

    if (!userApp || !userApp.properties.palette) {
      for (let  i = 0; i < PALETTE_SIZE; i++) {
        this.palette.push(WHITE);
      }
    } else {
      const  currentPalette = userApp.properties.palette;
      this.palette = JSON.parse(JSON.stringify(currentPalette));
    }
    for (let  i = 0; i < CURRENT_COLORS_SIZE; i++) {
      this.currentColors.push(WHITE);
    }
    this.paletteElt = this.makePaletteElt();
    this.currentColorsElt = this.makePaletteElt(true);
    paletteContainer.append(this.paletteElt).append(this.currentColorsElt);
  }

  private savePalette(userApp) {
    userApp.properties.palette = JSON.parse(JSON.stringify(this.palette));
  }
}
