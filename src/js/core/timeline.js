/**
 * @file Timeline class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * A Timeline keeps track of scheduled Activations
 *
 * @class
 */
murmures.Timeline = function () {
    /** @type {number} */
    this.time = 0;
    /** 
     * The string keys in this variable should be defined to the guid of the character that is activating a skill
     * The value is the matching Activation object
     * @type {Object.<string, murmures.Activation>} 
     */
    this.activationQueue = {};
    /** 
     * This variable contains the time (tick) when the next influencial event (the end of an Activation, the start/end of an effect) is expected to happen.
     * It is updated by the simulation after each time jump.
     * @type {number} 
     */
    this.nextKeyframe = 0;
};

murmures.Timeline.prototype = {
    /**
     * Initialization method reserved for the server.
     * Called everytime the heroes enter a new level.
     */
    build : function () {
        this.time = 0;
        this.activationQueue = {};
        this.nextKeyframe = 0;
    },
    
    /**
     * Initialization method reserved for the client.
     * Called everytime the client loads a new timeline.
     *
     * @param {Object} src - A stringified and parsed timeline received from the server.
     */
    initialize : function (src) {
        this.time = src.time;
        this.activationQueue = src.activationQueue; // TODO : cascade initialize (activation + order)
        this.nextKeyframe = src.nextKeyframe;
    },
    
    /**
     * Synchronization method reserved for the client.
     */
    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.time !== 'undefined') this.time = src.time;
        if (typeof src.activationQueue !== 'undefined') this.activationQueue = src.activationQueue; // TODO : cascade synchronize (activation + order). WARNING ! The queue may contain deleted value between calls. Make sure to delete them too during synchronization.
        if (typeof src.nextKeyframe !== 'undefined') this.nextKeyframe = src.nextKeyframe;
    },
    
    /**
     * Cloning method reserved for the server.
     */
    clone : function () {
        return {
            time: this.time,
            activationQueue: this.activationQueue, // TODO : clone this
            nextKeyframe: this.nextKeyframe
        };
    },
    
    /**
     * Comparison method reserved for the server.
     */
    compare : function (beforeState) {
        let ret = {};
        if (this.time !== beforeState.time) ret.time = this.time;
        if (this.activationQueue !== beforeState.activationQueue) ret.activationQueue = this.activationQueue;
        if (this.nextKeyframe !== beforeState.nextKeyframe) ret.nextKeyframe = this.nextKeyframe;
        // TODO
        if (true) ret.time = this.time;
        if (true) ret.activationQueue = this.activationQueue;
        if (true) ret.nextKeyframe = this.nextKeyframe;
        if (Object.getOwnPropertyNames(ret).length > 0) {
            // only returns ret if not empty
            return ret;
        }
        // otherwise, no return = undefined
    },
    
    /**
     * Pushes the Activation passed in parameter into this queue.
     * All heroes should have 1 Activation in this queue at all time (until they die).
     * Mob Activations should be enqueued as soon as the mob become spotted by a hero.
     * When an Activation is enqueued, the simulation becomes invalidated and has to run again
     */
    enqueue : function (activation) {
        /**
         * check hero has no other activation in progress
         */
        if (typeof activation !== "undefined" && typeof activation.order !== "undefined" && typeof activation.order.source !== "undefined") {
            this.activationQueue[activation.order.source.guid] = activation;
            this.simulate();
        } else {
            murmures.serverLog('Received an activation without a valid order. Discarding it.', activation);
            murmures.serverLog(JSON.stringify(activation));
        }
    },
    
    /**
     * Pops the Activation passed in parameter from this queue and returns it.
     */
    dequeue : function (guid) {
        const ret = this.activationQueue[guid];
        // We set this value to null to force the sending to the client. With 'undefined' it wouldn't be stringified and sent.
        this.activationQueue[guid] = null;
        return ret;
    },
    
    /**
     * Increases the time counter by 'tickCount' time units (1 unit = 0.1s), then updates all Activations in this queue.
     * If an Activation expires, calls the 'apply' function of its order.
     * This function should be called by the server, with a parameter set to reach the next keyframe.
     */
    tick : function () {
        const deltaTime = this.nextKeyframe - this.time;
        // Activate skills further
        
        for (let characterGuid in this.activationQueue) {
            const activation = this.activationQueue[characterGuid];
            if(activation != null) activation.remainingWork -= deltaTime;
        }
        // Move the clock forward
        this.time = this.nextKeyframe;
        const allActivationsThisTick = Object.keys(this.activationQueue).filter(function (guid) 
        { 
            if (this.activationQueue[guid] === null) return false;

            return this.activationQueue[guid].endTick === this.time; 
        }, this);
        //if (allActivationsThisTick.length === 0) throw "no activation this tick ! boom !";
        // if on the same tick than player, there is no more mobs or character to play, find further tick with activation
        // if on further tick, there is only mobs (no player), the allActivationsThisTick variable will reach length of zeo, so find further tick with activation
        if (allActivationsThisTick.length === 0) { 
            this.simulate();
            this.tick();
        }else{
            const firstActivationGuid = allActivationsThisTick[0];
            const firstActivation = this.dequeue(firstActivationGuid); // TODO : uncomment this
            firstActivation.order.apply();
            //firstActivation.endTick += 10; // TODO : this is temporary. Remove this when enqueue works
            const faosp = firstActivation.order.source.position;
            const newTarget = gameEngine.level.tiles[faosp.y - 1 + Math.floor(Math.random() * 3)][faosp.x - 1 + Math.floor(Math.random() * 3)];
            if (!firstActivation.order.source.isHero) {
                const order1 = firstActivation.order.source.applyAI();
                if (order1.command !== ''){
                    const sourceCharacter = order1.source;
                    const activation1 = new murmures.Activation();
                    
                    activation1.build({
                        startTick : this.time,
                        endTick : this.time + sourceCharacter.skills[sourceCharacter.activeSkill].activation,
                        remainingWork : 0,
                        order : order1
                    });
                    this.enqueue(activation1);
                }
                // keep ticking recursively while the next character in line is a monster
                this.tick();
            }
        }
        
    },
    
    /**
     * Generate virtual ticks (ticks that do not actually update the Activations in this queue) until all Activations expire.
     * Updates nextKeyframe based on the results.
     * This function is called after a tick and before the updated timeline is sent to the clients.
     */
    simulate : function () {
        // TODO
        const nextTicks = Object.keys(this.activationQueue).map(function (guid) {
            if (this.activationQueue[guid] == null) return Infinity;
             return this.activationQueue[guid].endTick || Infinity; 
            }, this);
        this.nextKeyframe = Math.min.apply(null, nextTicks);
    },
};
