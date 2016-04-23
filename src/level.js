'use strict';

(function (client) {

    var level = function () {
        this.id = '';
        this.layout = '';
        this.width = 0;
        this.height = 0;
        this.tiles = {};
        // ...
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = level;
    }
    else {
        client.level = level;
    }
})(this);