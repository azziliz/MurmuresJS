'use strict';

(function (client) {
    
    var gameEngine = function () {
        /// <field name="tileSize" type="Number"/>
        /// <field name="level" type="level"/>
        /// <field name="hero" type="character"/>
        /// <field name="mobs" type="character"/>
    };
    
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = gameEngine;
    }
    else {
        client.gameEngine = gameEngine;
    }
    
    gameEngine.prototype.fromJson = function (src) {
        /// <param name="src" type="gameEngine"/>
        this.tileSize = src.tileSize;
        this.level = src.level;
        this.hero = src.hero;
        this.mobs = src.mobs;
    };

})(this);