'use strict';


(function (client) {

    var level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="heroStartingTiles" type="tile"/>
        /// <field name="mobStartingTiles" type="tile"/>
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = level;
    }
    else {
        murmures.level = level;
    }

    level.prototype.fromJson = function (src, murmures) {
        /// <param name="src" type="level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new murmures.tile();
                this.tiles[y][x].fromJson(src.tiles[y][x], x, y)
            }
        }
        this.heroStartingTiles = src.heroStartingTiles;
        this.mobStartingTiles = src.mobStartingTiles;
    };

    level.prototype.isWall = function (tile, bodies) {
        /// <param name="tile" type="tile"/>
        let allowTerrestrialGround = (this.tiles[tile.y][tile.x].groundId === "") ? true : bodies[this.tiles[tile.y][tile.x].groundId].allowTerrestrial;
        let allowTerrestrialProp = (this.tiles[tile.y][tile.x].propId === "") ? true : bodies[this.tiles[tile.y][tile.x].propId].allowTerrestrial;

        return !allowTerrestrialGround || !allowTerrestrialProp;
    }


})(this);
