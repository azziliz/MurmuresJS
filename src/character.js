'use strict';

(function (client) {
    
    var character = function () {
        /// <field name="position" type="tile"/>
        /// <field name="hitPoints" type="Number"/>
        /// <field name="img" type="String"/>
        /// <field name="name" type="String"/>
    };
    
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = character;
    }
    else {
        client.character = character;
    }
    
    character.prototype.fromJson = function (src) {
        /// <param name="src" type="character"/>
        this.position = src.position;
        this.hitPoints = src.hitPoints;
        this.img = src.img;
        this.name = src.name;
    };

    character.prototype.move = function (x, y) {
        this.position.x = x;
        this.position.y = y;
    };

})(this);
