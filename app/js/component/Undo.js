/**
 * Created by Shinjini on 2/20/2017.
 */
/**
 * Created by Shinjini on 2/13/2017.
 */
var Undo = function(){
    var that = Object.create(Undo.prototype);

    var undoStack = [];
    var redoStack = [];

    var addToStack = function(widgetImage){
        undoStack.push(widgetImage);

        // a new action has been performed, so the previous redoable actions
        // cannot be done
        redoStack = [];
    };

    var undo = function(){
        // latest is the version you want to discard
        var latestVersion = undoStack.pop();
        redoStack.push(latestVersion);

        return UserWidget.fromString(JSON.stringify(undoStack[undoStack.length-1]));
    };

    var redo = function(){
        var latestUndid = redoStack.pop();
        undoStack.push(latestUndid);

        return UserWidget.fromString(JSON.stringify(latestUndid));
    };


    Object.freeze(that);
    return that;
};