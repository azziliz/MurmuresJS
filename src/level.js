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

    level.prototype.fromJson = function (src) {
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tileSize = src.tileSize;
        this.tiles = src.tiles;
    };

})(this);