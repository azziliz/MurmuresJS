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
 * For static levels created by the editor, each tile of a given layer is initialized with a reference to the [physical body]{@link murmures.PhysicalBody} that is present on the tile.
 * The physical properties of these bodies may restrict movement and actions on the tile.
 * 
 * A tile may contain at most one character.
 * 
 * @class
 */
murmures.Tile = function () {
    /// <field name="x" type="Number"/>
    /// <field name="y" type="Number"/>

    /// <field name="groundId" type="String"/>
    /// <field name="groundDeco" type="String"/>
    /// <field name="propId" type="String"/>
    /// <field name="propDeco" type="String"/>
    /// <field name="itemId" type="String"/>
    /// <field name="charId" type="String"/>
    /// <field name="charDeco" type="String"/>
    /// <field name="effectId" type="String"/>
    /// <field name="needsClientUpdate" type="bool"/>
};

murmures.Tile.prototype = {
    fromJson : function (src, x, y) {
        /// <param name="src" type="Tile"/>
        this.x = (src.x === undefined) ? x : src.x;
        this.y = (src.y === undefined) ? y : src.y;
        this.state = (src.state === undefined) ? murmures.C.TILE_NOT_DISCOVERED : src.state;
        this.groundId = (src.groundId === undefined) ? '' : src.groundId;
        this.propId = (src.propId === undefined) ? '' : src.propId;
        this.charId = (src.charId === undefined) ? '' : src.charId;
    },
    
    clean: function () {
        delete this.x;
        delete this.y;
        delete this.state;
        if (this.groundId === '') delete this.groundId;
        if (this.propId === '') delete this.propId;
        if (this.charId === '') delete this.charId;
    },

    isWall : function () {
        let allowTerrestrialGround = (this.groundId === "") ? true : gameEngine.bodies[this.groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.propId === "") ? true : gameEngine.bodies[this.propId].allowTerrestrial;
        return !allowTerrestrialGround || !allowTerrestrialProp;
    }
};

