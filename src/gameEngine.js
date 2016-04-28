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
        this.level = new murmures.level();
        this.level.fromJson(src.level);
        this.hero = src.hero;
        this.mobs = src.mobs;
    };

    gameEngine.prototype.checkOrder = function (order) {
        /// <param name="order" type="order"/>
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move') return { valid: false, reason: 'Order contains an unknown command' };
        else if (this.level.isWall(order.target)) return { valid: false, reason: 'Cannot move to a wall' };
        else return { valid: true };
    }

})(this);