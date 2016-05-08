'use strict';

//debugger;

murmures.Level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="heroStartingTiles" type="Tile"/>
        /// <field name="mobStartingTiles" type="Tile"/>
};

murmures.Level.prototype = {
    fromJson : function (src) {
        /// <param name="src" type="Level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.Tile();
                this.tiles[y][x].fromJson(src.tiles[y][x], x, y)
            }
        }
        this.heroStartingTiles = src.heroStartingTiles;
        this.mobStartingTiles = src.mobStartingTiles;
    },

    isWall : function (tile) {
        /// <param name="tile" type="Tile"/>
        let allowTerrestrialGround = (this.tiles[tile.y][tile.x].groundId === "") ? true : gameEngine.bodies[this.tiles[tile.y][tile.x].groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.tiles[tile.y][tile.x].propId === "") ? true : gameEngine.bodies[this.tiles[tile.y][tile.x].propId].allowTerrestrial;
        return !allowTerrestrialGround || !allowTerrestrialProp;
    }
};

