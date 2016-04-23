'use strict';

(function (client) {

    var character = function () {
        this.position = null;
        this.hitPoints = 20;
        // ...
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        client.character = character;
    }
})(this);