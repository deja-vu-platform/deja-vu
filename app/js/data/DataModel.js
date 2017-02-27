/**
 * Created by Shinjini on 9/26/2016.
 */
/** ** ** ** Constants ** ** ** **/
const DEFAULT_DATATYPE_NAME = "New Datatype";
/** ** ** ** ** ** ** ** ** ** **/

// TODO eventually freeze the object and only allow updates using the objects!

/**
 *
 * @param name
 * @param id
 * @param version
 * @param author
 * @returns {UserDatatype}
 * @constructor
 */

var UserDatatype = function(name, id, version, author){
    var that = Object.create(UserDatatype.prototype);

    that.objectType = "UserDatatype";
    that.type = "user";
    that.meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };

    that.bonds = {

    };

    that.properties = {
    };


    return that;
};

UserDatatype.fromString = function(string){
    var object = JSON.parse(string);
    return UserDatatype.fromObject(object)
};

UserDatatype.fromObject = function(object){
    // Check that the object has all the required fields
    var notCorrectObjectError = "notCorrectObjectError: object object is not an instance of a UserDatatype";
    if (!object.objectType){
        throw notCorrectObjectError;
    }
    if (!object.type){
        throw notCorrectObjectError;
    }
    if (!object.meta){
        throw notCorrectObjectError;
    }
    if (!object.innerWidgets){
        throw notCorrectObjectError;
    }
    if (!object.properties){
        throw notCorrectObjectError;
    }

    return $.extend(new UserDatatype(object.dimensions), object)
};

var UserDatatypeDisplay = function(){
    // this is a totally local object, the position, size, etc of any object
    // is for display for this particular user only

    var that = Object.create(UserDatatype.prototype);


    that.displayProperties = {
        // datatypeId : position, size
    };

    return that;
};