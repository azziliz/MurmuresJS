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
    this.skills = {'': new murmures.Skill()};
    /**
     * key is the level guid
     * @type {Object.<string, murmures.Level>} 
     */
    this.staticlevels = {};
    Object.defineProperty(this, "staticlevels", { enumerable : false });
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
     * This function receives a partial Reference as input and merges it into the client instance.
     */
    synchronize: function (to, from) {
        if (typeof from === 'undefined') return;
        if (from.guid !== to.guid) {
            // New object. We expect to receive all properties.
            if (Object.keys(to).length !== Object.keys(from).length) {
                murmures.serverLog('error in synchronize', { to : to, from: from });
                throw 'error in synchronize - source and destination have different length';
            } else {
                Object.keys(to).forEach(function (key) {
                    const toKey = to[key];
                    const toKeyType = Object.prototype.toString.call(toKey);
                    if (toKeyType === '[object String]' 
                        || toKeyType === '[object Number]' 
                        || toKeyType === '[object Boolean]') {
                        to[key] = from[key];
                    } else if (toKeyType === '[object Array]') {
                        murmures.serverLog('error in synchronize', { to : to, from: from });
                        throw 'error in synchronize - arrays are not supported';
                    } else if (toKeyType !== '[object Object]') {
                        murmures.serverLog('error in synchronize', { to : to, from: from, toKeyType: toKeyType });
                        throw 'error in synchronize - unknown type';
                    } else {
                        // type is '[object Object]'
                        if (toKey instanceof murmures.Level) {
                            synchronize(to[key], from[key]);
                        } else {
                            // type is '{Object.<string, murmures.Xxx>}'

                        }
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
