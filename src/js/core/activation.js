'use strict';
//debugger;

/**
 * @file Activation class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * An Activation is a time lapse during which a Characters prepares a Skill for launch.
 * It could also be called "casting" for a spell, "aiming" for an archery skill or "wielding / swinging" for a melee skill.
 * Activations are created when an Order is received from the client.
 * They are enqueued in the Timeline and progress with each Timeline tick.
 * When they are complete, the effect of the Skill contained in the Order is applied.
 *
 * @class
 */
murmures.Activation = function () {
    /** @type {?} */
    this.order = {};
    /** @type {number} */
    this.startTick = 0;
    /** @type {number} */
    this.endTick = 0;
    /** @type {number} */
    this.remainingWork = 0;
};

murmures.Activation.prototype = {
    /**
     * Initialization method reserved for the server.
     */
    build : function (src) {
        // TODO
    },
    
    /**
     * Initialization method reserved for the client.
     */
    initialize : function (src) {
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
     * Applies the effect of the Skill contained in this Order.
     * This method is called by the Timeline when this Activation expires (i.e. remainingWork = 0).
     */
    applyOrder : function () {
        // TODO
    },
};
