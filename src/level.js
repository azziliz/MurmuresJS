'use strict';

(function (client) {

    var level = function () { };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = level;
    }
    else {
        client.level = level;
    }

    level.prototype.id = '';
    level.prototype.layout = '';
    level.prototype.width = 0;
    level.prototype.height = 0;
    level.prototype.tileSize = 0;
    level.prototype.tiles = {};

})(this);