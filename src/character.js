'use strict';

(function (client) {

    var character = function () {};

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        client.character = character;
    }

    character.prototype.position = [1, 10];
    character.prototype.hitPoints = 20;
    character.prototype.img = "./data/img/perso.png";
    // ...
    

})(this);
