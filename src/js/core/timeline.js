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
     * This variable contains all 'times' when an influencial event (the end of an Activation, the start/end of an effect) is expected to happen.
     * It is updated by the simulation after each tick.
     * @type {Array.<number>} 
     */
    this.keyframes = [];
};

murmures.Timeline.prototype = {
    /**
     * Initialization method reserved for the server.
     * Called everytime the heroes enter a new level.
     */
    build : function () {
        this.time = 0;
        this.activationQueue = {};
        this.keyframes = [];
    },

    /**
     * Initialization method reserved for the client.
     * Called everytime the client loads a new timeline.
     *
     * @param {Object} src - A stringified and parsed timeline received from the server.
     */
    initialize : function (src) {
        this.time = src.time;
        // TODO
    },
    
    /**
     * Synchronization method reserved for the client.
     */
    synchronize : function (src) {
        // TODO
    },
    
    /**
     * Cloning method reserved for the server.
     */
    clone : function () {
        // TODO
    },
    
    /**
     * Comparison method reserved for the server.
     */
    compare : function (beforeState) {
        // TODO
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
        let found = "undefined";
        for(let i=0;i<this.activationQueue.length && found === "undefined";i++){
            if(activation.order.source.guid === activationQueue[i].order.source.guid){
                found = activationQueue[i];
            }
        }
        if (found !== "undefined"){
            /**
             * if another activation was found, check if it is solved or not
             * if yes, dequeue it, and enqueue the new one
             * if not, nothing to do, and no enqueue the new one
             */ 
            if (found.endTick > this.time){
                this.dequeue(found);
                this.activationQueue.push(activation);
                this.simulate();
            }
        }else{
            /**
             * ordinary case, enqueue the activation
             */
            this.activationQueue.push(activation);
            this.simulate();
        }

    },
    
    /**
     * Pops the Activation passed in parameter from this queue and returns it.
     */
    dequeue : function (activation) {
        if (this.activationQueue.indexOf(activation)!=-1){
            this.activationQueue.pop(activation);
            return activation;
        }
        return;
    },
    
    /**
     * Increases the time counter by 'tickCount' time units (1 unit = 0.1s), then updates all Activations in this queue.
     * If an Activation expires, calls its 'applyOrder' function.
     * This function should be called by the server, with a parameter set to reach the next keyframe.
     */
    tick : function (tickCount) {
        // TODO
    },
    
    /**
     * Generate virtual ticks (ticks that do not actually update the Activations in this queue) until all Activations expire.
     * Updates keyframes based on the results.
     * This function is called after a tick and before the updated timeline is sent to the clients.
     */
    simulate : function () {
        // TODO
    },
};
