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
     * key is the skill name
     * @type {Object.<string, murmures.Skill>} 
     */
    this.skills = {};
    /* Server-only */
    /** @type {Array.<murmures.Level>} */
    this.levels = [];
    /** @type {Array.<string>} */
    this.levelIds = {};
    /** @type {number} */
    this.activeLevel = 0;
    /** @type {number} */
    this.gameTurn = 0;
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
        this.skills = src.skills;
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
    
    /**
     * This function is called on client and server side.
     * If the order is deemed valid on client side, it is then sent to the server by a websocket message.
     * The server will check it again and, if it's still valid, call Order.apply().
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
            const skillToApply = order.source.skills[order.source.activeSkill];
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
    
    // Finds a hero with the guid passed in parameter
    // Expects to find exactly one
    // This function is called by the client and the server
    getHeroByGuid: function (guid) {
        const heroesWithThisGuid = this.heros.filter(function (hero) { return hero.guid === guid });
        if (heroesWithThisGuid.length !== 1) {
            murmures.serverLog('error in getHeroByGuid', { guid : guid, heroes: this.heros });
            murmures.serverLog('cannot find a hero with the guid');
        } else {
            return heroesWithThisGuid[0];
        }
    },
    
    // This function checks the front of the activation queue and expects to find a key with a null value
    // The key is the current hero guid
    // The server awaits an order from this hero
    // This is a client-only function
    getCurrentHero : function () {
        const aq = this.timeline.activationQueue;
        const awaitingGuids = Object.keys(aq).filter(function (guid) { return aq[guid] === null; }, this);
        if (awaitingGuids.length !== 1) {
            murmures.serverLog('error in getCurrentHero', { aq: this.timeline.activationQueue });
            murmures.serverLog('cannot find the hero at the front of the activation queue');
        } else {
            const currentHeroGuid = awaitingGuids[0];
            return this.getHeroByGuid(currentHeroGuid);
        }
    },

};
