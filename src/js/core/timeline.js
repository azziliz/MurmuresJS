'use strict';
//debugger;

/**
 * @file Timeline class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * A Timeline keeps track of scheduled Activations
 *
 * @class
 */
murmures.Timeline = function () {
    /** @type {number} */
    this.time = 0;
    /** @type {?} */
    this.activationQueue = {};
};

murmures.Timeline.prototype = {
    /**
     * Initialization method reserved for the server.
     * Called everytime the heroes enter a new level.
     */
    build : function () {
        this.time = 0;
        this.activationQueue = {};
    },

    /**
     * Initialization method reserved for the client.
     * Called everytime the client loads a new timeline.
     *
     * @param {Object} src - A stringified and parsed timeline received from the server.
     */
    initialize : function (src) {
        this.time = src.time;
        this.activationQueue = src.actionQueue;
    },
};
