/**
 * Created by Shinjini on 2/2/2017.
 */


var WidgetEditsManager = function(){
    var that = Object.create(WidgetEditsManager.prototype);

    // TODO make this general
    // TODO make this robust
    that.updateCustomProperties = function(outermostWidget, targetId, typeString, newProperties, forParent){
        var path = outermostWidget.getPath(targetId);
        if (forParent){
            targetId = path[path.length - 2];
        }

        var targetWidget = userApp.getWidget(targetId);
        targetWidget.overrideProperties = {};
        if (typeString == 'styles.custom'){
            if (!targetWidget.overrideProperties.styles){
                targetWidget.overrideProperties.styles = {};
            }
            if (!targetWidget.overrideProperties.styles.custom){
                targetWidget.overrideProperties.styles.custom = {};
            }
            for (var property in newProperties){
                targetWidget.overrideProperties.styles.custom[property] = newProperties[property];
            }
        } else if (typeString == 'value'){
            targetWidget.innerWidgets[newProperties.type] = newProperties.value;
        } else {
            // TODO is this right??
            // FIXME problem with dot notation
            for (var property in newProperties){
                if (!targetWidget.overrideProperties[typeString]){
                    targetWidget.overrideProperties[typeString] = {};
                }
                targetWidget.overrideProperties[typeString][property] = newProperties[property];
            }
        }

        that.refreshPropertyValues(outermostWidget);
    };



    // property name can be of the form "asdas.asda" like "layout.stackOrder"
    // TODO Make more robust
    that.clearCustomProperties = function(targetId, propertyName){
        var outermostWidget = userApp.getWidget(userApp.findUsedWidget(targetId)[1]);
        var targetWidget = userApp.getWidget(targetId);

        var customProperties = targetWidget.overrideProperties ||{};//that.getCustomProperty(outermostWidget, targetId);
        if (!propertyName){
            for (var property in customProperties){
                delete customProperties[property];
                delete targetWidget.properties[property];
            }
        } else {
            if (customProperties[propertyName]){
                // TODO fix for dot notation
                delete customProperties[propertyName];
            }
            if (propertyName == 'styles.custom'){
                if (customProperties.styles){
                    delete customProperties.styles.custom;
                }
                targetWidget.properties.styles.custom = {};
                targetWidget.properties.styles.bsClasses = {};
            } else if (propertyName == 'layout'){
                targetWidget.properties.layout = {stackOrder:[]};
            } else {
                targetWidget.properties[propertyName] = {};
            }
        }
        that.refreshPropertyValues(outermostWidget);
    };



    that.getMostRelevantOverallCustomChanges = function(outermostWidget, targetId){
        // if path is just the outer widget's id, will just return outerWidget.properties
        var change = {};
        var updateChange = function(widget){
            if (widget.overrideProperties) {
                if (widget.overrideProperties.styles) {
                    if (widget.overrideProperties.styles.custom) {
                        for (var style in widget.overrideProperties.styles.custom) {
                            change[style] = widget.overrideProperties.styles.custom[style];
                        }
                    }
                }
            }
        };
        var outerWidget = outermostWidget;
        var path = outermostWidget.getPath(targetId);

        // else go down and find the correct one
        for (var pathValueIdx = 0; pathValueIdx<path.length; pathValueIdx++){
            outerWidget = outermostWidget.getInnerWidget(path[pathValueIdx]);
            // moving down so that the inner styles override the outer styles
            updateChange(outerWidget);
        }
        return change;
    };

    var isFromTemplate = function(widget){
        var fromTemplate = true;
        var templateClicheId;
        var templateWidgetId;

        var templateIds = widget.meta.templateId;
        if (templateIds){
            var clicheAndWidgetId = getClicheAndWidgetIdFromTemplateId(templateIds);
            templateClicheId = clicheAndWidgetId.clicheId;
            templateWidgetId = clicheAndWidgetId.widgetId;

            if (templateClicheId == userApp.meta.id){
                // might not be there, at which point need to just continue
                if (!(templateWidgetId in userApp.widgets.templates)){
                    fromTemplate = false;
                }
            }
        } else {
            fromTemplate = false
        }
        return {fromTemplate: fromTemplate, clicheId:templateClicheId, widgetId: templateWidgetId};
    };

    /**
     * Goes down each level recursively.
     * As it goes up, it reads from the source code (Project) to override changes
     * @param outermostWidget
     */
    var applyPropertyChangesAtAllLevelsBelow = function(outermostWidget){
        var recursiveApplyPropertyChangesHelper = function(widgetToModify){
            if (widgetToModify.type == 'user') {
                var templateVersionCopy;
                var templateInfo = isFromTemplate(widgetToModify);
                if (templateInfo.fromTemplate){
                    templateVersionCopy =  UserWidget.fromString(
                        JSON.stringify(selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId])
                    );
                } else {
                    templateVersionCopy = widgetToModify;
                }

                widgetToModify.properties.layout.stackOrder.forEach(function (innerWidgetId) {
                    var innerWidget = widgetToModify.innerWidgets[innerWidgetId];
                    recursiveApplyPropertyChangesHelper(innerWidget);
                });

                // apply changes after calling the recursion so that higher levels override
                // lower level changes
                applyPropertyChanges(widgetToModify, templateVersionCopy);
            } else {
                // else it's a base component, so we'll just take it as is from the component we are reading from
                applyPropertyChanges(widgetToModify);
            }
            return widgetToModify
        };

        recursiveApplyPropertyChangesHelper(outermostWidget);

    };

    /**
     * Gets the changes made at the level of the outer widget and
     * puts them in the properties of the involved inner widget
     * saved in the outer widget. NOTE: this does not reference the
     * templates from the project! Use this before re-id-ing the cliches
     * or use the source widget as the id reference
     * @param outerWidget
     * @param sourceWidget
     */
    var applyPropertyChanges = function(outerWidget, sourceWidget){

        var insertPropertiesIntoWidget = function(widget, overrideProperties){
            // if there is a change, override the old one
            if (overrideProperties){
                if (overrideProperties.styles){
                    if (overrideProperties.styles.custom){
                        var customStyles = overrideProperties.styles.custom;
                        for (var style in customStyles) {
                            widget.properties.styles.custom[style] = customStyles[style];
                        }
                    }
                    if (overrideProperties.styles.bsClasses){
                        var bsClasses = overrideProperties.styles.bsClasses;
                        for (var bsClass in customStyles) {
                            widget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
                        }
                    }
                }

                if (overrideProperties.dimensions) {
                    widget.properties.dimensions = overrideProperties.dimensions;
                }

                if (overrideProperties.value){
                    widget.innerWidgets[overrideProperties.value.type] = overrideProperties.value.value;
                }
                if (overrideProperties.name){
                    widget.meta.name = overrideProperties.name;
                }

            }

        };

        var applyPropertyChangesHelper = function(innerWidget, correspondingSourceInnerWidget){

            path.push(correspondingSourceInnerWidget.meta.id);

            // get source properties

            var sourceProperties = correspondingSourceInnerWidget.overrideProperties; //getPropertyChanges(sourceWidget, path);
            insertPropertiesIntoWidget(innerWidget, sourceProperties);

            // get changed properties
            var properties = innerWidget.overrideProperties; //getPropertyChanges(sourceWidget, path);
            insertPropertiesIntoWidget(innerWidget, properties);

            if (innerWidget.type == 'user'){
                // then recurse down
                innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId, idx) {
                    var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
                    var innerInnerSourceWidgetId = correspondingSourceInnerWidget.properties.layout.stackOrder[idx];
                    var innerInnerSourceWidget = correspondingSourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
                    applyPropertyChangesHelper(innerInnerWidget, innerInnerSourceWidget);
                });
            }
            path.pop();
        };

        var path = [];

        if (!sourceWidget){ // if this is a new added component?
            sourceWidget = outerWidget;
        }

        // apply the properties to all lower levels
        applyPropertyChangesHelper(outerWidget, sourceWidget);

    };

    var getClicheAndWidgetIdFromTemplateId = function(templateId){
        var clicheAndWidgetId = templateId.split('_');
        var clicheId = clicheAndWidgetId[clicheAndWidgetId.length - 2];
        var widgetId = clicheAndWidgetId[clicheAndWidgetId.length - 1];
        return {clicheId:clicheId,widgetId:widgetId}
    };

    var resetStyleValues = function(outerWidget){
        var templateInfo = isFromTemplate(outerWidget);
        if (templateInfo.fromTemplate){
            var templateVersion =  selectedProject.cliches[templateInfo.clicheId].widgets.templates[templateInfo.widgetId];
            outerWidget.properties.styles = JSON.parse(JSON.stringify(templateVersion.properties.styles));
        }
        outerWidget.properties.layout.stackOrder.forEach(function(id){
            resetStyleValues(outerWidget.innerWidgets[id]);
        });
    };

    that.refreshPropertyValues = function(outerWidget){
        resetStyleValues(outerWidget);
        applyPropertyChangesAtAllLevelsBelow(outerWidget);

        return outerWidget
    };







    Object.freeze(that);
    return that;
};