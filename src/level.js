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
    };

    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = level;
    }
    else {
        murmures.level = level;
    }

    level.prototype.fromJson = function (src) {
        /// <param name="src" type="level"/>
        this.id = src.id;
        this.layout = src.layout;
        this.width = src.width;
        this.height = src.height;
        this.tileSize = src.tileSize;
        this.tiles = src.tiles;
        if (typeof require == "function"){
            let tile = require('./tile');
          
          for(let x=0;x<this.width;x++){
            for(let y=0;y<this.height;y++){
              let tempTile = new tile();
              tempTile.content = src.tiles[y][x];
              tempTile.state = 1;
              tempTile.x = x;
              tempTile.y = y;
              this.tiles[y][x] = tempTile;
            }
          }
        }
      
        this.startingTile = src.startingTile;
    };

    level.prototype.isWall = function (tile) {
        /// <param name="tile" type="tile"/>
        return this.tiles[tile.y][tile.x] === 1;
    }


})(this);
