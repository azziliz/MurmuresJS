/**
 * @file Activation class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

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
    /** @type {murmures.Order} */
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
        this.startTick = (typeof src.startTick === 'undefined') ? '' : src.startTick;
        this.endTick = (typeof src.endTick === 'undefined') ? '' : src.endTick;
        this.remainingWork = (typeof src.remainingWork === 'undefined') ? '' : src.remainingWork;
        this.order = (typeof src.order === 'undefined') ? '' : src.order;
    },
    
    /**
     * Initialization method reserved for the client.
     */
    initialize : function (src) {
        this.synchronize(src);

    },
    
    /**
     * Synchronization method reserved for the client.
     */
    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.startTick !== 'undefined') this.startTick = src.startTick;
        if (typeof src.endTick !== 'undefined') this.endTick = src.endTick;
        if (typeof src.remainingWork !== 'undefined') this.remainingWork = src.remainingWork;
        if (typeof src.order !== 'undefined') this.order = src.order;
    },
    
    /**
     * Cloning method reserved for the server.
     */
    clone : function () {
        return{
            order : this.order.clone(),
            startTick : this.startTick,
            endTick : this.endTick,
            remainingWork : this.remainingWork,
        };
    },
    
    /**
     * Comparison method reserved for the server.
     */
    compare : function (beforeState) {
        let ret = {};
        if (this.startTick !== beforeState.startTick) ret.startTick = this.startTick;
        if (this.endTick !== beforeState.endTick) ret.endTick = this.endTick;
        if (this.remainingWork !== beforeState.remainingWork) ret.remainingWork = this.remainingWork;
        const retOrder = this.order.compare(beforeState.order);
        if (typeof retOrder !== 'undefined') ret.order = retOrder;
        if(Object.getOwnPropertyNames(ret).length > 0) return ret;
    },
};
