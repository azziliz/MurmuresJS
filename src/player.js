'use strict';

(function (client) {

    var player = function () { };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = player;
    }
    else {
        murmures.player = player;
    }

    player.prototype.id = null;
    player.prototype.name = null;
    player.prototype.character = null;
    player.prototype.level = null; //actual level
    

})(this);
