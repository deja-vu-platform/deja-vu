var WidgetDisplay = function(){
    var that = Object.create(WidgetDisplay.prototype);

    var containerRef = widgetContainerMaker.getContainerRef();

    var defaultDisplayClasses = {
        'label': "display-component",
        'link': "btn display-component",
        'tab-viewer': "nav display-component",
        'menu': "btn-group display-component",
        'image': "display-component",
        'panel': "panel display-component"
    };

    var blankProperties = {
        'background-color': '',
        'color': '',
        'font-size': '',
        'font-weight': ''
        // TODO others
    };

    /**
     * display element in cell
     */
    that.getHTML = function(type){
        var defaultHTML = {
            'label': function (value) {
                if (!value) {
                    value = "Type text here...";
                }
                return '<div class="label-container"><p contenteditable="true" class="display-component">' + value + '</p></div>';
            },
            'link': function (value) {
                if (!value) {
                    return '<a class="btn btn-link display-component" href="#">Link</a>';
                }
                return '<a class="btn btn-link display-component" href="' + value.target + '">' + value.link_text + '</a>';
            },
            'tab-viewer': function (value) {
                if (!value) {
                    var html = '<ul class="nav nav-pills nav-stacked display-component">' +
                        '<li role="presentation" class="active"><a href="#" data-toggle="tab">Tab 1</a></li>' +
                        '<li role="presentation"><a href="#" data-toggle="tab">Tab 2</a></li>' +
                        '<li role="presentation"><a href="#" data-toggle="tab">Tab 3</a></li>' +
                        '</ul>';

                    return html;
                }
                var html = '<ul class="nav nav-pills nav-stacked display-component">' +
                    '<li role="presentation" class="active"><a href="#1a" data-toggle="tab">' + value.tab1.text + '</a></li>' +
                    '<li role="presentation"><a href="#2a" data-toggle="tab">' + value.tab2.text + '</a></li>' +
                    '<li role="presentation"><a href="#3a" data-toggle="tab">' + value.tab3.text + '</a></li>' +
                    '</ul>'; //TODO: tab target
                return html;
            },
            'menu': function (value) {
                if (!value) {
                    var html = '<div class="btn-group display-component" role="group">' +
                        '<a type="button" class="btn btn-default" role="button" href="#">Item 1</a>' +
                        '<a type="button" class="btn btn-default" role="button" href="#">Item 2</a>' +
                        '<a type="button" class="btn btn-default" role="button" href="#">Item 3</a>' +
                        '</div>';
                    return html;
                }
                var html = '<div class="btn-group display-component" role="group">' +
                    '<a type="button" class="btn btn-default" role="button" href="' + value.menu_item1.value + '">' + value.menu_item1.text + '</a>' +
                    '<a type="button" class="btn btn-default" role="button" href="' + value.menu_item2.value + '">' + value.menu_item2.text + '</a>' +
                    '<a type="button" class="btn btn-default" role="button" href="' + value.menu_item3.value + '">' + value.menu_item3.text + '</a>' +
                    '</div>';
                return html;
            },
            'image': function (value) {
                if (!value) {
                    return '<img class="display-component" src="images/image_icon.png" width="15px" height="15px">';
                }
                return '<img src="' + value.img_src + '" class="display-component">';
            },
            'panel': function (value) {
                if (!value) {
                    value = {heading: "Type heading...", content: "Type content..."};
                }
                return '<div class="panel panel-default display-component">' +
                    '<div class="panel-heading">' +
                    '<h3 contenteditable="true" class="panel-title">' + value.heading + '</h3>' +
                    '</div><div contenteditable="true" class="panel-body">' + value.content + '</div></div>';
            },
            'blank': function(){
                return '<div class="blank display-component"></div>';
            },
            'user': function(){
                return '<div class="blank display-component"></div>';
            }
        };
        return defaultHTML[type];
    };

    that.getDimensions = function(type){
        if (type == 'label'){
            return {height: 40, width: 200}
        }else if (type == 'link'){
            return {height: 36, width: 100}
        } else if (type == 'blank'){
            return {height: 300, width: 300}
        } else {
            return {height: 200, width: 200}
        }
    };

    var displayInnerWidget = function(container, type, html, zoom, properties, overallStyles, callback) {
        var displayElement = $(html);
        container.prepend(displayElement);
        that.hideBaseWidgetDisplayAt(container, type);
        that.updateBaseWidgetDisplayAt(container, type, zoom, properties, overallStyles);
        that.showBaseWidgetDisplayAt(container, type);
        if (callback) callback();
    };


    that.displayWidget = function(fresh, widget, container, overallStyles, zoom){
        // TODO this function needs to be cleaned up
        if (widget.type == 'user'){
            var width = widget.properties.dimensions.width * zoom;
            var height = widget.properties.dimensions.height * zoom;
            var styles = widget.properties.styles;

            container.css({
                width: width + 'px',
                height: height + 'px',
            });

            // make styles more specific
            overallStyles = JSON.parse(JSON.stringify(overallStyles));
            // for (var mainProperty in styles.main){
            //     overallStyles[mainProperty] = styles.main[mainProperty];
            // }
            for (var customStyle in styles.custom){
                overallStyles[customStyle] = styles.custom[customStyle];
            }

            // FIXME this appears twice
            container.css({
                'background-color':overallStyles['background-color'] || ''
            })

            widget.properties.layout.stackOrder.forEach(function(innerWidgetId){
                var innerWidget = widget.innerWidgets[innerWidgetId];
                var innerContainer = container.find('#'+containerRef+'_'+innerWidgetId);
                var top = widget.properties.layout[innerWidgetId].top * zoom;
                var left = widget.properties.layout[innerWidgetId].left * zoom;

                innerContainer.css({
                    top: top + 'px',
                    left: left + 'px',
                });

                that.displayWidget(fresh, innerWidget, innerContainer, overallStyles, zoom);
            });
        } else {
            var html;
            if (fresh){
                if (widget.type == 'label'){
                    container.find('.label-container').remove(); // FIXME this is going to do this a lot, unnecessarily!
                } else {
                    container.find('.display-component').remove(); // FIXME this is going to do this a lot, unnecessarily!
                }
                html = view.getHTML(widget.type)(widget.innerWidgets[widget.type]);
                var styles = widget.properties.styles;
                displayInnerWidget(container, widget.type, html, zoom, styles, overallStyles);
            } else if (container.length>0){
                var type = widget.type;
                view.hideBaseWidgetDisplayAt(container, type);

                var width = widget.properties.dimensions.width * zoom;
                var height = widget.properties.dimensions.height * zoom;

                var styles = widget.properties.styles;

                container.css({
                    width: width + 'px',
                    height: height + 'px',
                });

                view.updateBaseWidgetDisplayAt(container, type, zoom, styles, overallStyles);
                view.showBaseWidgetDisplayAt(container, type);

            }
        }
    };


    that.hideBaseWidgetDisplayAt = function(container, type){
        if (type === 'label'){
            container.find('.display-component').parent().css({
                display: 'none'
            });
        } else {
            container.find('.display-component').css({
                display: 'none'
            });
        }
    };


    that.showBaseWidgetDisplayAt = function(container, type){
        if (type === 'label'){
            container.find('.display-component').parent().css({
                display: 'block'
            });
        } else {
            container.find('.display-component').css({
                display: 'inline-block'
            });
        }
    };

    /**
     *
     * @param cellId
     * @param type
     * @param zoom
     */
    that.updateBaseWidgetDisplayAt = function(container, type, zoom, properties, overallStyles) {
        var containerHeight = container.height();
        var containerWidth = container.width();

        var displayWidget = container.find('.display-component');
        if (type === 'label'){
            displayWidget.parent().css({
                height: containerHeight + 'px',
                width: containerWidth + 'px',
            });
            displayWidget.css({
                zoom: zoom,
                background: 'white',
            });

        } else {
            if (type === 'image') {
                displayWidget.css({
                    'max-height': containerHeight/zoom + 'px',
                    'max-width': containerWidth/zoom + 'px',
                    height: 'auto',
                    width: 'auto',
                    'vertical-align':'top',
                    zoom: zoom,
                });
            } else if (type === 'blank') {
                displayWidget.css({
                    width: '100%',
                    height: '100%',
                    zoom: zoom,
                });
            } else {
                displayWidget.css({
                    zoom: zoom,
                });
            }

        }

        applyStyles(properties, overallStyles, container, displayWidget, type);

    };

    var applyStyles = function(properties, overallStyles, container, displayWidget, type){
        //// TODO SKETCHY!!!
        if (properties){
            if (overallStyles){

                // Reset old overall styles
                container.css({
                    'background-color': '#FFFFFF',
                });


                // TODO finish resetting other styles
                displayWidget.css(blankProperties);

                container.css({
                    'background-color':overallStyles['background-color'] || ''
                });

                for (var customProperty in overallStyles){
                    displayWidget.css(customProperty, overallStyles[customProperty]);
                }
            }
            if (Object.keys(properties.bsClasses).length>0){ // bootstrap classes
                var classes = '';
                for (var propertyName in properties.bsClasses){
                    classes = classes+' '+properties.bsClasses[propertyName];
                }
                classes.trim();
                displayWidget.removeClass();
                displayWidget.addClass(classes).addClass(defaultDisplayClasses[type]); // TODO what's going on here?
            }
            if (Object.keys(properties.custom).length>0){//TODO make succinct
                if (properties.custom['background-color']){
                    container.css({
                        'background-color':properties.custom['background-color']
                    })
                }
                for (var customProperty in properties.custom){//TODO make succinct
                    displayWidget.css(customProperty, properties.custom[customProperty]);
                }

            }
        }
    };

    /**
     * Removes just the display part of the component. Useful for removing the old image
     * on upload
     * @param cellId
     * @param callback
     * @constructor
     */
    that.removeDisplay = function(container, callback) {
        container.find('.label-container').remove();
        container.find('.display-component').remove();
        if (callback) callback();
    };

    return that;
};

