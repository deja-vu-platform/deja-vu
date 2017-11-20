var fs = require('fs');
var path = require('path');


var Utility = function(){

    // special characters not allowed in inputs
    //var regex = /[`~!@#$%^&*()|+=?;:'",.<>\{\}\[\]\\\/]/gi;
    var regex = /[^\w\s\-]/gi;

    var that = Object.create(Utility.prototype);

    // TODO get path emitted by main
    that.projectsSavePath = path.join(__dirname, 'projects');


    // from http://stackoverflow.com/questions/8813051/determine-which-element-the-mouse-pointer-is-on-top-of-in-javascript
    that.allElementsFromPoint = function(x, y) {
        var element, elements = [];
        var oldVisibility = [];
        while (true) {
            element = document.elementFromPoint(x, y);
            if (!element || element === document.documentElement) {
                break;
            }
            elements.push(element);
            oldVisibility.push(element.style.visibility);
            element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
        }
        for (var k = 0; k < elements.length; k++) {
            elements[k].style.visibility = oldVisibility[k];
        }
        elements.reverse();
        return elements;
    };

    /**
     * Saves the file and the sets a timer to save the file every 5 minutes
     */
    that.autoSave5Mins = function(){ // every 5 minutes
        console.log('saving!');
        // update the session stored project too
        window.sessionStorage.setItem('selectedProject', JSON.stringify(selectedProject));
        that.saveProject(selectedProject);
        setTimeout(function(){
            autoSave5Mins();
        }, 300000);
    };

    var saveObjectToFile = function(dirname, filename, object){
        // Asynch
        var pathName = path.join(dirname, filename);
        fs.writeFile(pathName, JSON.stringify(object),function(err){
            if(err) return console.log(err);
            return true;
        });
    };

    that.saveProject = function(project){
        saveObjectToFile(that.projectsSavePath, that.projectNameToFilename(project.meta.name), project);
    };

    that.filenameToProjectName = function(filename){
        return filename.split('.').slice(0, -1).join('.')
    };


    that.projectNameToFilename = function(projectName){
        return projectName+'.json';
    };

    that.generateId = function(){
        // use the full number!
        return  Math.floor(Math.random()*1000*1000*1000*1000*1000);
    };


    var checkStringForSpecialChars = function(string){
        // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
        var matches = regex.test(string);
        // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
        regex.lastIndex= 0;
        return matches;
    };

    that.sanitizeStringOfSpecialChars = function(string){
        // from http://stackoverflow.com/questions/4374822/javascript-regexp-remove-all-special-characters
        // edited to include _ and -
        var outString = string.replace(regex, '');
        // some javascript bs http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
        regex.lastIndex= 0;
        return outString;
    };

    var downloadObject = function(filename, obj) {
        var element = document.createElement('a');
        var data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

        element.setAttribute('href', data);
        element.setAttribute('download', filename);

        element.click();
    };

    that.isCopyOfFile = function(dirname, filename){
        var pathName = path.join(dirname, filename);
        try {
            var stats = fs.statSync(pathName);
            return true;
        }
        catch (err) {
            return false;
        }
    };


    Object.freeze(that);
    return that;
};