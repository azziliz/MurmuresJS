'use strict';

(function (client) {

    var character = function () {
        this.position={"x":10,"y":1};
        this.hitpoints=20;
        this.img='./src/img/perso.png';
        this.name="rincevent";
     };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        client.character = character;
    }

    character.prototype.position = {};
    character.prototype.hitPoints = 20;
    character.prototype.img = null;
    character.prototype.name = null;

    character.prototype.move = function(x,y){
      this.position.x=x;
      this.position.y=y;
    };

})(this);
