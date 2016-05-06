'use strict';

(function (client) {

    var gameEngine = function () {
        /// <field name="tileSize" type="Number"/>
        /// <field name="bodies" type="physicalBody"/>
        /// <field name="mobsReference" type="character"/>
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

    gameEngine.prototype.fromJson = function (src,murmures) {
        /// <param name="src" type="gameEngine"/>
        this.tileSize = src.tileSize;
        this.bodies = src.bodies;
        this.mobsReference = src.mobsReference;
        this.level = new murmures.level();
        this.level.fromJson(src.level,murmures);
        this.hero = new murmures.character();
        this.hero.fromJson(src.hero);
        
        let mobsarray = [];
        src.mobs.forEach(function (mob) {
            let charmob = new murmures.character();
            charmob.fromJson(mob);
            mobsarray.push(charmob);
        });
        this.mobs = mobsarray;
      
        this.hero.setVision(this);
    };

    gameEngine.prototype.loadMobs = function (murmures) {
        let mobsarray = [];
        this.level.mobStartingTiles.forEach(function (startingTile) {
            let creature = new murmures.character();
            creature.img = './src/img/skeleton.png';
            creature.position = new murmures.tile();
            creature.position.x = startingTile.x;
            creature.position.y = startingTile.y;
            creature.mobTemplate = startingTile.mobTemplate;
            creature.hitPoints = 10;
            creature.hitPointsMax = 10;
            mobsarray.push(creature);
        });
        this.mobs = mobsarray;
    }

    gameEngine.prototype.checkOrder = function (order) {
        /// <param name="order" type="order"/>
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move' && order.command !== 'attack') return { valid: false, reason: 'Order contains an unknown command' };
        else if ((order.source.position.x !== this.hero.position.x) || (order.source.position.y !== this.hero.position.y)) return { valid: false, reason: 'You can only give orders to your own hero' };
        else if (this.level.isWall(order.target)) return { valid: false, reason: 'You cannot target a wall' };

        else if (order.command === 'attack' && Math.abs(order.target.x - this.hero.position.x) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && Math.abs(order.target.y - this.hero.position.y) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && !this.tileHasMob(order.target)) return { valid: false, reason: 'You cannot attack an empty tile' };
        else if (order.command === 'attack') return { valid: true, hasMob: true };

        else if (order.command === 'move' && Math.abs(order.target.x - this.hero.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && Math.abs(order.target.y - this.hero.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && this.tileHasMob(order.target)) return { valid: false, reason: 'The target tile is occupied by a mob' };
        else return { valid: true, hasMob: false };
    }

    gameEngine.prototype.tileHasMob = function (tile) {
        let ret = false;
        this.mobs.forEach(function (mob) {
            if (mob.position.x === tile.x && mob.position.y === tile.y && mob.hitPoints > 0) ret = true;
        });
        return ret;
    }

    gameEngine.prototype.applyOrder = function (order) {
        if (order.command === "move") {
            this.hero.move(order.target.x, order.target.y);
            this.hero.setVision(this);
        }
        else {
            this.mobs.forEach(function (mob) {
                if (mob.position.x === order.target.x && mob.position.y === order.target.y) {
                    mob.hitPoints -= 3;
                    if (mob.hitPoints < 0) mob.hitPoints = 0;
                }
            });
        }
        this.applyAI();
    }

    gameEngine.prototype.applyAI = function () {
        let hero = this.hero;
        this.mobs.forEach(function (mob) {
            if (Math.abs(mob.position.x - hero.position.x) <= 2 && Math.abs(mob.position.y - hero.position.y) <= 2 && mob.hitPoints > 0) {
                hero.hitPoints -= 1;
                if (hero.hitPoints < 0) hero.hitPoints = 0;
            }
        });
    }

})(this);
