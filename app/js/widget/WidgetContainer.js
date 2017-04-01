/**
 * Created by Shinjini on 11/3/2016.
 */

var WidgetContainer = function(){
    var that = Object.create(WidgetContainer.prototype);

    var WIDGET_CONT_REF = 'widget-container';

    that.getContainerRef = function(){
        return WIDGET_CONT_REF;
    };

    var makeContainerResizable = function(widget, outerWidget, container, outermostWidget){
        var widgetId = widget.meta.id;

        var dragHandle_se = $('<span></span>');
        dragHandle_se.html('<img src="images/drag_handle_se_icon.png" width="15px" height="15px">');
        dragHandle_se.addClass('ui-resizable-handle ui-resizable-se drag-handle');
        dragHandle_se.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_sw = $('<span></span>');
        dragHandle_sw.html('<img src="images/drag_handle_sw_icon.png" width="15px" height="15px">');
        dragHandle_sw.addClass('ui-resizable-handle ui-resizable-sw drag-handle');
        dragHandle_sw.attr('id', 'drag-handle-sw' + '_' + widgetId);

        var dragHandle_ne = $('<span></span>');
        dragHandle_ne.html('<img src="images/drag_handle_ne_icon.png" width="15px" height="15px">');
        dragHandle_ne.addClass('ui-resizable-handle ui-resizable-ne drag-handle');
        dragHandle_ne.attr('id', 'drag-handle-se' + '_' + widgetId);

        var dragHandle_nw = $('<span></span>');
        dragHandle_nw.html('<img src="images/drag_handle_nw_icon.png" width="15px" height="15px">');
        dragHandle_nw.addClass('ui-resizable-handle ui-resizable-nw drag-handle');
        dragHandle_nw.attr('id', 'drag-handle-nw' + '_' + widgetId);

        container.append(dragHandle_se);
        container.append(dragHandle_sw);
        container.append(dragHandle_ne);
        container.append(dragHandle_nw);

        $(container).resizable({
            handles: {
                'se': dragHandle_se,
                'sw': dragHandle_sw,
                'ne': dragHandle_ne,
                'nw': dragHandle_nw
            },
            snap: '.grid-cell',
            snapTolerance: 10,
            start: function(){
                $('.grid').css({
                    visibility: 'visible'
                });
            },
            resize: function(e, ui){
                var newDimensions = {height: ui.size.height/currentZoom, width: ui.size.width/currentZoom};

                widgetEditsManager.updateCustomProperties(outermostWidget, widget.meta.id, 'dimensions', newDimensions);
                refreshContainerDisplay(false, container, currentZoom);
            },
            stop: function(e, ui){
                var newPosition = {left:  ui.position.left/currentZoom, top: ui.position.top/currentZoom};
                var newLayout = {};
                newLayout[widget.meta.id] = newPosition;
                widgetEditsManager.updateCustomProperties(outermostWidget, widget.meta.id, 'layout', newLayout, true);

                // not super important to update as you resize so just do it at the end
                miniNav.updateMiniNavInnerWidgetSizes(outerWidget, currentZoom);
                grid.setUpGrid();
                $('.grid').css({
                    visibility: 'hidden'
                });
            }
        });
    };

    var toggleOpenClose = function(e, parent){
        var shouldBeOpen = (!parent.hasClass('open'));
        $(parent).parent().find('*').removeClass('open'); // close all siblings
        if (shouldBeOpen){
            parent.addClass('open');
        }
        e.stopPropagation();
    };


    var createEditOptions = function(widget, outerWidget, container, outermostWidget, basic){
        var optionsDropdown = $('<div class="dropdown inner-component-options-small">'+
            '<button class="btn btn-default dropdown-toggle btn-xs inner-component-options-dropdown" type="button"  data-toggle="dropdown">'+
            '<span class="glyphicon glyphicon-option-vertical"></span></button>'+
            '<ul class="dropdown-menu">'+

            '</ul>'+
            '</div>');

        var buttonEdit = $('<li>' +
            '<a href="#" class="edit-btn">' +
            '<span class="glyphicon glyphicon-pencil"></span>' +
            '</a>' +
            '</li>');

        buttonEdit.attr('id', 'edit-btn' + '_' + widget.meta.id);


        var buttonStyle = $('<li class="dropdown-submenu">'+
                                '<a tabindex="-1" href="#" class="inner-component-style">Style</a>'+
                                '<ul class="dropdown-menu inner-component-style-dropdown">'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-custom-style">Custom</a>'+
                                        '<ul class="dropdown-menu inner-component-custom-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                    '<li class="dropdown-submenu">'+
                                        '<a tabindex="-1" href="#" class="inner-component-premade-style">Premade</a>'+
                                        '<ul class="dropdown-menu inner-component-premade-style-dropdown">'+
                                        '</ul>'+
                                    '</li>'+
                                    '<li class="divider"></li>'+
                                    '<li>' +
                                        '<a tabindex="-1" href="#" class="inner-component-delete-style">Clear Styles</a>'+
                                    '</li>'+
                                '</ul>'+
                            '</li>');



        var buttonTrash = $('<li>' +
            '<a href="#" class="inner-component-trash">' +
            '<span class="glyphicon glyphicon-trash"></span>' +
            '</a>' +
            '</li>');

        // TODO should inner widgets be deletable/unlinkable?
        var buttonUnlink = $('<li>' +
            '<a href="#" class="inner-component-unlink">' +
            '<span>Unlink</span>' +
            '</a>' +
            '</li>');

        var buttonCreateTemplate = $('<li>' +
            '<a href="#" class="inner-component-unlink">' +
            '<span>Create Template</span>' +
            '</a>' +
            '</li>');

        var buttonMoveUp = $('<li>' +
            '<a href="#" class="inner-component-move-up">' +
            '<span>Move Up</span>' +
            '</a>' +
            '</li>');
        var buttonMoveDown = $('<li>' +
            '<a href="#" class="inner-component-move-up">' +
            '<span>Move Down</span>' +
            '</a>' +
            '</li>');

        buttonTrash.attr('id', 'inner-component-trash' + '_' + widget.meta.id);

        optionsDropdown.find('.dropdown-menu')
            .append(buttonEdit)
            .append('<li class="divider"></li>')
            .append(buttonStyle)
            .append('<li class="divider"></li>')
            .append(buttonCreateTemplate)

        if (!basic){
            optionsDropdown.find('.dropdown-menu')
                .append('<li class="divider"></li>')
                .append(buttonUnlink)
                .append(buttonTrash)
                .append('<li class="divider"></li>')
                .append(buttonMoveUp)
                .append(buttonMoveDown);
        }

        // behaviour

        optionsDropdown.find('.inner-component-options-dropdown, .inner-component-style,' +
            ' .inner-component-custom-style, .inner-component-premade-style').each(function(idx, elt){
            $(elt).click(function(e){
                var thisElt = elt;
                toggleOpenClose(e, $(thisElt).parent());
            });
        });

        buttonStyle.find('.inner-component-delete-style').click(function(e){
            e.stopPropagation();
            clearCustomStyles(outermostWidget, widget.meta.id);
            refreshContainerDisplay(false, container, currentZoom);

            // TODO reset the values in the inputs
        });

        buttonEdit.on("click", function (e) {
            e.stopPropagation();
            container.find('.tooltip').addClass('open');
        });

        buttonCreateTemplate.click(function(){
            // TODO these functions should be somewhere else
            var copy = createUserWidgetCopy(widget);
            userApp.addTemplate(copy);
            //listDisplay.displayNewWidgetTemplateInList(copy.meta.name, copy.meta.id, userApp.meta.id);
            listDisplay.refresh();

        });

        buttonTrash.click(function(){
            deleteWidgetFromUserWidgetAndFromView(widget.meta.id)
        });

        buttonUnlink.click(function(){
            unlinkWidgetAndRemoveFromView(widget.meta.id)
        });



        buttonMoveUp.click(function(){
           WidgetWorkSurface().changeOrderByOne(widget.meta.id, outerWidget, true);
        });


        buttonMoveDown.click(function(){
            WidgetWorkSurface().changeOrderByOne(widget.meta.id, outerWidget, false);
        });

        return optionsDropdown;
    };


    that.createBasicWidgetContainer = function(widget, zoom){
        var container = $('<div></div>');
        var containerId = WIDGET_CONT_REF+'_'+widget.meta.id;
        container.addClass('dropped '+WIDGET_CONT_REF).attr('id', containerId);
        container.height(widget.properties.dimensions.height * zoom).width(widget.properties.dimensions.width * zoom);
        container.data('componentId', widget.meta.id);
        return container;
    };

    that.createMinimallyEditableWidgetContainer = function(widget, outerWidget, zoom, outermostWidget) {
        var container = that.createBasicWidgetContainer(widget, zoom);
        container.append(createEditOptions(widget, outerWidget, container, outermostWidget, true));
        return container;
    };

    that.createEditableWidgetContainer = function(widget, outerWidget, zoom, outermostWidget) {
        var container = that.createBasicWidgetContainer(widget, zoom);
        makeContainerResizable(widget, outerWidget, container, outermostWidget);
        container.append(createEditOptions(widget, outerWidget, container, outermostWidget));
        return container;
    };

    var getCustomStyles = function(target){
        var changes = target.overrideProperties; //widgetEditsManager.getCustomProperty(outermostWidget, targetId);
        if (changes){
            if (changes.styles) {
                if (changes.styles.custom){
                    return changes.styles.custom;
                }
            }
        }
        return {};
    };


    var updateCustomStyles = function(outermostWidget, targetId, customStyles){
        widgetEditsManager.updateCustomProperties(outermostWidget, targetId, 'styles.custom', customStyles);
    };


    var clearCustomStyles = function(outermostWidget, targetId){
        widgetEditsManager.clearCustomProperties(targetId, 'styles.custom');

        // TODO at this point might even be good to clear out all properties if they are empty
    };


    var setUpTextOptions = function(container, widget, outermostWidget){
        var customStyles = {};
        var targetId = widget.meta.id;
        if (outermostWidget){ // FIXME make more robust
            customStyles = getCustomStyles(widget);
        }

        var fontSizeOption = $('<li><div>Font Size: </div></li>');
        var fontWeightOption = $('<li><div>Font Weight: </div></li>');
        var fontSizeInput = $('<input class="font-size-input">');
        var fontWeightInput = $('<input class="font-weight-input">');
        var fontSizeSetButton = $('<button class="btn font-size-set-button">Set</button>');
        var fontWeightSetButton = $('<button class="btn font-size-set-button">Set</button>');

        var fontSize = customStyles['font-size'] || '14px'; // TODO
        fontSizeInput.val(fontSize);

        var fontWeight = customStyles['font-weight'] || '100'; // TODO
        fontWeightInput.val(fontWeight);


        fontSizeOption.append(fontSizeInput).append(fontSizeSetButton);
        fontWeightOption.append(fontWeightInput).append(fontWeightSetButton);
        container.find('.inner-component-custom-style-dropdown').append(fontSizeOption).append(fontWeightOption);


        fontSizeSetButton.click(function(){
            var value = fontSizeInput.val();
            if (!isNaN(parseInt(value))){
                updateCustomStyles(outermostWidget, targetId, {'font-size': value + 'px'});
                refreshContainerDisplay(false, container, currentZoom);

            }

        });

        fontWeightSetButton.click(function(){
            var value = fontWeightInput.val();
            if (!isNaN(parseInt(value))){
                updateCustomStyles(outermostWidget, targetId, {'font-weight': value});
                refreshContainerDisplay(false, container, currentZoom);

            }
        });

    };

    var setUpColorOptions = function(container, widget, outermostWidget){
        var customStyles = {};
        var targetId = widget.meta.id;
        if (outermostWidget){
            customStyles = getCustomStyles(widget);
        }

        var textColorOption = $('<li><div>Text Color: </div></li>');
        var bgColorOption = $('<li><div>Background Color: </div></li>');
        var textColorInput = $('<input class="color-input">');
        var bgColorInput = $('<input class="color-input">');
        textColorOption.append(textColorInput);
        bgColorOption.append(bgColorInput);

        var makeOnColorChangeFunction = function(type){
            return function(color) {
                var newStyle = {};
                newStyle[type] = color;
                updateCustomStyles(outermostWidget, targetId, newStyle);
                refreshContainerDisplay(false, container, currentZoom);
            };
        };

        style.setUpInnerWidgetTextColor(textColorInput, customStyles['color'], makeOnColorChangeFunction('color'));
        style.setUpInnerWidgetBGColor(bgColorInput, customStyles['background-color'],  makeOnColorChangeFunction('background-color'));

        container.find('.inner-component-custom-style-dropdown').append(textColorOption).append(bgColorOption);
    };

    var showConfigOptions = function(droppedWidgetType, container) {
        // Hide edit button if label or panel or user
        if (droppedWidgetType=='label' || droppedWidgetType=='panel' || droppedWidgetType=='user') { //TODO
            container.find('.edit-btn').css('display', 'none');
        } else {
            container.find('.edit-btn').css('display', 'block');
        }

        var labelProperties = $('.default-properties').find('.'+droppedWidgetType+'-properties').clone();

        if (labelProperties.length==0) {
            return;
        }
        var configOptions = labelProperties.find('.config-btns');

        configOptions.children().each(function(idx, elt){
            var li = $('<li class="dropdown-submenu"></li>');
            li.append($(elt).children());
            (function(){
                var thisLi = li;
                li.find('.dropdown-toggle').click(function(e){
                    toggleOpenClose(e, thisLi);
                });
            })();

            li.find('.premade-style').click(function(e){
                e.stopPropagation();
            });


            container.find('.inner-component-premade-style-dropdown').append(li);
        });
        container.find('.inner-component-style-dropdown').append(configOptions);
    };

    that.setUpContainer = function(container, dragHandle, widget, associated, outermostWidget){
        var type = widget.type;
        container.append(dragHandle);
        if (associated){
            showConfigOptions(type, container);
            setUpColorOptions(container, widget, outermostWidget);
            setUpTextOptions(container, widget, outermostWidget);
        }
    };

    that.getWidgetIdFromContainerId = function(containerId){
        if (!containerId){
            return null
        }
        var split = containerId.split('_');
        if (split.length == 1){
            return null
        }
        return split[split.length - 1]
    };

    Object.freeze(that);
    return that;
};
