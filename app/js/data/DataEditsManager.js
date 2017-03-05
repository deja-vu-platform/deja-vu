/**
 * Created by Shinjini on 2/2/2017.
 */


var DataEditsManager = function(){
    var that = Object.create(DataEditsManager.prototype);


    // that.getPath = function(outermostWidget, widgetId){
    //     var wantedPath;
    //     var getPathHelper = function(widget, path, targetId){
    //         if (widget.meta){
    //             var widgetId = widget.meta.id;
    //             path.push(widgetId);
    //             if (widgetId == targetId){
    //                 wantedPath = path;
    //             } else {
    //                 for (var id in widget.innerWidgets){
    //                     getPathHelper(widget.innerWidgets[id], JSON.parse(JSON.stringify(path)), targetId);
    //                 }
    //             }
    //         }
    //     };
    //     getPathHelper(outermostWidget, [], widgetId);
    //     return wantedPath;
    // };
    //
    // var getOrCreateCustomProperty = function(outermostWidget, targetId){
    //     var path = that.getPath(outermostWidget, targetId);
    //
    //     var currPath = outermostWidget.properties;
    //     path.forEach(function(pathVal, idx){
    //         if (idx != 0){
    //             if (!currPath.children[pathVal]){
    //                 currPath.children[pathVal] = {children:{}};
    //             }
    //             currPath = currPath.children[pathVal];
    //         }
    //
    //     });
    //     return currPath;
    // };
    //
    //
    // // TODO make this general
    // // TODO make this robust
    // that.updateCustomProperties = function(outermostWidget, targetId, typeString, newProperties, forParent){
    //     if (forParent){
    //         var path = that.getPath(outermostWidget, targetId);
    //         targetId = path[path.length - 2];
    //     }
    //
    //
    //
    //     var createCustomPropertyOfType = function(outermostWidget, targetId, typeString){
    //         var types = typeString.split('.');
    //
    //         var changes = getOrCreateCustomProperty(outermostWidget, targetId);
    //         types.forEach(function(type){
    //             if (!changes[type]){
    //                 changes[type] = {};
    //             }
    //             changes = changes[type];
    //         });
    //         return changes;
    //     };
    //
    //     var widget = that.getInnerWidget(outermostWidget, targetId);
    //     var changes = createCustomPropertyOfType(outermostWidget, targetId, typeString);
    //
    //     if (typeString == 'styles.custom'){
    //         for (var property in newProperties){
    //             changes[property] = newProperties[property];
    //             widget.properties.styles.custom[property] = newProperties[property];
    //         }
    //     } else if (typeString == "stackOrder"){
    //         // changes = newProperties;
    //         // widget.properties.layout.stackOrder = newProperties;
    //     } else if (typeString == 'value'){
    //         for (var property in newProperties){
    //             changes[property] = newProperties[property];
    //         }
    //         widget.innerWidgets[newProperties.type] = newProperties.value;
    //     } else {
    //         // TODO is this right??
    //         // FIXME problem with dot notation
    //         for (var property in newProperties){
    //             changes[property] = newProperties[property];
    //             // this might have problems with dot notation
    //             widget.properties[typeString][property] = newProperties[property];
    //         }
    //     }
    // };
    //
    //
    // that.getCustomProperty = function(outermostWidget, targetId){
    //     var path = that.getPath(outermostWidget, targetId);
    //
    //     var currPath = outermostWidget.properties;
    //     var noProperty = false;
    //     path.forEach(function(pathVal, idx){
    //         if (!noProperty){
    //             if (idx != 0){
    //                 if (!currPath.children[pathVal]){
    //                     noProperty = true;
    //                     currPath = {};
    //                 } else {
    //                     currPath = currPath.children[pathVal];
    //                 }
    //             }
    //         }
    //     });
    //
    //     return currPath;
    //
    // };
    //
    //
    //
    // // property name can be of the form "asdas.asda" like "layout.stackOrder"
    // // TODO Make more robust
    // that.clearCustomProperties = function(outermostWidget, targetId, propertyName){
    //     var path = that.getPath(outermostWidget, targetId);
    //
    //     var customProperties = that.getCustomProperty(outermostWidget, targetId);
    //     var widget = that.getInnerWidget(outermostWidget, path[path.length-1]);
    //     if (!propertyName){
    //         for (var property in customProperties){
    //             delete customProperties[property];
    //             delete widget.properties[property];
    //         }
    //     } else {
    //         if (customProperties[propertyName]){
    //             // TODO fix for dot notation
    //             delete customProperties[propertyName];
    //         }
    //         if (propertyName == 'styles.custom'){
    //             if (customProperties.styles){
    //                 delete customProperties.styles.custom;
    //             }
    //             widget.properties.styles.custom = {};
    //             widget.properties.styles.bsClasses = {};
    //         } else if (propertyName == 'layout'){
    //             widget.properties.layout = {stackOrder:[]};
    //         } else {
    //             widget.properties[propertyName] = {};
    //         }
    //     }
    //     that.applyPropertyChangesAtAllLevelsBelow(outermostWidget);
    // };
    //
    //
    //
    // that.getInnerWidget = function(outermostWidget, targetId, forParent){
    //     if (forParent){
    //         var path = dataEditsManager.getPath(outermostWidget, targetId);
    //         targetId = path[path.length-2];
    //     }
    //     var wantedWidget;
    //     var getInnerWidgetHelper = function(widget, targetId){
    //         if (widget.meta){
    //             var widgetId = widget.meta.id;
    //             if (widgetId == targetId){
    //                 wantedWidget = widget;
    //             } else {
    //                 for (var id in widget.innerWidgets){
    //                     getInnerWidgetHelper(widget.innerWidgets[id], targetId);
    //                 }
    //             }
    //
    //         }
    //     };
    //     getInnerWidgetHelper(outermostWidget, targetId);
    //     return wantedWidget;
    // };
    //
    // that.getMostRelevantOverallCustomChanges = function(outermostWidget, targetId){
    //     // if path is just the outer widget's id, will just return outerWidget.properties
    //     var change = JSON.parse(JSON.stringify(outermostWidget.properties.styles.custom));
    //     var outerWidget = outermostWidget;
    //     var path = that.getPath(outermostWidget, targetId);
    //
    //     // else go down and find the correct one
    //     for (var pathValueIdx = 1; pathValueIdx<path.length; pathValueIdx++){
    //         if (outerWidget.innerWidgets[path[pathValueIdx]]){
    //             outerWidget = outerWidget.innerWidgets[path[pathValueIdx]];
    //             // moving down so that the inner styles override the outer styles
    //             if (!$.isEmptyObject(outerWidget.properties.styles.custom)){
    //                 for (var style in outerWidget.properties.styles.custom){
    //                     change[style] = outerWidget.properties.styles.custom[style];
    //                 }
    //             }
    //         } else {
    //             break;
    //         }
    //     }
    //     return change;
    // };
    //
    // that.applyPropertyChangesAtAllLevelsBelow = function(outermostWidget){
    //     var recursiveApplyPropertyChangesHelper = function(widget){
    //         if (widget.type == 'user') {
    //
    //             var templateId = widget.meta.templateId;
    //             if (!templateId){ // it is an outermost widget!
    //                 templateId = widget.meta.id;
    //             }
    //             var projectCopy =  UserDatatype.fromString(
    //                 JSON.stringify(selectedProject.cliches[templateId])
    //             );
    //
    //             widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
    //                 var innerWidget = widget.innerWidgets[innerWidgetId];
    //                 recursiveApplyPropertyChangesHelper(innerWidget);
    //             });
    //
    //             // apply changes after calling the recursion so that higher levels override
    //             // lower level changes
    //             applyPropertyChanges(widget, projectCopy);
    //         } else {
    //             // else it's a base component, so we'll just take it as is from the component we are reading from
    //             applyPropertyChanges(widget);
    //         }
    //         return widget
    //     };
    //
    //     recursiveApplyPropertyChangesHelper(outermostWidget);
    //
    // };
    //
    // /**
    //  * Gets the changes made at the level of the outer widget and
    //  * puts them in the properties of the involved inner widget
    //  * saved in the outer widget. NOTE: this does not reference the
    //  * templates from the project! Use this before re-id-ing the cliches
    //  * or use the source widget as the id reference
    //  * @param outerWidget
    //  * @param sourceWidget
    //  */
    // var applyPropertyChanges = function(outerWidget, sourceWidget){
    //     var getPropertyChanges = function(outerWidget, path){
    //         // get the changes at this level
    //
    //         // if path is just the outer widget's id, will just return outerWidget.properties
    //         var change = outerWidget.properties;
    //
    //         // else go down and find the correct one
    //         for (var pathValueIdx = 1; pathValueIdx<path.length; pathValueIdx++){
    //             if (change.children){
    //                 if (change.children[path[pathValueIdx]]){
    //                     change = change.children[path[pathValueIdx]]
    //                 } else {
    //                     change = {};
    //                     break;
    //                 }
    //             } else {
    //                 change = {};
    //                 break;
    //             }
    //         }
    //         return change;
    //     };
    //
    //
    //
    //     var insertPropertiesIntoWidget = function(widget, properties){
    //         // if there is a change, override the old one
    //         if (properties.styles){
    //             if (properties.styles.custom){
    //                 var customStyles = properties.styles.custom;
    //                 for (var style in customStyles) {
    //                     widget.properties.styles.custom[style] = customStyles[style];
    //                 }
    //             }
    //             if (properties.styles.bsClasses){
    //                 var bsClasses = properties.styles.bsClasses;
    //                 for (var bsClass in customStyles) {
    //                     widget.properties.styles.bsClasses[bsClass] = bsClasses[bsClass];
    //                 }
    //             }
    //         }
    //
    //         if (properties.dimensions) {
    //             widget.properties.dimensions = properties.dimensions;
    //         }
    //
    //         if (properties.layout) {
    //             // TODO this has problems because the IDs CHANGE!
    //             // if (!$.isEmptyObject(properties.stackOrder)) {
    //             //     widget.properties.layout.stackOrder = properties.layout.stackOrder;
    //             // }
    //             // FIXME this will cause unnecessary weird id stuff :(
    //             for (var id in properties.layout){
    //                 if (id != 'stackOrder'){
    //                     widget.properties.layout[id] = properties.layout[id];
    //                 }
    //             }
    //         }
    //
    //         if (properties.value){
    //             widget.innerWidgets[properties.value.type] = properties.value.value;
    //         }
    //
    //     };
    //
    //     var path = [];
    //
    //     if (!sourceWidget){ // if this is a new added component?
    //         sourceWidget = outerWidget;
    //     }
    //
    //
    //     var applyPropertyChangesHelper = function(innerWidget, sourceWidget, correspondingSourceInnerWidget){
    //
    //         if (!sourceWidget){
    //             console.log('something went wrong in applyPropertyChangesHelper()');
    //             console.log(innerWidget);
    //             console.log(that.getPath(selectedUserWidget, innerWidget.meta.id));
    //         }
    //
    //         path.push(correspondingSourceInnerWidget.meta.id);
    //
    //         // get changed properties
    //         var properties = getPropertyChanges(sourceWidget, path);
    //
    //         insertPropertiesIntoWidget(innerWidget, properties);
    //
    //         if (innerWidget.type == 'user'){
    //             // then recurse down
    //             innerWidget.properties.layout.stackOrder.forEach(function (innerInnerWidgetId, idx) {
    //                 var innerInnerWidget = innerWidget.innerWidgets[innerInnerWidgetId];
    //                 // var innerInnerSourceWidgetId = innerWidget.idMap[innerInnerWidgetId];
    //                 var innerInnerSourceWidgetId = correspondingSourceInnerWidget.properties.layout.stackOrder[idx];
    //                 var innerInnerSourceWidget = correspondingSourceInnerWidget.innerWidgets[innerInnerSourceWidgetId];
    //                 if (!innerInnerWidget){
    //                     console.log(innerWidget, sourceWidget);
    //                 }
    //                 if (!innerInnerSourceWidget){
    //                     console.log(innerWidget, sourceWidget);
    //                     innerInnerSourceWidget = innerInnerWidget;
    //                 }
    //                 applyPropertyChangesHelper(innerInnerWidget, sourceWidget, innerInnerSourceWidget);
    //             });
    //         }
    //         path.pop();
    //     };
    //     applyPropertyChangesHelper(outerWidget, sourceWidget, sourceWidget);
    //
    // };
    //
    //
    // /**
    //  * Goes down each level recursively.
    //  * As it goes up, it reads from the source code (Project) to override changes
    //  * @param outerWidget
    //  */
    // var recursiveWidgetMaking = function(outerWidget){
    //     var oldCopy = UserDatatype.fromString(JSON.stringify(outerWidget));
    //
    //     // NOTE: the returned widget does not have its IDs correct, the ids are currently the same
    //     // the template code it reads.
    //     var recursiveWidgetMakingHelper = function(widget){
    //         if (widget.type == 'user') {
    //             widget.properties.layout.stackOrder.forEach(function (innerWidgetId) {
    //                 var innerWidget = widget.innerWidgets[innerWidgetId];
    //                 if (innerWidget.type == 'user') {
    //
    //                     // save the templateId here since the projectCopy does not have
    //                     // any idea of a template id
    //                     var templateId = innerWidget.meta.templateId;
    //
    //                     // make a copy of the project
    //                     // NOTE: applying property changes requires that the widget's ids are
    //                     // the same as the project we are copying from since the project stores
    //                     // the information using the ids.
    //                     // We will be changing the ids altogether later on.
    //                     innerWidget =  UserDatatype.fromString(
    //                         JSON.stringify(selectedProject.cliches[templateId])
    //                     );
    //
    //                     innerWidget.meta.templateId = templateId;
    //
    //                     innerWidget = recursiveWidgetMakingHelper(innerWidget);
    //
    //                     widget.innerWidgets[innerWidgetId] = innerWidget;
    //                 }
    //
    //                 // apply changes after calling the recursion so that higher levels override
    //                 // lower level changes
    //                 // applyPropertyChanges(innerWidget);
    //             });
    //         } else {
    //             // else it's a base component, so we'll just take it as is from the component we are reading from
    //         }
    //         return widget
    //     };
    //
    //     var recursiveWidget = recursiveWidgetMakingHelper(outerWidget);
    //     recursiveReIding(recursiveWidget, oldCopy);
    //     // do this after fixing ids, because at the top level the correct ids are used to store changes
    //     that.applyPropertyChangesAtAllLevelsBelow(recursiveWidget);
    //
    //     return recursiveWidget;
    // };



    that.refreshFromProject = function(outerWidget){
        var recursiveWidget = recursiveWidgetMaking(outerWidget);

        return recursiveWidget
    };







    Object.freeze(that);
    return that;
};