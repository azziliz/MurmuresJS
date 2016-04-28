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
        murmures.gameEngine = gameEngine;
    }
    
    gameEngine.prototype.fromJson = function (src) {
        /// <param name="src" type="gameEngine"/>
        this.tileSize = src.tileSize;
        this.level = new murmures.level();
        this.level.fromJson(src.level);
        this.hero = new murmures.character();
        this.hero.fromJson(src.hero);
        this.mobs = src.mobs;
    };

    gameEngine.prototype.checkOrder = function (order) {
        /// <param name="order" type="order"/>
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move') return { valid: false, reason: 'Order contains an unknown command' };
        else if ((order.source.position.x !== this.hero.position.x) || (order.source.position.y !== this.hero.position.y)) return { valid: false, reason: 'You can only give orders to your hero' };
        else if (this.level.isWall(order.target)) return { valid: false, reason: 'You cannot target a wall' };
        else if (Math.abs(order.target.x - this.hero.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (Math.abs(order.target.y - this.hero.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else return { valid: true };
    }

})(this);