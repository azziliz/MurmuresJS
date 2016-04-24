'use strict';

(function (client) {

    var player = function () {
        this.id = null;
        this.name = null;
        this.character = [];
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = player;
    }
    else {
        client.player = player;
    }
})(this);
