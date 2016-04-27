'use strict';

(function (client) {

    var level = function () {
        /// <field name="id" type="String"/>
        /// <field name="layout" type="String"/>
        /// <field name="width" type="Number"/>
        /// <field name="height" type="Number"/>
        /// <field name="tileSize" type="Number"/>
        /// <field name="tiles" type="Array"/>
        /// <field name="startingTile" type="tile"/>
        this.creatures=[];
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = level;
    }
    else {
        client.level = level;
    }

    level.prototype.creatures=[];

    level.prototype.fromJson = function (src) {
        /// <param name="src" type="level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tileSize = src.tileSize;
        this.tiles = src.tiles;
        this.startingTile = src.startingTile;
    };

})(this);
