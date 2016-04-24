'use strict';

(function (client) {

    var character = function () {
        this.position = [1,10];
        this.hitPoints = 20;
        this.img = "./data/img/perso.png"
        // ...
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        client.character = character;
    }
})(this);
