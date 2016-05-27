'use strict';
//debugger;

/**
 * @file GameEngine class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * GameEngine is the main manager for all game objects.
 *
 * A single instance of this class is created when Node starts and is kept alive at all time afterwards.
 * This instance is in the global scope and can be accessed from any other class.
 * This is the only variable of the murmures project in the global scope.
 * During startup, the server loads all references data -stored in JSON files- into the engine instance.
 * This includes bodies.json (list of all physical bodies and character templates).
 *
 * This class is also in charge of applying client orders to the game and calling AI methods.
 *
 * @class
 */
murmures.GameEngine = function () {
        /// <field name="tileSize" type="Number"/>
        /// <field name="gameTurn" type="Number"/>  // server only
        /// <field name="bodies" type="PhysicalBody"/>
        /// <field name="locale" type="Object"/>
        /// <field name="levels" type="Array"/>  // server only
        /// <field name="levelIds" type="Array"/>  // server only
        /// <field name="activeLevel" type="Number"/>  // server only
        /// <field name="level" type="Level"/>
        /// <field name="hero" type="Character"/>
        this.gameTurn = 0;
};

murmures.GameEngine.prototype = {
    
    /*
     * No build method here because initialization involves several Node-only functions.
     * We don't want to expose these functions to the client because they don't exist there.
     * Instead, we build the gameEngine master instance in server.js
     */

    /**
     * Synchronization method called on client side only.
     * Creates a full GameEngine objects from a JSON sent by the server.
     * Sub-classes are also synchronized recursively.
     * This function expects a full GameEngine object as input and is intended to overwrite the client instance completely.
     *
     * @param {Object} src - A parsed version of the stringified remote gameEngine instance.
     */
    initialize : function (src) {
        this.tileSize = src.tileSize;
        this.bodies = src.bodies;
        this.locale = src.locale;
        this.level = new murmures.Level();
        this.level.initialize(src.level);
        this.hero = new murmures.Character();
        this.hero.initialize(src.hero);
    },
    
    /**
     * Synchronization method called on client side only.
     * This function receives a partial GameEngine as input and merges it into the client instance.
     */
    synchronize: function (src) {
        if (typeof src === 'undefined') return;
        let isNewLevel = (typeof src.level !== 'undefined') && (typeof src.level.guid !== 'undefined') && (this.level.guid !== src.level.guid);
        if (isNewLevel === true) {
            this.level = new murmures.Level();
            this.level.initialize(src.level);
        } else {
            this.level.synchronize(src.level);
        }
        this.hero.synchronize(src.hero);
    },
    
    compare : function (beforeState) {
        let ret = {};
        let level_ = this.level.guid === beforeState.level.guid ? this.level.compare(beforeState.level) : this.level; // TODO: optimize response when level changes. We could send a clean() state if the client was able to handle empty mob list.
        if (typeof level_ !== "undefined") ret.level = level_;
        let hero_ = this.hero.compare(beforeState.hero);
        if (typeof hero_ !== "undefined") ret.hero = hero_;
        for (var prop in ret) {
            // only returns ret if not empty
            return ret;
        }
        // otherwise, no return = undefined
    },
    
    /**
     * This function is called on client and server side.
     * If the order is deemed valid on client side, it is then sent to the server by an XHR.
     * The server will check it again and, if it's still valid, call applyOrder().
     */
    checkOrder : function (order) {
        /// <param name="order" type="Order"/>
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move' && order.command !== 'attack') return { valid: false, reason: 'Order contains an unknown command' };
        else if ((order.source.guid !== this.hero.guid)) return { valid: false, reason: 'You can only give orders to your own hero' };
        else if (order.target.isWall()) return { valid: false, reason: 'You cannot target a wall' };

        else if (order.command === 'attack' && Math.abs(order.target.x - this.hero.position.x) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && Math.abs(order.target.y - this.hero.position.y) > 3) return { valid: false, reason: 'Target is too far. Your attack range is: 3' };
        else if (order.command === 'attack' && (this.tileHasMob(order.target).code === false)) return { valid: false, reason: 'You cannot attack an empty tile' };
        else if (order.command === 'attack' && (this.tileHasMob(order.target).code === true) && (this.tileHasMob(order.target).mob.onVision === false)) return { valid: false, reason: 'You cannot attack over an obstacle' };
        else if (order.command === 'attack') return { valid: true, hasMob: true };

        else if (order.command === 'move' && Math.abs(order.target.x - this.hero.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && Math.abs(order.target.y - this.hero.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && (this.tileHasMob(order.target).code === true)) return { valid: false, reason: 'The target tile is occupied by a mob' };
        else return { valid: true, hasMob: false };
    },
    
    // TODO move this function to the tile class
    tileHasMob : function (tile) {
        let ret = false;
        let retMob = null;
        if (this.level.mobs != undefined) {
            this.level.mobs.forEach(function (mob) {
                if (mob.position.x === tile.x && mob.position.y === tile.y && mob.hitPoints > 0) {
                    retMob = mob;
                    ret = true;
                }
            });
        }
        return { code : ret, mob : retMob };
    },
    
    applyOrder : function (order) {
        // This function is only called on server side
        if (order.command === 'move') {
            if (typeof order.target.behavior !== 'undefined' && typeof order.target.behavior.move !== "undefined") {
                murmures.Behavior[order.target.behavior.move.callback](order.source, order.target, order.target.behavior.move.params);
            }
            else {
                this.hero.move(order.target.x, order.target.y);
            }
        }
        else {
            this.level.mobs.forEach(function (mob) {
                if (mob.onVision && mob.position.x === order.target.x && mob.position.y === order.target.y) {
                    mob.hitPoints -= 3;
                    if (mob.hitPoints < 0) mob.hitPoints = 0;
                }
            });
        }
        murmures.serverLog('Moves / attacks done' + order.target.x + "//" + order.target.y);
        this.hero.setVision();
        murmures.serverLog('Vision done');
        this.applyAI();
        murmures.serverLog('AI done');
    },
    
    applyAI : function () {
        let hero = this.hero;
        let level = this.level;
        let bodies = this.bodies;
        this.level.mobs.forEach(function (mob) {
            if (mob.charSpotted) {
                let fireOnHero = false;
                if (mob.onVision) {
                    if (Math.abs(mob.position.x - hero.position.x) <= 2 && Math.abs(mob.position.y - hero.position.y) <= 2 && mob.hitPoints > 0) {
                        hero.hitPoints -= 1;
                        fireOnHero = true;
                        if (hero.hitPoints < 0) hero.hitPoints = 0;
                    }
                    
                }
                if (!fireOnHero) {
                // TODO : move to hero
                }
            }
        });
    }
};
