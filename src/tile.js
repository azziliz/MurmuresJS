'use strict';

(function (client) {
    
    var tile = function () {
        /// <field name="x" type="Number"/>
        /// <field name="y" type="Number"/>
        this.x = 0;
        this.y = 0;
        // state == 0 --> not discovered yet
        // state == 1 --> highlighted (visible)
        // state == 2 --> fog of war
        this.state = 0;
        this.groundId = '';
        this.propId = '';
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
