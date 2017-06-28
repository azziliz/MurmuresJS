/**
 * @file TurnReport class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;

/**
 * Turn reports are objects sent by the server to the client at the beginning of each turn.
 * They contain information about the previous turn: outcome of the player orders and AI actions.
 * 
 * Allowed effects are: "characterMove", "projectileMove", "damage"
 *
 * @class
 */
murmures.TurnReport = function () {
    /** @type {string} */
    this.effect = '';
    /** @type {murmures.Character} */
    this.character = {};
    /** @type {murmures.Tile} */
    this.sourceTile = {};
    /** @type {murmures.Tile} */
    this.targetTile = {};
    /** @type {number} */
    this.value = 0;
    /** @type {number} */
    this.priority = 0;
};

murmures.TurnReport.prototype = {
    
    build : function (src) {
        this.effect = src.effect;
        //TODO : clean that shit
        this.character = typeof src.character !== 'undefined' ? { guid: src.character.guid } : undefined;
        this.sourceTile = typeof src.sourceTile !== 'undefined' ? { x: src.sourceTile.x, y: src.sourceTile.y } : undefined;
        this.targetTile = typeof src.targetTile !== 'undefined' ? { x: src.targetTile.x, y: src.targetTile.y } : undefined;
        this.value = typeof src.value !== 'undefined' ? src.value : undefined;
        this.priority = typeof src.priority !== 'undefined' ? src.priority : undefined;
    },
    
    initialize : function (src) {
        this.effect = src.effect;
        if (typeof src.character !== 'undefined') this.character = gameEngine.getHeroByGuid(src.character.guid);
        if (typeof src.sourceTile !== 'undefined') this.sourceTile = gameEngine.level.tiles[src.sourceTile.y][src.sourceTile.x];
        if (typeof src.targetTile !== 'undefined') this.targetTile = gameEngine.level.tiles[src.targetTile.y][src.targetTile.x];
        this.value = src.value;
        this.priority = src.priority;
    }
};
