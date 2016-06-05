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
    /* No guid on GameEngine ; we just want one */
    /** @type {number} */
    this.tileSize = 32 | 0;
    /** @type {Object.<string, murmures.PhysicalBody>} */
    this.bodies = {};
    /** @type {Object.<string, Object.<string, string>>} */
    this.locale = {};
    /** @type {murmures.Level} */
    this.level = {};
    /** @type {murmures.Character} */
    this.heros = {};
    /** @type {Array.<murmures.Order>} */
    this.waitingOrders = [];
    
    /* Server-only */
    /** @type {Array.<murmures.Level>} */
    this.levels = {};
    /** @type {Array.<string>} */
    this.levelIds = {};
    /** @type {number} */
    this.activeLevel = 0 | 0;
    /** @type {number} */
    this.gameTurn = 0 | 0;
    /** @type {number} */
    this.state = murmures.C.STATE_ENGINE_INIT | 0;
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
        this.levelIds = src.levelIds;
        this.level = new murmures.Level();
        this.level.initialize(src.level);
        this.heros = [];
        src.heros.forEach(function (hero) {
            let tempHero = new murmures.Character();
            tempHero.initialize(hero);
            this.heros.push(tempHero);
        }, this);
        this.state = src.state;
    },
    
    /**
     * Synchronization method called on client side only.
     * This function receives a partial GameEngine as input and merges it into the client instance.
     */
    synchronize: function (src) {
        if (typeof src === 'undefined') return;
        let isNewLevel = (typeof src.level !== 'undefined') && (typeof src.level.guid !== 'undefined') && (this.level.guid !== src.level.guid);
        if (isNewLevel) {
            this.level = new murmures.Level();
            this.level.initialize(src.level);
        } else {
            this.level.synchronize(src.level);
        }
        if (src.state !== 'undefined') {
            this.state = src.state;
        }
        
        if (typeof src.heros !== 'undefined') {
            src.heros.forEach(function (remoteHero) {
                this.heros.forEach(function (localHero) {
                    if (localHero.guid === remoteHero.guid) {
                        localHero.synchronize(remoteHero);
                    }
                }, this);
            }, this);
        }
    },
    
    clone : function (src) {
        let tempHeros = [];
        for (let itHero = 0; itHero < this.heros.length ; itHero++) {
            let hero = this.heros[itHero].clone();
            tempHeros.push(hero);
        }
        return {
            state: this.state,
            level: this.level.clone(),
            heros: tempHeros,
        };
    },
    
    compare : function (beforeState) {
        let ret = {};
        if (this.state != beforeState.state) {
            ret.state = this.state;
        }
        let level_ = this.level.compare(beforeState.level);
        
        if (typeof level_ !== 'undefined') ret.level = level_;
        let heros_ = [];
        for (let itHero =0; itHero < this.heros.length; itHero++) {
            for (let itHero_ = 0 ; itHero_ < beforeState.heros.length; itHero_++) {
                if (beforeState.heros[itHero_].guid === this.heros[itHero].guid) {
                    let hero_ = this.heros[itHero].compare(beforeState.heros[itHero_]);
                    if (typeof hero_ !== 'undefined') heros_.push(hero_);
                }
            }
        }
        
        if (heros_.length > 0) {
            ret.heros = heros_;
        }
        for (let prop in ret) {
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
        let heroToCheck = null;
        this.heros.forEach(function (hero) {
            if (order.source.guid === hero.guid) {
                heroToCheck = hero;
            }
        }, this);
        
        if (this.state === murmures.C.STATE_ENGINE_DEATH) return { valid : false, reason : 'You are dead!' };
        if (order.source === null) return { valid: false, reason: 'Order source is not defined' };
        else if (order.target === null) return { valid: false, reason: 'Order target is not defined' };
        else if (order.command === null) return { valid: false, reason: 'Order command is not defined' };
        else if (order.command !== 'move' && order.command !== 'attack') return { valid: false, reason: 'Order contains an unknown command' };
        //else if ((order.source.guid !== this.heros[0].guid)) return { valid: false, reason: 'You can only give orders to your own hero' };
        else if (typeof heroToCheck === 'undefined' || heroToCheck === null) return { valid: false, reason : 'order sent for an invalid hero' };
        else if (order.target.isWall()) return { valid: false, reason: 'You cannot target a wall' };

        else if (order.command === 'attack' && Math.abs(order.target.x - heroToCheck.position.x) > heroToCheck.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + heroToCheck.range };
        else if (order.command === 'attack' && Math.abs(order.target.y - heroToCheck.position.y) > heroToCheck.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + heroToCheck.range };
        else if (order.command === 'attack' && (!order.target.hasMob.code)) return { valid: false, reason: 'You cannot attack an empty tile' };
        else if (order.command === 'attack' && (order.target.hasMob.code) && (!order.target.hasMob.mob.onVision)) return { valid: false, reason: 'You cannot attack over an obstacle' };
        else if (order.command === 'attack') return { valid: true };

        else if (order.command === 'move' && Math.abs(order.target.x - heroToCheck.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && Math.abs(order.target.y - heroToCheck.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && (order.target.hasMob.code)) return { valid: false, reason: 'The target tile is occupied by a mob' };
        else return { valid: true };
    },
    
    saveOrder : function (order) {
        // This function is only called on server side
        let nbOrderDone = 0;
        for (let itHero = 0; itHero < this.heros.length ; itHero++) {
            if (this.heros[itHero].guid === order.source.guid) {
                this.heros[itHero].stateOrder = murmures.C.STATE_HERO_ORDER_GIVEN;
                if (typeof this.waitingOrders === 'undefined') this.waitingOrders = [];
                murmures.serverLog(this.waitingOrders);
                this.waitingOrders.push(order);
                murmures.serverLog('Order saved');
            }
            
            if (this.heros[itHero].stateOrder === murmures.C.STATE_HERO_ORDER_GIVEN) {
                nbOrderDone += 1;
            }
        }
        
        if (this.heros.length !== nbOrderDone) {
            for (let itHero = 0; itHero < this.heros.length ; itHero++) {
                if (this.heros[itHero].stateOrder !== murmures.C.STATE_HERO_ORDER_GIVEN) {
                    this.heros[itHero].stateOrder = murmures.C.STATE_HERO_ORDER_INPROGRESS;
                    murmures.serverLog('Waiting for next order from following hero');
                    break;
                }
            }
        } else {
            murmures.serverLog('Apply all orders');
            for (let itOrders = 0; itOrders < this.waitingOrders.length ; itOrders++) {
                this.applyOrder(this.waitingOrders[itOrders]);
            }
            this.waitingOrders = [];
            this.applyAI();
            murmures.serverLog('AI done');
            
            for (let itHero = 0; itHero < this.heros.length ; itHero++) {
                if (itHero === 0) {
                    this.heros[itHero].stateOrder = murmures.C.STATE_HERO_ORDER_INPROGRESS;
                } else {
                    this.heros[itHero].stateOrder = murmures.C.STATE_HERO_WAITING_FOR_ORDER;
                }
            }
        }
    },
    
    applyOrder : function (order) {
        // This function is only called on server side
        if (order.command === 'move') {
            if (typeof order.target.behavior !== 'undefined' && typeof order.target.behavior.move !== 'undefined') {
                murmures.Behavior[order.target.behavior.move.callback](order.source, order.target, order.target.behavior.move.params);
            }
            else {
                order.source.move(order.target.x, order.target.y);
            }
        }
        else {
            this.level.mobs.forEach(function (mob) {
                if (mob.onVision && mob.position.x === order.target.x && mob.position.y === order.target.y) {
                    mob.hitPoints -= order.source.defaultDamageValue;
                    if (mob.hitPoints <= 0) {
                        mob.hitPoints = 0;
                        mob.position.groundDeco = '_b1_02_blood_red00';
                    }
                }
            });
        }
        murmures.serverLog('Moves / attacks done');
        let tilesProcessed = [];
        for (let itHero = 0; itHero < this.heros.length ; itHero++) {
            if (typeof tilesProcessed === 'undefined') { tilesProcessed = []; murmures.serverLog("prout"); }
            tilesProcessed = this.heros[itHero].setVision(tilesProcessed);
        }
        murmures.serverLog('Vision done');
    },
    
    applyAI : function () {
        let heros = this.heros;
        let level = this.level;
        let bodies = this.bodies;
        this.level.mobs.forEach(function (mob) {
            if (mob.charSpotted) {
                let fireOnHero = false;
                if (mob.onVision) {
                    
                    for (let itHero = 0; itHero < heros.length; itHero++) {
                        if (Math.abs(mob.position.x - heros[itHero].position.x) <= mob.range && Math.abs(mob.position.y - heros[itHero].position.y) <= mob.range && mob.hitPoints > 0) {
                            heros[itHero].hitPoints -= mob.defaultDamageValue;
                            fireOnHero = true;
                            if (heros[itHero].hitPoints <= 0) {
                                heros[itHero].hitPoints = 0;
                                this.state = murmures.C.STATE_ENGINE_DEATH;
                            }
                            break;
                        }
                    }
                }
                if (!fireOnHero) {
                // TODO : move to hero
                }
            }
        }, this);
    }
};
