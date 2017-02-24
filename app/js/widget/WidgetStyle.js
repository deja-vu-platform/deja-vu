/**
 * Created by Shinjini on 2/13/2017.
 */
var WidgetStyle = function(paletteContainer){
    var that = Object.create(WidgetStyle.prototype);


    // possible sources http://jscolor.com/, http://www.w3schools.com/colors/colors_picker.asp
    // http://jscolor.com/examples/

    // Some colors:
    const WHITE = 'FFFFFF';
    const BLACK = '000000';
    const PALETTE_SIZE = 16;


    var pickerObject = new jscolor($('<div>')[0]); // Needs an object to bind to

    var palette = [];

    var paletteElt;

    var containerRef = widgetContainerMaker.getContainerRef();
    var workSurfaceRef = workSurface.getWorkSurfaceRef();



    var updatePalette = function(color, idx){
        // if real color; TODO check with pickerObject
        var realColor = pickerObject.fromString(color); // returns true if it's a real color string
        if (realColor){
            if (idx || idx == 0){ // index given
                if (idx>= 0 && idx<palette.length){
                    palette[idx] = color;
                }
            } else {
                palette.push(color);
                if (palette.length> PALETTE_SIZE){
                    palette.shift(); // keeping a max size
                }
            }
        }
        updatePaletteElt();
    };



    // TODO function making palette and each cell a picker object



    that.setUpStyleColors = function(userWidget){
        var pickerText = $('#pick-color-text-input')[0]._jscLinkedInstance;
        pickerText.fromString('000000');
        var pickerBG = $('#pick-color-bg-input')[0]._jscLinkedInstance;
        pickerBG.fromString('87CEFA');

        if (userWidget.properties.styles.custom) {
            var overallStyles = userWidget.properties.styles.custom;
            var textColor = overallStyles['color'] || '';
            pickerText.fromString(textColor);

            var bgColor = overallStyles['background-color'] || '';
            pickerBG.fromString(bgColor);
            $('#'+workSurfaceRef+'_'+userWidget.meta.id).css({
                'background-color': bgColor,
            });
        }
    };

    var setOverallStyleAndUpdateView = function(styleName, styleValue, userWidget){
        if (!userWidget.properties.styles.custom){
            userWidget.properties.styles.custom = {}
        }
        userWidget.properties.styles.custom[styleName] = styleValue;
        for (var id in userWidget.innerWidgets){
            var container = $('#'+workSurfaceRef+'_'+userWidget.meta.id).find('#'+containerRef+'_'+id);
            refreshContainerDisplay(false, container, currentZoom);
        }

    };

    var setUpPickerInputs = function(){
        var inputText = $('#pick-color-text-input');
        var pickerText = new jscolor(inputText[0]);
        pickerText.closable = true;
        pickerText.closeText = 'X';
        inputText.change(function(){
            var color = pickerText.toHEXString();
            setOverallStyleAndUpdateView('color', color, selectedUserWidget);
            updatePalette(color);
        });

        var inputBG = $('#pick-color-bg-input');
        var pickerBG = new jscolor(inputBG[0]);
        pickerBG.closable = true;
        pickerBG.closeText = 'X';
        inputBG.change(function(){
            var color = pickerBG.toHEXString();
            setOverallStyleAndUpdateView('background-color', color, selectedUserWidget);
            $('#'+workSurfaceRef+'_'+selectedUserWidget.meta.id).css({
                'background-color': color,
            });
            updatePalette(color);
        });

        $('#reset-overall-color').click(function(){
            widgetEditsManager.clearCustomProperties(selectedUserWidget, selectedUserWidget.meta.id, 'styles.custom');

            style.setUpStyleColors(selectedUserWidget);
            for (var id in selectedUserWidget.innerWidgets){
                var container = $('#'+workSurfaceRef+'_'+selectedUserWidget.meta.id).find('#'+containerRef+'_'+id);
                refreshContainerDisplay(false, container, currentZoom);
            }
        });
    };

    var setUpFontInputs = function(){
        $('.overall-text-size-input-set').click(function(){
            var value = $('.overall-text-size-input').val();
            if (!isNaN(parseInt(value))){
                setOverallStyleAndUpdateView('font-size', value + 'px', selectedUserWidget);
            }
        });

        $('.overall-text-weight-input-set').click(function(){
            var value = $('.overall-text-weight-input').val();
            if (!isNaN(parseInt(value))){
                setOverallStyleAndUpdateView('font-weight', value, selectedUserWidget);
            }
        });

    };

    that.setUpOverallInputs = function(){
        setUpPickerInputs();
        setUpFontInputs();
    };

    that.setUpInnerWidgetTextColor = function(textColorInput, customColor, onChange){
        var pickerText = new jscolor(textColorInput[0]);
        pickerText.closable = true;
        pickerText.closeText = 'X';
        textColorInput.change(function(e){
            e.stopPropagation();
            var color = pickerText.toHEXString();
            updatePalette(color);
            onChange(color);
        });
        var textColor = customColor || BLACK;
        pickerText.fromString(textColor);

    };

    that.setUpInnerWidgetBGColor = function(bgColorInput, customColor, onChange){
        var pickerBG = new jscolor(bgColorInput[0]);
        pickerBG.closable = true;
        pickerBG.closeText = 'X';
        bgColorInput.change(function(e){
            e.stopPropagation();
            var color = pickerBG.toHEXString();
            updatePalette(color);
            onChange(color);
        });

        var bgColor = customColor || WHITE;
        pickerBG.fromString(bgColor);
    };

    var makeColorPaletteElt = function(){
        var container = $('<div></div>');
        container.attr('id', 'palette');

        for (var i = 0; i<PALETTE_SIZE; i++){
            var elt = $('<div></div>');
            elt.attr('id', 'palette-elt_'+i);
            elt.addClass('palette-elt');
            elt.css({
                'background-color': palette[i],
            });

            elt.click(function(){
                // TODO maybe we'll have a selected component variable
                // and if you click this, the color gets set to that color
                // console.log($(this).css('background-color'));
            });
            container.prepend(elt);
        }

        return container;
    };

    var updatePaletteElt = function(){
        for (var i = 0; i<PALETTE_SIZE; i++) {
            paletteElt.find('#palette-elt_' + i).css({
                'background-color': palette[i],
            })
        }
    };


    var loadPalette = function(givenPalette){
        if (!givenPalette){
            for (var i = 0; i<PALETTE_SIZE; i++){
                palette.push(WHITE);
            }
        } else {
            palette = JSON.stringify(JSON.parse(givenPalette));
        }

        paletteElt = makeColorPaletteElt();
        paletteContainer.append(paletteElt);
    };
    // TODO load palette function input
    loadPalette();

    Object.freeze(that);
    return that;
};