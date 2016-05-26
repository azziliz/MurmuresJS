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
murmures.Tile = function () {
    /** @type {string} */
    this.guid = '';
    /** @type {number} */
    this.x = 0 | 0;
    /** @type {number} */
    this.y = 0 | 0;
    /** @type {number} */
    this.state = 0 | 0;
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
   

    /// <field name="needsClientUpdate" type="bool"/>
    /// <field name="toUpdate" type="bool"/>
    /// <field name="updatedTurn" type="number"/>
    this.updatedTurn = 0;
};

murmures.Tile.prototype = {
    
    build : function (src, x, y) {
        this.guid = Math.random().toString();
        this.x = x | 0;
        this.y = y | 0;
        this.state = murmures.C.TILE_NOT_DISCOVERED | 0;
        this.groundId = (typeof src.groundId === 'undefined') ? '' : src.groundId;
        this.groundDeco = (typeof src.groundDeco === 'undefined') ? '' : src.groundDeco;
        this.propId = (typeof src.propId === 'undefined') ? '' : src.propId;
        this.propDeco = (typeof src.propDeco === 'undefined') ? '' : src.propDeco;
        this.itemId = (typeof src.itemId === 'undefined') ? '' : src.itemId;
        this.charId = (typeof src.charId === 'undefined') ? '' : src.charId;
        this.effectId = (typeof src.effectId === 'undefined') ? '' : src.effectId;
        this.behavior = (typeof src.propId === 'undefined') ? {} : gameEngine.bodies[src.propId].behavior;
    },

    /**
     * Method called by the server once, to build the gameEngine instance during startup.
     * Afterwards, becomes a client-side-only synchronization method.
     * Creates a full Tile object from a JSON.
     *
     * @param {Object} src - A parsed version of the stringified remote tile.
     */
    fromJson : function (src, x, y) {
        /// <param name="src" type="Tile"/>
        this.x = (src.x === undefined) ? x : src.x;
        this.y = (src.y === undefined) ? y : src.y;
        this.state = (src.state === undefined) ? murmures.C.TILE_NOT_DISCOVERED : src.state;
        this.groundId = (src.groundId === undefined) ? '' : src.groundId;
        this.propId = (src.propId === undefined) ? '' : src.propId;
        this.charId = (src.charId === undefined) ? '' : src.charId;
        if (src.propId !== undefined && src.propId !== '') {
            this.behavior = gameEngine.bodies[src.propId].behavior;
        }
        else {
            this.behavior = {};
        }
        this.needsClientUpdate = (src.needsClientUpdate === undefined) ? false : src.needsClientUpdate;
    },

    clean: function () {
        delete this.x;
        delete this.y;
        delete this.state;
        delete this.behavior;
        delete this.needsClientUpdate;
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
