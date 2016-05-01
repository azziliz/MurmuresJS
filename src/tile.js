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
  
  tile.prototype.x = 0;
  tile.prototype.y = 0;
  tile.prototype.state = 0;
  tile.prototype.content = 0;
    
    tile.prototype.fromJson = function (src) {
        /// <param name="src" type="tile"/>
        this.x = src.x;
        this.y = src.y;
        this.state = 0;
        this.content = 0;
    };

})(this);
