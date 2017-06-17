'use strict';
//debugger;

/**
 * @file Pathfinding class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * 
 *
 * @class
 */
murmures.Pathfinding = function () {
    /** @type {boolean} */
    this.found = false;
    /** @type {number} */
    this.length = 0 | 0;
    /** @type {Array.<murmures.Tile>} */
    this.path = [];
};

murmures.Pathfinding.prototype = {
    /**
     * Compute path, using the A* algorithm.
     * Heuristic is Max(x, y), which should never overestimate the cost
     *
     * @param {murmures.Tile} source - The starting tile.
     * @param {murmures.Tile} target - The targeted tile.
     * @static
     */
    compute: function (source, target) {
        murmures.serverLog("starting A*");
        let level = gameEngine.level;
    }
};
