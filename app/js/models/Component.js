/**
 * Main component
 * @returns {MainComponent}
 * @constructor
 */
Component = function(type, properties, dimensions, name, id, version, author) {

    var that = Object.create(Component.prototype);

    var meta = {
        name: name,
        id: id,
        version: version,
        author: author
    };

    var type = type;

    that.properties = {};
    that.dimensions = dimensions;
    that.components = {};
    that.addComponent = function(component, row, col) {
        if (row > that.dimensions.rows || col > that.dimensions.cols) {
            that.components[row][col]=component;
        }
    };

    that.getName = function() { return meta.name; };
    that.getName = function() { return meta.name; };
    that.getId = function() { return meta.id; };
    that.getId = function() { return meta.id; };
    that.getVersion = function() { return meta.version; };
    that.getVersion = function() { return meta.version; };
    that.getAuthor = function() { return meta.author; };
    that.getAuthor = function() { return meta.author; };
    that.getType = function() { return type; };
    that.getType = function() { return type; };
    that.getProperties = function() { return properties; };

    Object.freeze(that);

    return that;

};

