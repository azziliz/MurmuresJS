'use strict';
//debugger;

/**
 * @file Tile class. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * @license MIT
 */

/**
 * A tile is a square on the game grid.
 *
 * It is rendered on client side by drawing several overlapping layers, each layer being one PNG image from the murmures tileset.
 * For static levels created by the editor, each tile of a given layer is initialized 
 * with a reference to the [physical body]{@link murmures.PhysicalBody} that is present on the tile.
 * The physical properties of these bodies may restrict movement and actions on the tile.
 *
 * A tile may contain at most one character.
 *
 * @class
 */
murmures.Tile = function (x, y) {
    /* No guid on Tile because tiles are always part of a level and we can identify a tile inside a level with (x, y)*/
    /** @type {number} */
    this.x = x | 0;
    /** @type {number} */
    this.y = y | 0;
    /** @type {number} */
    this.state = murmures.C.TILE_NOT_DISCOVERED | 0;
    /** @type {string} */
    this.groundId = '';
    /** @type {string} */
    this.groundDeco = '';
    /** @type {string} */
    this.propId = '';
    /** @type {string} */
    this.propDeco = '';
    /** @type {string} */
    this.itemId = '';
    /** @type {string} */
    this.charId = '';
    /** @type {string} */
    this.effectId = '';
    /** @type {Object.<string, Object.<string, string>>} */
    this.behavior = {};
};

murmures.Tile.prototype = {
    
    build : function (src) {
        // TODO: allow undefined layers
        this.groundId = (typeof src.groundId === 'undefined') ? '' : src.groundId;
        this.groundDeco = (typeof src.groundDeco === 'undefined') ? '' : src.groundDeco;
        this.propId = (typeof src.propId === 'undefined') ? '' : src.propId;
        this.propDeco = (typeof src.propDeco === 'undefined') ? '' : src.propDeco;
        this.itemId = (typeof src.itemId === 'undefined') ? '' : src.itemId;
        this.charId = (typeof src.charId === 'undefined') ? '' : src.charId;
        this.effectId = (typeof src.effectId === 'undefined') ? '' : src.effectId;
        this.behavior = (typeof src.propId === 'undefined') ? {} : gameEngine.bodies[src.propId].behavior;
    },
    
    initialize : function (src) {
        this.synchronize(src);
    },
    
    synchronize : function (src) {
        if (typeof src === 'undefined') return;
        if (typeof src.state !== 'undefined') this.state = src.state;
        if (typeof src.groundId !== 'undefined') this.groundId = src.groundId;
        if (typeof src.groundDeco !== 'undefined') this.groundDeco = src.groundDeco;
        if (typeof src.propId !== 'undefined') this.propId = src.propId;
        if (typeof src.propDeco !== 'undefined') this.propDeco = src.propDeco;
        if (typeof src.itemId !== 'undefined') this.itemId = src.itemId;
        if (typeof src.charId !== 'undefined') this.charId = src.charId; // TODO: do not send charId, this is only useful for server init
        if (typeof src.effectId !== 'undefined') this.effectId = src.effectId;
        if (typeof src.behavior !== 'undefined') this.behavior = src.behavior;
    },
    
    clone : function () {
        return {
            state: this.state,
            groundId: this.groundId,
            groundDeco: this.groundDeco,
            propId: this.propId,
            propDeco: this.propDeco,
            itemId: this.itemId,
            charId: this.charId,
            effectId: this.effectId,
            behavior: this.behavior,
        };
    },
    
    compare : function (beforeState) {
        let ret = {};
        if (this.state !== beforeState.state) ret.state = this.state;
        if (this.groundId !== beforeState.groundId) ret.groundId = this.groundId;
        if (this.groundDeco !== beforeState.groundDeco) ret.groundDeco = this.groundDeco;
        if (this.propId !== beforeState.propId) ret.propId = this.propId;
        if (this.propDeco !== beforeState.propDeco) ret.propDeco = this.propDeco;
        if (this.itemId !== beforeState.itemId) ret.itemId = this.itemId;
        if (this.charId !== beforeState.charId) ret.charId = this.charId;
        if (this.effectId !== beforeState.effectId) ret.effectId = this.effectId;
        if (this.propId !== beforeState.propId && 
        JSON.stringify(this.behavior) !== JSON.stringify(beforeState.behavior)) ret.behavior = this.behavior;
        for (var prop in ret) {
            // only returns ret if not empty
            ret.x = this.x;
            ret.y = this.y;
            return ret;
        }
        // otherwise, no return = undefined
    },
    
    coordinates : function () {
        return { x: this.x, y: this.y };
    },
    
    clean: function () {
        delete this.x;
        delete this.y;
        delete this.state;
        delete this.behavior;
        if (this.groundId === '') delete this.groundId;
        if (this.propId === '') delete this.propId;
        if (this.charId === '') delete this.charId;
    },
    
    isWall : function () {
        let allowTerrestrialGround = (this.groundId === "") ? true : !gameEngine.bodies[this.groundId].hasPhysics ? true : !!gameEngine.bodies[this.groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.propId === "") ? true : !gameEngine.bodies[this.propId].hasPhysics ? true : !!gameEngine.bodies[this.propId].allowTerrestrial;
        let hasMoveBehavior = (typeof this.behavior !== "undefined" && typeof this.behavior.move !== "undefined");
        return (!allowTerrestrialGround || !allowTerrestrialProp) && !hasMoveBehavior;
    }
};
