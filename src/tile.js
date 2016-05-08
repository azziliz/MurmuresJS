'use strict';

//debugger;

murmures.Tile = function () {
    /// <field name="x" type="Number"/>
    /// <field name="y" type="Number"/>
    // state == 0 --> not discovered yet
    // state == 1 --> highlighted (visible)
    // state == 2 --> fog of war
};

murmures.Tile.prototype = {
    fromJson : function (src, x, y) {
        /// <param name="src" type="Tile"/>
        this.x = (src.x === undefined) ? x : src.x;
        this.y = (src.y === undefined) ? y : src.y;
        this.state = (src.state === undefined) ? 0 : src.state;
        this.groundId = src.groundId;
        this.propId = src.propId;
    }
};

