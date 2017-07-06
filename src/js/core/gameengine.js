/**
 * @file GameEngine class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * GameEngine is the main manager for all game objects.
 *
 * A single instance of this class is created when Node starts and is kept alive at all time afterwards.
 * This instance is in the global scope and can be accessed from any other class.
 * This is the only variable of the murmures project in the global scope.
 * During startup, the server loads all references data -stored in JSON files- into the engine instance.
 * This includes assets (list of all physical bodies and character templates), locale files, heroes and static levels.
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
    /** @type {murmures.Timeline} */
    this.timeline = {};
    /** @type {Array.<murmures.Character>} */
    this.heros = [];
    /** @type {Array.<murmures.TurnReport>} */
    this.reportQueue = [];
    /**
     * key is the skill Id
     * @type {Object.<number, murmures.Skill>} 
     */
    this.skills = {};
    /* Server-only */
    /** @type {Array.<murmures.Level>} */
    this.levels = {};
    /** @type {Array.<string>} */
    this.levelIds = {};
    /** @type {number} */
    this.activeLevel = 0;
    /** @type {number} */
    this.gameTurn = 0;
    /** @type {number} */
    this.state = murmures.C.STATE_ENGINE_INIT | 0;
    /** @type {Array.<murmures.Order>} */
    this.orderQueue = [];
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
        this.timeline = new murmures.Timeline();
        this.timeline.initialize(src.timeline);
        this.heros = [];
        src.heros.forEach(function (hero) {
            let tempHero = new murmures.Character();
            tempHero.initialize(hero);
            this.heros.push(tempHero);
        }, this);
        this.reportQueue = [];
        if (typeof src.reportQueue !== 'undefined') {
            src.reportQueue.forEach(function (report) {
                let tempReport = new murmures.TurnReport();
                tempReport.initialize(report);
                this.reportQueue.push(tempReport);
            }, this);
        }
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
        if (typeof src.timeline !== 'undefined') {
            this.timeline.synchronize(src.timeline);
        }
        if (typeof src.state !== 'undefined') {
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
        this.reportQueue = [];
        if (typeof src.reportQueue !== 'undefined') {
            src.reportQueue.forEach(function (report) {
                let tempReport = new murmures.TurnReport();
                tempReport.initialize(report);
                this.reportQueue.push(tempReport);
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
            timeline: this.timeline.clone(),
            heros: tempHeros
        };
    },
    
    compare : function (beforeState) {
        let ret = {};
        if (this.state !== beforeState.state) {
            ret.state = this.state;
        }
        let level_ = this.level.compare(beforeState.level);
        if (typeof level_ !== 'undefined') ret.level = level_;
        let timeline_ = this.timeline.compare(beforeState.timeline);
        if (typeof timeline_ !== 'undefined') ret.timeline = timeline_;
        let heros_ = [];
        for (let itHero = 0; itHero < this.heros.length; itHero++) {
            for (let itHero_ = 0; itHero_ < beforeState.heros.length; itHero_++) {
                if (beforeState.heros[itHero_].guid === this.heros[itHero].guid) {
                    let hero_ = this.heros[itHero].compare(beforeState.heros[itHero_]);
                    if (typeof hero_ !== 'undefined') heros_.push(hero_);
                }
            }
        }
        if (heros_.length > 0) {
            ret.heros = heros_;
        }
        if (this.reportQueue.length > 0) {
            ret.reportQueue = this.reportQueue;
        }
        if (Object.getOwnPropertyNames(ret).length > 0) {
            // only returns ret if not empty
            return ret;
        }
        // otherwise, no return = undefined
    },
    
    getHeroByGuid: function (guid) {
        this.heros.forEach(function (hero) {
            if (hero.guid === guid) return hero;
        }, this);
    },
    
    /**
     * This function is called on client and server side.
     * If the order is deemed valid on client side, it is then sent to the server by a websocket message.
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
        else if (typeof heroToCheck === 'undefined' || heroToCheck === null) return { valid: false, reason : 'order sent for an invalid hero' };
        else if ((order.command === 'move' || order.command === 'attack') && order.target.isWall()) return { valid: false, reason: 'You cannot target a wall' };

        else if (order.command === 'attack' && (!order.target.hasMob.code)) return { valid: false, reason: 'You cannot attack an empty tile' };
        else if (order.command === 'attack' && (order.target.hasMob.code) && (!order.target.hasMob.mob.onVisionCharacters[order.source.guid])) return { valid: false, reason: 'You cannot attack over an obstacle' };
        else if (order.command === 'attack') {
            let skillToApply = order.source.skills[order.source.activeSkill];
            if (skillToApply) {
                if (Math.abs(order.target.x - order.source.position.x) > skillToApply.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillToApply.range };
                if (Math.abs(order.target.y - order.source.position.y) > skillToApply.range) return { valid: false, reason: 'Target is too far. Your attack range is: ' + skillToApply.range };
                if ((skillToApply.targetaudience === murmures.C.TARGET_AUDIENCE_MOB) && (order.target.hasMob.isHero)) return { valid : false, reason: 'Invalid target. Target must be a mob' };
                if ((skillToApply.targetaudience === murmures.C.TARGET_AUDIENCE_HERO) && (!order.target.hasMob.isHero)) return { valid : false, reason: 'Invalid target. Target must be a hero' };
            } else {
                return { valid : false, reason : 'hero doesn t have such a skill' };
            }
        }
        else if (order.command === 'move' && Math.abs(order.target.x - heroToCheck.position.x) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && Math.abs(order.target.y - heroToCheck.position.y) > 1) return { valid: false, reason: 'Target is too far. Your moving range is: 1' };
        else if (order.command === 'move' && (order.target.hasMob.code && !order.target.hasMob.isHero)) return { valid: false, reason: 'The target tile is occupied by a mob' };
        return { valid: true };
    },
    
    saveOrder : function (order) {
        // This function is only called on server side
        let nbOrderDone = 0;
        for (let itHero = 0; itHero < this.heros.length ; itHero++) {
            if (this.heros[itHero].guid === order.source.guid) {
                this.heros[itHero].stateOrder = murmures.C.STATE_HERO_ORDER_GIVEN;
                if (typeof this.orderQueue === 'undefined') this.orderQueue = [];
                
                this.orderQueue.push(order);
                murmures.serverLog('Order saved');
            }
            
            if (this.heros[itHero].stateOrder === murmures.C.STATE_HERO_ORDER_GIVEN) {
                nbOrderDone += 1;
            }
        }
        this.reportQueue = [];
        if (this.heros.length !== nbOrderDone) {
            for (let itHero = 0; itHero < this.heros.length ; itHero++) {
                if (this.heros[itHero].stateOrder !== murmures.C.STATE_HERO_ORDER_GIVEN) {
                    this.heros[itHero].stateOrder = murmures.C.STATE_HERO_ORDER_INPROGRESS;
                    murmures.serverLog('Waiting for next order from following hero');
                    break;
                }
            }
        } else {
            murmures.serverLog('Apply all orders', { orderQueue : this.orderQueue, mobs: this.level.mobs });
            for (let itOrders = 0; itOrders < this.orderQueue.length ; itOrders++) {
                this.applyOrder(this.orderQueue[itOrders]);
            }
            this.orderQueue = [];
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
                let tr1 = new murmures.TurnReport();
                tr1.build({
                    effect: 'characterMove',
                    character: order.source,
                    sourceTile: order.source.position.coordinates,
                    targetTile: order.target.coordinates,
                    priority: 10
                });
                this.reportQueue.push(tr1);
                order.source.move(order.target.x, order.target.y);
            }
        }
        else {
            //TODO : two foreach for same thing but once on mobs, second on hero... certainly a better way to do this
            //if(order.source.skills[order.source..activeSkill].targetaudience === murmures.C.TARGET_AUDIENCE_MOB)
            murmures.serverLog('debug1', { order : order, murmures: murmures });
            if ([murmures.C.TARGET_AUDIENCE_ALL, murmures.C.TARGET_AUDIENCE_MOB].indexOf(order.source.skills[order.source.activeSkill].targetaudience) >= 0) {
                this.level.mobs.forEach(function (mob) {
                    murmures.serverLog('debug2', { mob : mob });
                    if (mob.onVisionCharacters[order.source.guid] && mob.position.x === order.target.x && mob.position.y === order.target.y) {
                        let tr1 = new murmures.TurnReport();
                        tr1.build({
                            effect: 'projectileMove',
                            sourceTile: order.source.position.coordinates,
                            targetTile: order.target.coordinates,
                            priority: 20
                        });
                        this.reportQueue.push(tr1);
                        let tr2 = new murmures.TurnReport();
                        tr2.build({
                            effect: 'damage',
                            character: mob,
                            value: order.source.defaultDamageValue,
                            priority: 30
                        });
                        this.reportQueue.push(tr2);
                        
                        order.source.skills[order.source.activeSkill].apply(mob);
                        if (mob.hitPoints <= 0) {
                            mob.hitPoints = 0;
                            mob.position.groundDeco = '_b1_02_blood_red00';
                        }
                    }
                }, this);
            }
            if ([murmures.C.TARGET_AUDIENCE_ALL, murmures.C.TARGET_AUDIENCE_HERO].indexOf(order.source.skills[order.source.activeSkill].targetaudience) >= 0) {
                this.heros.forEach(function (mob) {
                    if (mob.onVisionCharacters[order.source.guid] && mob.position.x === order.target.x && mob.position.y === order.target.y) {
                        order.source.skills[order.source.activeSkill].apply(mob);
                    }
                }, this);
            }
        }
        murmures.serverLog('Moves / attacks done');
        for (let itMob=0; itMob < this.level.mobs.length; itMob++) {
            for (let itHero=0; itHero < this.heros.length; itHero++) {
                this.level.mobs[itMob].onVisionCharacters[this.heros[itHero].guid] = false;
            }

        }
        let tilesProcessed = [];
        for (let itHero = 0; itHero < this.heros.length ; itHero++) {
            if (typeof tilesProcessed === 'undefined') {
                tilesProcessed = [];
            }
            tilesProcessed = this.heros[itHero].setVision(tilesProcessed);
        }
        murmures.serverLog('Vision done');
    },
    
    applyAI : function () {
        let heros = this.heros;
        this.level.mobs.forEach(function (mob) {
            let ret = mob.applyAI(heros);
            if (typeof ret.state !== "undefined" ) this.state = ret.state;
            if(typeof ret.reportQueue !== "undefined"){
                for(let i=0;i<ret.reportQueue.length;i++){
                    this.reportQueue.push(ret.reportQueue[i]);
                }
            }
        }, this);
    },

    getCurrentHero : function () {
        const aq = this.timeline.activationQueue;
        const awaitingGuids = Object.keys(aq).filter(function (guid) { return aq[guid] === null; }, this);
        if (awaitingGuids.length !== 1) {
            console.log('gameEngine.timeline.activationQueue');
            console.log(this.timeline.activationQueue);
            throw 'cannot find the current hero 1';
        }
        const currentHeroGuid = awaitingGuids[0];
        const heroesWithThisGuid = this.heros.filter(function (hero) { return hero.guid === currentHeroGuid; }, this);
        if (heroesWithThisGuid.length !== 1) {
            console.log('gameEngine.timeline.activationQueue');
            console.log(this.timeline.activationQueue);
            throw 'cannot find the current hero 2';
        }
        return heroesWithThisGuid[0];
    },

};
