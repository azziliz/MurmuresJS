'use strict';

(function (client) {
    
    var tile = function () {
        /// <field name="x" type="Number"/>
        /// <field name="y" type="Number"/>
    };
    
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = tile;
    }
    else {
        murmures.tile = tile;
    }
    
    tile.prototype.fromJson = function (src) {
        /// <param name="src" type="tile"/>
        this.x = src.x;
        this.y = src.y;
    };

})(this);
