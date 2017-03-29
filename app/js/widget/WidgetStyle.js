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
    const CURRENT_COLORS_SIZE = 8;

    const CURRENT_COLORS_CLASS = 'current-colors-elt';
    const PALETTE_CLASS = 'palette-elt';

    var pickerObject = new jscolor($('<div>')[0]); // Needs an object to bind to

    var palette = [];
    var currentColors = [];

    var paletteElt;
    var currentColorsElt;

    var selectedPaletteElt = null;

    var containerRef = widgetContainerMaker.getContainerRef();
    var workSurfaceRef = workSurface.getWorkSurfaceRef();



    var addNewColorToCurrentColors = function(color, idx){
        // if real color;
        var realColor = pickerObject.fromString(color); // returns true if it's a real color string
        if (realColor){
            if (idx || idx == 0){ // index given
                if (idx>= 0 && idx<currentColors.length){
                    currentColors[idx] = color;
                }
            } else {
                currentColors.push(color);
                if (currentColors.length> CURRENT_COLORS_SIZE){
                    currentColors.shift(); // keeping a max size
                }
            }
        }
        updateElt(true);
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
            addNewColorToCurrentColors(color);
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
            addNewColorToCurrentColors(color);
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
            addNewColorToCurrentColors(color);
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
            addNewColorToCurrentColors(color);
            onChange(color);
        });

        var bgColor = customColor || WHITE;
        pickerBG.fromString(bgColor);
    };

    var makePaletteElt = function(forCurrentColorsElt){
        var container = $('<div></div>');
        forCurrentColorsElt? container.attr('id', 'current-colors'):container.attr('id', 'palette');
        var size = forCurrentColorsElt? CURRENT_COLORS_SIZE:PALETTE_SIZE;
        for (var i = 0; i<size; i++){
            var elt = $('<div></div>');
            if (forCurrentColorsElt){
                var color = currentColors[i];
                var makeOnClickFunction = function(i){
                    return function(){
                        if (selectedPaletteElt){
                            var idx = selectedPaletteElt.data('index');
                            palette[idx] = currentColors[i];
                            savePalette(userApp); // TODO fixme
                            updateElt();
                            selectedPaletteElt = null;
                        }
                    }
                };


                elt.attr('id', CURRENT_COLORS_CLASS+'_'+i)
                    .data('index', i)
                    .addClass(CURRENT_COLORS_CLASS)
                    .css({
                        'background-color': color,
                    })
                    .click(makeOnClickFunction(i));
            } else {
                elt.attr('id', PALETTE_CLASS+'_'+i)
                    .data('index', i)
                    .addClass(PALETTE_CLASS)
                    .css({
                        'background-color': palette[i],
                    })
                    .click(function(){
                        // TODO maybe we'll have a selected component variable
                        // and if you click this, the color gets set to that color
                        // console.log($(this).css('background-color'));
                        selectedPaletteElt = $(this);
                    });

            }
            container.prepend(elt);
        }

        return container;
    };

    var updateElt = function(forCurrentColors){
        var size = forCurrentColors? CURRENT_COLORS_SIZE: PALETTE_SIZE;
        var source = forCurrentColors? currentColors: palette;
        var id = forCurrentColors? CURRENT_COLORS_CLASS: PALETTE_CLASS;
        var elt = forCurrentColors? currentColorsElt: paletteElt;
        for (var i = 0; i<size; i++) {
            elt.find('#'+id+'_' + i).css({
                'background-color': source[i],
            })
        }
    };


    that.loadPalette = function(userApp){
        currentColors = [];
        palette = [];

        if (!userApp || !userApp.properties.palette){
            for (var i = 0; i<PALETTE_SIZE; i++){
                palette.push(WHITE);
            }
        } else {
            var currentPalette = userApp.properties.palette;
            palette = JSON.parse(JSON.stringify(currentPalette));
        }
        for (var i = 0; i<CURRENT_COLORS_SIZE; i++){
            currentColors.push(WHITE);
        }
        paletteElt = makePaletteElt();
        currentColorsElt = makePaletteElt(true);
        paletteContainer.append(paletteElt).append(currentColorsElt);
    };

    var savePalette = function(userApp){
        userApp.properties.palette = JSON.parse(JSON.stringify(palette));
    };

    // TODO load palette function input
    that.loadPalette();

    Object.freeze(that);
    return that;
};