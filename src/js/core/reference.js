/**
 * @file Reference class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * Reference contains all objects that are shared between all Game instances.
 * This includes locales (translations), assets (list of all physical bodies and character templates), 
 * skill definitions, static levels and attributes.
 * 
 * These objects are downloaded by the client when it opens the game for the first time.
 * They don't require synchronization afterwards.
 *
 * A single instance of this class is created when Node starts and is kept alive at all time.
 * This instance is in the global scope and can be accessed from any other class.
 * This is the only variable of the murmures project in the global scope.
 *
 * @class
 */
murmures.Reference = function () {
    /** @type {string} */
    this.guid = '';
    /** @type {number} */
    this.tileSize = 32 | 0;
    /** @type {Object.<string, murmures.PhysicalBody>} */
    this.assets = {};
    /** @type {Object.<string, Object.<string, string>>} */
    this.locales = {};
    /**
     * key is the skill name
     * @type {Object.<string, murmures.Skill>} 
     */
    this.skills = {};
    /** @type {Array.<murmures.Level>} */
    this.staticlevels = [];
    /** @type {Array.<string>} */
    this.levelIds = [];
};

murmures.Reference.prototype = {
    
    /*
     * No build method here because initialization involves several Node-only functions.
     * We don't want to expose these functions to the client because they don't exist there.
     * Instead, we build the reference master instance in server.js
     */
    
    /**
     * Synchronization method called on client side only.
     * This function receives a partial GameEngine as input and merges it into the client instance.
     */
    synchronize: function (src) {
        if (typeof src === 'undefined') return;
        if (src.guid !== this.guid) {
            // New object. We expect to receive all properties.
            if (Object.keys(this).length !== Object.keys(src).length) {
                murmures.serverLog('error in synchronize', { dst : this, src: src });
                throw 'error in synchronize - source and destination have different length';
            } else {
                Object.keys(this).forEach(function (thiskey) {
                    const thiskeyType = Object.prototype.toString.call(this[thiskey]);
                    if (thiskeyType === '[object String]' 
                        || thiskeyType === '[object Number]' 
                        || thiskeyType === '[object Boolean]') {
                        this[thiskey] = src[thiskey];
                    } else if (thiskeyType === '[object Array]') { 
                    }
                }, this);
            }
        } else {
        }
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
    
};
