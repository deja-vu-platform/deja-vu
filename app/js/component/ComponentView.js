var ComponentView = function(){
    var that = Object.create(ComponentView);

    var defaultDisplayClasses = {
        'label': "display-component",
        'link': "btn display-component",
        'tab-viewer': "nav display-component",
        'menu': "btn-group display-component",
        'image': "display-component",
        'panel': "panel display-component"
    };

    /**
     * display element in cell
     */
    that.getHTML = {
        'label': function(value) {
            if (!value){
                value = "Type text here...";
            }
            return '<div class="label-container"><p contenteditable="true" class="display-component">'+value+'</p></div>';
        },
        'link': function(value) {
            if (!value){
                return '<a class="btn btn-link display-component" href="#">Link</a>';
            }
            return '<a class="btn btn-link display-component" href="'+value.target+'">'+value.link_text+'</a>';
        },
        'tab-viewer': function(value) {
            if (!value){
                var html = '<ul class="nav nav-pills nav-stacked display-component">' +
                    '<li role="presentation" class="active"><a href="#" data-toggle="tab">Tab 1</a></li>' +
                    '<li role="presentation"><a href="#" data-toggle="tab">Tab 2</a></li>' +
                    '<li role="presentation"><a href="#" data-toggle="tab">Tab 3</a></li>' +
                    '</ul>';

                return html;
            }
            var html = '<ul class="nav nav-pills nav-stacked display-component">' +
                '<li role="presentation" class="active"><a href="#1a" data-toggle="tab">'+value.tab1.text+'</a></li>' +
                '<li role="presentation"><a href="#2a" data-toggle="tab">'+value.tab2.text+'</a></li>' +
                '<li role="presentation"><a href="#3a" data-toggle="tab">'+value.tab3.text+'</a></li>' +
                '</ul>'; //TODO: tab target
            return html;
        },
        'menu': function(value) {
            if (!value){
                var html = '<div class="btn-group display-component" role="group">' +
                    '<a type="button" class="btn btn-default" role="button" href="#">Item 1</a>' +
                    '<a type="button" class="btn btn-default" role="button" href="#">Item 2</a>' +
                    '<a type="button" class="btn btn-default" role="button" href="#">Item 3</a>' +
                    '</div>';
                return html;
            }
            var html = '<div class="btn-group display-component" role="group">' +
                '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item1.value+'">'+value.menu_item1.text+'</a>' +
                '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item2.value+'">'+value.menu_item2.text+'</a>' +
                '<a type="button" class="btn btn-default" role="button" href="'+value.menu_item3.value+'">'+value.menu_item3.text+'</a>' +
                '</div>';
            return html;
        },
        'image': function(value) {
            if (!value){
                return '<img class="display-component" src="images/image_icon.png" width="15px" height="15px">';
            }
            return '<img src="'+value.img_src+'" class="display-component">';
        },
        'panel': function(value) {
            if (!value){
                value = {heading: "Type heading...", content: "Type content..."};
            }
            return '<div class="panel panel-default display-component">'+
                '<div class="panel-heading">'+
                '<h3 contenteditable="true" class="panel-title">'+value.heading+'</h3>'+
                '</div><div contenteditable="true" class="panel-body">'+value.content+'</div></div>';
        }
    };

    that.getDimensions = function(type){
        if (type == 'label'){
            return {height: 40, width: 200}
        }else if (type == 'link'){
            return {height: 20, width: 100}
        } else {
            return {height: 200, width: 200}
        }
    };

    that.display = function(container, type, html, zoom, properties, callback) {
        var displayElement = $(html);
        container.prepend(displayElement);
        that.hideBaseComponentDisplayAt(container, type);
        that.updateBaseComponentDisplayAt(container, type, zoom, properties);
        that.showBaseComponentDisplayAt(container, type);
        if (callback) callback();
    };

    that.hideBaseComponentDisplayAt = function(container, type){
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


    that.showBaseComponentDisplayAt = function(container, type){
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
    that.updateBaseComponentDisplayAt = function(container, type, zoom, properties) {
        var containerHeight = container.height();
        var containerWidth = container.width();

        var displayComponent = container.find('.display-component');
        if (type === 'label'){
            displayComponent.parent().css({
                height: containerHeight + 'px',
                width: containerWidth + 'px',
            });
            displayComponent.css({
                zoom: zoom,
                background: 'white',
            });

        } else {
            if (type === 'image') {
                displayComponent.css({
                    'max-height': containerHeight/zoom + 'px',
                    'max-width': containerWidth/zoom + 'px',
                    height: 'auto',
                    width: 'auto',
                    'vertical-align':'top',
                    zoom: zoom,
                });
            } else {
                displayComponent.css({
                    zoom: zoom,
                });
            }

        }

        //// TODO SKETCHY!!!
        if (properties){
            if (Object.keys(properties).length>0){
                var classes = '';
                for (var propertyName in properties){
                    //displayComponent.addClass(properties[propertyName]);
                    if (propertyName == 'custom'){
                        continue;
                    }
                    classes = classes+' '+properties[propertyName];
                }
                classes.trim();

                displayComponent.removeClass();
                displayComponent.addClass(classes).addClass(defaultDisplayClasses[type]);
            }
            if (properties.custom){
                if (Object.keys(properties.custom).length>0){
                    for (var customProperty in properties.custom){
                        displayComponent.css(customProperty, properties.custom[customProperty]);
                    }

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

