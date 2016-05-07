'use strict';

(function (client) {
    
    var tile = function () {
        /// <field name="x" type="Number"/>
        /// <field name="y" type="Number"/>
        // state == 0 --> not discovered yet
        // state == 1 --> highlighted (visible)
        // state == 2 --> fog of war
    };
    
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = tile;
    }
    else {
        murmures.tile = tile;
    }
  
    
    tile.prototype.fromJson = function (src, x, y) {
        /// <param name="src" type="tile"/>
        this.x = x;
        this.y = y;
        this.state = (src.state === undefined) ? 0 : src.state;
        this.groundId = src.groundId;
        this.propId = src.propId;
    };

})(this);
