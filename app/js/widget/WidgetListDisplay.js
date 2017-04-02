/**
 * Created by Shinjini on 3/27/2017.
 */

var WidgetListDisplay = function(){
    var that = Object.create(WidgetListDisplay.prototype);

    var createListElt = function(widgetId, widgetName, clicheId, hasChildren, isDraggable, isDeletable, isPage){
        var dropdownId = widgetId+'_children';
        var dropdownHtmlStart = '';
        var dropdownHtmlEnd = '';
        var childrenUl = '<ul class="inner-widgets"></ul>';
        if (hasChildren){
            dropdownHtmlStart =
                '<span class="dropdown-trigger dropdown-open" data-dropdownid="'+ dropdownId +'">'
                +       '<span class="glyphicon glyphicon-triangle-bottom"></span>';
            dropdownHtmlEnd = '</span>';
            childrenUl = '<div class="content dropdown-target"  data-dropdownid="'+dropdownId+'">'
                +   childrenUl
                +   '</div>';
        }

        var deleteBtnContainer = '';
        if (isDeletable){
            deleteBtnContainer = '<div class="delete-button-container"></div>';
        }

        var indexToggleElt = '';
        if (isPage){
            indexToggleElt = '<div class="index-page-toggle"></div>';
        }



        var elt = $(
            '<li data-type="'+'user'+'" class="widget" data-componentid="' + widgetId + '" data-clicheid=' + clicheId + '>'
            +   dropdownHtmlStart
            +       '<div class="component-name-container">'
            +           '<span class="component-name">' + widgetName + '</span>'
            +           '<div class="submit-rename not-displayed">'
            +               '<input type="text" class="new-name-input form-control" autofocus>'
            +           '</div>'
            +           indexToggleElt
            +       '</div>'
            +    dropdownHtmlEnd
            +    deleteBtnContainer
            +    childrenUl
            + '</li>');

        if (!isDraggable){
            elt.addClass('not-draggable')
        }
        if (hasChildren){
            elt.addClass('dropdown-encapsulator')
        }
        return elt;
    };


    var recursivelyLoadWidgetIntoList = function(widget, clicheId, listElt){

        // keeps the structure instead of linearizing so it can have a folding structure
        var recursiveListMakerHelper = function(innerWidgetList, parentElt){
            innerWidgetList.forEach(function(parentAndChildren){
                var parentId = parentAndChildren[0];
                var children = parentAndChildren[1];
                var widgetInfo = widget.getInnerWidget(parentId).meta;

                var hasChildren = (children.length>0);
                var elt = createListElt(widgetInfo.id, widgetInfo.name, clicheId, hasChildren, false, false, false);

                if (hasChildren) {
                    var ul = elt.find('.inner-widgets');
                    recursiveListMakerHelper(children, ul);
                }
                parentElt.append(elt);
            });
        };
        if (widget.type == 'user'){
            var innerWidgetsInfoList = widget.getAllInnerWidgetsIds(true);
            recursiveListMakerHelper(innerWidgetsInfoList, listElt.find('.inner-widgets'));
        }
        enableDropdownTrigger();
    };

    that.loadClicheIntoWidgetList = function(cliche, widgetToLoadId){
        var usedWidgetsIds = cliche.getAllUsedWidgetIds();
        var userAppId = userApp.meta.id;
        var clicheId = cliche.meta.id;
        if (clicheId == userAppId){
            userApp.getAllOuterWidgetIds().forEach(function(widgetId){
                var widget;
                if (widgetId in userApp.widgets.pages){
                    widget = userApp.widgets.pages[widgetId];
                    displayNewWidgetInMainPagesList(widget, clicheId);
                } else if (widgetId in userApp.widgets.unused){
                    widget = userApp.widgets.unused[widgetId];
                    displayUnusedWidgetInList(widget, clicheId);
                } else if (widgetId in userApp.widgets.templates) {
                    widget = userApp.widgets.templates[widgetId];
                    displayNewWidgetTemplateInList(widget, clicheId);
                }
            });
            if (widgetToLoadId){
                that.select(widgetToLoadId);
            }
            usedWidgetsIds.forEach(function(id){
                var widget = cliche.getWidget(id);
                if (widget.type == 'user'){
                    displayUsedWidgetInList(widget, clicheId);
                }
            });

        } else {
            // TODO
        }
    };

    /**
     * Adds a component to the list of user components
     * @param newComponent
     */
    var displayUnusedWidgetInList = function(widget, clicheId){
        var name = widget.meta.name;
        var id = widget.meta.id;

        var hasChildren = !$.isEmptyObject(widget.innerWidgets);
        var newWidgetElt = createListElt(id, name, clicheId, hasChildren, true, true, false);

        $('#user-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
        recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
    };

    var displayUsedWidgetInList = function(widget, clicheId){
        var name = widget.meta.name;
        var id = widget.meta.id;

        var hasChildren = !$.isEmptyObject(widget.innerWidgets);
        var newWidgetElt = createListElt(id, name, clicheId, hasChildren, false, true, false);

        $('#user-used-components-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
    };


    /**
     * Adds a component to the list of main pages
     * @param newComponent
     */
    var displayNewWidgetInMainPagesList = function(widget, clicheId){
        var name = widget.meta.name;
        var id = widget.meta.id;

        var hasChildren = !$.isEmptyObject(widget.innerWidgets);
        var newWidgetElt = createListElt(id, name, clicheId, hasChildren, false, true, true);


        $('#main-pages-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
    };

    var displayNewWidgetTemplateInList = function(widget, clicheId){
        var name = widget.meta.name;
        var id = widget.meta.id;

        var hasChildren = !$.isEmptyObject(widget.innerWidgets);
        var newWidgetElt = createListElt(id, name, clicheId, hasChildren, true, true, false);

        $('#widget-templates-list').append(newWidgetElt);
        addDeleteUserWidgetButton(id, newWidgetElt);
        dragAndDrop.registerWidgetDragHandleDraggable(newWidgetElt);
        recursivelyLoadWidgetIntoList(widget, clicheId, newWidgetElt);
    };

    that.select = function(id){
        $('.selected').removeClass("selected");
        $("[data-componentid='" + id + "']").addClass('selected');
    };

    that.refresh = function(){
        $('.widget-list').html("");
        that.loadClicheIntoWidgetList(userApp, selectedUserWidget.meta.id);
    };

    that.updateDraggables = function(selectedWidget){
        // first enable all draggables
        $('.widget').each(function(idx, elt){
            elt = $(elt);
            if (elt.data('uiDraggable')){
                elt.draggable('enable');
            }
        });
        // then disable the relevant ones
        userApp.getAllOuterWidgetIds().forEach(function(widgetId){
            var widget = userApp.getWidget(widgetId);
            var path = widget.getPath(selectedWidget.meta.id);
            path.forEach(function(pathWidgetId){ // note this includes the selectedWidgetId
                var dragHandle = $('.components').find('[data-componentid='+pathWidgetId+']');
                if (dragHandle.data('uiDraggable')){
                    dragHandle.draggable('disable');
                }
            });
        });
    };

    Object.freeze(that);
    return that;
};