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
 * It could also be called "casting" for a spell, "aiming" for an archery skill or "wielding" for a melee skill.
 * Activations are created when an Order is received from the client.
 * They are enqueued in the Timeline and progress with each Timeline tick.
 * When they are complete, the effect of the Skill contained in the Order is applied.
 *
 * @class
 */
murmures.Activation = function () {
    /** @type {?} */
    this.order = {};
};

murmures.Activation.prototype = {
};
