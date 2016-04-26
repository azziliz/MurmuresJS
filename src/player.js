'use strict';

(function (client) {

    var player = function () { };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = player;
    }
    else {
        client.player = player;
    }

    player.prototype.id = null;
    player.prototype.name = null;
    player.prototype.character = null;
    player.prototype.level = null; //array of levels (old and actual)
    player.prototype.actualLevel = null; //int : on which level character is (it can down or up back)

})(this);
